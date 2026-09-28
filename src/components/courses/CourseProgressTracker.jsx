import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Lock, Award, ListChecks, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const ASSESSMENT_ICON = { quiz: FileText, test: ListChecks, exam: Award };

// Visual progress system for a single enrolled course: a circular completion
// ring, a per-lesson milestone timeline (done / current / locked), and an
// assessment checklist showing the learner's best score on each quiz, test,
// and exam. Self-contained — fetches the signed-in learner's ExamAttempt rows.
export default function CourseProgressTracker({ course, enrollment, lessons = [], assessments = [], color = "#D1FF26" }) {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !course?.id) { setAttempts([]); return; }
      try {
        const rows = await base44.entities.ExamAttempt.filter({ course_id: course.id, owner_user_id: user.id }, "-created_date", 200);
        if (!cancelled) setAttempts(Array.isArray(rows) ? rows : []);
      } catch { if (!cancelled) setAttempts([]); }
    })();
    return () => { cancelled = true; };
  }, [user, course?.id]);

  const total = lessons.length || 1;
  const progressPct = enrollment?.progress_pct || 0;
  const completedLessons = enrollment?.status === "completed" ? total : Math.min(enrollment?.current_lesson_index || 0, total);
  const currentIdx = enrollment?.status === "completed" ? total - 1 : Math.min(enrollment?.current_lesson_index || 0, total - 1);

  const bestByAssessment = {};
  (attempts || []).forEach((at) => {
    const prev = bestByAssessment[at.assessment_id];
    if (!prev || (at.score_pct || 0) > (prev.score_pct || 0)) bestByAssessment[at.assessment_id] = at;
  });

  const R = 42, C = 2 * Math.PI * R;
  const dash = (progressPct / 100) * C;
  const passedAssessments = assessments.filter((a) => bestByAssessment[a.id]?.passed).length;

  return (
    <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}>
      <div className="flex items-center gap-2 mb-4">
        <ListChecks size={14} style={{ color }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color }}>// PROGRESS TRACKER</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completion ring */}
        <div className="flex flex-col items-center justify-center p-4" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
          <div className="relative">
            <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
              <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(138,143,152,0.15)" strokeWidth="8" />
              <circle cx="55" cy="55" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${C}`} style={{ transition: "stroke-dasharray 0.6s ease", filter: `drop-shadow(0 0 6px ${color}66)` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{Math.round(progressPct)}%</p>
            </div>
          </div>
          <p className="font-mono text-[8px] tracking-widest mt-2" style={{ color: "#8A8F98" }}>{completedLessons}/{total} LESSONS</p>
        </div>

        {/* Lesson milestone timeline */}
        <div className="lg:col-span-2 p-4" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>LESSON TIMELINE</p>
          <div className="flex flex-wrap gap-1.5">
            {lessons.map((l, i) => {
              const done = i < completedLessons;
              const current = i === currentIdx && enrollment?.status !== "completed";
              const Icon = done ? CheckCircle2 : current ? Circle : Lock;
              return (
                <div key={l.id} title={l.title} className="w-6 h-6 flex items-center justify-center" style={{ background: done ? color : current ? `${color}22` : "rgba(5,7,10,0.6)", border: `0.5px solid ${done ? color : current ? color : "rgba(138,143,152,0.12)"}` }}>
                  <Icon size={11} style={{ color: done ? "#05070A" : current ? color : "#4A4F58" }} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 font-mono text-[8px] tracking-wider" style={{ color: "#8A8F98" }}>
            <span className="flex items-center gap-1"><CheckCircle2 size={10} style={{ color }} /> COMPLETE</span>
            <span className="flex items-center gap-1"><Circle size={10} style={{ color }} /> CURRENT</span>
            <span className="flex items-center gap-1"><Lock size={10} style={{ color: "#4A4F58" }} /> LOCKED</span>
          </div>
        </div>
      </div>

      {/* Assessment checklist */}
      <div className="mt-4">
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>ASSESSMENTS · {passedAssessments}/{assessments.length} PASSED</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {assessments.map((a) => {
            const best = bestByAssessment[a.id];
            const Icon = ASSESSMENT_ICON[a.type] || FileText;
            const passed = best?.passed;
            return (
              <div key={a.id} className="flex items-center gap-2 p-2.5" style={{ background: passed ? `${color}10` : "rgba(5,7,10,0.4)", border: `0.5px solid ${passed ? color : "rgba(138,143,152,0.12)"}` }}>
                <Icon size={13} style={{ color: passed ? color : "#8A8F98" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[8px] tracking-widest uppercase truncate" style={{ color: passed ? color : "#8A8F98" }}>{a.type}</p>
                  <p className="text-[10px] truncate" style={{ color: "#F5F5F7" }}>{a.title.replace(`${course?.title} — `, "")}</p>
                </div>
                {best ? (
                  <span className="font-mono text-[9px] font-bold" style={{ color: passed ? color : "#8A8F98" }}>{best.score_pct}%</span>
                ) : (
                  <Lock size={12} style={{ color: "#4A4F58" }} />
                )}
              </div>
            );
          })}
          {assessments.length === 0 && <p className="font-mono text-[8px]" style={{ color: "#4A4F58" }}>NO ASSESSMENTS</p>}
        </div>
      </div>
    </div>
  );
}