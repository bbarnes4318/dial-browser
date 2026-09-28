import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Glowing data-point chart for daily call volume + peak usage times.
// Data comes from getVoiceCommandStats (admin-only) — daily_volume + hourly_volume.
// All times are US Eastern (America/New_York) per platform convention.

function GlowDot({ size, color, delay, active }) {
  return (
    <span
      className="rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size * 0.7}px ${color}cc`,
        animation: active ? `dotPulse ${1.4 + (delay % 5) * 0.12}s ease-in-out infinite` : "none",
        animationDelay: `${delay * 0.06}s`,
      }}
    />
  );
}

export default function TrafficCharts() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getVoiceCommandStats", {});
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load traffic data");
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

  const daily = stats?.daily_volume || [];
  const hourly = stats?.hourly_volume || [];
  const peak = stats?.peak_hour;
  const total = stats?.total_commands || 0;
  const last7 = daily.slice(-7).reduce((s, d) => s + d.count, 0);
  const prev7 = daily.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const trend = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);
  const maxDaily = Math.max(1, ...daily.map((d) => d.count));
  const maxHourly = Math.max(1, ...hourly.map((h) => h.count));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 relative overflow-hidden" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* scanning accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// PLATFORM TRAFFIC — GLOWING DATA POINTS</p>
          <span className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.4s ease-in-out infinite" }} />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {peak && peak.count > 0 && (
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: "#5AE0C8" }}>
              <Clock size={11} /> PEAK: {peak.label} ET · {peak.count} calls
            </span>
          )}
          {total > 0 && (
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: trend >= 0 ? "#D1FF26" : "#ef4444" }}>
              <TrendingUp size={11} /> 7-DAY: {trend >= 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
      </div>

      {/* Daily call volume — glowing data points */}
      <div className="mb-6">
        <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>DAILY CALL VOLUME (LAST 14 DAYS)</p>
        <div className="relative flex items-end justify-between gap-1 h-32 px-1">
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(138,143,152,0.12)" }} />
          {daily.map((d, i) => {
            const size = 8 + (d.count / maxDaily) * 28;
            const isActive = d.count > 0;
            const isToday = i === daily.length - 1;
            const color = isToday ? "#D1FF26" : isActive ? "#5AE0C8" : "#3a3f48";
            return (
              <div key={d.date} className="relative flex flex-col items-center justify-end flex-1 h-full group" style={{ paddingBottom: 2 }}>
                {isActive ? (
                  <GlowDot size={size} color={color} delay={i} active />
                ) : (
                  <span className="rounded-full" style={{ width: 4, height: 4, background: "rgba(138,143,152,0.25)" }} />
                )}
                <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 px-2 py-1 whitespace-nowrap" style={{ background: "rgba(5,7,10,0.95)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  <p className="font-mono text-[8px]" style={{ color: "#F5F5F7" }}>{d.weekday} {d.date}</p>
                  <p className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{d.count} calls</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          {daily.map((d, i) => (
            <span key={d.date} className="font-mono text-[7px] flex-1 text-center" style={{ color: i === daily.length - 1 ? "#D1FF26" : "rgba(138,143,152,0.5)" }}>{d.date}</span>
          ))}
        </div>
      </div>

      {/* Peak usage times — hourly glowing data points */}
      <div>
        <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>PEAK USAGE TIMES (HOURLY, US EASTERN)</p>
        <div className="relative flex items-end justify-between gap-0.5 h-28 px-1">
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(138,143,152,0.12)" }} />
          {/* peak reference line */}
          {peak && peak.count > 0 && (
            <div className="absolute top-0 bottom-0 flex items-start justify-center pointer-events-none" style={{ left: `${(peak.hour / 23) * 100}%`, width: "4.3%" }}>
              <span className="font-mono text-[7px] tracking-widest px-1" style={{ color: "#5AE0C8", background: "rgba(90,224,200,0.1)", border: "0.5px solid rgba(90,224,200,0.3)" }}>PEAK</span>
            </div>
          )}
          {hourly.map((h, i) => {
            const size = 5 + (h.count / maxHourly) * 22;
            const isActive = h.count > 0;
            const isPeak = peak && h.hour === peak.hour && h.count > 0;
            const color = isPeak ? "#5AE0C8" : isActive ? "#D1FF26" : "#3a3f48";
            return (
              <div key={h.hour} className="relative flex flex-col items-center justify-end flex-1 h-full group" style={{ paddingBottom: 2 }}>
                {isActive ? (
                  <GlowDot size={size} color={color} delay={i} active />
                ) : (
                  <span className="rounded-full" style={{ width: 3, height: 3, background: "rgba(138,143,152,0.2)" }} />
                )}
                <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 px-2 py-1 whitespace-nowrap" style={{ background: "rgba(5,7,10,0.95)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  <p className="font-mono text-[8px]" style={{ color: "#F5F5F7" }}>{h.label} ET</p>
                  <p className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{h.count} calls</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          {[0, 6, 12, 18, 23].map((h) => {
            const slot = hourly.find((x) => x.hour === h);
            const period = h < 12 ? "AM" : "PM";
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return <span key={h} className="font-mono text-[7px] flex-1 text-center" style={{ color: "rgba(138,143,152,0.5)" }}>{slot ? slot.label : `${h12}${period}`}</span>;
          })}
        </div>
      </div>

      {total === 0 && (
        <p className="mt-4 font-mono text-[9px] text-center" style={{ color: "rgba(138,143,152,0.6)" }}>
          No voice command data recorded yet. Glowing data points will appear as members use the platform.
        </p>
      )}
    </motion.div>
  );
}