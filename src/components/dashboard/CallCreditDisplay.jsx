import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Gift, CalendarClock, Loader2, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PORTAL, glassPanel } from "@/components/social/portal/portalTheme";

const TIER_META = {
  free: { label: "Free", monthly: 25, accent: "cyan" },
  plus: { label: "Plus", monthly: 300, accent: "cyan" },
  premium: { label: "Premium", monthly: 800, accent: "magenta" },
  elite: { label: "Elite", monthly: 2000, accent: "magenta" },
  ultimate: { label: "Ultimate", monthly: 5000, accent: "magenta" },
};

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
  } catch {
    return "—";
  }
}

export default function CallCreditDisplay() {
  const [credit, setCredit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await base44.entities.CallCredit.list("-created_date", 1);
        if (cancelled) return;
        setCredit(rows && rows.length > 0 ? rows[0] : null);
      } catch {
        if (!cancelled) setCredit(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const unsub = base44.entities.CallCredit.subscribe?.(() => load());
    return () => {
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const tier = credit?.plan_tier || "free";
  const meta = TIER_META[tier] || TIER_META.free;
  const total = credit?.total_credits ?? meta.monthly;
  const used = credit?.used_credits ?? 0;
  const bonus = credit?.bonus_credits ?? 0;
  const pool = total + bonus;
  const remaining = Math.max(0, pool - used);
  const usedPct = pool > 0 ? Math.min(100, (used / pool) * 100) : 0;

  const accentColor = meta.accent === "magenta" ? PORTAL.magenta : PORTAL.cyan;
  const accentBorder = meta.accent === "magenta" ? "rgba(255,0,255,0.4)" : "rgba(0,240,255,0.4)";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10" style={{ ...glassPanel(meta.accent), minHeight: 120 }}>
        <Loader2 size={18} className="animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
      style={glassPanel(meta.accent)}
    >
      {/* Scanning neon line */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div
          className="h-full w-1/3"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            animation: "tickerScroll 4s linear infinite",
          }}
        />
      </div>

      <div className="p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: accentColor }} />
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: accentColor }}>
              // Call Credits
            </p>
          </div>
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase"
            style={{
              background: "rgba(0,240,255,0.06)",
              border: `0.5px solid ${accentBorder}`,
              color: accentColor,
            }}
          >
            <Crown size={10} /> {meta.label} Tier
          </span>
        </div>

        {/* Big remaining readout */}
        <div className="flex items-end gap-2 mb-1">
          <span
            className="font-heading font-black text-4xl lg:text-5xl leading-none tabular-nums"
            style={{ color: PORTAL.text, textShadow: `0 0 24px ${accentColor}66` }}
          >
            {remaining.toLocaleString()}
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase pb-1.5" style={{ color: PORTAL.muted }}>
            minutes left
          </span>
        </div>
        <p className="font-mono text-[9px] tracking-widest mb-5" style={{ color: PORTAL.muted }}>
          OF {pool.toLocaleString()} THIS CYCLE · {used.toLocaleString()} USED
        </p>

        {/* Neon progress bar */}
        <div className="relative h-2 mb-6 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usedPct}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute inset-y-0 left-0"
            style={{
              background: `linear-gradient(90deg, ${accentColor}, ${meta.accent === "magenta" ? PORTAL.pink : "#00b3cc"})`,
              boxShadow: `0 0 12px ${accentColor}99`,
            }}
          />
          {/* Tick markers */}
          <div className="absolute inset-0 flex justify-between px-[1px]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-px h-full" style={{ background: "rgba(0,0,0,0.4)" }} />
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Billing cycle */}
          <div className="p-3" style={{ background: "rgba(0,0,0,0.25)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarClock size={11} style={{ color: PORTAL.cyan }} />
              <p className="font-mono text-[8px] tracking-widest uppercase" style={{ color: PORTAL.muted }}>Billing Cycle</p>
            </div>
            <p className="font-mono text-[10px] leading-relaxed" style={{ color: PORTAL.text }}>
              {fmtDate(credit?.billing_cycle_start)}<br />
              <span style={{ color: PORTAL.muted }}>→</span> {fmtDate(credit?.billing_cycle_end)}
            </p>
          </div>

          {/* Bonus credits */}
          <div
            className="p-3"
            style={{
              background: "rgba(255,0,255,0.05)",
              border: "0.5px solid rgba(255,0,255,0.25)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Gift size={11} style={{ color: PORTAL.magenta }} />
              <p className="font-mono text-[8px] tracking-widest uppercase" style={{ color: PORTAL.muted }}>Bonus Credits</p>
            </div>
            <p
              className="font-heading font-black text-xl leading-none tabular-nums"
              style={{ color: PORTAL.magenta, textShadow: "0 0 16px rgba(255,0,255,0.4)" }}
            >
              +{bonus.toLocaleString()}
            </p>
            <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: PORTAL.muted }}>EXTRA MINUTES</p>
          </div>
        </div>

        {/* Low-credit hint */}
        {remaining > 0 && remaining < total * 0.15 && (
          <p className="font-mono text-[9px] tracking-widest mt-4 text-center" style={{ color: PORTAL.pink }}>
            ⚠ LOW — TOP UP BEFORE RESET
          </p>
        )}
      </div>
    </motion.div>
  );
}