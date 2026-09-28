import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Globe, Zap, Server, Radio, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

const nodes = [
  { id: "US-EAST", region: "Virginia, USA", status: "online", latency: 42, load: 68, calls: 12847 },
  { id: "EU-WEST", region: "Dublin, Ireland", status: "online", latency: 38, load: 54, calls: 9234 },
  { id: "AP-SOUTH", region: "Mumbai, India", status: "online", latency: 61, load: 82, calls: 18923 },
  { id: "AP-EAST", region: "Singapore", status: "online", latency: 55, load: 71, calls: 14502 },
  { id: "SA-EAST", region: "São Paulo, Brazil", status: "degraded", latency: 128, load: 91, calls: 6102 },
  { id: "AF-SOUTH", region: "Cape Town, SA", status: "online", latency: 74, load: 43, calls: 3891 },
  { id: "ME-CENT", region: "Bahrain", status: "online", latency: 49, load: 59, calls: 5234 },
  { id: "OC-ANZ", region: "Sydney, Australia", status: "online", latency: 67, load: 47, calls: 4102 },
];

const metrics = [
  { label: "Avg Latency", value: 64, unit: "ms", icon: Zap, trend: -8, color: "#D1FF26" },
  { label: "Active Calls", value: 73832, unit: "", icon: Activity, trend: 12, color: "#D1FF26" },
  { label: "Uptime", value: 99.97, unit: "%", icon: CheckCircle2, trend: 0.01, color: "#D1FF26" },
  { label: "Data Throughput", value: 2.4, unit: "TB/s", icon: TrendingUp, trend: 5, color: "#D1FF26" },
];

function useAnimatedNumber(target, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    let frame;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function MetricCard({ metric, inView, delay }) {
  const Icon = metric.icon;
  const animated = useAnimatedNumber(inView ? metric.value : 0, 1800);
  const display = metric.unit === "%" ? animated.toFixed(2) : metric.unit === "TB/s" ? animated.toFixed(1) : Math.round(animated).toLocaleString();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="relative p-5 overflow-hidden"
      style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: metric.color }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
            {metric.label.toUpperCase()}
          </p>
        </div>
        <span
          className="font-mono text-[9px]"
          style={{ color: metric.trend > 0 ? '#D1FF26' : metric.trend < 0 ? '#D1FF26' : '#8A8F98' }}
        >
          {metric.trend > 0 ? '▲' : metric.trend < 0 ? '▼' : '—'} {Math.abs(metric.trend)}{metric.unit === '%' ? '%' : ''}
        </span>
      </div>
      <p className="font-heading font-black text-3xl lg:text-4xl tracking-tight" style={{ color: '#F5F5F7' }}>
        {display}<span className="text-lg ml-1" style={{ color: metric.color }}>{metric.unit}</span>
      </p>
      {/* Mini sparkline */}
      <div className="flex items-end gap-0.5 mt-3 h-6">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${20 + Math.sin(i * 0.5 + delay) * 30 + Math.random() * 30}%`,
              background: i > 18 ? '#D1FF26' : 'rgba(209,255,38,0.2)',
              opacity: i > 18 ? 0.9 : 0.4,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function NodeRow({ node, inView, delay }) {
  const [liveLatency, setLiveLatency] = useState(node.latency);
  const [liveLoad, setLiveLoad] = useState(node.load);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setLiveLatency(Math.max(20, node.latency + Math.round((Math.random() - 0.5) * 15)));
      setLiveLoad(Math.max(10, Math.min(99, node.load + Math.round((Math.random() - 0.5) * 8))));
    }, 2500 + delay * 100);
    return () => clearInterval(interval);
  }, [inView, node, delay]);

  const isOnline = node.status === 'online';
  const statusColor = isOnline ? '#D1FF26' : '#FFB347';
  const statusLabel = isOnline ? 'ONLINE' : 'DEGRADED';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.3 + delay * 0.05 }}
      className="flex items-center gap-3 p-3"
      style={{ background: 'rgba(16,20,29,0.3)', border: '0.5px solid rgba(138,143,152,0.06)' }}
    >
      {/* Status dot */}
      <div className="relative flex-shrink-0">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
        />
        {isOnline && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: statusColor, opacity: 0.4 }}
          />
        )}
      </div>

      {/* Node ID + region */}
      <div className="flex-shrink-0 w-28 lg:w-36">
        <p className="font-mono text-[10px] font-bold tracking-wider" style={{ color: '#F5F5F7' }}>
          {node.id}
        </p>
        <p className="text-[10px] truncate" style={{ color: '#8A8F98' }}>
          {node.region}
        </p>
      </div>

      {/* Latency */}
      <div className="flex-shrink-0 w-16 text-right">
        <p className="font-mono text-xs font-bold" style={{ color: liveLatency > 100 ? '#FFB347' : '#D1FF26' }}>
          {liveLatency}ms
        </p>
        <p className="font-mono text-[8px]" style={{ color: '#8A8F98' }}>LATENCY</p>
      </div>

      {/* Load bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(138,143,152,0.1)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${liveLoad}%` }}
              transition={{ duration: 0.8 }}
              style={{
                background: liveLoad > 85 ? '#FFB347' : '#D1FF26',
                boxShadow: `0 0 6px ${liveLoad > 85 ? '#FFB347' : '#D1FF26'}`,
              }}
            />
          </div>
          <span className="font-mono text-[10px] flex-shrink-0" style={{ color: '#8A8F98' }}>
            {liveLoad}%
          </span>
        </div>
      </div>

      {/* Calls */}
      <div className="flex-shrink-0 w-16 text-right hidden sm:block">
        <p className="font-mono text-xs font-bold" style={{ color: '#F5F5F7' }}>
          {node.calls.toLocaleString()}
        </p>
        <p className="font-mono text-[8px]" style={{ color: '#8A8F98' }}>CALLS</p>
      </div>

      {/* Status badge */}
      <div
        className="flex-shrink-0 px-2 py-1 font-mono text-[8px] tracking-widest"
        style={{
          background: isOnline ? 'rgba(209,255,38,0.08)' : 'rgba(255,179,71,0.08)',
          border: `0.5px solid ${isOnline ? 'rgba(209,255,38,0.2)' : 'rgba(255,179,71,0.2)'}`,
          color: statusColor,
        }}
      >
        {statusLabel}
      </div>
    </motion.div>
  );
}

