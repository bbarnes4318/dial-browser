import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Server, Zap, Globe, Flame } from "lucide-react";
import HeatmapOverlay from "@/components/landing/HeatmapOverlay";

// Active regions with coordinates (percentage-based on the map container)
const regions = [
  { id: "us-east", name: "New York, USA", x: 28, y: 38, connections: 1247, status: "Optimal", station_id: "NYC-01", speed: "10 Gbps", bandwidth: "847 Mbps", latency: "12 ms", uptime: "99.98%", carrier: "1CALL Backbone", peak: "14:00–18:00 EST" },
  { id: "us-west", name: "Los Angeles, USA", x: 17, y: 42, connections: 892, status: "Optimal", station_id: "LAX-02", speed: "10 Gbps", bandwidth: "623 Mbps", latency: "18 ms", uptime: "99.97%", carrier: "1CALL Backbone", peak: "09:00–13:00 PST" },
  { id: "uk", name: "London, UK", x: 47, y: 32, connections: 634, status: "Optimal", station_id: "LDN-01", speed: "10 Gbps", bandwidth: "412 Mbps", latency: "24 ms", uptime: "99.99%", carrier: "BT Wholesale", peak: "08:00–12:00 GMT" },
  { id: "lagos", name: "Lagos, Nigeria", x: 49, y: 58, connections: 1089, status: "Active", station_id: "LOS-01", speed: "5 Gbps", bandwidth: "1.2 Gbps", latency: "47 ms", uptime: "99.82%", carrier: "MainOne", peak: "10:00–15:00 WAT" },
  { id: "nairobi", name: "Nairobi, Kenya", x: 56, y: 62, connections: 743, status: "Active", station_id: "NBO-01", speed: "5 Gbps", bandwidth: "687 Mbps", latency: "52 ms", uptime: "99.79%", carrier: "Safaricom", peak: "11:00–16:00 EAT" },
  { id: "mumbai", name: "Mumbai, India", x: 66, y: 48, connections: 1567, status: "Optimal", station_id: "BOM-01", speed: "10 Gbps", bandwidth: "1.8 Gbps", latency: "31 ms", uptime: "99.95%", carrier: "Tata Communications", peak: "12:00–17:00 IST" },
  { id: "jakarta", name: "Jakarta, Indonesia", x: 76, y: 62, connections: 412, status: "Active", station_id: "CGK-01", speed: "5 Gbps", bandwidth: "298 Mbps", latency: "58 ms", uptime: "99.76%", carrier: "Telkomsel", peak: "13:00–18:00 WIB" },
  { id: "saopaulo", name: "São Paulo, Brazil", x: 34, y: 70, connections: 528, status: "Active", station_id: "GRU-01", speed: "5 Gbps", bandwidth: "431 Mbps", latency: "41 ms", uptime: "99.88%", carrier: "Vivo Fibra", peak: "10:00–14:00 BRT" },
  { id: "tokyo", name: "Tokyo, Japan", x: 84, y: 40, connections: 384, status: "Optimal", station_id: "NRT-01", speed: "10 Gbps", bandwidth: "356 Mbps", latency: "22 ms", uptime: "99.99%", carrier: "NTT Communications", peak: "09:00–13:00 JST" },
  { id: "sydney", name: "Sydney, Australia", x: 88, y: 75, connections: 256, status: "Active", station_id: "SYD-01", speed: "5 Gbps", bandwidth: "198 Mbps", latency: "64 ms", uptime: "99.91%", carrier: "Telstra", peak: "08:00–12:00 AEST" },
  { id: "cairo", name: "Cairo, Egypt", x: 54, y: 44, connections: 467, status: "Active", station_id: "CAI-01", speed: "5 Gbps", bandwidth: "384 Mbps", latency: "44 ms", uptime: "99.85%", carrier: "TE Data", peak: "11:00–16:00 EET" },
  { id: "mexico", name: "Mexico City, Mexico", x: 20, y: 48, connections: 389, status: "Active", station_id: "MEX-01", speed: "5 Gbps", bandwidth: "312 Mbps", latency: "33 ms", uptime: "99.90%", carrier: "Telmex", peak: "09:00–14:00 CST" },
];

