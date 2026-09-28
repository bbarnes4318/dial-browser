import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Loader2, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ET = "America/New_York";
const dateFmt = new Intl.DateTimeFormat("en-US", { timeZone: ET, month: "2-digit", day: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: ET, weekday: "short" });
const hourFmt = new Intl.DateTimeFormat("en-US", { timeZone: ET, hour: "2-digit", hour12: false });

const CAT_COLORS = {
  Medical: "#5AE0C8",
  Music: "#D1FF26",
  Weather: "#7AA2F7",
  Jobs: "#E0A85A",
  Grocery: "#C8A0FF",
  Construction: "#FF9F64",
  Real_Estate: "#7AE08A",
  Default: "#8A8F98",
};

function colorFor(cat) {
  return CAT_COLORS[cat] || CAT_COLORS.Default;
}

// Build a contiguous 14-day window ending today (ET)
function build14Days() {
  const days = [];
  const nowEt = new Date(new Date().toLocaleString("en-US", { timeZone: ET }));
  for (let i = 13; i >= 0; i--) {
    const d = new Date(nowEt);
    d.setDate(nowEt.getDate() - i);
    days.push({ key: dateFmt.format(d), weekday: weekdayFmt.format(d), date: d, count: 0, commands: [] });
  }
  return days;
}

export default function LiveTrafficGlow() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [livePulse, setLivePulse] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.VoiceCommand.filter({}, "-created_date", 200);
        setCommands(data || []);
      } catch {
        // empty state shows
      } finally {
        setLoading(false);
      }
    })();

    // Realtime subscription — new commands flow in live
    const unsub = base44.entities.VoiceCommand.subscribe((event) => {
      if (event.type === "create" && event.data) {
        setCommands((prev) => [event.data, ...prev].slice(0, 200));
        setLivePulse((p) => p + 1);
      }
    });
    return unsub;
  }, []);

  const { daily, categories, total, todayCount, peakDay } = useMemo(() => {
    const days = build14Days();
    const idx = {};
    days.forEach((d) => { idx[d.key] = d; });
    const catMap = {};
    (commands || []).forEach((cmd) => {
      if (!cmd.created_date) return;
      const d = new Date(cmd.created_date);
      if (isNaN(d.getTime())) return;
      const key = dateFmt.format(d);
      if (idx[key]) idx[key].count += 1;
      const cat = cmd.service_category || "General";
      if (!catMap[cat]) catMap[cat] = { category: cat, count: 0, hours: new Array(24).fill(0) };
      catMap[cat].count += 1;
      const h = parseInt(hourFmt.format(d), 10) % 24;
      catMap[cat].hours[h] += 1;
    });
    const cats = Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 6);
    const peak = days.reduce((m, d) => (d.count > m.count ? d : m), days[0]);
    const today = days[days.length - 1].key;
    const todayC = idx[today]?.count || 0;
    return { daily: days, categories: cats, total: commands.length, todayCount: todayC, peakDay: peak };
  }, [commands]);

  const maxCount = Math.max(1, ...daily.map((d) => d.count));
  const maxCat = Math.max(1, ...categories.map((c) => c.count));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 lg:p-6 relative overflow-hidden" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* scanning accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE TRAFFIC — CALL VOLUME & SERVICE TRENDS</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26", animation: "dotPulse 1.2s ease-in-out infinite" }} />
            LIVE
          </span>
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{total} TOTAL</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Radio size={28} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>AWAITING SIGNAL</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Your live call volume will glow here as you use voice commands</p>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <GlowStat label="TODAY (ET)" value={todayCount} accent="#D1FF26" pulse={livePulse} />
            <GlowStat label="PEAK DAY" value={peakDay.count} sub={peakDay.weekday} accent="#5AE0C8" />
            <GlowStat label="14-DAY TOTAL" value={daily.reduce((s, d) => s + d.count, 0)} accent="#7AA2F7" />
          </div>

          {/* Daily call volume — glowing data points */}
          <div className="mb-6">
            <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>DAILY CALL VOLUME — GLOWING DATA POINTS</p>
            <div className="relative flex items-end justify-between gap-1 h-28 px-1">
              {/* baseline */}
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(138,143,152,0.12)" }} />
              {daily.map((d, i) => {
                const size = 8 + (d.count / maxCount) * 26;
                const isActive = d.count > 0;
                const isToday = i === daily.length - 1;
                return (
                  <div key={d.key} className="relative flex flex-col items-center justify-end flex-1 h-full group" style={{ paddingBottom: 2 }}>
                    {isActive && (
                      <span
                        className="rounded-full"
                        style={{
                          width: size,
                          height: size,
                          background: isToday ? "#D1FF26" : "#5AE0C8",
                          boxShadow: `0 0 ${size * 0.6}px ${isToday ? "rgba(209,255,38,0.7)" : "rgba(90,224,200,0.5)"}`,
                          animation: `dotPulse ${1.4 + (i % 5) * 0.15}s ease-in-out infinite`,
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    )}
                    {!isActive && (
                      <span className="rounded-full" style={{ width: 4, height: 4, background: "rgba(138,143,152,0.25)" }} />
                    )}
                    {/* tooltip */}
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 px-2 py-1 whitespace-nowrap" style={{ background: "rgba(5,7,10,0.95)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <p className="font-mono text-[8px]" style={{ color: "#F5F5F7" }}>{d.weekday} {d.key}</p>
                      <p className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{d.count} calls</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 px-1">
              {daily.map((d, i) => (
                <span key={d.key} className="font-mono text-[7px] flex-1 text-center" style={{ color: i === daily.length - 1 ? "#D1FF26" : "rgba(138,143,152,0.5)" }}>{d.key}</span>
              ))}
            </div>
          </div>

          {/* Service usage trends — glowing category dots + trend bars */}
          <div>
            <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>SERVICE USAGE TRENDS</p>
            <div className="space-y-3">
              {categories.map((c, i) => {
                const color = colorFor(c.category);
                const pct = (c.count / maxCat) * 100;
                return (
                  <div key={c.category} className="flex items-center gap-3">
                    <span
                      className="rounded-full flex-shrink-0"
                      style={{
                        width: 10,
                        height: 10,
                        background: color,
                        boxShadow: `0 0 10px ${color}`,
                        animation: `dotPulse ${1.3 + i * 0.2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                    <span className="font-mono text-[10px] tracking-wider w-24 truncate" style={{ color: "#F5F5F7" }}>{c.category}</span>
                    <div className="flex-1 h-2 relative overflow-hidden" style={{ background: "rgba(138,143,152,0.08)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full"
                        style={{ background: `linear-gradient(90deg, ${color}40, ${color})`, boxShadow: `0 0 8px ${color}80` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] w-8 text-right" style={{ color }}>{c.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function GlowStat({ label, value, sub, accent, pulse }) {
  return (
    <div className="p-3 relative" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${accent}30` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}`, animation: pulse ? "dotPulse 1s ease-in-out infinite" : "none" }} />
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
      </div>
      <p className="font-heading font-black text-xl" style={{ color: accent }}>{value}</p>
      {sub && <p className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>{sub}</p>}
    </div>
  );
}