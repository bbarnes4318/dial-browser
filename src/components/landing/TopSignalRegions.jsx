import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Activity, Zap } from "lucide-react";

// Region data with uptime, connection count, and activity score
const regions = [
  { id: "tokyo", name: "Tokyo", country: "Japan", station: "NRT-01", uptime: 99.99, connections: 1284, latency: 22, carrier: "NTT Communications" },
  { id: "london", name: "London", country: "UK", station: "LDN-01", uptime: 99.99, connections: 1532, latency: 24, carrier: "BT Wholesale" },
  { id: "nyc", name: "New York", country: "USA", station: "NYC-01", uptime: 99.98, connections: 2467, latency: 12, carrier: "1CALL Backbone" },
  { id: "la", name: "Los Angeles", country: "USA", station: "LAX-02", uptime: 99.97, connections: 1892, latency: 18, carrier: "1CALL Backbone" },
  { id: "mumbai", name: "Mumbai", country: "India", station: "BOM-01", uptime: 99.95, connections: 2867, latency: 31, carrier: "Tata Communications" },
  { id: "sydney", name: "Sydney", country: "Australia", station: "SYD-01", uptime: 99.91, connections: 756, latency: 64, carrier: "Telstra" },
  { id: "saopaulo", name: "São Paulo", country: "Brazil", station: "GRU-01", uptime: 99.88, connections: 1128, latency: 41, carrier: "Vivo Fibra" },
  { id: "mexico", name: "Mexico City", country: "Mexico", station: "MEX-01", uptime: 99.90, connections: 989, latency: 33, carrier: "Telmex" },
  { id: "lagos", name: "Lagos", country: "Nigeria", station: "LOS-01", uptime: 99.82, connections: 2089, latency: 47, carrier: "MainOne" },
  { id: "nairobi", name: "Nairobi", country: "Kenya", station: "NBO-01", uptime: 99.79, connections: 1543, latency: 52, carrier: "Safaricom" },
  { id: "jakarta", name: "Jakarta", country: "Indonesia", station: "CGK-01", uptime: 99.76, connections: 912, latency: 58, carrier: "Telkomsel" },
  { id: "cairo", name: "Cairo", country: "Egypt", station: "CAI-01", uptime: 99.85, connections: 1067, latency: 44, carrier: "TE Data" },
];

