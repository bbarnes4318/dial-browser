import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { bumpStudyStreak } from "../../shared/studyStreak.ts";
import { sendStudySms, emailCertificatePdf } from "../../shared/studyNotifications.ts";

// Grades a learner's exam/quiz/test attempt: objective questions are scored
// locally; spoken short_answer/essay questions are graded by an LLM against
// the reference answer and rubric. On a passing exam, issues a verifiable
// completion certificate and marks the enrollment complete.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const assessmentId = body.assessment_id;
    const submittedAnswers = Array.isArray(body.answers) ? body.answers : [];
    const deliveryChannel = ['voice', 'sms', 'web'].includes(body.delivery_channel) ? body.delivery_channel : 'web';

    if (!assessmentId) return Response.json({ error: 'Assessment required.' }, { status: 400 });
    if (submittedAnswers.length === 0) return Response.json({ error: 'Answers required.' }, { status: 400 });

    const assessment = await base44.entities.Assessment.get(assessmentId).catch(() => null);
    if (!assessment) return Response.json({ error: 'Assessment not found.' }, { status: 404 });

    // Enrollment gate — learner must have a paid or completed enrollment.
    const enrollments = await base44.entities.Enrollment.filter(
      { course_id: assessment.course_id, owner_user_id: user.id }, '-created_date', 10
    );
    const enrolled = (enrollments || []).find((e) => e.status === 'paid' || e.status === 'completed');
    if (!enrolled) {
      return Response.json({ error: 'You must enroll in this course before taking its assessment.' }, { status: 403 });
    }

    // Retake cap
    const prior = await base44.entities.ExamAttempt.filter(
      { owner_user_id: user.id, assessment_id: assessmentId }, '-created_date', 50
    );
    const attemptNumber = (prior?.length || 0) + 1;
    if (attemptNumber > (assessment.retake_cap || 3)) {
      return Response.json({ error: `You have reached the maximum of ${assessment.retake_cap} attempts for this assessment.` }, { status: 403 });
    }

    // Load questions in order
    const questions = await base44.entities.Question.filter({ assessment_id: assessmentId }, 'order_index', 200);
    const qMap = new Map((questions || []).map((q) => [q.id, q]));

    const gradedAnswers = [];
    const spokenToGrade = [];
    let totalMarks = 0;
    let awardedMarks = 0;

    for (const ans of submittedAnswers) {
      const q = qMap.get(ans.question_id);
      if (!q) continue;
      totalMarks += (q.marks || 1);
      const entry = { question_id: q.id, type: q.type, response: ans.response || '', correct: false, marks_awarded: 0 };
      if (ans.audio_url) entry.audio_url = ans.audio_url;
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        const idx = Number(ans.response);
        const correct = !isNaN(idx) && idx === q.correct_option_index;
        entry.correct = correct;
        entry.marks_awarded = correct ? (q.marks || 1) : 0;
        awardedMarks += entry.marks_awarded;
      } else {
        // short_answer / essay — defer to the LLM grader
        spokenToGrade.push({ q, entry });
      }
      gradedAnswers.push(entry);
    }

    // Transcribe any spoken answers delivered as audio recordings (phone or
    // mic) so the AI grader has text to evaluate.
    let attemptTranscriptUrl = null;
    if (spokenToGrade.length > 0) {
      for (const s of spokenToGrade) {
        if (s.entry.audio_url && !s.entry.response) {
          try {
            const tr = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: s.entry.audio_url });
            s.entry.response = typeof tr === 'string' ? tr : (tr?.transcript || tr?.text || '');
            s.entry.transcribed = true;
            console.log('grade-exam-attempt: transcribed spoken answer ->', s.entry.response.slice(0, 120));
            if (!attemptTranscriptUrl) attemptTranscriptUrl = s.entry.audio_url;
          } catch (e) {
            console.error('grade-exam-attempt: transcription failed:', e.message);
            s.entry.transcribed = false;
          }
        }
      }
    }

    // Grade spoken answers in a single batched LLM call to conserve credits.
    let llmGrades = null;
    if (spokenToGrade.length > 0) {
      const items = spokenToGrade.map((s, i) => ({
        index: i,
        prompt: s.q.prompt,
        reference: s.q.correct_answer_text || '',
        rubric: s.q.rubric || '',
        marks: s.q.marks || 1,
        student_response: String(s.entry.response || ''),
      }));
      const llmPrompt =
        'You are grading a certification exam. For each item, judge the student response against the reference answer and rubric and award marks (0 to the item max marks). Partial credit is allowed where the rubric permits it.\n\n' +
        'Items:\n' + JSON.stringify(items, null, 2) + '\n\n' +
        'Return JSON with a "grades" array, one entry per item in order: { "index", "correct" (boolean), "marks_awarded" (number, 0..marks), "rationale" (short string) }.';
      try {
        const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: llmPrompt,
          response_json_schema: {
            type: 'object',
            properties: {
              grades: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    index: { type: 'number' },
                    correct: { type: 'boolean' },
                    marks_awarded: { type: 'number' },
                    rationale: { type: 'string' },
                  },
                },
              },
            },
            required: ['grades'],
          },
        });
        llmGrades = llm;
        const grades = Array.isArray(llm?.grades) ? llm.grades : [];
        const byIndex = new Map(grades.map((g) => [g.index, g]));
        spokenToGrade.forEach((s, i) => {
          const g = byIndex.get(i);
          if (g) {
            const max = s.q.marks || 1;
            const awarded = Math.max(0, Math.min(max, Number(g.marks_awarded) || 0));
            s.entry.correct = !!g.correct;
            s.entry.marks_awarded = awarded;
            awardedMarks += awarded;
          }
        });
      } catch (e) {
        console.error('grade-exam-attempt: LLM grading failed:', e.message);
        // Fail gracefully — ungraded spoken answers receive 0 marks.
      }
    }

    const scorePct = totalMarks > 0 ? Math.round((awardedMarks / totalMarks) * 100) : 0;
    const passed = scorePct >= (assessment.passing_score_pct || 70);

    const attempt = await base44.entities.ExamAttempt.create({
      owner_user_id: user.id,
      assessment_id: assessmentId,
      course_id: assessment.course_id,
      attempt_number: attemptNumber,
      answers: gradedAnswers,
      score_pct: scorePct,
      passed,
      delivery_channel: deliveryChannel,
      llm_grades: llmGrades ? JSON.stringify(llmGrades) : null,
      transcript_url: attemptTranscriptUrl,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    // Issue a certificate on a passing final exam (idempotent — one per course).
    let certificate = null;
    if (passed && assessment.type === 'exam') {
      const existing = await base44.asServiceRole.entities.Certificate.filter(
        { owner_user_id: user.id, course_id: assessment.course_id, revoked: false }, '-created_date', 1
      );
      if (existing && existing.length > 0) {
        certificate = existing[0];
      } else {
        const code = '1CALL-' + Math.random().toString(36).slice(2, 8).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
        certificate = await base44.asServiceRole.entities.Certificate.create({
          owner_user_id: user.id,
          owner_name: user.full_name || '',
          owner_email: user.email || '',
          course_id: assessment.course_id,
          course_title: enrolled.course_title || '',
          verification_code: code,
          issued_at: new Date().toISOString(),
          exam_attempt_id: attempt.id,
        });
      }
      if (enrolled.status !== 'completed') {
        await base44.asServiceRole.entities.Enrollment.update(enrolled.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          certificate_id: certificate ? certificate.id : null,
          progress_pct: 100,
        });
      }
    }

    // ── Daily streak + milestone notifications ──
    try {
      await bumpStudyStreak(base44, user.id, "quiz");
    } catch (e) { console.error("grade-exam-attempt: streak bump failed:", e.message); }

    if (passed && (assessment.type === "quiz" || assessment.type === "test")) {
      try {
        const shortTitle = assessment.title.replace(`${enrolled.course_title} — `, "");
        await sendStudySms(base44, user.id, `1 Call Academy: You passed "${shortTitle}" with ${scorePct}%. Keep the streak going!`);
      } catch (e) { console.error("grade-exam-attempt: quiz SMS failed:", e.message); }
    }

    if (passed && assessment.type === "exam" && certificate) {
      try {
        const appUrl = req.headers.get("X-Base44-App-Url") || process.env.WIX_CHECKOUT_APP_URL || "https://www.dialbrowser.com";
        const emailRes = await emailCertificatePdf(base44, certificate.id, appUrl);
        console.log("grade-exam-attempt: certificate email:", emailRes?.sent ? `sent to ${emailRes.to}` : `skipped (${emailRes?.reason})`);
        if (emailRes?.sent) {
          await sendStudySms(base44, user.id, `1 Call Academy: You passed your final exam for ${enrolled.course_title}! Your certificate was emailed to ${emailRes.to}.`);
        }
      } catch (e) { console.error("grade-exam-attempt: certificate email failed:", e.message); }
    }

    return Response.json({
      passed,
      score_pct: scorePct,
      attempt_id: attempt.id,
      certificate_id: certificate ? certificate.id : null,
      verification_code: certificate ? certificate.verification_code : null,
      awarded_marks: awardedMarks,
      total_marks: totalMarks,
      attempt_number: attemptNumber,
      retake_cap: assessment.retake_cap || 3,
    });
  } catch (error) {
    console.error('grade-exam-attempt error:', error.message);
    return Response.json({ error: 'Failed to grade exam attempt.' }, { status: 500 });
  }
}