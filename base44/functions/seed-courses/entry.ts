import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { COURSE_SEED } from "../../shared/courseSeed.ts";

// Admin-only: populates Course / Lesson / Assessment / Question records from
// the built-in curriculum template. Idempotent — skips a course whose title
// already exists so it can be re-run safely.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const seed of COURSE_SEED) {
      try {
        // Idempotency: skip if a course with this title already exists.
        const existing = await base44.asServiceRole.entities.Course.filter(
          { title: seed.title }, '-created_date', 1
        );
        if (existing && existing.length > 0) { skipped++; continue; }

        const course = await base44.asServiceRole.entities.Course.create({
          title: seed.title,
          subtitle: seed.subtitle,
          description: seed.description,
          category: seed.category,
          difficulty: seed.difficulty,
          duration_hours: seed.duration_hours,
          recommended_weeks: seed.recommended_weeks,
          price: seed.price,
          cover_gradient: seed.cover_gradient,
          cover_art_url: seed.cover_art_url,
          dial_code: seed.dial_code,
          tags: seed.tags || [],
          status: 'published',
          certificate_eligible: true,
          is_seeded: true,
          instructor_name: '1 Call Academy',
        });

        // Lessons
        for (let i = 0; i < seed.lessons.length; i++) {
          const l = seed.lessons[i];
          await base44.asServiceRole.entities.Lesson.create({
            course_id: course.id,
            title: l.title,
            summary: l.summary,
            lesson_text: l.text,
            order_index: i,
            duration_minutes: Math.max(2, Math.round(l.text.length / 900)),
          });
        }

        // Assessments: quiz, test, exam
        const makeAssessment = async (type, title, order, qs, passingScore, timeLimit, retake) => {
          const assessment = await base44.asServiceRole.entities.Assessment.create({
            course_id: course.id,
            title,
            type,
            passing_score_pct: passingScore,
            time_limit_minutes: timeLimit,
            retake_cap: retake,
            order_index: order,
            weight: type === 'exam' ? 3 : type === 'test' ? 2 : 1,
          });
          for (let i = 0; i < qs.length; i++) {
            const q = qs[i];
            const record = {
              assessment_id: assessment.id,
              course_id: course.id,
              type: q.type,
              prompt: q.prompt,
              options: q.options || [],
              correct_option_index: q.correct_option_index ?? null,
              correct_answer_text: q.correct_answer_text || null,
              rubric: q.rubric || null,
              marks: q.marks ?? 1,
              order_index: i,
            };
            await base44.asServiceRole.entities.Question.create(record);
          }
        };

        await makeAssessment('quiz', `${seed.title} — Knowledge Quiz`, 0, seed.quiz, 70, 0, 5);
        await makeAssessment('test', `${seed.title} — Midterm Test`, 1, seed.test, 70, 0, 3);
        await makeAssessment('exam', `${seed.title} — Final Certification Exam`, 2, seed.exam, 70, 30, 2);

        created++;
      } catch (e) {
        console.error(`seed-courses: failed "${seed.title}":`, e.message);
        errors.push({ course: seed.title, error: e.message });
      }
    }

    return Response.json({ created, skipped, errors, total: COURSE_SEED.length });
  } catch (error) {
    console.error('seed-courses error:', error.message);
    return Response.json({ error: 'Failed to seed courses.' }, { status: 500 });
  }
}