const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function TopSignalRegions() {
  const [inView, setInView] = useState(true);
  const [tick, setTick] = useState(0);
  const [sortBy, setSortBy] = useState("score");
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(interval);
  }, [inView]);

  const ranked = useMemo(() => {
    // Add live activity jitter to connections
    const live = regions.map((r) => ({
      ...r,
      liveConnections: r.connections + Math.floor(Math.random() * 50) + tick * Math.floor(Math.random() * 3),
      // Activity score: weighted blend of uptime (60%) and connection volume normalized (40%)
      activityScore: Math.round(
        r.uptime * 0.6 + (r.connections / 2867) * 100 * 0.4
      ),
    }));

    if (sortBy === "uptime") {
      return live.sort((a, b) => b.uptime - a.uptime || b.connections - a.connections);
    }
    if (sortBy === "activity") {
      return live.sort((a, b) => b.liveConnections - a.liveConnections);
    }
    // Default: composite score
    return live.sort((a, b) => b.activityScore - a.activityScore);
  }, [sortBy, tick]);

  const topThree = ranked.slice(0, 3);
  const rest = ranked.slice(3, 10);

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-10 text-center">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// REGIONAL PERFORMANCE RANKINGS</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Top Signal <span style={{ color: "#D1FF26" }}>Regions</span>
          </h2>
          <p className="text-base font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Live leaderboard ranking global regions by uptime reliability and connection activity volume.
          </p>
        </motion.div>

        {/* Sort toggle */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="flex justify-center gap-2 mb-8">
          {[
            { id: "score", label: "Overall Score", icon: Trophy },
            { id: "uptime", label: "Uptime", icon: TrendingUp },
            { id: "activity", label: "Activity Volume", icon: Activity },
          ].map((opt) => {
            const Icon = opt.icon;
            const active = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{
                  background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                  color: active ? "#D1FF26" : "#8A8F98",
                  boxShadow: active ? "0 0 15px rgba(209,255,38,0.1)" : "none",
                }}
              >
                <Icon size={12} /> {opt.label}
              </button>
            );
          })}
        </motion.div>

        {/* Podium — Top 3 */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {topThree.map((region, i) => {
            const medal = medalColors[i];
            const heightClass = i === 0 ? "sm:pt-8" : i === 1 ? "sm:pt-4" : "";
            return (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
                className={`relative p-5 ${heightClass}`}
                style={{
                  background: i === 0 ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.5)",
                  border: `0.5px solid ${i === 0 ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`,
                  boxShadow: i === 0 ? "0 0 30px rgba(209,255,38,0.08)" : "none",
                }}
              >
                {/* Medal badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 flex items-center justify-center font-heading font-black text-sm" style={{ background: `${medal}1a`, border: `1px solid ${medal}80`, color: medal }}>
                      {i + 1}
                    </div>
                    {i === 0 && <Trophy size={14} style={{ color: medal }} />}
                  </div>
                  <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    {region.station}
                  </span>
                </div>

                {/* Region name */}
                <h3 className="font-heading font-black text-lg mb-0.5" style={{ color: "#F5F5F7" }}>{region.name}</h3>
                <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>{region.country.toUpperCase()}</p>

                {/* Key metric */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>UPTIME</span>
                    <span className="font-heading font-black text-sm" style={{ color: "#D1FF26" }}>{region.uptime}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CONNECTIONS</span>
                    <span className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>{region.liveConnections.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SCORE</span>
                    <span className="font-heading font-black text-sm" style={{ color: medal }}>{region.activityScore}</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-3 h-1" style={{ background: "rgba(138,143,152,0.15)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${region.activityScore}%` } : {}}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                    className="h-full"
                    style={{ background: medal, boxShadow: `0 0 8px ${medal}80` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rest of leaderboard */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.5 }} style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
            <span className="font-mono text-[8px] tracking-widest w-6 text-center" style={{ color: "#8A8F98" }}>#</span>
            <span className="font-mono text-[8px] tracking-widest flex-1" style={{ color: "#8A8F98" }}>REGION</span>
            <span className="font-mono text-[8px] tracking-widest text-right w-20 hidden sm:block" style={{ color: "#8A8F98" }}>CARRIER</span>
            <span className="font-mono text-[8px] tracking-widest text-right w-16" style={{ color: "#8A8F98" }}>UPTIME</span>
            <span className="font-mono text-[8px] tracking-widest text-right w-20" style={{ color: "#8A8F98" }}>CONN.</span>
            <span className="font-mono text-[8px] tracking-widest text-right w-12" style={{ color: "#8A8F98" }}>SCORE</span>
          </div>

          {rest.map((region, i) => {
            const rank = i + 4;
            return (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.55 + i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[rgba(209,255,38,0.03)]"
                style={{ borderBottom: rank < rest.length + 3 ? "0.5px solid rgba(138,143,152,0.06)" : "none" }}
              >
                <span className="font-mono text-xs font-bold text-center w-6" style={{ color: "#8A8F98" }}>{rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{region.name}</p>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{region.country.toUpperCase()} · {region.station}</p>
                </div>
                <span className="font-mono text-[9px] text-right w-20 hidden sm:block truncate" style={{ color: "#8A8F98" }}>{region.carrier}</span>
                <div className="flex items-center justify-end gap-1.5 w-16">
                  <TrendingUp size={10} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-xs font-bold" style={{ color: "#D1FF26" }}>{region.uptime}%</span>
                </div>
                <span className="font-mono text-xs text-right w-20" style={{ color: "#F5F5F7" }}>{region.liveConnections.toLocaleString()}</span>
                <span className="font-heading font-black text-sm text-right w-12" style={{ color: "#F5F5F7" }}>{region.activityScore}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer note */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.8 }} className="mt-6 flex items-center justify-center gap-2">
          <Zap size={10} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
            SCORE = 60% UPTIME + 40% ACTIVITY VOLUME · LIVE DATA REFRESHED EVERY 3S
          </p>
        </motion.div>
      </div>
    </section>
  );
}