// Route metadata for each arc — speed and protocol shown on hover
const routeMeta = {
  "us-east-uk": { speed: "40 Gbps", protocol: "SEA-ME-WE 6", distance: "5,570 km" },
  "uk-lagos": { speed: "20 Gbps", protocol: "Equiano", distance: "5,140 km" },
  "lagos-nairobi": { speed: "10 Gbps", protocol: "EASSy", distance: "2,610 km" },
  "nairobi-mumbai": { speed: "20 Gbps", protocol: "PEACE", distance: "4,530 km" },
  "mumbai-jakarta": { speed: "10 Gbps", protocol: "SEA-ME-WE 5", distance: "4,420 km" },
  "jakarta-tokyo": { speed: "10 Gbps", protocol: "JUS", distance: "5,790 km" },
  "tokyo-sydney": { speed: "10 Gbps", protocol: "JASURAUS", distance: "7,820 km" },
  "us-east-saopaulo": { speed: "20 Gbps", protocol: "SAm-1", distance: "7,640 km" },
  "us-east-us-west": { speed: "40 Gbps", protocol: "Terrestrial", distance: "3,940 km" },
  "us-west-mexico": { speed: "10 Gbps", protocol: "Terrestrial", distance: "2,480 km" },
  "uk-cairo": { speed: "20 Gbps", protocol: "I-ME-WE", distance: "3,420 km" },
  "mumbai-tokyo": { speed: "20 Gbps", protocol: "SEA-ME-WE 6", distance: "6,750 km" },
  "us-east-lagos": { speed: "20 Gbps", protocol: "South Atlantic 2", distance: "8,630 km" },
  "saopaulo-lagos": { speed: "10 Gbps", protocol: "SAIL", distance: "6,190 km" },
};

// Curved arc paths between hub nodes — each entry defines a connection route
const connections = [
  ["us-east", "uk"],
  ["uk", "lagos"],
  ["lagos", "nairobi"],
  ["nairobi", "mumbai"],
  ["mumbai", "jakarta"],
  ["jakarta", "tokyo"],
  ["tokyo", "sydney"],
  ["us-east", "saopaulo"],
  ["us-east", "us-west"],
  ["us-west", "mexico"],
  ["uk", "cairo"],
  ["mumbai", "tokyo"],
  ["us-east", "lagos"],
  ["saopaulo", "lagos"],
];

