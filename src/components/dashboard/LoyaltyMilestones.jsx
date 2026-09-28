import React from "react";
import { motion } from "framer-motion";
import { Zap, Users, Star, Award, Crown, Lock, Check } from "lucide-react";

// Referral-count milestones — each unlocks a badge + a tangible benefit.
const MILESTONES = [
  { threshold: 1, name: "First Connection", icon: Zap, color: "#D1FF26", benefit: "Priority support badge on your profile" },
  { threshold: 5, name: "Network Builder", icon: Users, color: "#22D3EE", benefit: "50 bonus call credits added to your account" },
  { threshold: 10, name: "Community Anchor", icon: Star, color: "#FFD700", benefit: "Exclusive profile badge + early access to new features" },
  { threshold: 25, name: "Ambassador", icon: Award, color: "#C084FC", benefit: "Free month of Plus tier membership" },
  { threshold: 50, name: "Legend", icon: Crown, color: "#F97316", benefit: "Lifetime 10% credit boost + VIP badge" },
];

export default function LoyaltyMilestones({ completedCount = 0 }) {
  const unlockedCount = MILESTONES.filter((m) => completedCount >= m.threshold).length;
  const nextMilestone = MILESTONES.find((m) => completedCount < m.threshold);
  const prevThreshold = nextMilestone
    ? MILESTONES.filter((m) => m.threshold < nextMilestone.threshold).pop()?.threshold || 0
    : 0;
  const span = nextMilestone ? nextMilestone.threshold - prevThreshold : 0;
  const progress = nextMilestone
    ? Math.min(100, ((completedCount - prevThreshold) / span) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="p-5"
      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Award size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// MILESTONE BADGES</p>
        </div>
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
          {unlockedCount}/{MILESTONES.length} UNLOCKED
        </p>
      </div>
      <p className="text-xs mb-5" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Reach referral milestones to unlock badges and exclusive benefits. Keep sharing to climb the ladder.
      </p>

      {/* Progress to next milestone */}
      {nextMilestone ? (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
              NEXT: {nextMilestone.name.toUpperCase()}
            </p>
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
              {nextMilestone.threshold - completedCount} MORE REFERRAL{nextMilestone.threshold - completedCount !== 1 ? "S" : ""}
            </p>
          </div>
          <div className="h-1.5 w-full" style={{ background: "rgba(5,7,10,0.6)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full"
              style={{ background: "linear-gradient(90deg, #D1FF26, #8cf348)" }}
            />
          </div>
        </div>
      ) : (
        <p className="font-mono text-[10px] tracking-widest text-center mb-5" style={{ color: "#D1FF26" }}>
          ★ ALL MILESTONES UNLOCKED ★
        </p>
      )}

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {MILESTONES.map((m) => {
          const MIcon = m.icon;
          const unlocked = completedCount >= m.threshold;
          return (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative p-3 text-center flex flex-col items-center"
              style={{
                background: unlocked ? "rgba(209,255,38,0.05)" : "rgba(5,7,10,0.5)",
                border: `0.5px solid ${unlocked ? `${m.color}77` : "rgba(138,143,152,0.12)"}`,
                boxShadow: unlocked ? `0 0 18px ${m.color}22` : "none",
              }}
            >
              {/* Badge icon */}
              <div
                className="relative w-11 h-11 flex items-center justify-center rounded-full mb-2"
                style={{
                  background: unlocked ? `${m.color}1a` : "rgba(138,143,152,0.06)",
                  border: `1px solid ${unlocked ? m.color : "rgba(138,143,152,0.2)"}`,
                }}
              >
                <MIcon size={18} style={{ color: unlocked ? m.color : "rgba(138,143,152,0.4)" }} />
                {!unlocked && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full" style={{ background: "#05070A", border: "0.5px solid rgba(138,143,152,0.3)" }}>
                    <Lock size={8} style={{ color: "#8A8F98" }} />
                  </div>
                )}
              </div>

              <p className="font-heading font-bold text-[11px] leading-tight" style={{ color: unlocked ? "#F5F5F7" : "#8A8F98" }}>
                {m.name}
              </p>
              <p className="font-mono text-[7px] tracking-widest mt-1" style={{ color: "rgba(138,143,152,0.6)" }}>
                {m.threshold} REFERRAL{m.threshold !== 1 ? "S" : ""}
              </p>

              <p className="font-mono text-[7px] leading-snug mt-2 px-0.5" style={{ color: unlocked ? m.color : "rgba(138,143,152,0.5)" }}>
                {m.benefit}
              </p>

              {unlocked && (
                <span className="flex items-center gap-1 mt-2 font-mono text-[7px] tracking-widest" style={{ color: m.color }}>
                  <Check size={8} /> UNLOCKED
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}