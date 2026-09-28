import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2 } from "lucide-react";
import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { base44 } from "@/api/base44Client";

const DAYS = 30;

// Admin panel — visual growth trend of active dating matches over the last
// 30 days. Pulls live from the match-engagement records (DatingLike rows
// where matched = true). Daily new matches render as bars; the running
// cumulative total renders as the lime area, showing match growth over time.
export default function MatchGrowthTrend() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me || me.role !== "admin") {
          setLoading(false);
          return;
        }
        const all = await base44.entities.DatingLike.filter({ matched: true }, "-created_date", 1000);
        setMatches(all || []);
      } catch (e) {
        console.error("match growth load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { chart, totalActive, new30 } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 86400000;
    const buckets = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today.getTime() - (DAYS - 1 - i) * dayMs);
      return { label: `${d.getMonth() + 1}/${d.getDate()}`, date: d, newMatches: 0, cumulative: 0 };
    });

    const tsOf = (m) => new Date(m.matched_at || m.created_date);
    const sorted = [...matches].sort((a, b) => tsOf(a) - tsOf(b));

    // Matches that occurred before the 30-day window — they seed the running total.
    let cum = sorted.filter((m) => {
      const t = tsOf(m); t.setHours(0, 0, 0, 0);
      return t.getTime() < buckets[0].date.getTime();
    }).length;

    sorted.forEach((m) => {
      const t = tsOf(m); t.setHours(0, 0, 0, 0);
      const daysAgo = Math.round((today.getTime() - t.getTime()) / dayMs);
      if (daysAgo >= 0 && daysAgo < DAYS) buckets[DAYS - 1 - daysAgo].newMatches++;
    });
    buckets.forEach((b) => { cum += b.newMatches; b.cumulative = cum; });

    return {
      chart: buckets,
      totalActive: matches.length,
      new30: buckets.reduce((a, b) => a + b.newMatches, 0),
    };
  }, [matches]);

  if (loading) {
    return (
      <div className="mb-8 p-6 flex items-center justify-center" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-6"
      style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}
    >
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ACTIVE MATCH GROWTH — LAST 30 DAYS</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>TOTAL ACTIVE <span style={{ color: "#D1FF26" }}>{totalActive}</span></span>
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NEW · 30D <span style={{ color: "#FF6B35" }}>+{new30}</span></span>
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>
        Cumulative active dating matches over time, pulled live from match engagement records. Bars show new matches per day; the line tracks the running total.
      </p>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chart} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="matchCumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D1FF26" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#D1FF26" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(138,143,152,0.1)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(138,143,152,0.15)" }} tickLine={false} />
            <YAxis yAxisId="left" allowDecimals={false} tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={30} />
            <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 11, fontFamily: "monospace", color: "#F5F5F7" }} labelStyle={{ color: "#D1FF26" }} />
            <Bar yAxisId="left" dataKey="newMatches" name="New / day" fill="#FF6B35" fillOpacity={0.55} barSize={10} radius={[2, 2, 0, 0]} />
            <Area yAxisId="right" type="monotone" dataKey="cumulative" name="Active matches" stroke="#D1FF26" strokeWidth={2} fill="url(#matchCumGrad)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}