import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Award, CheckCircle2, Loader2, Lock, Trophy, GraduationCap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import CourseCover from "@/components/courses/CourseCover";
import CourseProgressTracker from "@/components/courses/CourseProgressTracker";

// End-of-program summary for a certified course: weighted final score across
// every assessment, completion status, earned certificate, the visual progress
// tracker, and a per-assessment score breakdown.
export default function CourseSummary() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const c = await base44.entities.Course.get(id).catch(() => null);
      setCourse(c);
      const [ls, as, ens, atts, certs] = await Promise.all([
        base44.entities.Lesson.filter({ course_id: id }, "order_index", 200).catch(() => []),
        base44.entities.Assessment.filter({ course_id: id }, "order_index", 50).catch(() => []),
        base44.entities.Enrollment.filter({ course_id: id, owner_user_id: user.id }, "-created_date", 5).catch(() => []),
        base44.entities.ExamAttempt.filter({ course_id: id, owner_user_id: user.id }, "-created_date", 200).catch(() => []),
        base44.entities.Certificate.filter({ course_id: id, owner_user_id: user.id, revoked: false }, "-created_date", 5).catch(() => []),
      ]);
      setLessons(Array.isArray(ls) ? ls : []);
      setAssessments(Array.isArray(as) ? as : []);
      const paid = (ens || []).find((e) => e.status === "paid" || e.status === "completed");
      if (paid) setEnrollment(paid);
      setAttempts(Array.isArray(atts) ? atts : []);
      if (certs && certs.length) setCertificate(certs[0]);
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>;
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#05070A" }}>
        <Lock size={32} className="mb-3" style={{ color: "rgba(209,255,38,0.4)" }} />
        <p className="font-mono text-[10px] tracking-widest mb-4 text-center max-w-sm" style={{ color: "#8A8F98" }}>Enroll in this course to view your summary.</p>
        <Link to={`/courses/${id}`} className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>▸ Back to Course</Link>
      </div>
    );
  }

  // Best score per assessment
  const bestByAssessment = {};
  attempts.forEach((at) => {
    const prev = bestByAssessment[at.assessment_id];
    if (!prev || (at.score_pct || 0) > (prev.score_pct || 0)) bestByAssessment[at.assessment_id] = at;
  });

  // Weighted final score across attempted assessments
  let totalWeight = 0, weightedSum = 0;
  assessments.forEach((a) => {
    const best = bestByAssessment[a.id];
    if (best) { totalWeight += a.weight || 1; weightedSum += (best.score_pct || 0) * (a.weight || 1); }
  });
  const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const examAssessment = assessments.find((a) => a.type === "exam");
  const examPassed = examAssessment ? bestByAssessment[examAssessment.id]?.passed : false;
  const allLessonsDone = (enrollment.progress_pct || 0) >= 100 || enrollment.status === "completed";
  const isCompleted = enrollment.status === "completed" || (examPassed && allLessonsDone);
  const color = "#D1FF26";

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to={`/courses/${id}`} className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Course
        </Link>

        <div className="mb-6 overflow-hidden" style={{ border: `0.5px solid ${color}22` }}>
          <CourseCover course={course} size="hero" />
        </div>

        <div className="mb-6 text-center">
          <p className="font-mono text-xs tracking-[0.4em] mb-2" style={{ color }}>// COURSE SUMMARY</p>
          <h1 className="font-heading font-black text-2xl sm:text-3xl mb-1" style={{ color: "#F5F5F7" }}>{course.title}</h1>
          <p className="text-sm" style={{ color: "#8A8F98" }}>Final score & completion status</p>
        </div>

        {/* Final score + completion status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 text-center" style={{ background: isCompleted ? `${color}10` : "rgba(16,20,29,0.6)", border: `0.5px solid ${isCompleted ? color : "rgba(138,143,152,0.15)"}` }}>
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>FINAL SCORE</p>
            <p className="font-heading font-black text-5xl" style={{ color }}>{finalScore}%</p>
            <p className="font-mono text-[8px] tracking-wider mt-2" style={{ color: "#8A8F98" }}>WEIGHTED ACROSS {Object.keys(bestByAssessment).length} ASSESSMENT{Object.keys(bestByAssessment).length === 1 ? "" : "S"}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-6 text-center flex flex-col items-center justify-center" style={{ background: isCompleted ? `${color}10` : "rgba(16,20,29,0.6)", border: `0.5px solid ${isCompleted ? color : "rgba(138,143,152,0.15)"}` }}>
            <div className="w-14 h-14 flex items-center justify-center mb-2" style={{ background: isCompleted ? color : "rgba(138,143,152,0.1)", border: `0.5px solid ${isCompleted ? color : "rgba(138,143,152,0.2)"}` }}>
              {isCompleted ? <Trophy size={24} style={{ color: "#05070A" }} /> : <GraduationCap size={24} style={{ color: "#8A8F98" }} />}
            </div>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>COMPLETION STATUS</p>
            <p className="font-heading font-black text-xl" style={{ color: isCompleted ? color : "#F5F5F7" }}>{isCompleted ? "COMPLETED" : "IN PROGRESS"}</p>
          </motion.div>
        </div>

        {/* Certificate */}
        {isCompleted && certificate?.verification_code && (
          <div className="p-5 mb-6 flex items-center gap-3" style={{ background: `${color}10`, border: `0.5px solid ${color}55` }}>
            <Award size={20} style={{ color }} />
            <div className="flex-1">
              <p className="font-mono text-[9px] tracking-widest" style={{ color }}>CERTIFICATE EARNED</p>
              <p className="font-mono text-sm font-bold" style={{ color: "#F5F5F7" }}>{certificate.verification_code}</p>
            </div>
            <Link to={`/verify/${certificate.verification_code}`} className="font-mono text-[9px] tracking-widest uppercase px-4 py-2 font-bold" style={{ background: color, color: "#05070A" }}>View</Link>
          </div>
        )}

        {/* Visual progress tracker */}
        <CourseProgressTracker course={course} enrollment={enrollment} lessons={lessons} assessments={assessments} color={color} />

        {/* Per-assessment score breakdown */}
        <div className="mt-6">
          <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color }}>▸ SCORE BREAKDOWN</p>
          <div className="space-y-2">
            {assessments.map((a) => {
              const best = bestByAssessment[a.id];
              return (
                <div key={a.id} className="flex items-center gap-3 p-3" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}>
                  <span className="font-mono text-[8px] tracking-widest uppercase px-2 py-1" style={{ background: `${color}22`, color }}>{a.type}</span>
                  <p className="flex-1 text-xs" style={{ color: "#F5F5F7" }}>{a.title.replace(`${course.title} — `, "")}</p>
                  {best ? (
                    <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: best.passed ? color : "#8A8F98" }}>
                      {best.passed && <CheckCircle2 size={12} style={{ color }} />}
                      {best.score_pct}% · {a.weight}x
                    </span>
                  ) : (
                    <span className="font-mono text-[9px]" style={{ color: "#4A4F58" }}>NOT ATTEMPTED</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/my-courses" className="font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>My Courses</Link>
          <Link to={`/courses/${id}`} className="font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color }}>Back to Course</Link>
        </div>
      </div>
    </div>
  );
}