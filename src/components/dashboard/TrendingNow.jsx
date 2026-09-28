import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Activity, ArrowUp, ArrowDown, Minus, Radio } from "lucide-react";

// Seed list — rank 1 = most accessed this week
const seedTrends = [
  { id: "15", name: "Local Directory", dial: "*101#", category: "Local", calls: 48230, delta: 0 },
  { id: "06", name: "Music Streaming", dial: "*105#", category: "Entertainment", calls: 41180, delta: 0 },
  { id: "03", name: "Restaurant Finder", dial: "*101#", category: "Food", calls: 38940, delta: 0 },
  { id: "09", name: "AI Assistant", dial: "*108#", category: "Productivity", calls: 35120, delta: 0 },
  { id: "08", name: "Creator Access", dial: "*107#", category: "Entertainment", calls: 24880, delta: 0 },
];

function TrendArrow({ delta }) {
  if (delta > 0) return <ArrowUp size={11} style={{ color: "#D1FF26" }} />;
  if (delta < 0) return <ArrowDown size={11} style={{ color: "#ef4444" }} />;
  return <Minus size={11} style={{ color: "#8A8F98" }} />;
}

export default function TrendingNow() {
  const [trends, setTrends] = useState(seedTrends);
  const [pulse, setPulse] = useState(false);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  // Live feed simulation — bump call counts and occasionally reshuffle ranks
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTrends((prev) => {
        // Increment call counts with slight randomness
        const updated = prev.map((t) => ({
          ...t,
          calls: t.calls + Math.floor(Math.random() * 40) + 5,
        }));

        // Every ~4 ticks, shuffle one adjacent pair to simulate rank movement
        if (Math.random() > 0.75) {
          const i = Math.floor(Math.random() * (updated.length - 1));
          if (updated[i].calls < updated[i + 1].calls) {
            [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
            updated[i] = { ...updated[i], delta: 1 };
            updated[i + 1] = { ...updated[i + 1], delta: -1 };
          }
        }

        // Sort by calls descending
        return updated.sort((a, b) => b.calls - a.calls);
      });
      setTick((t) => t + 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
    }, 2200);
    return () => clearInterval(intervalRef.current);
  }, []);

  const maxCalls = trends[0]?.calls || 1;
  const totalCalls = trends.reduce((s, t) => s + t.calls, 0);

  return (
    <div className="p-5 lg:p-6 relative overflow-hidden" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Scanline glow */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// TRENDING NOW</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: pulse ? "#D1FF26" : "rgba(209,255,38,0.3)", boxShadow: pulse ? "0 0 8px #D1FF26" : "none", transition: "all 0.3s" }} />
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>LIVE</span>
        </div>
      </div>

      {/* Aggregate stat */}
      <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
        <div>
          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>TOTAL CALLS THIS WEEK</p>
          <motion.p
            key={totalCalls}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-heading font-black text-2xl"
            style={{ color: "#D1FF26" }}
          >
            {totalCalls.toLocaleString()}
          </motion.p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Activity size={12} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>7-DAY</span>
        </div>
      </div>

      {/* Live feed list */}
      <div className="space-y-1.5">
        <AnimatePresence>
          {trends.map((trend, idx) => {
            const rank = idx + 1;
            const barWidth = (trend.calls / maxCalls) * 100;
            return (
              <motion.div
                key={trend.id}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative flex items-center gap-3 p-3 overflow-hidden"
                style={{ background: "rgba(5,7,10,0.4)", border: `0.5px solid ${rank <= 3 ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.08)"}` }}
              >
                {/* Background bar — proportional to call volume */}
                <div
                  className="absolute left-0 top-0 bottom-0 transition-all duration-700"
                  style={{ width: `${barWidth}%`, background: "linear-gradient(90deg, rgba(209,255,38,0.08), transparent)" }}
                />

                {/* Rank */}
                <div className="relative flex-shrink-0 w-7 text-center">
                  <span className="font-heading font-black text-lg" style={{ color: rank <= 3 ? "#D1FF26" : "#8A8F98" }}>{rank}</span>
                </div>

                {/* Delta arrow */}
                <div className="relative flex-shrink-0 w-4 flex justify-center">
                  <TrendArrow delta={trend.delta} />
                </div>

                {/* Service info */}
                <div className="relative flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{trend.name}</p>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{trend.category.toUpperCase()} · {trend.dial}</p>
                </div>

                {/* Call count */}
                <div className="relative flex-shrink-0 text-right">
                  <motion.p
                    key={trend.calls}
                    initial={{ opacity: 0.5, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="font-mono text-xs font-bold"
                    style={{ color: "#D1FF26" }}
                  >
                    {trend.calls.toLocaleString()}
                  </motion.p>
                  <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>CALLS</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 mt-4 pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.08)" }}>
        <Radio size={10} style={{ color: "rgba(209,255,38,0.4)" }} />
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
          UPDATED {tick}× · REFRESHES EVERY 2s
        </p>
      </div>
    </div>
  );
}