// Compute quadratic bezier control point offset perpendicular to the line
function arcPath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * 0.35, 12);
  const cx = mx;
  const cy = my - offset;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export default function ActiveMap() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [hoveredArc, setHoveredArc] = useState(null);
  const [inView, setInView] = useState(true);
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [heatmapOn, setHeatmapOn] = useState(false);
  const sectionRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(interval);
  }, [inView]);

  // Generate live connection logs
  useEffect(() => {
    if (!inView) return;
    const logMessages = [
      'Packet routed via NYC-01',
      'Handshake complete LDN-01',
      'Bandwidth allocation LOS-01',
      'Signal boost NBO-01',
      'Connection established BOM-01',
      'Latency optimized CGK-01',
      'Carrier switch GRU-01',
      'Route validation NRT-01',
      'Data sync SYD-01',
      'Uptime check CAI-01',
      'Node heartbeat MEX-01',
      'Protocol upgrade SEA-ME-WE 6',
    ];
    const interval = setInterval(() => {
      const randomRegion = regions[Math.floor(Math.random() * regions.length)];
      const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
      const timestamp = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' });
      setLogs((prev) => {
        const newLogs = [...prev, { id: Date.now(), timestamp, message: `${randomRegion.station_id}: ${randomMessage}` }];
        return newLogs.slice(-8);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [inView]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Filter regions based on search query
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regions;
    const query = searchQuery.toLowerCase();
    return regions.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.station_id.toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Auto-select first matching region when search query changes
  useEffect(() => {
    if (searchQuery.trim() && filteredRegions.length > 0) {
      setSelected(filteredRegions[0].id);
    } else if (!searchQuery.trim()) {
      setSelected(null);
    }
  }, [searchQuery, filteredRegions.length]);

  const totalConnections = regions.reduce((sum, r) => sum + r.connections, 0);
  const activeRegion = regions.find((r) => r.id === (hovered || selected));

  const arcs = useMemo(() => {
    return connections.map(([a, b]) => {
      const ra = regions.find((r) => r.id === a);
      const rb = regions.find((r) => r.id === b);
      if (!ra || !rb) return null;
      return {
        id: `${a}-${b}`,
        d: arcPath(ra.x, ra.y, rb.x, rb.y),
        from: ra,
        to: rb,
        meta: routeMeta[`${a}-${b}`],
        midX: (ra.x + rb.x) / 2,
        midY: Math.min(ra.y, rb.y) - Math.min(Math.sqrt((rb.x - ra.x) ** 2 + (rb.y - ra.y) ** 2) * 0.35, 12),
      };
    }).filter(Boolean);
  }, []);

  const activeArc = hoveredArc ? arcs.find((a) => a.id === hoveredArc) : null;

  // Calculate dashboard metrics
  const avgSpeed = useMemo(() => {
    const speeds = regions.map(r => parseFloat(r.speed));
    return (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1);
  }, []);

  const totalBandwidth = useMemo(() => {
    return regions.reduce((sum, r) => {
      const val = parseFloat(r.bandwidth);
      return sum + (r.bandwidth.includes('Gbps') ? val * 1000 : val);
    }, 0).toFixed(0);
  }, []);

  const optimalNodes = useMemo(() => {
    return regions.filter(r => r.status === "Optimal").length;
  }, []);

  const avgLatency = useMemo(() => {
    const latencies = regions.map(r => parseFloat(r.latency));
    return (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(209,255,38,0.04) 0%, transparent 60%)' }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Signal Health Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.25)' }}>
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ background: '#D1FF26', boxShadow: '0 0 8px #D1FF26' }} />
                <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: 'rgba(209,255,38,0.6)' }} />
              </div>
              <span className="font-mono text-[9px] tracking-widest" style={{ color: '#D1FF26' }}>SIGNAL HEALTH</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2" style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
              <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>ACTIVE NODES</span>
              <span className="font-heading font-black text-xl" style={{ color: '#D1FF26' }}>{regions.length}</span>
              <span className="font-mono text-[8px]" style={{ color: '#8A8F98' }}>/ {regions.length}</span>
            </div>
            <button
              onClick={() => setHeatmapOn(!heatmapOn)}
              className="flex items-center gap-2 px-4 py-2 transition-all"
              style={{
                background: heatmapOn ? 'rgba(239,68,68,0.12)' : 'rgba(16,20,29,0.6)',
                border: heatmapOn ? '0.5px solid rgba(239,68,68,0.4)' : '0.5px solid rgba(138,143,152,0.15)',
                boxShadow: heatmapOn ? '0 0 15px rgba(239,68,68,0.15)' : 'none',
              }}
            >
              <Flame size={12} style={{ color: heatmapOn ? '#ef4444' : '#8A8F98' }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: heatmapOn ? '#ef4444' : '#8A8F98' }}>
                {heatmapOn ? 'OUTAGE HEATMAP: ON' : 'OUTAGE HEATMAP: OFF'}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.15 }} className="mb-8">
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, region, or station ID..."
                className="w-full px-5 py-3 pl-12 text-sm outline-none transition-all"
                style={{ 
                  background: 'rgba(16,20,29,0.8)', 
                  border: searchQuery.trim() ? '0.5px solid rgba(209,255,38,0.4)' : '0.5px solid rgba(138,143,152,0.15)',
                  color: '#F5F5F7',
                  boxShadow: searchQuery.trim() ? '0 0 20px rgba(209,255,38,0.1)' : 'none'
                }}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" style={{ color: '#8A8F98' }} />
                <path d="M21 21l-4.35-4.35" style={{ color: '#8A8F98' }} />
              </svg>
              {searchQuery.trim() && (
                <button 
                  onClick={() => { setSearchQuery(''); setSelected(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[rgba(138,143,152,0.1)] rounded"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A8F98" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <p className="font-mono text-[9px] mt-2 text-center" style={{ color: '#8A8F98' }}>
                {filteredRegions.length} node{filteredRegions.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="mb-10 lg:mb-14 text-center">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>// NETWORK COVERAGE</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>Where We're Live</h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>Real-time connections across the globe. Tap a node to see live activity.</p>
        </motion.div>

        {/* Main grid: Map + Dashboard */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Column (2/3) */}
          <div className="lg:col-span-2">
            {/* Stats bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.15 }} className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-4 text-center" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: '#8A8F98' }}>ACTIVE NODES</p>
                <p className="font-heading font-black text-2xl" style={{ color: '#D1FF26' }}>{regions.length}</p>
              </div>
              <div className="p-4 text-center" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: '#8A8F98' }}>CONNECTIONS</p>
                <p className="font-heading font-black text-2xl" style={{ color: '#D1FF26' }}>{(totalConnections + tick * 3).toLocaleString()}</p>
              </div>
              <div className="p-4 text-center" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: '#8A8F98' }}>CONTINENTS</p>
                <p className="font-heading font-black text-2xl" style={{ color: '#D1FF26' }}>6</p>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.8, delay: 0.2 }} className="relative w-full overflow-hidden" style={{ aspectRatio: '2 / 1', background: 'radial-gradient(ellipse at 50% 40%, rgba(22,28,40,0.9) 0%, rgba(5,7,10,0.85) 70%, rgba(5,7,10,1) 100%)', border: '1px solid rgba(209,255,38,0.15)', boxShadow: '0 0 60px rgba(209,255,38,0.04), inset 0 0 120px rgba(0,0,0,0.5)' }}>
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-5 h-5 pointer-events-none" style={{ borderTop: '1.5px solid rgba(209,255,38,0.4)', borderLeft: '1.5px solid rgba(209,255,38,0.4)' }} />
              <div className="absolute top-0 right-0 w-5 h-5 pointer-events-none" style={{ borderTop: '1.5px solid rgba(209,255,38,0.4)', borderRight: '1.5px solid rgba(209,255,38,0.4)' }} />
              <div className="absolute bottom-0 left-0 w-5 h-5 pointer-events-none" style={{ borderBottom: '1.5px solid rgba(209,255,38,0.4)', borderLeft: '1.5px solid rgba(209,255,38,0.4)' }} />
              <div className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none" style={{ borderBottom: '1.5px solid rgba(209,255,38,0.4)', borderRight: '1.5px solid rgba(209,255,38,0.4)' }} />

              <WorldMapSilhouette />
              <HeatmapOverlay active={heatmapOn} />

              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                {Array.from({ length: 7 }, (_, i) => (<div key={`h${i}`} className="absolute left-0 right-0 h-px" style={{ top: `${(i + 1) * 12.5}%`, background: 'linear-gradient(90deg, transparent, rgba(209,255,38,0.08) 50%, transparent)' }} />))}
                {Array.from({ length: 11 }, (_, i) => (<div key={`v${i}`} className="absolute top-0 bottom-0 w-px" style={{ left: `${(i + 1) * 8.33}%`, background: 'linear-gradient(180deg, transparent, rgba(209,255,38,0.06) 50%, transparent)' }} />))}
              </div>

              {/* Radar sweep */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative" style={{ width: '80%', height: '80%' }}>
                  <div className="absolute inset-0 rounded-full" style={{ border: '0.5px solid rgba(209,255,38,0.06)' }} />
                  <div className="absolute inset-[12%] rounded-full" style={{ border: '0.5px solid rgba(209,255,38,0.05)' }} />
                  <div className="absolute inset-[25%] rounded-full" style={{ border: '0.5px solid rgba(209,255,38,0.04)' }} />
                  <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(209,255,38,0.06) 30deg, transparent 60deg)', animation: 'spin 12s linear infinite' }} />
                </div>
              </div>

              {/* Connection arcs */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(209,255,38,0)" />
                    <stop offset="50%" stopColor="rgba(209,255,38,0.3)" />
                    <stop offset="100%" stopColor="rgba(209,255,38,0)" />
                  </linearGradient>
                  <filter id="arcGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {arcs.map((arc) => {
                  const highlight = (activeRegion && (arc.from.id === activeRegion.id || arc.to.id === activeRegion.id)) || hoveredArc === arc.id;
                  return (
                    <g key={arc.id}>
                      {/* Base dim arc */}
                      <path d={arc.d} fill="none" stroke={highlight ? 'rgba(209,255,38,0.7)' : 'rgba(209,255,38,0.08)'} strokeWidth={highlight ? '1.5' : '0.5'} style={{ transition: 'stroke 0.3s, stroke-width 0.3s', pointerEvents: 'none' }} />
                      {/* Animated flow dash */}
                      <path d={arc.d} fill="none" stroke={highlight ? '#D1FF26' : 'rgba(209,255,38,0.25)'} strokeWidth={highlight ? '1' : '0.6'} strokeDasharray="4 8" filter="url(#arcGlow)" style={{ transition: 'stroke 0.3s, stroke-width 0.3s', pointerEvents: 'none' }}>
                        <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.5s" repeatCount="indefinite" />
                      </path>
                      {/* Hover hit area */}
                      <path d={arc.d} fill="none" stroke="transparent" strokeWidth="8" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredArc(arc.id)} onMouseLeave={() => setHoveredArc(null)} />
                    </g>
                  );
                })}
              </svg>

              {/* Data packets */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                {arcs.map((arc, i) => (<DataPacket key={`pkt-${arc.id}`} path={arc.d} delay={i * 0.4} duration={2.5 + (i % 3)} />))}
              </svg>

              {/* Region nodes */}
              {regions.map((region, i) => {
                const isActive = activeRegion?.id === region.id;
                const isOptimal = region.status === "Optimal";
                const nodeColor = isOptimal ? '#D1FF26' : '#8A8F98';
                return (
                  <button key={region.id} onClick={() => setSelected(selected === region.id ? null : region.id)} onMouseEnter={() => setHovered(region.id)} onMouseLeave={() => setHovered(null)} className="absolute -translate-x-1/2 -translate-y-1/2 group z-10" style={{ left: `${region.x}%`, top: `${region.y}%` }}>
                    {/* Outer converge ring */}
                    <div className="absolute rounded-full pointer-events-none" style={{ width: '32px', height: '32px', left: '-16px', top: '-16px', border: `1px solid ${isOptimal ? 'rgba(209,255,38,0.35)' : 'rgba(138,143,152,0.35)'}`, animation: `converge ${2 + (i % 3) * 0.5}s ease-out infinite`, animationDelay: `${i * 0.3}s` }} />
                    {/* Second staggered ring */}
                    <div className="absolute rounded-full pointer-events-none" style={{ width: '20px', height: '20px', left: '-10px', top: '-10px', border: `0.5px solid ${isOptimal ? 'rgba(209,255,38,0.2)' : 'rgba(138,143,152,0.2)'}`, animation: `converge ${2.5 + (i % 2) * 0.7}s ease-out infinite`, animationDelay: `${i * 0.5 + 0.4}s` }} />
                    {/* Active selection ring */}
                    {isActive && (<div className="absolute rounded-full pointer-events-none" style={{ width: '44px', height: '44px', left: '-22px', top: '-22px', border: '1px solid rgba(209,255,38,0.4)', animation: `converge 1.5s ease-out infinite` }} />)}
                    {/* Soft glow halo */}
                    <div className="absolute rounded-full pointer-events-none transition-all duration-300" style={{ width: isActive ? '24px' : '16px', height: isActive ? '24px' : '16px', left: isActive ? '-12px' : '-8px', top: isActive ? '-12px' : '-8px', background: `radial-gradient(circle, ${isOptimal ? 'rgba(209,255,38,0.25)' : 'rgba(138,143,152,0.2)'} 0%, transparent 70%)` }} />
                    {/* Core dot */}
                    <div className="relative rounded-full transition-all duration-300" style={{ width: isActive ? '12px' : '7px', height: isActive ? '12px' : '7px', background: nodeColor, boxShadow: `0 0 ${isActive ? '16px' : '8px'} ${nodeColor}, 0 0 ${isActive ? '32px' : '16px'} ${isOptimal ? 'rgba(209,255,38,0.35)' : 'rgba(138,143,152,0.25)'}` }} />
                  </button>
                );
              })}

              <AnimatePresence>
                {activeRegion && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute z-30 p-4 pointer-events-none" style={{ left: `${activeRegion.x}%`, top: `${activeRegion.y}%`, transform: `translate(${activeRegion.x > 70 ? 'calc(-100% - 15px)' : '15px'}, ${activeRegion.y > 60 ? 'calc(-100% - 15px)' : '15px'})`, background: '#10141D', border: '0.5px solid rgba(209,255,38,0.3)', minWidth: '230px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-heading font-bold text-sm" style={{ color: '#F5F5F7' }}>{activeRegion.name}</p>
                      <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: activeRegion.status === 'Optimal' ? 'rgba(209,255,38,0.12)' : 'rgba(138,143,152,0.12)', color: activeRegion.status === 'Optimal' ? '#D1FF26' : '#8A8F98' }}>{activeRegion.station_id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3 pb-3" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.12)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeRegion.status === 'Optimal' ? '#D1FF26' : '#8A8F98', boxShadow: `0 0 4px ${activeRegion.status === 'Optimal' ? '#D1FF26' : '#8A8F98'}` }} />
                      <span className="font-mono text-[9px] tracking-widest font-bold" style={{ color: activeRegion.status === 'Optimal' ? '#D1FF26' : '#8A8F98' }}>{activeRegion.status.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>CONNECTION SPEED</span>
                      <span className="font-heading font-black text-sm" style={{ color: '#D1FF26' }}>{activeRegion.speed}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>BANDWIDTH</span><span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{activeRegion.bandwidth}</span></div>
                      <div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>LATENCY</span><span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{activeRegion.latency}</span></div>
                      <div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>UPTIME</span><span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{activeRegion.uptime}</span></div>
                      <div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>CONNECTIONS</span><span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{activeRegion.connections.toLocaleString()}</span></div>
                      <div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>CARRIER</span><span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{activeRegion.carrier}</span></div>
                      <div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>PEAK HOURS</span><span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{activeRegion.peak}</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeArc && activeArc.meta && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute z-30 p-3 pointer-events-none" style={{ left: `${activeArc.midX}%`, top: `${activeArc.midY}%`, transform: `translate(-50%, ${activeArc.midY > 50 ? 'calc(-100% - 10px)' : '10px'})`, background: '#10141D', border: '0.5px solid rgba(209,255,38,0.3)', minWidth: '160px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                    <p className="font-heading font-bold text-xs mb-1" style={{ color: '#F5F5F7' }}>{activeArc.from.name.split(',')[0]} → {activeArc.to.name.split(',')[0]}</p>
                    <p className="font-mono text-[8px] tracking-widest mb-2.5" style={{ color: '#8A8F98' }}>SUBMARINE ROUTE</p>
                    <div className="flex items-center justify-between mb-1.5"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>SPEED</span><span className="font-heading font-black text-sm" style={{ color: '#D1FF26' }}>{activeArc.meta.speed}</span></div>
                    <div className="flex items-center justify-between mb-1.5"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>DISTANCE</span><span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{activeArc.meta.distance}</span></div>
                    <div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>CABLE</span><span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{activeArc.meta.protocol}</span></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HUD labels */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
                <span style={{ color: 'rgba(209,255,38,0.5)' }}>◆</span> GLOBAL NETWORK MAP v2.1
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1.5 font-mono text-[9px] tracking-widest px-2 py-1" style={{ color: '#D1FF26', background: 'rgba(209,255,38,0.06)', border: '0.5px solid rgba(209,255,38,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D1FF26', boxShadow: '0 0 6px #D1FF26', animation: 'dotPulse 1.5s ease-in-out infinite' }} />LIVE
              </div>
              <div className="absolute bottom-3 left-3 font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>LAT: GLOBAL · LON: REALTIME</div>
              <div className="absolute bottom-3 right-3 font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>REFRESH: 1s</div>

              {/* Heatmap legend */}
              {heatmapOn && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2" style={{ background: 'rgba(16,20,29,0.85)', border: '0.5px solid rgba(239,68,68,0.25)' }}>
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>OUTAGE VOLUME</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(234,179,8,0.5)', boxShadow: '0 0 4px rgba(234,179,8,0.4)' }} />
                    <span className="font-mono text-[8px]" style={{ color: '#8A8F98' }}>LOW</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(245,158,11,0.5)', boxShadow: '0 0 4px rgba(245,158,11,0.4)' }} />
                    <span className="font-mono text-[8px]" style={{ color: '#8A8F98' }}>MED</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(239,68,68,0.6)', boxShadow: '0 0 4px rgba(239,68,68,0.4)' }} />
                    <span className="font-mono text-[8px]" style={{ color: '#8A8F98' }}>HIGH</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Region list */}
            <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.4 }} className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {regions.map((region, i) => {
                const isMatch = searchQuery.trim() && filteredRegions.some(r => r.id === region.id);
                const isHidden = searchQuery.trim() && !isMatch;
                return (
                  <button key={region.id} onClick={() => setSelected(selected === region.id ? null : region.id)} onMouseEnter={() => setHovered(region.id)} onMouseLeave={() => setHovered(null)} className="flex items-center gap-2 p-2.5 text-left transition-all" style={{ background: activeRegion?.id === region.id ? 'rgba(209,255,38,0.06)' : 'rgba(16,20,29,0.3)', border: `0.5px solid ${activeRegion?.id === region.id ? 'rgba(209,255,38,0.25)' : isMatch ? 'rgba(209,255,38,0.4)' : 'rgba(138,143,152,0.08)'}`, opacity: isHidden ? 0.3 : 1, display: isHidden ? 'none' : 'flex' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: region.status === 'Optimal' ? '#D1FF26' : '#8A8F98', boxShadow: `0 0 6px ${region.status === 'Optimal' ? '#D1FF26' : 'rgba(138,143,152,0.5)'}`, animation: `dotPulse ${1.5 + (i % 3) * 0.3}s ease-in-out infinite` }} />
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ color: '#F5F5F7' }}>{region.name}</p>
                      <p className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>{region.connections.toLocaleString()} conn.</p>
                    </div>
                  </button>
                );
              })}
            </motion.div>

            {/* Live Connection Log */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.5 }} className="mt-6" style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.15)' }}>
                <Activity size={12} style={{ color: '#D1FF26' }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: '#D1FF26' }}>// LIVE CONNECTION LOG</p>
              </div>
              <div ref={logContainerRef} className="h-32 overflow-y-auto px-4 py-3 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1FF26 rgba(16,20,29,0.3)' }}>
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-2 font-mono text-[8px]">
                    <span className="flex-shrink-0" style={{ color: '#8A8F98' }}>{log.timestamp}</span>
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#D1FF26', animation: 'dotPulse 1s ease-in-out infinite' }} />
                    <span style={{ color: '#F5F5F7' }}>{log.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Dashboard Panel (1/3) */}
          <NetworkDashboard avgSpeed={avgSpeed} totalBandwidth={totalBandwidth} optimalNodes={optimalNodes} avgLatency={avgLatency} totalConnections={totalConnections} tick={tick} arcs={arcs} regions={regions} />
        </div>
      </div>
    </section>
  );
}

