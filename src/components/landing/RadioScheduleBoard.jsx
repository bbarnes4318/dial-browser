import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Radio, Star, Zap, Music2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SPOTLIGHT_META = {
  featured_track: { icon: Music2, label: "FEATURED TRACK", color: "#D1FF26" },
  artist_spotlight: { icon: Star, label: "ARTIST SPOTLIGHT", color: "#5AE0C8" },
  premier: { icon: Zap, label: "PREMIERE", color: "#E0A85A" },
  live_session: { icon: Radio, label: "LIVE SESSION", color: "#E085A8" },
};

function formatTimeEST(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm} EST`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "TODAY";
  if (d.toDateString() === tomorrow.toDateString()) return "TOMORROW";
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function RadioScheduleBoard() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSchedule = useCallback(async () => {
    try {
      const list = await base44.entities.RadioSchedule.list("air_time", 20);
      const now = new Date();
      const upcoming = (list || []).filter(s => {
        if (s.status === "cancelled") return false;
        const airTime = new Date(s.air_time);
        const endTime = new Date(airTime.getTime() + (s.duration_minutes || 30) * 60000);
        return endTime > now;
      });
      setSchedule(upcoming);
    } catch {
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (schedule.length === 0) return null;

  const now = new Date();
  const nextIdx = schedule.findIndex(s => new Date(s.air_time) > now);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ RADIO SCHEDULE</span>
        <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>— WHAT'S PLAYING NEXT</span>
      </div>

      <div className="space-y-2">
        {schedule.map((item, idx) => {
          const airTime = new Date(item.air_time);
          const endTime = new Date(airTime.getTime() + (item.duration_minutes || 30) * 60000);
          const isLive = airTime <= now && now < endTime;
          const isNext = !isLive && idx === nextIdx;
          const meta = SPOTLIGHT_META[item.spotlight_type] || SPOTLIGHT_META.featured_track;
          const SpotIcon = meta.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 p-3 transition-all"
              style={{
                background: isLive ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.5)",
                border: `0.5px solid ${isLive ? "rgba(209,255,38,0.4)" : isNext ? "rgba(209,255,38,0.25)" : "rgba(138,143,152,0.1)"}`,
              }}
            >
              <div className="flex-shrink-0 text-center w-16">
                <p className="font-mono text-[8px] tracking-widest" style={{ color: isLive ? "#D1FF26" : "#8A8F98" }}>{formatDate(item.air_time)}</p>
                <p className="font-heading font-bold text-sm" style={{ color: isLive ? "#D1FF26" : "#F5F5F7" }}>{formatTimeEST(item.air_time)}</p>
              </div>

              <div className="w-px h-10 flex-shrink-0" style={{ background: "rgba(138,143,152,0.15)" }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{item.show_name}</p>
                  {isLive && (
                    <span className="flex items-center gap-1 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "#D1FF26", color: "#05070A" }}>
                      <span className="rounded-full" style={{ width: 4, height: 4, background: "#05070A", animation: "dotPulse 1.5s ease-in-out infinite" }} />
                      LIVE NOW
                    </span>
                  )}
                  {isNext && !isLive && (
                    <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>UP NEXT</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest" style={{ color: meta.color }}>
                    <SpotIcon size={8} /> {meta.label}
                  </span>
                  {item.artist_name && <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{item.artist_name}</span>}
                  {item.track_title && <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>· {item.track_title}</span>}
                </div>
                {item.description && <p className="text-xs mt-0.5 truncate" style={{ color: "#8A8F98" }}>{item.description}</p>}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock size={9} style={{ color: "#8A8F98" }} />
                <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{item.duration_minutes || 30}m</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}