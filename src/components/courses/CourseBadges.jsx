import React from "react";
import { motion } from "framer-motion";
import { Lock, Award } from "lucide-react";
import { COURSE_BADGES } from "./courseBadges";

// Renders the student's digital badge collection. Earned badges (courses the
// student completed) glow in full color; locked badges for not-yet-completed
// courses appear dimmed. Shown prominently above the course list on the
// student dashboard so progress toward all 16 certifications is visible at a glance.
export default function CourseBadges({ earnedDialCodes = [] }) {
  const earned = new Set(earnedDialCodes.filter(Boolean));
  const earnedCount = COURSE_BADGES.filter((b) => earned.has(b.dial_code)).length;

  return (
    <div className="p-4 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ACHIEVEMENT BADGES</p>
        </div>
        <span className="font-mono text-[9px] tracking-wider" style={{ color: "#8A8F98" }}>
          {earnedCount} / {COURSE_BADGES.length} EARNED
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {COURSE_BADGES.map((badge, i) => {
          const isEarned = earned.has(badge.dial_code);
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.dial_code}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              title={`${badge.name}${isEarned ? " — Earned" : " — Locked"}`}
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
              {!isEarned && (
                <Lock size={9} className="absolute bottom-1 right-1" style={{ color: "#4A4F58" }} />
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="font-mono text-[8px] tracking-wider mt-3" style={{ color: "#8A8F98" }}>
        COMPLETE A CERTIFIED COURSE TO UNLOCK ITS UNIQUE BADGE
      </p>
    </div>
  );
}