import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, GraduationCap, Loader2, BookOpen, ListChecks, Users, Save, Plus,
  CheckCircle2, Hash, Clock, Award, AlertCircle, TrendingUp, User,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import InstructorAnalytics from "@/components/courses/InstructorAnalytics";
import InstructorProfileEditor from "@/components/courses/InstructorProfileEditor";
import InstructorProfileHeader from "@/components/courses/InstructorProfileHeader";

const CATEGORY_COLORS = {
  AI: "#D1FF26", Engineering: "#5AC8E0", Healthcare: "#5AE0C8", Hospitality: "#E085A8",
  Education: "#FBBF24", Trades: "#5A8FE0", Security: "#94A3B8", Finance: "#60A5FA",
  Automotive: "#A3E635", Science: "#5AE07A", Business: "#E0A85A", Marketing: "#E085A8",
  Technology: "#5AC8E0",
};

const STATUS_META = {
  paid: { label: "In Progress", color: "#D1FF26" },
  completed: { label: "Completed", color: "#5AE0C8" },
  pending: { label: "Pending", color: "#8A8F98" },
  expired: { label: "Expired", color: "#ef4444" },
};

export default function InstructorDashboard() {
  const [data, setData] = useState({ courses: [] });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("lessons");
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("instructor-dashboard", {});
      const d = res?.data;
      setData(d || { courses: [] });
      if (d?.courses?.length > 0 && !selectedId) setSelectedId(d.courses[0].id);
    } catch { setData({ courses: [] }); }
    finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  const course = data.courses.find((c) => c.id === selectedId);
  const color = course ? CATEGORY_COLORS[course.category] || "#D1FF26" : "#D1FF26";

  const saveLesson = async () => {
    if (!editingLesson) return;
    setSaving(true); setFeedback(null);
    try {
      const res = await base44.functions.invoke("instructor-save-content", {
        action: "save_lesson",
        lesson_id: editingLesson.id,
        course_id: course.id,
        title: editingLesson.title,
        summary: editingLesson.summary,
        lesson_text: editingLesson.lesson_text,
      });
      if (res?.data?.ok) {
        setFeedback({ ok: true, msg: "Lesson script saved" });
        setEditingLesson(null);
        load();
      } else throw new Error(res?.data?.error || "Save failed");
    } catch (e) { setFeedback({ ok: false, msg: e.message || "Save failed" }); }
    finally { setSaving(false); }
  };

  const saveQuestion = async () => {
    if (!editingQuestion) return;
    setSaving(true); setFeedback(null);
    const q = editingQuestion;
    const payload = {
      action: "save_question",
      assessment_id: q.assessment_id,
      course_id: course.id,
      type: q.type, prompt: q.prompt, options: q.options, correct_option_index: q.correct_option_index,
      correct_answer_text: q.correct_answer_text, rubric: q.rubric, marks: Number(q.marks) || 1, order_index: Number(q.order_index) || 0,
    };
    if (q.id) payload.question_id = q.id;
    try {
      const res = await base44.functions.invoke("instructor-save-content", payload);
      if (res?.data?.ok) {
        setFeedback({ ok: true, msg: q.id ? "Question updated" : "Question added" });
        setEditingQuestion(null);
        load();
      } else throw new Error(res?.data?.error || "Save failed");
    } catch (e) { setFeedback({ ok: false, msg: e.message || "Save failed" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// INSTRUCTOR DASHBOARD</p>
          </div>
          <h1 className="font-heading font-black text-3xl tracking-tight" style={{ color: "#F5F5F7" }}>
            Teach. <span style={{ color: "#D1FF26" }}>Track. Certify.</span>
          </h1>
        </div>

        <InstructorProfileHeader courses={data.courses} />

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : data.courses.length === 0 ? (
          <div className="text-center py-24">
            <GraduationCap size={36} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO ASSIGNED COURSES</p>
            <p className="text-xs" style={{ color: "#8A8F98" }}>An admin must assign you as an instructor to a course.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Course list */}
            <div className="lg:col-span-1">
              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR COURSES</p>
              <div className="space-y-2">
                {data.courses.map((c) => {
                  const cc = CATEGORY_COLORS[c.category] || "#D1FF26";
                  const active = c.id === selectedId;
                  const studentCount = c.enrollments.length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedId(c.id); setEditingLesson(null); setEditingQuestion(null); setFeedback(null); }}
                      className="w-full text-left p-3 transition-all"
                      style={{
                        background: active ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.5)",
                        border: `0.5px solid ${active ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                      }}
                    >
                      <p className="font-heading font-bold text-sm" style={{ color: active ? "#D1FF26" : "#F5F5F7" }}>{c.title}</p>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                        <span className="flex items-center gap-1"><Hash size={8} style={{ color: cc }} />{c.dial_code}</span>
                        <span className="flex items-center gap-1"><Users size={8} />{studentCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-3">
              {course && (
                <>
                  <div className="p-4 mb-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}>
                    <p className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>{course.title}</p>
                    <div className="flex items-center gap-4 mt-1 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                      <span className="flex items-center gap-1"><BookOpen size={10} style={{ color }} />{course.lessons.length} lessons</span>
                      <span className="flex items-center gap-1"><ListChecks size={10} style={{ color }} />{course.assessments.length} assessments</span>
                      <span className="flex items-center gap-1"><Users size={10} style={{ color }} />{course.enrollments.length} students</span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1.5 mb-4">
                    {[
                      { id: "lessons", label: "Lesson Scripts", Icon: BookOpen },
                      { id: "questions", label: "Quiz Questions", Icon: ListChecks },
                      { id: "students", label: "Student Progress", Icon: Users },
                      { id: "analytics", label: "Analytics", Icon: TrendingUp },
                      { id: "profile", label: "My Profile", Icon: User },
                    ].map((t) => {
                      const active = tab === t.id;
                      const I = t.Icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => { setTab(t.id); setEditingLesson(null); setEditingQuestion(null); setFeedback(null); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase"
                          style={{
                            background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)",
                            border: `0.5px solid ${active ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                            color: active ? "#D1FF26" : "#8A8F98",
                          }}
                        >
                          <I size={11} /> {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {feedback && (
                    <div className="flex items-center gap-1.5 mb-3 px-3 py-2" style={{ background: feedback.ok ? "rgba(209,255,38,0.08)" : "rgba(239,68,68,0.08)", border: `0.5px solid ${feedback.ok ? "rgba(209,255,38,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                      {feedback.ok ? <CheckCircle2 size={12} style={{ color: "#D1FF26" }} /> : <AlertCircle size={12} style={{ color: "#ef4444" }} />}
                      <p className="font-mono text-[9px] tracking-wider" style={{ color: feedback.ok ? "#D1FF26" : "#ef4444" }}>{feedback.msg}</p>
                    </div>
                  )}

                  {/* Lessons tab */}
                  {tab === "lessons" && (
                    <div className="space-y-2">
                      {editingLesson ? (
                        <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}33` }}>
                          <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>EDITING: {editingLesson.title}</p>
                          <input
                            value={editingLesson.title}
                            onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                            placeholder="Lesson title"
                            className="w-full px-3 py-2 text-sm mb-2 outline-none"
                            style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                          />
                          <input
                            value={editingLesson.summary || ""}
                            onChange={(e) => setEditingLesson({ ...editingLesson, summary: e.target.value })}
                            placeholder="Short summary (shown on the course outline)"
                            className="w-full px-3 py-2 text-xs mb-2 outline-none"
                            style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                          />
                          <textarea
                            value={editingLesson.lesson_text || ""}
                            onChange={(e) => setEditingLesson({ ...editingLesson, lesson_text: e.target.value })}
                            placeholder="Full narration script read aloud by TTS during the voice lesson..."
                            rows={8}
                            className="w-full px-3 py-2 text-xs outline-none resize-y font-body"
                            style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7", lineHeight: 1.5 }}
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={saveLesson}
                              disabled={saving}
                              className="flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-50"
                              style={{ background: "#D1FF26", color: "#05070A" }}
                            >
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Script
                            </button>
                            <button
                              onClick={() => setEditingLesson(null)}
                              className="px-4 py-2 font-mono text-[9px] tracking-widest uppercase"
                              style={{ border: "0.5px solid rgba(138,143,152,0.3)", color: "#8A8F98" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        course.lessons.map((l, i) => (
                          <button
                            key={l.id}
                            onClick={() => setEditingLesson({ ...l })}
                            className="w-full text-left flex items-start gap-3 p-3 transition-all hover:border-[rgba(209,255,38,0.3)]"
                            style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.08)" }}
                          >
                            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center font-mono text-[10px] font-bold" style={{ background: `${color}22`, color }}>{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{l.title}</p>
                              {l.summary && <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "#8A8F98" }}>{l.summary}</p>}
                              <p className="font-mono text-[8px] mt-1" style={{ color: "#4A4F58" }}>{(l.lesson_text || "").length} chars · {l.duration_minutes}m</p>
                            </div>
                            <span className="font-mono text-[8px] tracking-widest flex-shrink-0" style={{ color }}>EDIT ▸</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Questions tab */}
                  {tab === "questions" && (
                    <div className="space-y-4">
                      {course.assessments.map((a) => (
                        <div key={a.id} className="p-4" style={{ background: "rgba(16,20,29,0.4)", border: `0.5px solid ${color}22` }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Award size={12} style={{ color }} />
                              <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{a.title.replace(`${course.title} — `, "")}</p>
                              <span className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5" style={{ background: `${color}22`, color }}>{a.type}</span>
                            </div>
                            <button
                              onClick={() => setEditingQuestion({ assessment_id: a.id, type: "multiple_choice", prompt: "", options: ["", ""], correct_option_index: 0, marks: 1, order_index: a.questions.length })}
                              className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-widest uppercase"
                              style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                            >
                              <Plus size={10} /> Add
                            </button>
                          </div>

                          {editingQuestion && editingQuestion.assessment_id === a.id && (
                            <div className="p-3 mb-3" style={{ background: "rgba(5,7,10,0.5)", border: `0.5px solid ${color}44` }}>
                              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>{editingQuestion.id ? "EDIT QUESTION" : "NEW QUESTION"}</p>
                              <select
                                value={editingQuestion.type}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value, options: e.target.value === "multiple_choice" ? editingQuestion.options || ["", ""] : e.target.value === "true_false" ? ["True", "False"] : [] })}
                                className="w-full px-2 py-1.5 text-xs mb-2 outline-none"
                                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                              >
                                <option value="multiple_choice">Multiple Choice (DTMF)</option>
                                <option value="true_false">True / False (DTMF)</option>
                                <option value="short_answer">Short Answer (spoken, LLM-graded)</option>
                                <option value="essay">Essay (spoken, LLM-graded)</option>
                              </select>
                              <textarea
                                value={editingQuestion.prompt || ""}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                                placeholder="Question prompt (read aloud to the learner)"
                                rows={2}
                                className="w-full px-2 py-1.5 text-xs mb-2 outline-none resize-y"
                                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                              />
                              {(editingQuestion.type === "multiple_choice" || editingQuestion.type === "true_false") && (
                                <div className="mb-2">
                                  {(editingQuestion.options || []).map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-2 mb-1">
                                      <button
                                        onClick={() => setEditingQuestion({ ...editingQuestion, correct_option_index: oi })}
                                        className="w-5 h-5 flex items-center justify-center text-[10px]"
                                        style={{ background: (editingQuestion.correct_option_index === oi) ? "#D1FF26" : "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.3)", color: (editingQuestion.correct_option_index === oi) ? "#05070A" : "#8A8F98" }}
                                      >
                                        {editingQuestion.correct_option_index === oi ? "✓" : String.fromCharCode(65 + oi)}
                                      </button>
                                      <input
                                        value={opt}
                                        disabled={editingQuestion.type === "true_false"}
                                        onChange={(e) => {
                                          const next = [...(editingQuestion.options || [])];
                                          next[oi] = e.target.value;
                                          setEditingQuestion({ ...editingQuestion, options: next });
                                        }}
                                        className="flex-1 px-2 py-1 text-xs outline-none disabled:opacity-60"
                                        style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                                      />
                                      {editingQuestion.type === "multiple_choice" && (editingQuestion.options || []).length > 2 && (
                                        <button onClick={() => setEditingQuestion({ ...editingQuestion, options: (editingQuestion.options || []).filter((_, x) => x !== oi), correct_option_index: Math.min(editingQuestion.correct_option_index || 0, (editingQuestion.options || []).length - 2) })} className="font-mono text-[9px]" style={{ color: "#ef4444" }}>✕</button>
                                      )}
                                    </div>
                                  ))}
                                  {editingQuestion.type === "multiple_choice" && (
                                    <button onClick={() => setEditingQuestion({ ...editingQuestion, options: [...(editingQuestion.options || []), ""] })} className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#D1FF26" }}>+ ADD OPTION</button>
                                  )}
                                </div>
                              )}
                              {(editingQuestion.type === "short_answer" || editingQuestion.type === "essay") && (
                                <>
                                  <input
                                    value={editingQuestion.correct_answer_text || ""}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer_text: e.target.value })}
                                    placeholder="Reference correct answer (used as LLM grading reference)"
                                    className="w-full px-2 py-1.5 text-xs mb-2 outline-none"
                                    style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                                  />
                                  <textarea
                                    value={editingQuestion.rubric || ""}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, rubric: e.target.value })}
                                    placeholder="Grading rubric passed to the LLM grader"
                                    rows={2}
                                    className="w-full px-2 py-1.5 text-xs mb-2 outline-none resize-y"
                                    style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                                  />
                                </>
                              )}
                              <div className="flex items-center gap-2 mb-3">
                                <label className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>MARKS</label>
                                <input type="number" min="1" value={editingQuestion.marks || 1} onChange={(e) => setEditingQuestion({ ...editingQuestion, marks: e.target.value })} className="w-16 px-2 py-1 text-xs outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={saveQuestion} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-50" style={{ background: "#D1FF26", color: "#05070A" }}>
                                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                                </button>
                                <button onClick={() => setEditingQuestion(null)} className="px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.3)", color: "#8A8F98" }}>Cancel</button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            {a.questions.map((q, qi) => (
                              <button
                                key={q.id}
                                onClick={() => setEditingQuestion({ ...q, options: q.options || (q.type === "true_false" ? ["True", "False"] : ["", ""]) })}
                                className="w-full text-left flex items-start gap-2 p-2.5 transition-all hover:border-[rgba(209,255,38,0.3)]"
                                style={{ background: "rgba(5,7,10,0.3)", border: "0.5px solid rgba(138,143,152,0.1)" }}
                              >
                                <span className="font-mono text-[9px] flex-shrink-0 mt-0.5" style={{ color }}>{qi + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs line-clamp-2" style={{ color: "#F5F5F7" }}>{q.prompt}</p>
                                  <p className="font-mono text-[8px] mt-0.5" style={{ color: "#8A8F98" }}>{q.type} · {q.marks} marks</p>
                                </div>
                              </button>
                            ))}
                            {a.questions.length === 0 && <p className="font-mono text-[8px] py-2" style={{ color: "#4A4F58" }}>NO QUESTIONS YET</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Students tab */}
                  {tab === "students" && (
                    <div className="space-y-2">
                      {course.enrollments.length === 0 ? (
                        <div className="text-center py-12">
                          <Users size={28} className="mx-auto mb-2" style={{ color: "rgba(209,255,38,0.3)" }} />
                          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO ENROLLMENTS YET</p>
                        </div>
                      ) : course.enrollments.map((en) => {
                        const meta = STATUS_META[en.status] || STATUS_META.pending;
                        return (
                          <div key={en.id} className="p-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.08)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{en.learner_name || en.owner_email || "Public buyer"}</p>
                                {en.owner_email && <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{en.owner_email}</p>}
                              </div>
                              <span className="font-mono text-[8px] tracking-widest uppercase px-2 py-1" style={{ background: `${meta.color}15`, color: meta.color }}>{meta.label}</span>
                            </div>
                            <div className="relative h-2 w-full" style={{ background: "rgba(138,143,152,0.12)" }}>
                              <div className="h-full transition-all" style={{ width: `${en.progress_pct || 0}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
                            </div>
                            <div className="flex items-center justify-between mt-1.5 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                              <span>LESSON {(en.current_lesson_index || 0) + 1}</span>
                              <span style={{ color }}>{en.progress_pct || 0}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {tab === "analytics" && (
                    <InstructorAnalytics course={course} color={color} />
                  )}

                  {tab === "profile" && (
                    <InstructorProfileEditor />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}