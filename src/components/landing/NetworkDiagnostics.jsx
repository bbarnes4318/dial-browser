import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Activity, Zap, ShieldCheck, Gauge } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// Simulated real-time speed samples (Mbps) — 1 CALL AWAY vs standard networks
const speedSeries = Array.from({ length: 24 }, (_, i) => ({
  t: `${i}s`,
  callaway: 92 + Math.round(Math.sin(i / 2) * 4 + (Math.random() * 6 - 3)),
  standard: 58 + Math.round(Math.cos(i / 3) * 8 + (Math.random() * 10 - 5)),
}));

const reliabilityData = [
  { metric: "Uptime %", callaway: 99.98, standard: 94.2 },
  { metric: "Call Success", callaway: 99.5, standard: 88.1 },
  { metric: "SMS Delivery", callaway: 99.9, standard: 91.4 },
  { metric: "Reconnect Rate", callaway: 98.7, standard: 76.3 },
];

const latencyData = [
  { metric: "Voice Latency", callaway: 120, standard: 340 },
  { metric: "SMS Latency", callaway: 800, standard: 4200 },
  { metric: "Setup Time", callaway: 1.2, standard: 8.5 },
  { metric: "Handoff", callaway: 90, standard: 480 },
];

const radarData = [
  { axis: "Speed", callaway: 95, standard: 60 },
  { axis: "Reliability", callaway: 99, standard: 88 },
  { axis: "Coverage", callaway: 97, standard: 72 },
  { axis: "Latency", callaway: 92, standard: 45 },
  { axis: "Recovery", callaway: 96, standard: 58 },
];

function DiagnosticHeader({ label, value, unit, icon: Icon, accent }) {
  return (
    <div className="flex items-center justify-between p-3" style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.15)' }}>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: accent }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono font-bold text-lg" style={{ color: accent }}>{value}</span>
        <span className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>{unit}</span>
      </div>
    </div>
  );
}

function ChartFrame({ title, subtitle, children }) {
  return (
    <div className="flex flex-col" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(209,255,38,0.12)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '0.5px solid rgba(209,255,38,0.1)' }}>
        <div>
          <p className="font-mono text-[10px] tracking-widest" style={{ color: '#D1FF26' }}>{title}</p>
          {subtitle && <p className="font-mono text-[8px] tracking-wider mt-0.5" style={{ color: '#8A8F98' }}>{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#D1FF26', animation: 'dotPulse 1.5s ease-in-out infinite' }} />
          <span className="font-mono text-[8px] tracking-widest" style={{ color: '#D1FF26' }}>LIVE</span>
        </div>
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2" style={{ background: '#10141D', border: '0.5px solid rgba(209,255,38,0.3)' }}>
      <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: '#8A8F98' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono text-[10px]" style={{ color: p.color }}>
          {p.dataKey === 'callaway' ? '1 CALL AWAY' : 'STANDARD'}: {p.value}{unit || ''}
        </p>
      ))}
    </div>
  );
};

export default function NetworkDiagnostics() {
  const [inView, setInView] = useState(true);
  const [tick, setTick] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Simulate live ticking readout
  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(interval);
  }, [inView]);

  const liveSpeed = speedSeries[tick % speedSeries.length].callaway;
  const liveLatency = latencyData[0].callaway + Math.round(Math.sin(tick) * 8);

  return (
    <section
      id="diagnostics"
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} style={{ color: '#D1FF26' }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: '#D1FF26' }}>
              // NETWORK DIAGNOSTICS
            </p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Faster. More Reliable.<br />
            <span style={{ color: '#D1FF26' }}>By Every Metric.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Real-time diagnostic comparison of 1 CALL AWAY™ against standard mobile networks — speed, reliability, and latency measured across live connection samples.
          </p>
        </motion.div>

        {/* Live readout strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3"
        >
          <DiagnosticHeader label="LIVE SPEED" value={liveSpeed} unit="Mbps" icon={Zap} accent="#D1FF26" />
          <DiagnosticHeader label="VOICE LATENCY" value={liveLatency} unit="ms" icon={Gauge} accent="#D1FF26" />
          <DiagnosticHeader label="UPTIME" value="99.98" unit="%" icon={ShieldCheck} accent="#D1FF26" />
          <DiagnosticHeader label="PACKET LOSS" value="0.02" unit="%" icon={Activity} accent="#D1FF26" />
        </motion.div>

        {/* Charts grid */}
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Speed over time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <ChartFrame title="CONNECTION SPEED · LIVE TRACE" subtitle="Mbps sampled every second over 24s window">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={speedSeries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(138,143,152,0.1)" />
                  <XAxis dataKey="t" tick={{ fill: '#8A8F98', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(138,143,152,0.2)' }} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: '#8A8F98', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(138,143,152,0.2)' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip unit=" Mbps" />} />
                  <Line type="monotone" dataKey="standard" stroke="#8A8F98" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
                  <Line type="monotone" dataKey="callaway" stroke="#D1FF26" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          </motion.div>

          {/* Reliability bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <ChartFrame title="RELIABILITY MATRIX" subtitle="Success rate % across critical operations">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reliabilityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(138,143,152,0.1)" />
                  <XAxis dataKey="metric" tick={{ fill: '#8A8F98', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(138,143,152,0.2)' }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={40} />
                  <YAxis domain={[70, 100]} tick={{ fill: '#8A8F98', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(138,143,152,0.2)' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip unit="%" />} cursor={{ fill: 'rgba(209,255,38,0.04)' }} />
                  <Bar dataKey="standard" fill="#3A3F48" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="callaway" fill="#D1FF26" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </motion.div>

          {/* Latency area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ChartFrame title="LATENCY PROFILE" subtitle="Response time in milliseconds (lower is better)">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={latencyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="callawayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D1FF26" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#D1FF26" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="standardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8A8F98" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#8A8F98" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(138,143,152,0.1)" />
                  <XAxis dataKey="metric" tick={{ fill: '#8A8F98', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(138,143,152,0.2)' }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={40} />
                  <YAxis tick={{ fill: '#8A8F98', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(138,143,152,0.2)' }} tickLine={false} />
                  <Tooltip content={<CustomTooltip unit=" ms" />} cursor={{ fill: 'rgba(209,255,38,0.04)' }} />
                  <Area type="monotone" dataKey="standard" stroke="#8A8F98" strokeWidth={1.5} fill="url(#standardGrad)" />
                  <Area type="monotone" dataKey="callaway" stroke="#D1FF26" strokeWidth={2} fill="url(#callawayGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>
          </motion.div>

          {/* Radar overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <ChartFrame title="PERFORMANCE RADAR" subtitle="Composite score across 5 dimensions">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <PolarGrid stroke="rgba(138,143,152,0.15)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#8A8F98', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#8A8F98', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={false} />
                  <Radar name="standard" dataKey="standard" stroke="#8A8F98" fill="#8A8F98" fillOpacity={0.15} strokeWidth={1.5} />
                  <Radar name="callaway" dataKey="callaway" stroke="#D1FF26" fill="#D1FF26" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </motion.div>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{ background: '#D1FF26' }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: '#F5F5F7' }}>1 CALL AWAY™</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{ background: '#8A8F98' }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>STANDARD NETWORKS</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}