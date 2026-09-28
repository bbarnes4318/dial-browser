import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2, AlertCircle, PiggyBank, Activity, Gauge, ArrowUpRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fmtUsd = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => (n || 0).toLocaleString();

export default function UsageForecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getUsageForecast", {});
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load forecast");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-8 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
        <AlertCircle size={14} style={{ color: "#ef4444" }} />
        <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  const cur = data?.current || {};
  const tiers = data?.volumeTiers || [];
  const scenarios = data?.scenarios || [];
  const next = data?.nextMilestone;

  // Position of current projection along the tier ladder (for the progress bar).
  const maxThreshold = tiers.length ? tiers[tiers.length - 1].threshold : 1;
  const curPct = Math.min(100, (cur.projectedMonthlyUsage / maxThreshold) * 100);
  const nextPct = next ? Math.min(100, (next.threshold / maxThreshold) * 100) : 100;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 relative overflow-hidden" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Gauge size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// USAGE FORECAST — MONTHLY COST PROJECTION</p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: "#5AE0C8" }}>
          <Activity size={11} /> CYCLE {Math.round((cur.cycleProgress || 0) * 100)}% COMPLETE
        </span>
      </div>

      {/* Projected monthly cost + run-rate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>PROJECTED MONTHLY COST</p>
          <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{fmtUsd(cur.projectedMonthlyCost)}</p>
          <p className="font-mono text-[7px] mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>{fmtNum(cur.projectedMonthlyUsage)} credits @ ${cur.effectiveRate?.toFixed(3)}/cr</p>
        </div>
        <div className="p-4" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>USAGE THIS CYCLE</p>
          <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{fmtNum(cur.totalUsed)}</p>
          <p className="font-mono text-[7px] mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>{cur.activeUsers} active users</p>
        </div>
        <div className="p-4" style={{ background: cur.currentSavings > 0 ? "rgba(209,255,38,0.06)" : "rgba(5,7,10,0.5)", border: cur.currentSavings > 0 ? "0.5px solid rgba(209,255,38,0.3)" : "0.5px solid rgba(138,143,152,0.15)" }}>
          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>VOLUME SAVINGS (NOW)</p>
          <p className="font-heading font-black text-2xl" style={{ color: cur.currentSavings > 0 ? "#D1FF26" : "#F5F5F7" }}>{fmtUsd(cur.currentSavings)}</p>
          <p className="font-mono text-[7px] mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>vs ${fmtUsd(cur.baselineCost)} at baseline rate</p>
        </div>
      </div>

      {/* Volume discount tier ladder — current position + next milestone */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <PiggyBank size={11} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>VOLUME DISCOUNT TIERS — SAVINGS UNLOCK AS TRAFFIC GROWS</p>
        </div>

        {/* Progress bar */}
        <div className="relative h-10 mb-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
          <div className="absolute top-0 left-0 h-full" style={{ width: `${curPct}%`, background: "linear-gradient(90deg, rgba(209,255,38,0.15), rgba(209,255,38,0.4))", boxShadow: "0 0 12px rgba(209,255,38,0.2)" }} />
          {/* tier threshold markers */}
          {tiers.map((t, i) => {
            const left = (t.threshold / maxThreshold) * 100;
            return (
              <div key={t.label} className="absolute top-0 bottom-0" style={{ left: `${left}%` }}>
                <div className="h-full" style={{ width: i === 0 ? 0 : 1, background: "rgba(138,143,152,0.25)" }} />
              </div>
            );
          })}
          {/* current position marker */}
          <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${curPct}%` }}>
            <div className="w-0.5 h-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }} />
            <span className="ml-1 font-mono text-[8px] px-1.5 py-0.5" style={{ background: "#D1FF26", color: "#05070A" }}>NOW</span>
          </div>
          {/* next milestone marker */}
          {next && (
            <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${nextPct}%` }}>
              <div className="w-0.5 h-full" style={{ background: "#5AE0C8", boxShadow: "0 0 8px #5AE0C8" }} />
              <span className="ml-1 font-mono text-[8px] px-1.5 py-0.5 whitespace-nowrap" style={{ background: "rgba(90,224,200,0.15)", color: "#5AE0C8", border: "0.5px solid rgba(90,224,200,0.4)" }}>{next.label}</span>
            </div>
          )}
        </div>

        {/* Tier labels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tiers.map((t) => (
            <div key={t.label} className="p-3" style={{ background: t.active ? "rgba(209,255,38,0.06)" : "rgba(5,7,10,0.5)", border: t.active ? "0.5px solid rgba(209,255,38,0.3)" : "0.5px solid rgba(138,143,152,0.12)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[8px] tracking-widest font-bold" style={{ color: t.active ? "#D1FF26" : "#8A8F98" }}>{t.label}</span>
                {t.active && <span className="font-mono text-[7px]" style={{ color: "#D1FF26" }}>●</span>}
              </div>
              <p className="font-mono text-[8px] mb-0.5" style={{ color: "#F5F5F7" }}>{fmtNum(t.threshold)}+ cr/mo</p>
              <p className="font-mono text-[8px]" style={{ color: "#5AE0C8" }}>${t.rate.toFixed(3)}/cr · {t.savingsPct}% off</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next milestone callout */}
      {next && (
        <div className="mb-6 p-4 flex items-center gap-3" style={{ background: "rgba(90,224,200,0.05)", border: "0.5px solid rgba(90,224,200,0.25)" }}>
          <ArrowUpRight size={18} style={{ color: "#5AE0C8" }} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#5AE0C8" }}>NEXT SAVINGS MILESTONE — {next.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "#F5F5F7" }}>
              {fmtNum(next.creditsAway)} more credits/mo unlocks <span style={{ color: "#5AE0C8" }}>{next.savingsPct}% off</span> your effective rate
              {next.usersAway > 0 ? ` · ≈ ${next.usersAway} new active users at current pace` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Growth scenarios — cost at 2x / 5x / 10x traffic */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={11} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>GROWTH SCENARIOS — PROJECTED COST & SAVINGS</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scenarios.map((s) => {
            const hasSavings = s.savings > 0;
            return (
              <div key={s.multiplier} className="p-4" style={{ background: hasSavings ? "rgba(209,255,38,0.04)" : "rgba(5,7,10,0.5)", border: hasSavings ? "0.5px solid rgba(209,255,38,0.25)" : "0.5px solid rgba(138,143,152,0.12)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{s.multiplier}× traffic</span>
                  <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: hasSavings ? "rgba(209,255,38,0.1)" : "rgba(138,143,152,0.1)", color: hasSavings ? "#D1FF26" : "#8A8F98" }}>{s.tierLabel}</span>
                </div>
                <p className="font-mono text-[8px] mb-1" style={{ color: "rgba(138,143,152,0.7)" }}>{fmtNum(s.projectedUsage)} credits/mo</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>PROJECTED COST</p>
                    <p className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{fmtUsd(s.cost)}</p>
                  </div>
                  {hasSavings && (
                    <div className="text-right">
                      <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>SAVINGS</p>
                      <p className="font-heading font-bold text-sm" style={{ color: "#5AE0C8" }}>{fmtUsd(s.savings)}</p>
                      <p className="font-mono text-[7px]" style={{ color: "#5AE0C8" }}>{s.savingsPct}% off</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 pt-3 font-mono text-[9px] leading-relaxed" style={{ color: "rgba(138,143,152,0.7)", borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
        Forecast projects this cycle's run-rate to a full month, then models volume-discounted per-credit rates as traffic scales. Savings reflect the gap between the baseline ${"$0.010/cr"} rate and the tier rate your projected usage qualifies for. Admin testing is exempt from credit accounting, so this reflects real member activity only.
      </p>
    </motion.div>
  );
}