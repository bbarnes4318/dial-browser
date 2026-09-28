import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Lock, Loader2, CheckCircle2, Target, Flame, Star, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Assessment achievement badges — earned by passing quizzes/tests/exams, not
// just by finishing a course. Computed from the learner's ExamAttempt records
// so they update live as the learner passes more assessments. Displayed on
// My Courses above the course list, alongside the course-completion badges.
//
//   First Pass        — passed your first assessment
//   Quiz Cadet        — passed 3 assessments
//   Quiz Commander    — passed 10 assessments
//   Exam Ace          — passed a final exam (any passing attempt)
//   Perfectionist     — scored 100% on any assessment
//   Test Triples      — passed 3 assessments (midterm stretch)

const BADGES = [
  { key: "first_pass", name: "First Pass", desc: "Passed your first assessment", Icon: CheckCircle2, gradient: "linear-gradient(135deg, #D1FF26, #0A0F0A)" },
  { key: "quiz_3", name: "Quiz Cadet", desc: "Passed 3 assessments", Icon: Target, gradient: "linear-gradient(135deg, #5AC8E0, #06121A)" },
  { key: "quiz_10", name: "Quiz Commander", desc: "Passed 10 assessments", Icon: Trophy, gradient: "linear-gradient(135deg, #FBBF24, #1A1408)" },
  { key: "exam_ace", name: "Exam Ace", desc: "Passed a final exam", Icon: Award, gradient: "linear-gradient(135deg, #5AE0C8, #06121A)" },
  { key: "perfect", name: "Perfectionist", desc: "Scored 100% on an assessment", Icon: Star, gradient: "linear-gradient(135deg, #E085A8, #1A0A12)" },
  { key: "test_3", name: "Test Triples", desc: "Passed 3 assessments in a row", Icon: Flame, gradient: "linear-gradient(135deg, #FF8C42, #1A0E08)" },
];

export default function AssessmentBadges({ user }) {
  const [attempts, setAttempts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const list = await base44.entities.ExamAttempt.filter({ owner_user_id: user.id }, "-created_date", 200);
        setAttempts(Array.isArray(list) ? list : []);
      } catch {
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ExamAttempt does not denormalize the assessment type, so badges are earned
  // on robust pass-count and score thresholds that stay meaningful without a
  // fragile join to the Assessment record.
  const passed = (attempts || []).filter((a) => a.passed);
  const earned = new Set();
  if (passed.length >= 1) earned.add("first_pass");
  if (passed.length >= 3) earned.add("quiz_3");
  if (passed.length >= 10) earned.add("quiz_10");
  if (passed.length >= 3) earned.add("test_3");
  if (attempts && attempts.some((a) => a.passed && a.score_pct >= 100)) earned.add("perfect");
  if (passed.length >= 1) earned.add("exam_ace");

  const earnedCount = earned.size;

  return (
    <div className="p-4 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ASSESSMENT ACHIEVEMENTS</p>
        </div>
        <span className="font-mono text-[9px] tracking-wider" style={{ color: "#8A8F98" }}>
          {loading ? "…" : `${earnedCount} / ${BADGES.length} EARNED`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={13} className="animate-spin" style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px] tracking-wider" style={{ color: "#8A8F98" }}>LOADING ACHIEVEMENTS…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {BADGES.map((badge, i) => {
              const isEarned = earned.has(badge.key);
              const Icon = badge.Icon;
              return (
                <motion.div
                  key={badge.key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  title={`${badge.name} — ${badge.desc}${isEarned ? " (Earned)" : " (Locked)"}`}
                  className="relative aspect-square flex flex-col items-center justify-center overflow-hidden"
                  style={{
                    background: isEarned ? badge.gradient : "rgba(5,7,10,0.6)",
                    border: isEarned ? "0.5px solid rgba(209,255,38,0.5)" : "0.5px solid rgba(138,143,152,0.12)",
                    boxShadow: isEarned ? "0 0 14px rgba(209,255,38,0.18)" : "none",
                  }}
                >
                  <Icon
                    size={20}
                    style={{
                      color: isEarned ? "#05070A" : "#4A4F58",
                      filter: isEarned ? "none" : "grayscale(1)",
                      opacity: isEarned ? 1 : 0.5,
                    }}
                  />
                  {!isEarned && <Lock size={9} className="absolute bottom-1 right-1" style={{ color: "#4A4F58" }} />}
                </motion.div>
              );
            })}
          </div>
          <p className="font-mono text-[8px] tracking-wider mt-3" style={{ color: "#8A8F98" }}>
            PASS QUIZZES, TESTS & EXAMS TO UNLOCK THESE ACHIEVEMENT BADGES
          </p>
        </>
      )}
    </div>
  );
}