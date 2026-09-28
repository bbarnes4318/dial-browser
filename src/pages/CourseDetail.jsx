import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, GraduationCap, Clock, BarChart3, Hash, Award, Loader2, CheckCircle2,
  Play, FileText, ListChecks, BookOpen, Phone, Lock, AlertCircle,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import CourseFAQ from "@/components/courses/CourseFAQ";
import CourseCover from "@/components/courses/CourseCover";
import CourseProgressTracker from "@/components/courses/CourseProgressTracker";

const CATEGORY_COLORS = {
  AI: "#D1FF26", Engineering: "#5AC8E0", Healthcare: "#5AE0C8", Hospitality: "#E085A8",
  Education: "#FBBF24", Trades: "#5A8FE0", Security: "#94A3B8", Finance: "#60A5FA",
  Automotive: "#A3E635", Science: "#5AE07A", Business: "#E0A85A", Marketing: "#E085A8",
  Technology: "#5AC8E0",
};
const DIFFICULTY_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
const ASSESSMENT_ICON = { quiz: FileText, test: ListChecks, exam: Award };

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const referralCode = typeof window !== "undefined" ? localStorage.getItem("course_ref_code") || "" : "";

  const load = useCallback(async () => {
    try {
      const c = await base44.entities.Course.get(id);
      setCourse(c);
      const [ls, as] = await Promise.all([
        base44.entities.Lesson.filter({ course_id: id }, "order_index", 200),
        base44.entities.Assessment.filter({ course_id: id }, "order_index", 50),
      ]);
      setLessons(Array.isArray(ls) ? ls : []);
      setAssessments(Array.isArray(as) ? as : []);
      if (user) {
        const ens = await base44.entities.Enrollment.filter({ course_id: id, owner_user_id: user.id }, "-created_date", 5);
        const paid = (ens || []).find((e) => e.status === "paid" || e.status === "completed");
        if (paid) setEnrollment(paid);
      }
    } catch { setCourse(null); }
    finally { setLoading(false); }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const enroll = async () => {
    setEnrolling(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("create-checkout", { plan: "course_enrollment", course_id: id, referral_code: referralCode });
      const redirectUrl = res?.data?.redirectUrl;
      if (redirectUrl) { window.location.href = redirectUrl; return; }
      setError("Unable to start checkout. Please try again.");
    } catch (e) {
      setError(e?.response?.data?.error || "Unable to start checkout. Please try again.");
    } finally { setEnrolling(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#05070A" }}>
        <GraduationCap size={36} className="mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
        <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>COURSE NOT FOUND</p>
        <Link to="/courses" className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>▸ Back to Courses</Link>
      </div>
    );
  }

  const color = CATEGORY_COLORS[course.category] || "#D1FF26";
  const gradient = course.cover_gradient || `linear-gradient(135deg, ${color}, #0A0F0A)`;
  const price = parseFloat(course.price) || 0;
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === "completed";

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/courses" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Courses
        </Link>

        {/* Cover */}
        <div className="mb-6 overflow-hidden" style={{ border: `0.5px solid ${color}22` }}>
          <CourseCover course={course} size="hero" />
        </div>

        {/* Meta + Enroll */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 p-5" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(138,143,152,0.9)" }}>{course.description}</p>
            <div className="flex items-center gap-4 flex-wrap font-mono text-[9px]" style={{ color: "#8A8F98" }}>
              <span className="flex items-center gap-1"><BarChart3 size={11} style={{ color }} /> {DIFFICULTY_LABEL[course.difficulty]}</span>
              <span className="flex items-center gap-1"><Clock size={11} style={{ color }} /> {course.duration_hours} hours</span>
              <span className="flex items-center gap-1"><Calendar size={11} style={{ color }} /> {course.recommended_weeks} weeks</span>
              <span className="flex items-center gap-1"><Hash size={11} style={{ color }} /> Dial {course.dial_code}</span>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}>
            <div className="mb-4">
              <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>ENROLLMENT FEE</p>
              <p className="font-heading font-black text-3xl" style={{ color: price > 0 ? color : "#8A8F98" }}>{price > 0 ? `$${price.toFixed(2)}` : "FREE"}</p>
              <p className="font-mono text-[8px] tracking-wider mt-1" style={{ color: "#8A8F98" }}>INCLUDES LESSONS + CERTIFICATE</p>
              {referralCode && price > 0 && (
                <p className="font-mono text-[8px] tracking-wider mt-1" style={{ color: "#D1FF26" }}>REFERRAL 20% OFF → ${(price * 0.8).toFixed(2)}</p>
              )}
            </div>
            {isEnrolled ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  {isCompleted ? <CheckCircle2 size={14} style={{ color: "#D1FF26" }} /> : <CheckCircle2 size={14} style={{ color: "#D1FF26" }} />}
                  <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>{isCompleted ? "Completed" : "Enrolled"}</span>
                </div>
                <Link to="/my-courses" className="block text-center py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
                  Go to My Courses
                </Link>
                <Link to={`/courses/${id}/summary`} className="block text-center py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  View Summary
                </Link>
              </div>
            ) : (
              <button
                onClick={enroll}
                disabled={enrolling}
                className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)] disabled:opacity-50"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                {enrolling ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} {enrolling ? "Starting..." : "Enroll & Pay"}
              </button>
            )}
            {error && (
              <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                <AlertCircle size={11} style={{ color: "#ef4444" }} />
                <p className="font-mono text-[8px] tracking-wider" style={{ color: "#ef4444" }}>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpen size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ COURSE OUTLINE · {lessons.length} LESSONS</p>
            </div>
            <Link to={`/courses/${id}/curriculum`} className="font-mono text-[9px] tracking-widest uppercase px-3 py-1.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>Detailed Curriculum</Link>
          </div>
          <div className="space-y-2">
            {lessons.map((l, i) => (
              <div key={l.id} className="flex items-start gap-3 p-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.08)" }}>
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center font-mono text-[10px] font-bold" style={{ background: `${color}22`, color }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{l.title}</p>
                  {l.summary && <p className="text-[11px] mt-0.5" style={{ color: "#8A8F98" }}>{l.summary}</p>}
                </div>
                <span className="font-mono text-[8px] flex-shrink-0" style={{ color: "#8A8F98" }}>{l.duration_minutes}m</span>
              </div>
            ))}
          </div>
        </div>

        {isEnrolled && (
          <div className="mb-8">
            <CourseProgressTracker course={course} enrollment={enrollment} lessons={lessons} assessments={assessments} color={color} />
          </div>
        )}

        {/* Assessments */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Award size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ ASSESSMENTS · QUIZ · TEST · EXAM</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {assessments.map((a) => {
              const Icon = ASSESSMENT_ICON[a.type] || FileText;
              return (
                <div key={a.id} className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color }} />
                    <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color }}>{a.type}</p>
                  </div>
                  <p className="font-heading font-bold text-sm mb-2" style={{ color: "#F5F5F7" }}>{a.title.replace(`${course.title} — `, "")}</p>
                  <div className="flex items-center gap-3 font-mono text-[8px] mb-3" style={{ color: "#8A8F98" }}>
                    <span>Pass {a.passing_score_pct}%</span>
                    {a.time_limit_minutes > 0 && <span>{a.time_limit_minutes}min</span>}
                    <span>{a.retake_cap} retakes</span>
                  </div>
                  {isEnrolled && (
                    <Link to={`/exam/${a.id}`} className="flex items-center justify-center gap-1.5 py-2 font-mono text-[8px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.25)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                      <Play size={11} /> Take {a.type === "exam" ? "Exam" : a.type === "test" ? "Test" : "Quiz"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Student FAQ */}
        <CourseFAQ course={course} />

        {/* Phone instruction */}
        <div className="p-4 flex items-start gap-3" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Phone size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
          <div>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>TAKE THIS COURSE BY PHONE</p>
            <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
              Once enrolled, dial the 1 Call number and press <span className="font-mono" style={{ color: color }}>{course.dial_code}</span> to start listening to lessons and take your quizzes and exam by voice. SMS fallback is available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Calendar(props) {
  return <Clock {...props} />;
}