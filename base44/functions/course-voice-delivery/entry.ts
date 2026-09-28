import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { normPhone, twimlEscape } from "../../shared/twilioVoice.ts";
import { bumpStudyStreak } from "../../shared/studyStreak.ts";
import { sendStudySms } from "../../shared/studyNotifications.ts";

/**
 * course-voice-delivery — the telephony engine for Dial Certified Courses.
 *
 * Delivers the next lesson in a learner's queue when they call the platform
 * number (Twilio webhook) or invoke from the in-app softphone (SDK).
 * Resolves the learner, advances the enrollment progress, and returns either
 * TwiML (Twilio, narrated via Polly <Say>) or JSON (SDK, for in-app playback).
 *
 * Twilio flow: caller dials in → concierge gathers the course dial code →
 * redirects here with `course_id`. Each lesson is one <Gather>; pressing 1
 * calls back here to deliver the next lesson; pressing * on the final lesson
 * prompts for the certification exam.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const contentType = req.headers.get("content-type") || "";
    const isTwilio = contentType.includes("x-www-form-urlencoded");
    const url = new URL(req.url);
    let course_id = url.searchParams.get("course_id") || "";
    let userId = null;
    let digits = "";

    if (isTwilio) {
      const bodyText = await req.text();
      const valid = await validateTwilioRequest(req, bodyText);
      if (!valid) return new Response("Forbidden", { status: 403 });
      const params = new URLSearchParams(bodyText);
      const from = normPhone(params.get("From"));
      digits = (params.get("Digits") || "").trim();
      if (!course_id) course_id = params.get("course_id") || "";
      // Resolve the learner by their personal Dial number (caller ID).
      if (from) {
        const nums = await base44.asServiceRole.entities.PhoneNumber.filter(
          { assignment_type: "personal", status: "active" }, "-created_date", 300
        );
        const match = (nums || []).find((n) => normPhone(n.number) === from);
        if (match) userId = match.owner_user_id;
      }
      if (!userId) {
        return twimlResponse(sayOnly("You are not recognized as a 1 Call member. Please enroll and link your phone number in the app. Goodbye."));
      }
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      userId = user.id;
      const payload = await req.json().catch(() => ({}));
      if (!course_id) course_id = payload.course_id || "";
    }

    if (!course_id) {
      return isTwilio
        ? twimlResponse(sayOnly("No course was specified. Please try again."))
        : Response.json({ error: "course_id required" }, { status: 400 });
    }

    const course = await base44.asServiceRole.entities.Course.get(course_id).catch(() => null);
    if (!course) {
      return isTwilio
        ? twimlResponse(sayOnly("That course was not found."))
        : Response.json({ error: "Course not found" }, { status: 404 });
    }

    const ens = await base44.asServiceRole.entities.Enrollment.filter(
      { owner_user_id: userId, course_id: course.id }, "-created_date", 10
    );
    const enrollment = (ens || []).find((e) => e.status === "paid" || e.status === "completed");
    if (!enrollment) {
      return isTwilio
        ? twimlResponse(sayOnly(`You are not enrolled in ${course.title}. Please enroll in the app to start learning.`))
        : Response.json({ error: "Not enrolled" }, { status: 403 });
    }

    const lessons = await base44.asServiceRole.entities.Lesson.filter(
      { course_id: course.id }, "order_index", 200
    );
    const total = (lessons || []).length;
    if (total === 0) {
      return isTwilio
        ? twimlResponse(sayOnly("This course has no lessons yet."))
        : Response.json({ error: "No lessons" }, { status: 404 });
    }

    // Exam shortcut — learner pressed * after the final lesson.
    if (isTwilio && digits === "*") {
      return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">You have completed all lessons. You are ready to take your final certification exam. Please open the 1 Call app or website to begin your exam. Goodbye.</Say>
</Response>`);
    }

    const idx = Math.min(enrollment.current_lesson_index || 0, total - 1);
    const lesson = lessons[idx];
    const nextIndex = idx + 1;
    const isLast = nextIndex >= total;
    const newPct = Math.round((Math.min(nextIndex, total) / total) * 100);

    // Advance the queue — persist progress so the next call resumes correctly.
    await base44.asServiceRole.entities.Enrollment.update(enrollment.id, {
      current_lesson_index: isLast ? idx : nextIndex,
      progress_pct: isLast ? 100 : newPct,
    });

    // Bump the daily study streak for this lesson; text the learner when they
    // finish the final lesson of the course. Fire-and-forget so a notification
    // failure never blocks lesson delivery.
    try { await bumpStudyStreak(base44, userId, "lesson"); } catch (e) { console.error("streak bump failed:", e.message); }
    if (isLast) {
      try {
        await sendStudySms(base44, userId, `1 Call Academy: You finished all lessons for ${course.title}. You're ready for the final exam — open the app to take it. Keep it up!`);
      } catch (e) { console.error("module-complete SMS failed:", e.message); }
    }

    const intro = `Lesson ${idx + 1} of ${total}: ${lesson.title}.`;
    const outro = isLast
      ? "That was the final lesson. You are ready to take your certification exam. Press the star key to hear exam instructions, or hang up to return later."
      : "Press 1 to continue to the next lesson, or hang up. Your progress has been saved.";

    if (isTwilio) {
      const nextUrl = `${url.origin}/functions/course-voice-delivery?course_id=${encodeURIComponent(course.id)}`;
      // Play the pre-generated lesson audio directly if available; otherwise
      // fall back to narrating the lesson text with Polly TTS.
      const bodyXml = lesson.audio_url
        ? `<Play>${twimlEscape(lesson.audio_url)}</Play>`
        : `<Say voice="Polly.Joanna">${twimlEscape(lesson.lesson_text || lesson.summary || "")}</Say>`;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="dtmf" numDigits="1" action="${twimlEscape(nextUrl)}" method="POST" timeout="12" finishOnKey="">
    <Say voice="Polly.Joanna">${twimlEscape(intro)}</Say>
    ${bodyXml}
    <Say voice="Polly.Joanna">${twimlEscape(outro)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">Goodbye.</Say>
</Response>`;
      return twimlResponse(twiml);
    }

    return Response.json({
      course_id: course.id,
      course_title: course.title,
      lesson_index: idx,
      lesson_total: total,
      is_last: isLast,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        text: lesson.lesson_text,
        summary: lesson.summary,
        duration_minutes: lesson.duration_minutes,
      },
      progress_pct: isLast ? 100 : newPct,
      next_action: isLast ? "exam" : "next_lesson",
    });
  } catch (error) {
    console.error("course-voice-delivery error:", error.message);
    return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Sorry, we couldn't load your lesson right now. Please try again later.</Say></Response>`);
  }
}

function sayOnly(text) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${twimlEscape(text)}</Say></Response>`;
}

function twimlResponse(body) {
  return new Response(body, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
}