// Dashboard Panel Component
function NetworkDashboard({ avgSpeed, totalBandwidth, optimalNodes, avgLatency, totalConnections, tick, arcs, regions }) {
  const activeArcs = arcs.filter((arc, i) => tick % 3 === i % 3);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="space-y-4">
      {/* Header */}
      <div className="p-5" style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.25)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} style={{ color: '#D1FF26' }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: '#D1FF26' }}>// LIVE SIGNAL METRICS</p>
        </div>
        <p className="font-heading font-bold text-sm" style={{ color: '#F5F5F7' }}>Network Performance Dashboard</p>
      </div>

      {/* Speed Metric */}
      <div className="p-5" style={{ background: 'rgba(16,20,29,0.4)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} style={{ color: '#D1FF26' }} />
          <p className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>AVG SIGNAL SPEED</p>
        </div>
        <p className="font-heading font-black text-3xl" style={{ color: '#D1FF26' }}>{avgSpeed} <span className="text-lg">Gbps</span></p>
        <div className="mt-3 h-1" style={{ background: 'rgba(138,143,152,0.2)' }}>
          <div className="h-full transition-all duration-1000" style={{ width: `${Math.min((parseFloat(avgSpeed) / 10) * 100, 100)}%`, background: '#D1FF26', boxShadow: '0 0 10px rgba(209,255,38,0.5)' }} />
        </div>
      </div>

      {/* Bandwidth Metric */}
      <div className="p-5" style={{ background: 'rgba(16,20,29,0.4)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={14} style={{ color: '#D1FF26' }} />
          <p className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>TOTAL BANDWIDTH</p>
        </div>
        <p className="font-heading font-black text-3xl" style={{ color: '#D1FF26' }}>{(parseFloat(totalBandwidth) / 1000).toFixed(1)} <span className="text-lg">Gbps</span></p>
        <p className="font-mono text-[9px] mt-2" style={{ color: '#8A8F98' }}>Across {regions.length} nodes</p>
      </div>

      {/* Node Status */}
      <div className="p-5" style={{ background: 'rgba(16,20,29,0.4)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Server size={14} style={{ color: '#D1FF26' }} />
          <p className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>NODE STATUS</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-heading font-black text-3xl" style={{ color: '#D1FF26' }}>{optimalNodes}</p>
          <p className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>of {regions.length} optimal</p>
        </div>
        <div className="mt-3 flex gap-1">
          {regions.map((r, i) => (
            <div key={r.id} className="flex-1 h-2 rounded-sm" style={{ background: r.status === 'Optimal' ? '#D1FF26' : '#8A8F98', opacity: 0.3 + (i % 3) * 0.23 }} />
          ))}
        </div>
      </div>

      {/* Latency */}
      <div className="p-5" style={{ background: 'rgba(16,20,29,0.4)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>AVG LATENCY</p>
          <p className="font-heading font-black text-xl" style={{ color: '#D1FF26' }}>{avgLatency} <span className="text-sm">ms</span></p>
        </div>
        <p className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>Real-time packet routing</p>
      </div>

      {/* Active Routes */}
      <div className="p-5" style={{ background: 'rgba(16,20,29,0.4)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
        <p className="font-mono text-[8px] tracking-widest mb-3" style={{ color: '#8A8F98' }}>ACTIVE DATA STREAMS</p>
        <div className="space-y-2">
          {arcs.slice(0, 4).map((arc, i) => (
            <div key={arc.id} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#D1FF26', animation: `dotPulse ${1 + i * 0.3}s ease-in-out infinite` }} />
              <p className="font-mono text-[8px] truncate flex-1" style={{ color: '#F5F5F7' }}>{arc.from.name.split(',')[0]} → {arc.to.name.split(',')[0]}</p>
              <p className="font-mono text-[8px]" style={{ color: '#8A8F98' }}>{arc.meta.speed}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function DataPacket({ path, delay = 0, duration = 3 }) {
  return (
    <circle r="1.5" fill="#D1FF26" style={{ filter: 'drop-shadow(0 0 3px #D1FF26)' }}>
      <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`} path={path} />
      <animate attributeName="opacity" values="0;1;1;0" dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`} />
    </circle>
  );
}

function WorldMapSilhouette() {
  const dots = useMemo(() => generateWorldDots(), []);
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      {dots.map((dot, i) => (<circle key={i} cx={`${dot.x}%`} cy={`${dot.y}%`} r={dot.r || 0.8} fill={dot.bright ? 'rgba(209,255,38,0.12)' : 'rgba(138,143,152,0.18)'} />))}
    </svg>
  );
}

function generateWorldDots() {
  const dots = [];
  const spacing = 1.8;
  const continents = [
    { xMin: 12, xMax: 30, yMin: 28, yMax: 48, shape: northAmerica },
    { xMin: 17, xMax: 24, yMin: 47, yMax: 53, shape: centralAmerica },
    { xMin: 27, xMax: 38, yMin: 55, yMax: 80, shape: southAmerica },
    { xMin: 44, xMax: 56, yMin: 26, yMax: 40, shape: europe },
    { xMin: 47, xMax: 60, yMin: 42, yMax: 70, shape: africa },
    { xMin: 56, xMax: 64, yMin: 38, yMax: 48, shape: middleEast },
    { xMin: 62, xMax: 82, yMin: 35, yMax: 55, shape: asia },
    { xMin: 72, xMax: 82, yMin: 56, yMax: 64, shape: indonesia },
    { xMin: 82, xMax: 87, yMin: 37, yMax: 42, shape: japan },
    { xMin: 82, xMax: 92, yMin: 66, yMax: 78, shape: australia },
    { xMin: 36, xMax: 42, yMin: 18, yMax: 26, shape: greenland },
  ];
  for (const cont of continents) {
    for (let x = cont.xMin; x <= cont.xMax; x += spacing) {
      for (let y = cont.yMin; y <= cont.yMax; y += spacing) {
        if (cont.shape(x, y)) dots.push({ x, y, r: 0.8, bright: false });
      }
    }
  }
  return dots;
}

function northAmerica(x, y) { const cx = 21, cy = 38; const dx = (x - cx) / 9; const dy = (y - cy) / 11; return dx * dx + dy * dy < 1 && y > 28 && y < 49 && x > 12; }
function centralAmerica(x, y) { return x > 17 && x < 25 && y > 47 && y < 54 && (x + y > 63); }
function southAmerica(x, y) { const cx = 32; const width = 6 - (y - 55) * 0.25; return Math.abs(x - cx) < width && y > 55 && y < 80; }
function europe(x, y) { const cx = 50, cy = 33; const dx = (x - cx) / 6; const dy = (y - cy) / 7; return dx * dx + dy * dy < 1 && y > 26 && y < 41; }
function africa(x, y) { const cx = 53, cy = 56; const dx = (x - cx) / 7; const dy = (y - cy) / 14; return dx * dx + dy * dy < 1 && y > 42 && y < 71; }
function middleEast(x, y) { return x > 56 && x < 64 && y > 38 && y < 49; }
function asia(x, y) { const cx = 72, cy = 44; const dx = (x - cx) / 10; const dy = (y - cy) / 10; return dx * dx + dy * dy < 1 && x > 62 && x < 82 && y > 35 && y < 56; }
function indonesia(x, y) { return x > 72 && x < 82 && y > 56 && y < 64; }
function japan(x, y) { return x > 82 && x < 87 && y > 37 && y < 42; }
function australia(x, y) { const cx = 87, cy = 72; const dx = (x - cx) / 5; const dy = (y - cy) / 6; return dx * dx + dy * dy < 1; }
function greenland(x, y) { const cx = 39, cy = 22; const dx = (x - cx) / 3; const dy = (y - cy) / 4; return dx * dx + dy * dy < 1; }