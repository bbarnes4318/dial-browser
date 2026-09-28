import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Award, Loader2, AlertCircle, CheckCircle2, XCircle, FileText, ListChecks, Lock,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function ExamPage() {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gateError, setGateError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const a = await base44.entities.Assessment.get(assessmentId).catch(() => null);
      if (!a) { setGateError("Assessment not found."); setLoading(false); return; }
      setAssessment(a);
      const [qs, c] = await Promise.all([
        base44.entities.Question.filter({ assessment_id: assessmentId }, "order_index", 200),
        base44.entities.Course.get(a.course_id).catch(() => null),
      ]);
      setQuestions(Array.isArray(qs) ? qs : []);
      setCourse(c);
      if (user) {
        const ens = await base44.entities.Enrollment.filter({ course_id: a.course_id, owner_user_id: user.id }, "-created_date", 10);
        const paid = (ens || []).find((e) => e.status === "paid" || e.status === "completed");
        if (!paid) setGateError("You must enroll in this course before taking its assessment.");
        else setEnrollment(paid);
      }
    } catch (e) { setGateError("Unable to load this assessment."); }
    finally { setLoading(false); }
  }, [assessmentId, user]);

  useEffect(() => { load(); }, [load]);

  const setAnswer = (qid, value) => setAnswers((p) => ({ ...p, [qid]: value }));

  const allAnswered = questions.length > 0 && questions.every((q) => {
    const v = answers[q.id];
    if (q.type === "multiple_choice" || q.type === "true_false") return v !== undefined && v !== "";
    return v && String(v).trim().length > 0;
  });

  const submit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        assessment_id: assessmentId,
        delivery_channel: "web",
        answers: questions.map((q) => ({ question_id: q.id, response: answers[q.id] })),
      };
      const res = await base44.functions.invoke("grade-exam-attempt", payload);
      const r = res?.data;
      if (!r) { setError("Unable to grade your answers. Please try again."); setSubmitting(false); return; }
      setResult(r);
    } catch (e) {
      setError(e?.response?.data?.error || "Unable to grade your answers. Please try again.");
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (gateError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#05070A" }}>
        <Lock size={32} className="mb-3" style={{ color: "rgba(209,255,38,0.4)" }} />
        <p className="font-mono text-[10px] tracking-widest mb-4 text-center max-w-sm" style={{ color: "#8A8F98" }}>{gateError}</p>
        {course && <Link to={`/courses/${course.id}`} className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>▸ Back to Course</Link>}
      </div>
    );
  }

  // Result screen
  if (result) {
    const passed = result.passed;
    return (
      <div className="min-h-screen" style={{ background: "#05070A" }}>
        <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 lg:px-8 pt-8 pb-24">
          <div className="text-center py-12">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center justify-center w-20 h-20 mb-5" style={{ background: passed ? "rgba(209,255,38,0.12)" : "rgba(239,68,68,0.12)", border: `2px solid ${passed ? "#D1FF26" : "#ef4444"}`, borderRadius: "50%" }}>
              {passed ? <CheckCircle2 size={40} style={{ color: "#D1FF26" }} /> : <XCircle size={40} style={{ color: "#ef4444" }} />}
            </motion.div>
            <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: passed ? "#D1FF26" : "#ef4444" }}>
              {passed ? "▸ ASSESSMENT PASSED" : "▸ ASSESSMENT NOT PASSED"}
            </p>
            <h1 className="font-heading font-black text-3xl mb-2" style={{ color: "#F5F5F7" }}>{passed ? "Congratulations!" : "Keep going."}</h1>
            <p className="text-sm mb-6" style={{ color: "#8A8F98" }}>
              You scored <span className="font-mono font-bold" style={{ color: passed ? "#D1FF26" : "#F5F5F7" }}>{result.score_pct}%</span>
              {" "}({result.awarded_marks}/{result.total_marks} marks). Passing is {assessment.passing_score_pct}%.
            </p>

            {passed && result.verification_code && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-5 mb-6 text-left" style={{ background: "rgba(209,255,38,0.06)", border: "1px solid rgba(209,255,38,0.3)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={16} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>CERTIFICATE EARNED</p>
                </div>
                <p className="text-xs mb-3" style={{ color: "#8A8F98" }}>
                  Your completion certificate has been issued. Share it with employers — anyone can verify it instantly.
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>CODE</span>
                  <span className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>{result.verification_code}</span>
                </div>
                <Link to={`/verify/${result.verification_code}`} className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
                  <Award size={13} /> View Certificate
                </Link>
              </motion.div>
            )}

            {!passed && (
              <div className="flex items-center gap-2 justify-center mb-6 px-4 py-3" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
                <p className="font-mono text-[9px] tracking-wider" style={{ color: "#8A8F98" }}>
                  Attempt {result.attempt_number} of {result.retake_cap}. Review the lessons and try again.
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              {course && <Link to={`/courses/${course.id}`} className="font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>Back to Course</Link>}
              <Link to="/my-courses" className="font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>My Courses</Link>
              {course && <Link to={`/courses/${course.id}/summary`} className="font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>Course Summary</Link>}
              {!passed && result.attempt_number < result.retake_cap && (
                <button onClick={() => { setResult(null); setAnswers({}); }} className="font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ background: "#D1FF26", color: "#05070A" }}>Retake</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam form
  const typeIcon = { quiz: FileText, test: ListChecks, exam: Award };
  const TypeIcon = typeIcon[assessment.type] || FileText;

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        {course && (
          <Link to={`/courses/${course.id}`} className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
            <ArrowLeft size={14} /> Back to Course
          </Link>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TypeIcon size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.3em]" style={{ color: "#D1FF26" }}>// {assessment.type.toUpperCase()}</p>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
            {assessment.title.replace(`${course?.title} — `, "")}
          </h1>
          {course && <p className="text-xs" style={{ color: "#8A8F98" }}>{course.title}</p>}
          <div className="flex items-center gap-4 mt-3 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
            <span>{questions.length} questions</span>
            <span>Pass {assessment.passing_score_pct}%</span>
            {assessment.time_limit_minutes > 0 && <span>{assessment.time_limit_minutes}min limit</span>}
            <span>{assessment.retake_cap} retakes</span>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {questions.map((q, i) => (
            <div key={q.id} className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold" style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26" }}>{i + 1}</span>
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm leading-snug" style={{ color: "#F5F5F7" }}>{q.prompt}</p>
                  <span className="font-mono text-[8px] tracking-widest uppercase mt-1 inline-block" style={{ color: "#8A8F98" }}>
                    {q.type.replace("_", " ")} · {q.marks} mark{(q.marks === 1 ? "" : "s")}
                  </span>
                </div>
              </div>

              {(q.type === "multiple_choice" || q.type === "true_false") ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
                  {(q.options || (q.type === "true_false" ? ["True", "False"] : [])).map((opt, idx) => {
                    const selected = answers[q.id] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setAnswer(q.id, idx)}
                        className="flex items-center gap-2 p-2.5 text-left text-xs transition-all"
                        style={{
                          background: selected ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                          border: `0.5px solid ${selected ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                          color: selected ? "#D1FF26" : "#8A8F98",
                        }}
                      >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: selected ? "#D1FF26" : "rgba(138,143,152,0.15)", color: selected ? "#05070A" : "#8A8F98" }}>{String.fromCharCode(65 + idx)}</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="ml-9">
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder={q.type === "essay" ? "Type your full answer…" : "Type your short answer…"}
                    rows={q.type === "essay" ? 5 : 3}
                    className="w-full p-3 text-sm outline-none resize-y"
                    style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                  />
                  <p className="font-mono text-[8px] tracking-wider mt-1.5" style={{ color: "#8A8F98" }}>Graded by AI against the rubric — be specific.</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
            <AlertCircle size={13} style={{ color: "#ef4444" }} />
            <p className="font-mono text-[9px] tracking-wider" style={{ color: "#ef4444" }}>{error}</p>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!allAnswered || submitting}
          className="w-full flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)] disabled:opacity-40"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {submitting ? "Grading…" : "Submit for Grading"}
        </button>
        {!allAnswered && <p className="text-center font-mono text-[8px] tracking-wider mt-2" style={{ color: "#8A8F98" }}>Answer all questions to submit</p>}
      </div>
    </div>
  );
}