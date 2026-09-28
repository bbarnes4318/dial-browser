import React from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, CalendarDays, Lock } from "lucide-react";
import { STREAK_MILESTONES, STREAK_BADGES_META } from "./streakBadges";

// Daily study-streak tracker shown on the student dashboard. Displays the
// learner's current consecutive-day streak, longest streak, total active days,
// and the six milestone badges (locked until the streak threshold is reached).
// Streak data is bumped server-side by lesson delivery and quiz grading.
export default function StudyStreakPanel({ streak }) {
  const current = streak?.current_streak || 0;
  const longest = streak?.longest_streak || 0;
  const totalDays = streak?.total_active_days || 0;
  const unlocked = new Set((streak?.unlocked_milestones || []).map(Number));
  const nextMilestone = STREAK_MILESTONES.find((m) => !unlocked.has(m));
  const toNext = nextMilestone ? Math.max(0, nextMilestone - current) : 0;
  const lit = current > 0;

  return (
    <div className="p-4 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DAILY STREAK</p>
        </div>
        {nextMilestone && lit && (
          <span className="font-mono text-[9px] tracking-wider" style={{ color: "#8A8F98" }}>
            {toNext} DAY{toNext === 1 ? "" : "S"} TO {STREAK_BADGES_META[nextMilestone].name.toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex flex-col items-center justify-center w-20 h-20 flex-shrink-0"
          style={{ background: lit ? "linear-gradient(135deg,#D1FF26,#0A0F0A)" : "rgba(5,7,10,0.6)", border: `0.5px solid ${lit ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}` }}>
          <span className="font-heading font-black text-2xl" style={{ color: lit ? "#05070A" : "#4A4F58" }}>{current}</span>
          <span className="font-mono text-[7px] tracking-widest" style={{ color: lit ? "#05070A" : "#4A4F58" }}>DAY{current === 1 ? "" : "S"}</span>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="p-2" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
            <div className="flex items-center gap-1.5"><Trophy size={11} style={{ color: "#D1FF26" }} /><span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>LONGEST</span></div>
            <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{longest}d</p>
          </div>
          <div className="p-2" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
            <div className="flex items-center gap-1.5"><CalendarDays size={11} style={{ color: "#D1FF26" }} /><span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>ACTIVE DAYS</span></div>
            <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{totalDays}</p>
          </div>
        </div>
      </div>

      <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>STREAK BADGES</p>
      <div className="grid grid-cols-6 gap-2">
        {STREAK_MILESTONES.map((m, i) => {
          const earned = unlocked.has(m);
          const meta = STREAK_BADGES_META[m];
          return (
            <motion.div
              key={m}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              title={`${meta.name} — ${meta.description}${earned ? "" : " (locked)"}`}
              className="relative aspect-square flex flex-col items-center justify-center overflow-hidden"
              style={{
                background: earned ? "linear-gradient(135deg,#D1FF26,#1A2A05)" : "rgba(5,7,10,0.6)",
                border: earned ? "0.5px solid rgba(209,255,38,0.5)" : "0.5px solid rgba(138,143,152,0.12)",
                boxShadow: earned ? "0 0 14px rgba(209,255,38,0.18)" : "none",
              }}
            >
              <span className="text-base" style={{ filter: earned ? "none" : "grayscale(1)", opacity: earned ? 1 : 0.4 }}>{meta.emoji}</span>
              <span className="font-mono text-[7px] font-bold" style={{ color: earned ? "#05070A" : "#4A4F58" }}>{m}d</span>
              {!earned && <Lock size={8} className="absolute bottom-1 right-1" style={{ color: "#4A4F58" }} />}
            </motion.div>
          );
        })}
      </div>

      <p className="font-mono text-[8px] tracking-wider mt-3" style={{ color: "#8A8F98" }}>
        {lit ? "STUDY AGAIN TOMORROW TO EXTEND YOUR STREAK" : "COMPLETE A LESSON OR QUIZ TO START YOUR STREAK"}
      </p>
    </div>
  );
}