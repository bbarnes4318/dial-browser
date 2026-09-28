import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Loader2, TrendingUp, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceCommandSummaryCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke("getVoiceCommandStats", {});
        setStats(res.data);
      } catch { /* non-blocking */ }
      setLoading(false);
    };
    load();
  }, []);

  const maxCount = stats?.top_categories?.[0]?.count || 1;

  return (
    <div className="relative p-5 overflow-hidden" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Signal line accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div style={{ animation: "phosphorPulse 2.5s ease-in-out infinite" }}>
            <Mic size={15} style={{ color: "#D1FF26" }} />
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE COMMAND DEMAND</p>
        </div>
        {!loading && stats && (
          <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>
            {stats.total_commands} TOTAL COMMANDS
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : !stats || stats.total_commands === 0 ? (
        <div className="text-center py-8">
          <MessageSquare size={28} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto" }} />
          <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO COMMANDS LOGGED YET</p>
          <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Commands will appear as users search via the Dial Browser</p>
        </div>
      ) : (
        <>
          {/* Top categories with glowing bars */}
          <div className="space-y-2 mb-4">
            {stats.top_categories.map((cat, i) => {
              const pct = (cat.count / maxCount) * 100;
              const isTop = i < 3;
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="font-mono text-[9px] font-bold w-4 text-right" style={{ color: isTop ? "#D1FF26" : "rgba(138,143,152,0.4)" }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold truncate" style={{ color: "#F5F5F7" }}>{cat.category}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isTop && <TrendingUp size={9} style={{ color: "#D1FF26" }} />}
                        <span className="font-mono text-[9px]" style={{ color: isTop ? "#D1FF26" : "#8A8F98" }}>{cat.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full relative overflow-hidden" style={{ background: "rgba(138,143,152,0.08)" }}>
                      <motion.div
                        className="h-full"
                        style={{
                          background: isTop
                            ? "linear-gradient(90deg, rgba(209,255,38,0.6), #D1FF26)"
                            : "linear-gradient(90deg, rgba(209,255,38,0.2), rgba(209,255,38,0.4))",
                          boxShadow: isTop ? "0 0 6px rgba(209,255,38,0.4)" : "none",
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.04 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent commands */}
          {stats.recent_commands && stats.recent_commands.length > 0 && (
            <div className="pt-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>RECENT COMMANDS</p>
              <div className="space-y-1.5">
                {stats.recent_commands.slice(0, 3).map((cmd, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Mic size={8} style={{ color: cmd.source === "voice" ? "#D1FF26" : "#8A8F98" }} />
                    <span className="font-mono text-[9px] truncate flex-1" style={{ color: "#8A8F98" }}>"{cmd.command_text}"</span>
                    <span className="font-mono text-[7px] tracking-widest flex-shrink-0" style={{ color: "rgba(138,143,152,0.4)" }}>{cmd.service_category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}