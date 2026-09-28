import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Verifies the caller is the assigned instructor (or an admin) of a course.
async function verifyCourseInstructor(base44, user, courseId) {
  const course = await base44.asServiceRole.entities.Course.get(courseId);
  if (!course) return { error: "Course not found", status: 404 };
  if (user.role !== "admin" && course.instructor_user_id !== user.id) {
    return { error: "You are not the instructor of this course", status: 403 };
  }
  return { course };
}

// Lets an instructor update lesson scripts and create/edit quiz/test/exam
// questions for courses they teach. All writes go through service role after
// verifying ownership, so RLS on Lesson/Question (which keys on created_by_id)
// does not block edits to seeded content created by an admin.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
    const body = await req.json();
    const action = body.action;

    if (action === "save_lesson") {
      const { lesson_id, course_id, title, summary, lesson_text } = body;
      if (!lesson_id || !course_id) return Response.json({ error: "Missing lesson_id or course_id" }, { status: 400 });
      const check = await verifyCourseInstructor(base44, user, course_id);
      if (check.error) return Response.json({ error: check.error }, { status: check.status });
      const lesson = await base44.asServiceRole.entities.Lesson.get(lesson_id);
      if (!lesson || lesson.course_id !== course_id) {
        return Response.json({ error: "Lesson does not belong to this course" }, { status: 400 });
      }
      await base44.asServiceRole.entities.Lesson.update(lesson_id, {
        title: title ?? lesson.title,
        summary: summary ?? lesson.summary,
        lesson_text: lesson_text ?? lesson.lesson_text,
      });
      return Response.json({ ok: true, lesson_id });
    }

    if (action === "save_question") {
      const { question_id, assessment_id, course_id, type, prompt, options, correct_option_index, correct_answer_text, rubric, marks, order_index } = body;
      if (!assessment_id || !course_id) return Response.json({ error: "Missing assessment_id or course_id" }, { status: 400 });
      const check = await verifyCourseInstructor(base44, user, course_id);
      if (check.error) return Response.json({ error: check.error }, { status: check.status });
      const assessment = await base44.asServiceRole.entities.Assessment.get(assessment_id);
      if (!assessment || assessment.course_id !== course_id) {
        return Response.json({ error: "Assessment does not belong to this course" }, { status: 400 });
      }
      const payload = {
        type, prompt, options, correct_option_index, correct_answer_text, rubric, marks, order_index, course_id,
      };
      if (question_id) {
        const existing = await base44.asServiceRole.entities.Question.get(question_id);
        if (!existing || existing.assessment_id !== assessment_id) {
          return Response.json({ error: "Question not found in this assessment" }, { status: 400 });
        }
        await base44.asServiceRole.entities.Question.update(question_id, payload);
        return Response.json({ ok: true, question_id });
      }
      const created = await base44.asServiceRole.entities.Question.create({ ...payload, assessment_id });
      return Response.json({ ok: true, question_id: created.id, created: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("instructor-save-content error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}