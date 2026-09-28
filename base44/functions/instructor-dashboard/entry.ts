import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Returns the courses the calling instructor is assigned to (or all published
// courses for admins), each with its lessons, assessments + questions, and
// student enrollments. Runs as service role so instructors can read enrollments
// for their own courses despite Enrollment RLS (which only allows owners/admins).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
    const isAdmin = user.role === "admin";

    const allCourses = await base44.asServiceRole.entities.Course.filter(
      { status: "published" }, "-created_date", 200
    );
    const courses = (allCourses || []).filter((c) => isAdmin || c.instructor_user_id === user.id);
    if (courses.length === 0) return Response.json({ courses: [] });

    const courseIds = new Set(courses.map((c) => c.id));

    // Fetch all lessons/assessments/questions/enrollments in parallel and
    // filter in-memory by the instructor's course ids (avoids relying on $in).
    const [lessons, assessments, questions, enrollments, examAttempts] = await Promise.all([
      base44.asServiceRole.entities.Lesson.list("order_index", 500),
      base44.asServiceRole.entities.Assessment.list("order_index", 200),
      base44.asServiceRole.entities.Question.list("order_index", 500),
      base44.asServiceRole.entities.Enrollment.list("-created_date", 500),
      base44.asServiceRole.entities.ExamAttempt.list("-created_date", 1000),
    ]);

    const byCourse = (arr, key = "course_id") => (arr || []).filter((x) => x[key] && courseIds.has(x[key]));

    return Response.json({
      courses: courses.map((c) => {
        const courseLessons = byCourse(lessons)
          .filter((l) => l.course_id === c.id)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        const courseAssessments = byCourse(assessments)
          .filter((a) => a.course_id === c.id)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          .map((a) => ({
            ...a,
            questions: (questions || [])
              .filter((q) => q.assessment_id === a.id)
              .sort((x, y) => (x.order_index || 0) - (y.order_index || 0)),
          }));
        const courseEnrollments = (enrollments || [])
          .filter((e) => e.course_id === c.id)
          .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));

        // ── Performance analytics ──
        // Active enrollment count, average time-to-completion (paid→completed),
        // exam pass rate, and the questions learners most often get wrong.
        const activeEnrollments = courseEnrollments.filter((e) => e.status === "paid" || e.status === "completed");
        const completedEnrollments = courseEnrollments.filter((e) => e.status === "completed");
        let avgCompletionHours = null;
        const completedWithTimes = completedEnrollments.filter((e) => e.paid_at && e.completed_at);
        if (completedWithTimes.length > 0) {
          const totalMs = completedWithTimes.reduce(
            (s, e) => new Date(e.completed_at).getTime() - new Date(e.paid_at).getTime(), 0
          );
          avgCompletionHours = Math.round((totalMs / completedWithTimes.length) / 3600000 * 10) / 10;
        }

        const courseAttempts = (examAttempts || []).filter((at) => at.course_id === c.id);
        const attemptCount = courseAttempts.length;
        const passedCount = courseAttempts.filter((at) => at.passed).length;
        const passRate = attemptCount > 0 ? Math.round((passedCount / attemptCount) * 100) : null;

        // Aggregate per-question wrong answers across every attempt for this course.
        const qFailMap = new Map();
        courseAttempts.forEach((at) => {
          (at.answers || []).forEach((ans) => {
            if (!ans.question_id) return;
            const cur = qFailMap.get(ans.question_id) || { total: 0, fails: 0 };
            cur.total += 1;
            if (ans.correct === false) cur.fails += 1;
            qFailMap.set(ans.question_id, cur);
          });
        });
        const courseQuestionMeta = new Map(
          (questions || []).filter((q) => q.course_id === c.id).map((q) => [q.id, q])
        );
        const failurePoints = Array.from(qFailMap.entries())
          .map(([qid, f]) => {
            const q = courseQuestionMeta.get(qid);
            return {
              question_id: qid,
              prompt: q?.prompt || "(removed question)",
              type: q?.type || null,
              total: f.total,
              fails: f.fails,
              fail_rate: f.total > 0 ? Math.round((f.fails / f.total) * 100) : 0,
            };
          })
          .filter((f) => f.fails > 0)
          .sort((a, b) => b.fails - a.fails)
          .slice(0, 6);

        return {
          id: c.id,
          title: c.title,
          category: c.category,
          dial_code: c.dial_code,
          instructor_name: c.instructor_name,
          instructor_user_id: c.instructor_user_id,
          lessons: courseLessons,
          assessments: courseAssessments,
          enrollments: courseEnrollments,
          analytics: {
            active_enrollments: activeEnrollments.length,
            completed_enrollments: completedEnrollments.length,
            avg_completion_hours: avgCompletionHours,
            attempt_count: attemptCount,
            pass_rate: passRate,
            failure_points: failurePoints,
          },
        };
      }),
    });
  } catch (error) {
    console.error("instructor-dashboard error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}