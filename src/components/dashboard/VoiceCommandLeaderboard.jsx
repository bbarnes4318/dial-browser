import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, Phone, TrendingUp, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { dialServices } from "@/data/dialServices";

const RANK_COLORS = ["#D1FF26", "#D1FF26", "rgba(209,255,38,0.7)", "#8A8F98", "#8A8F98", "#8A8F98", "#8A8F98", "#8A8F98", "#8A8F98", "#8A8F98"];

function findServiceByCategory(category) {
  if (!category) return null;
  const lower = category.toLowerCase();
  return dialServices.find((svc) => {
    if (svc.category.toLowerCase() === lower) return true;
    if (svc.name.toLowerCase().includes(lower)) return true;
    return (svc.tags || []).some((t) => lower.includes(t) || t.includes(lower));
  });
}

export default function VoiceCommandLeaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalThisWeek, setTotalThisWeek] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // Fetch a broad set, then filter to this week client-side
        const data = await base44.entities.VoiceCommand.list("-created_date", 500);
        const weekAgo = Date.now() - 7 * 86400000;
        const weekly = (data || []).filter((c) => {
          if (!c.created_date) return false;
          return new Date(c.created_date).getTime() >= weekAgo;
        });
        setTotalThisWeek(weekly.length);

        // Aggregate by service_category
        const freqMap = new Map();
        weekly.forEach((cmd) => {
          const cat = cmd.service_category || "General";
          freqMap.set(cat, (freqMap.get(cat) || 0) + 1);
        });

        const ranked = Array.from(freqMap.entries())
          .map(([category, count]) => {
            const svc = findServiceByCategory(category);
            return {
              category,
              count,
              service: svc,
              pct: weekly.length > 0 ? (count / weekly.length) * 100 : 0,
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setEntries(ranked);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxCount = entries.length > 0 ? entries[0].count : 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Trophy size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE COMMAND LEADERBOARD</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{totalThisWeek} COMMANDS THIS WEEK</span>
      </div>

      {loading ? (
        <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>TALLYING THIS WEEK'S COMMANDS…</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <TrendingUp size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO COMMANDS LOGGED THIS WEEK</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Voice commands from the past 7 days will rank here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rankColor = RANK_COLORS[idx] || "#8A8F98";
            const isTop3 = idx < 3;
            const svc = entry.service;
            const barWidth = (entry.count / maxCount) * 100;

            const inner = (
              <motion.div
                key={entry.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
                className="relative p-4 flex items-center gap-3 transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.08)]"
                style={{
                  background: isTop3 ? "rgba(209,255,38,0.04)" : "#10141D",
                  border: `0.5px solid ${isTop3 ? "rgba(209,255,38,0.3)" : "rgba(209,255,38,0.12)"}`,
                }}
              >
                {/* Rank number */}
                <div className="flex-shrink-0 w-8 text-center">
                  {idx === 0 ? (
                    <Crown size={18} style={{ color: "#D1FF26", filter: "drop-shadow(0 0 4px rgba(209,255,38,0.5))" }} />
                  ) : (
                    <span className="font-heading font-black text-lg" style={{ color: rankColor }}>{idx + 1}</span>
                  )}
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <span className="text-base">{svc?.icon || "🎙️"}</span>
                </div>

                {/* Content + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>
                      {svc?.name || entry.category}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-[10px] font-bold" style={{ color: rankColor }}>{entry.count}</span>
                      <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>CALLS</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden" style={{ background: "rgba(5,7,10,0.6)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: Math.min(idx * 0.04, 0.3) }}
                      className="h-full"
                      style={{
                        background: isTop3 ? "#D1FF26" : "rgba(209,255,38,0.5)",
                        boxShadow: isTop3 ? "0 0 8px rgba(209,255,38,0.4)" : "none",
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.6)" }}>{entry.category.toUpperCase()}</span>
                    {svc?.dial && (
                      <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>· {svc.dial}</span>
                    )}
                  </div>
                </div>

                {/* Dial action */}
                {svc?.dial && (
                  <a
                    href={`tel:${svc.dial}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 flex items-center justify-center w-9 h-9 transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.25)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                    title={`Dial ${svc.dial}`}
                  >
                    <Phone size={13} />
                  </a>
                )}
              </motion.div>
            );

            // Make the whole row clickable to navigate to service detail
            if (svc) {
              return (
                <Link key={entry.category} to={`/directory/${svc.id}`} className="block">
                  {inner}
                </Link>
              );
            }
            return inner;
          })}
        </div>
      )}
    </motion.div>
  );
}