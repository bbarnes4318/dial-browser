import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Award, Loader2, TrendingUp, Star, Crown, Sparkles, Check } from "lucide-react";
import LoyaltyMilestones from "@/components/dashboard/LoyaltyMilestones";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Every successfully completed referral earns this many loyalty points.
const POINTS_PER_REFERRAL = 100;

const TIERS = [
  { name: "Bronze", min: 0, icon: Star, color: "#CD7F32" },
  { name: "Silver", min: 500, icon: Award, color: "#C0C0C0" },
  { name: "Gold", min: 1500, icon: Crown, color: "#FFD700" },
  { name: "Platinum", min: 3000, icon: Sparkles, color: "#D1FF26" },
];

export default function LoyaltyBalance() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await base44.entities.Referral.filter(
        { referrer_user_id: user.id },
        "-created_date",
        50
      );
      setReferrals(data || []);
    } catch {
      // empty state shows
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const completed = referrals.filter(
    (r) => r.status === "completed" || r.status === "rewarded"
  );
  const points = completed.length * POINTS_PER_REFERRAL;
  const currentTier =
    [...TIERS].reverse().find((t) => points >= t.min) || TIERS[0];
  const nextTier = TIERS.find((t) => t.min > points);
  const progress = nextTier
    ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;
  const pointsToNext = nextTier ? nextTier.min - points : 0;
  const TierIcon = currentTier.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-3">
          <Award size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// LOYALTY BALANCE</p>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
          Your Loyalty <span style={{ color: "#D1FF26" }}>Points</span>
        </h2>
        <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Earn <span style={{ color: "#D1FF26" }}>{POINTS_PER_REFERRAL} points</span> for every friend who successfully joins 1 Call Away through your referral. Climb tiers to unlock rewards.
        </p>
      </motion.div>

      {/* Balance + tier card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="p-6"
        style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.25)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>CURRENT BALANCE</p>
            <p className="font-heading font-black text-4xl sm:text-5xl" style={{ color: "#D1FF26" }}>
              {points.toLocaleString()}
            </p>
            <p className="font-mono text-[9px] tracking-widest mt-1" style={{ color: "rgba(138,143,152,0.6)" }}>LOYALTY POINTS</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: "rgba(209,255,38,0.06)", border: `0.5px solid ${currentTier.color}55` }}>
            <TierIcon size={18} style={{ color: currentTier.color }} />
            <div>
              <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>TIER</p>
              <p className="font-heading font-bold text-sm" style={{ color: currentTier.color }}>{currentTier.name}</p>
            </div>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                PROGRESS TO {nextTier.name.toUpperCase()}
              </p>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                {pointsToNext} PTS TO GO
              </p>
            </div>
            <div className="h-2 w-full" style={{ background: "rgba(5,7,10,0.6)" }}>
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
          <p className="font-mono text-[10px] tracking-widest text-center py-2" style={{ color: "#D1FF26" }}>
            ★ HIGHEST TIER REACHED ★
          </p>
        )}
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Completed Referrals" value={completed.length} />
        <StatCard label="Points per Referral" value={POINTS_PER_REFERRAL} />
        <StatCard label="Current Tier" value={currentTier.name} highlight />
      </div>

      {/* Tier ladder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="p-5"
        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}
      >
        <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>// TIER LADDER</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIERS.map((t) => {
            const TIcon = t.icon;
            const reached = points >= t.min;
            return (
              <div
                key={t.name}
                className="p-3 text-center"
                style={{
                  background: reached ? "rgba(209,255,38,0.06)" : "rgba(5,7,10,0.4)",
                  border: `0.5px solid ${reached ? `${t.color}66` : "rgba(138,143,152,0.1)"}`,
                }}
              >
                <TIcon size={18} className="mx-auto mb-2" style={{ color: reached ? t.color : "rgba(138,143,152,0.4)" }} />
                <p className="font-heading font-bold text-sm" style={{ color: reached ? "#F5F5F7" : "#8A8F98" }}>{t.name}</p>
                <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "rgba(138,143,152,0.6)" }}>{t.min.toLocaleString()} PTS</p>
                {reached && (
                  <p className="flex items-center justify-center gap-1 mt-2 font-mono text-[8px]" style={{ color: t.color }}>
                    <Check size={9} /> UNLOCKED
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Milestone badges — unlocked at referral milestones */}
      <LoyaltyMilestones completedCount={completed.length} />

      {/* Recent points earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>// POINTS EARNED</p>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : completed.length === 0 ? (
          <div className="text-center py-12" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
            <TrendingUp size={32} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO POINTS YET</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Complete a referral from the Refer &amp; Earn tab to start earning</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completed.map((ref, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.08)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.1)" }}>
                    <Check size={14} style={{ color: "#D1FF26" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#F5F5F7" }}>{ref.service_shared || "Platform referral"}</p>
                    <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>
                      {new Date(ref.created_date).toLocaleDateString()} · {ref.referred_email || "Friend joined"}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>+{POINTS_PER_REFERRAL}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div
      className="p-4 text-center"
      style={{
        background: highlight ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.6)",
        border: `0.5px solid ${highlight ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}`,
      }}
    >
      <p className="font-heading font-black text-xl" style={{ color: highlight ? "#D1FF26" : "#F5F5F7" }}>{value}</p>
      <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>{label}</p>
    </div>
  );
}