export default function MonitoringDashboard() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);
  const [clock, setClock] = useState(new Date());
  const [waveform, setWaveform] = useState(Array.from({ length: 40 }, () => 50));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setWaveform(prev => [...prev.slice(1), 20 + Math.random() * 80]);
    }, 120);
    return () => clearInterval(interval);
  }, [inView]);

  const onlineCount = nodes.filter(n => n.status === 'online').length;

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 text-center"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // LIVE NETWORK OPERATIONS
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Network Operations Center
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Real-time visibility into the global 1 CALL AWAY™ infrastructure. Every node, every call, every millisecond — monitored.
          </p>
        </motion.div>

        {/* Dashboard frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative"
          style={{
            background: 'rgba(8,11,16,0.8)',
            border: '0.5px solid rgba(209,255,38,0.15)',
          }}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '0.5px solid rgba(138,143,152,0.1)', background: 'rgba(16,20,29,0.5)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#FF5F57' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#FFBD2E' }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#28C840' }} />
              </div>
              <span className="font-mono text-[10px] tracking-widest ml-2" style={{ color: '#8A8F98' }}>
                NOC://1CALLAWAY/monitor
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px]" style={{ color: '#D1FF26' }}>
                ● LIVE
              </span>
              <span className="font-mono text-[10px] hidden sm:block" style={{ color: '#8A8F98' }}>
                {clock.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })} EST
              </span>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            {/* Metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {metrics.map((m, i) => (
                <MetricCard key={i} metric={m} inView={inView} delay={i * 0.1} />
              ))}
            </div>

            {/* Live waveform + global status */}
            <div className="grid lg:grid-cols-3 gap-3 mb-6">
              {/* Waveform */}
              <div className="lg:col-span-2 p-4" style={{ background: 'rgba(16,20,29,0.4)', border: '0.5px solid rgba(138,143,152,0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio size={14} style={{ color: '#D1FF26' }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                      VOICE SIGNAL WAVEFORM
                    </p>
                  </div>
                  <span className="font-mono text-[9px]" style={{ color: '#D1FF26' }}>● TRANSMITTING</span>
                </div>
                <div className="flex items-end justify-between gap-0.5 h-20">
                  {waveform.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-all duration-150"
                      style={{
                        height: `${h}%`,
                        background: i > waveform.length - 5 ? '#D1FF26' : 'rgba(209,255,38,0.3)',
                        boxShadow: i > waveform.length - 5 ? '0 0 6px #D1FF26' : 'none',
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-mono text-[8px]" style={{ color: 'rgba(138,143,152,0.4)' }}>0Hz</span>
                  <span className="font-mono text-[8px]" style={{ color: 'rgba(138,143,152,0.4)' }}>4kHz</span>
                  <span className="font-mono text-[8px]" style={{ color: 'rgba(138,143,152,0.4)' }}>8kHz</span>
                </div>
              </div>

              {/* Global status summary */}
              <div className="p-4 flex flex-col justify-between" style={{ background: 'rgba(16,20,29,0.4)', border: '0.5px solid rgba(138,143,152,0.08)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={14} style={{ color: '#D1FF26' }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                      GLOBAL STATUS
                    </p>
                  </div>
                  <p className="font-heading font-black text-4xl tracking-tight" style={{ color: '#D1FF26' }}>
                    {onlineCount}/{nodes.length}
                  </p>
                  <p className="font-mono text-[10px] mt-1" style={{ color: '#8A8F98' }}>
                    NODES OPERATIONAL
                  </p>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>REGIONS</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>6 CONTINENTS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>CARRIERS</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>847 PEERED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>PROTOCOL</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>SIP / SS7 / SMS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Node status list */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Server size={14} style={{ color: '#D1FF26' }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                  EDGE NODE STATUS
                </p>
                <div className="flex-1 h-px" style={{ background: 'rgba(138,143,152,0.1)' }} />
                <span className="font-mono text-[9px]" style={{ color: '#D1FF26' }}>REAL-TIME</span>
              </div>
              <div className="space-y-1.5">
                {nodes.map((node, i) => (
                  <NodeRow key={node.id} node={node} inView={inView} delay={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom status bar */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderTop: '0.5px solid rgba(138,143,152,0.1)', background: 'rgba(16,20,29,0.5)' }}
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>
                <CheckCircle2 size={10} className="inline mr-1" style={{ color: '#D1FF26' }} />
                ALL SYSTEMS NOMINAL
              </span>
              <span className="font-mono text-[9px] hidden sm:block" style={{ color: '#8A8F98' }}>
                LAST INCIDENT: 47 DAYS AGO
              </span>
            </div>
            <span className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>
              v4.2.1-stable
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}