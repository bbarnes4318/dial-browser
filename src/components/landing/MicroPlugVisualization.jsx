import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Smartphone, Building2, Cloud, Activity, Wifi, Zap } from "lucide-react";

// Micro-Plug nodes hosted in local businesses — positioned as percentages
const microPlugs = [
  { id: "mp1", name: "Corner Cafe", x: 20, y: 30, capacity: 50, active: 38, type: "cafe" },
  { id: "mp2", name: "Community Market", x: 55, y: 22, capacity: 80, active: 61, type: "market" },
  { id: "mp3", name: "Local Pharmacy", x: 78, y: 45, capacity: 40, active: 27, type: "pharmacy" },
  { id: "mp4", name: "Neighborhood Gym", x: 35, y: 68, capacity: 60, active: 44, type: "gym" },
  { id: "mp5", name: "Bookstore Hub", x: 70, y: 72, capacity: 45, active: 31, type: "bookstore" },
];

// Mobile devices scattered around the neighborhood
const devices = [
  { id: "d1", x: 12, y: 45, plug: "mp1", role: "access" },
  { id: "d2", x: 28, y: 18, plug: "mp1", role: "relay" },
  { id: "d3", x: 14, y: 22, plug: "mp1", role: "access" },
  { id: "d4", x: 42, y: 35, plug: "mp2", role: "access" },
  { id: "d5", x: 48, y: 12, plug: "mp2", role: "relay" },
  { id: "d6", x: 62, y: 35, plug: "mp2", role: "access" },
  { id: "d7", x: 68, y: 30, plug: "mp3", role: "access" },
  { id: "d8", x: 85, y: 38, plug: "mp3", role: "relay" },
  { id: "d9", x: 82, y: 55, plug: "mp3", role: "access" },
  { id: "d10", x: 28, y: 60, plug: "mp4", role: "access" },
  { id: "d11", x: 42, y: 75, plug: "mp4", role: "relay" },
  { id: "d12", x: 22, y: 78, plug: "mp4", role: "access" },
  { id: "d13", x: 62, y: 65, plug: "mp5", role: "access" },
  { id: "d14", x: 78, y: 62, plug: "mp5", role: "relay" },
  { id: "d15", x: 65, y: 85, plug: "mp5", role: "access" },
  { id: "d16", x: 50, y: 50, plug: "mp2", role: "relay" },
];

// Peer-to-peer relay connections (device to device)
const peerLinks = [
  ["d2", "d5"], ["d5", "d16"], ["d16", "d14"], ["d14", "d8"],
  ["d11", "d13"], ["d6", "d7"],
];

function arcPath(x1, y1, x2, y2, curve = 0.25) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * curve, 10);
  return `M ${x1} ${y1} Q ${mx} ${my - offset} ${x2} ${y2}`;
}

function DataPacket({ path, delay, duration, color }) {
  return (
    <circle r="1.4" fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }}>
      <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`} path={path} />
      <animate attributeName="opacity" values="0;1;1;0" dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`} />
    </circle>
  );
}

export default function MicroPlugVisualization() {
  const [inView, setInView] = useState(false);
  const [selectedPlug, setSelectedPlug] = useState(null);
  const [hoveredDevice, setHoveredDevice] = useState(null);
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState([]);
  const [view, setView] = useState("all"); // all | cloud | local
  const sectionRef = useRef(null);
  const logRef = useRef(null);

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
    const interval = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(interval);
  }, [inView]);

  // Generate live log entries
  useEffect(() => {
    if (!inView) return;
    const messages = [
      () => `CACHE SYNC: ${microPlugs[Math.floor(Math.random() * microPlugs.length)].name} updated`,
      () => `PACKET: ${devices[Math.floor(Math.random() * devices.length)].id.toUpperCase()} ← Micro-Plug`,
      () => `RELAY: ${devices[Math.floor(Math.random() * devices.length)].id.toUpperCase()} → peer device`,
      () => `BANDWIDTH: ${(0.8 + Math.random() * 2.5).toFixed(1)} Mbps saved locally`,
      () => `COMPRESSION: ${(15 + Math.random() * 40).toFixed(0)}% ratio on update batch`,
      () => `EDGE HIT: ${microPlugs[Math.floor(Math.random() * microPlugs.length)].name} served ${(5 + Math.random() * 20).toFixed(0)} requests`,
    ];
    const interval = setInterval(() => {
      const ts = new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });
      setLogs((prev) => [...prev.slice(-12), { id: Date.now(), ts, msg: messages[Math.floor(Math.random() * messages.length)]() }]);
    }, 1200);
    return () => clearInterval(interval);
  }, [inView]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Filter connections by view mode
  const visiblePlugLinks = useMemo(() => {
    if (view === "local") return [];
    return microPlugs.map((mp) => {
      const cloudX = 50, cloudY = 8;
      return { id: `cloud-${mp.id}`, d: arcPath(cloudX, cloudY, mp.x, mp.y), mp };
    });
  }, [view]);

  const visibleDeviceLinks = useMemo(() => {
    if (view === "cloud") return [];
    return devices
      .filter((d) => !selectedPlug || d.plug === selectedPlug)
      .map((d) => {
        const mp = microPlugs.find((m) => m.id === d.plug);
        return { id: `link-${d.id}`, d: arcPath(mp.x, mp.y, d.x, d.y, 0.15), device: d, mp };
      });
  }, [view, selectedPlug]);

  const visiblePeerLinks = useMemo(() => {
    if (view !== "all" && view !== "local") return [];
    return peerLinks
      .map(([a, b]) => {
        const da = devices.find((d) => d.id === a);
        const db = devices.find((d) => d.id === b);
        if (!da || !db) return null;
        if (selectedPlug && da.plug !== selectedPlug && db.plug !== selectedPlug) return null;
        return { id: `peer-${a}-${b}`, d: arcPath(da.x, da.y, db.x, db.y, 0.1), da, db };
      })
      .filter(Boolean);
  }, [view, selectedPlug]);

  const totalActive = microPlugs.reduce((s, mp) => s + mp.active, 0);
  const totalCapacity = microPlugs.reduce((s, mp) => s + mp.capacity, 0);
  const activePlug = microPlugs.find((m) => m.id === selectedPlug);
  const connectedDevices = selectedPlug ? devices.filter((d) => d.plug === selectedPlug) : devices;

  return (
    <div ref={sectionRef} className="relative">
      {/* Header + view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
            // MICRO-PLUG NEIGHBORHOOD MAP
          </p>
        </div>
        <div className="flex items-center gap-1 p-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
          {[
            { key: "all", label: "FULL" },
            { key: "cloud", label: "CLOUD" },
            { key: "local", label: "LOCAL" },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="px-3 py-1.5 font-mono text-[9px] tracking-widest transition-all"
              style={{
                background: view === v.key ? "rgba(209,255,38,0.12)" : "transparent",
                color: view === v.key ? "#D1FF26" : "#8A8F98",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-3 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>MICRO-PLUGS</p>
              <p className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{microPlugs.length}</p>
            </div>
            <div className="p-3 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>DEVICES</p>
              <p className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{devices.length}</p>
            </div>
            <div className="p-3 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>ACTIVE CONN</p>
              <p className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{(totalActive + tick * 2) % (totalCapacity + 50)}</p>
            </div>
            <div className="p-3 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>PEER RELAYS</p>
              <p className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{peerLinks.length}</p>
            </div>
          </div>

          {/* Map canvas */}
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: "16 / 10",
              background: "radial-gradient(ellipse at 50% 40%, rgba(22,28,40,0.9) 0%, rgba(5,7,10,0.85) 70%, rgba(5,7,10,1) 100%)",
              border: "1px solid rgba(209,255,38,0.15)",
              boxShadow: "0 0 60px rgba(209,255,38,0.04), inset 0 0 120px rgba(0,0,0,0.5)",
            }}
          >
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-5 h-5 pointer-events-none" style={{ borderTop: "1.5px solid rgba(209,255,38,0.4)", borderLeft: "1.5px solid rgba(209,255,38,0.4)" }} />
            <div className="absolute top-0 right-0 w-5 h-5 pointer-events-none" style={{ borderTop: "1.5px solid rgba(209,255,38,0.4)", borderRight: "1.5px solid rgba(209,255,38,0.4)" }} />
            <div className="absolute bottom-0 left-0 w-5 h-5 pointer-events-none" style={{ borderBottom: "1.5px solid rgba(209,255,38,0.4)", borderLeft: "1.5px solid rgba(209,255,38,0.4)" }} />
            <div className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none" style={{ borderBottom: "1.5px solid rgba(209,255,38,0.4)", borderRight: "1.5px solid rgba(209,255,38,0.4)" }} />

            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={`h${i}`} className="absolute left-0 right-0 h-px" style={{ top: `${(i + 1) * 12.5}%`, background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.08) 50%, transparent)" }} />
              ))}
              {Array.from({ length: 11 }, (_, i) => (
                <div key={`v${i}`} className="absolute top-0 bottom-0 w-px" style={{ left: `${(i + 1) * 8.33}%`, background: "linear-gradient(180deg, transparent, rgba(209,255,38,0.06) 50%, transparent)" }} />
              ))}
            </div>

            {/* Radar sweep */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative" style={{ width: "85%", height: "85%" }}>
                <div className="absolute inset-0 rounded-full" style={{ border: "0.5px solid rgba(209,255,38,0.05)" }} />
                <div className="absolute inset-[20%] rounded-full" style={{ border: "0.5px solid rgba(209,255,38,0.04)" }} />
                <div className="absolute inset-[40%] rounded-full" style={{ border: "0.5px solid rgba(209,255,38,0.03)" }} />
                <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(209,255,38,0.05) 30deg, transparent 60deg)", animation: "spin 14s linear infinite" }} />
              </div>
            </div>

            {/* Cloud server icon at top center */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2 z-20" style={{ left: "50%", top: "8%" }}>
              <div className="relative">
                <div className="absolute rounded-full pointer-events-none" style={{ width: "44px", height: "44px", left: "-22px", top: "-22px", border: "1px solid rgba(138,143,152,0.25)", animation: "converge 3s ease-out infinite" }} />
                <div className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: "rgba(16,20,29,0.9)", border: "1px solid rgba(138,143,152,0.3)" }}>
                  <Cloud size={16} style={{ color: "#8A8F98" }} />
                </div>
                <p className="font-mono text-[7px] tracking-widest mt-1 text-center whitespace-nowrap" style={{ color: "#8A8F98" }}>CLOUD</p>
              </div>
            </div>

            {/* Cloud → Micro-Plug arcs */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <filter id="mpArcGlow">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {visiblePlugLinks.map((link) => {
                const highlight = !selectedPlug || link.mp.id === selectedPlug;
                return (
                  <g key={link.id}>
                    <path d={link.d} fill="none" stroke={highlight ? "rgba(138,143,152,0.3)" : "rgba(138,143,152,0.08)"} strokeWidth="0.5" style={{ pointerEvents: "none" }} />
                    <path d={link.d} fill="none" stroke={highlight ? "rgba(138,143,152,0.5)" : "rgba(138,143,152,0.12)"} strokeWidth="0.5" strokeDasharray="3 6" filter="url(#mpArcGlow)" style={{ pointerEvents: "none" }}>
                      <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="2s" repeatCount="indefinite" />
                    </path>
                  </g>
                );
              })}
              {/* Data packets cloud → plug */}
              {visiblePlugLinks.map((link, i) => (
                <DataPacket key={`pkt-${link.id}`} path={link.d} delay={i * 0.5} duration={3 + (i % 2)} color="#8A8F98" />
              ))}
            </svg>

            {/* Micro-Plug → Device links */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {visibleDeviceLinks.map((link) => {
                const highlight = !selectedPlug || link.mp.id === selectedPlug || hoveredDevice === link.device.id;
                return (
                  <g key={link.id}>
                    <path d={link.d} fill="none" stroke={highlight ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.06)"} strokeWidth={highlight ? "0.8" : "0.4"} style={{ pointerEvents: "none", transition: "stroke 0.3s, stroke-width 0.3s" }} />
                    <path d={link.d} fill="none" stroke={highlight ? "#D1FF26" : "rgba(209,255,38,0.15)"} strokeWidth={highlight ? "0.5" : "0.3"} strokeDasharray="2 5" style={{ pointerEvents: "none", transition: "stroke 0.3s" }}>
                      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.2s" repeatCount="indefinite" />
                    </path>
                  </g>
                );
              })}
              {/* Data packets plug → device */}
              {visibleDeviceLinks.map((link, i) => (
                <DataPacket key={`dpkt-${link.id}`} path={link.d} delay={i * 0.3} duration={2 + (i % 3) * 0.5} color="#D1FF26" />
              ))}
            </svg>

            {/* Peer-to-peer relay links */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {visiblePeerLinks.map((link) => (
                <g key={link.id}>
                  <path d={link.d} fill="none" stroke="rgba(76,180,255,0.3)" strokeWidth="0.5" strokeDasharray="1 3" style={{ pointerEvents: "none" }}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1s" repeatCount="indefinite" />
                  </path>
                </g>
              ))}
            </svg>

            {/* Micro-Plug nodes */}
            {microPlugs.map((mp, i) => {
              const isSelected = selectedPlug === mp.id;
              const isDimmed = selectedPlug && !isSelected;
              return (
                <button
                  key={mp.id}
                  onClick={() => setSelectedPlug(isSelected ? null : mp.id)}
                  onMouseEnter={() => setSelectedPlug(mp.id)}
                  onMouseLeave={() => setSelectedPlug(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
                  style={{ left: `${mp.x}%`, top: `${mp.y}%`, opacity: isDimmed ? 0.4 : 1 }}
                >
                  {/* Coverage radius */}
                  <div className="absolute rounded-full pointer-events-none" style={{ width: "90px", height: "90px", left: "-45px", top: "-45px", border: "0.5px solid rgba(209,255,38,0.08)", opacity: isDimmed ? 0.3 : 0.6 }} />
                  {/* Converge ring */}
                  <div className="absolute rounded-full pointer-events-none" style={{ width: "40px", height: "40px", left: "-20px", top: "-20px", border: "0.5px solid rgba(209,255,38,0.3)", animation: `converge ${2.5 + (i % 3) * 0.5}s ease-out infinite`, animationDelay: `${i * 0.4}s` }} />
                  {/* Glow halo */}
                  <div className="absolute rounded-full pointer-events-none transition-all duration-300" style={{ width: isSelected ? "30px" : "22px", height: isSelected ? "30px" : "22px", left: isSelected ? "-15px" : "-11px", top: isSelected ? "-15px" : "-11px", background: "radial-gradient(circle, rgba(209,255,38,0.3) 0%, transparent 70%)" }} />
                  {/* Core */}
                  <div className="relative flex items-center justify-center rounded-full transition-all duration-300" style={{ width: isSelected ? "22px" : "18px", height: isSelected ? "22px" : "18px", background: "rgba(16,20,29,0.95)", border: `1.5px solid #D1FF26`, boxShadow: `0 0 ${isSelected ? "20px" : "12px"} rgba(209,255,38,0.5)` }}>
                    <Radio size={10} style={{ color: "#D1FF26" }} />
                  </div>
                  {/* Label */}
                  <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none" style={{ opacity: isSelected || hoveredDevice ? 1 : 0.7 }}>
                    <p className="font-mono text-[8px] tracking-widest" style={{ color: isSelected ? "#D1FF26" : "#8A8F98" }}>{mp.name}</p>
                  </div>
                </button>
              );
            })}

            {/* Device nodes */}
            {devices.map((dev, i) => {
              const mp = microPlugs.find((m) => m.id === dev.plug);
              const isDimmed = selectedPlug && dev.plug !== selectedPlug;
              const isHovered = hoveredDevice === dev.id;
              const isRelay = dev.role === "relay";
              return (
                <div
                  key={dev.id}
                  onMouseEnter={() => setHoveredDevice(dev.id)}
                  onMouseLeave={() => setHoveredDevice(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-[5] transition-all duration-300"
                  style={{ left: `${dev.x}%`, top: `${dev.y}%`, opacity: isDimmed ? 0.25 : 1 }}
                >
                  {/* Pulse ring */}
                  <div className="absolute rounded-full pointer-events-none" style={{ width: "16px", height: "16px", left: "-8px", top: "-8px", border: `0.5px solid ${isRelay ? "rgba(76,180,255,0.3)" : "rgba(209,255,38,0.2)"}`, animation: `converge ${2 + (i % 4) * 0.4}s ease-out infinite`, animationDelay: `${i * 0.2}s` }} />
                  {/* Core dot */}
                  <div className="relative rounded-full transition-all duration-300" style={{ width: isHovered ? "8px" : "6px", height: isHovered ? "8px" : "6px", background: isRelay ? "#4CB4FF" : "#D1FF26", boxShadow: `0 0 ${isHovered ? "10px" : "6px"} ${isRelay ? "#4CB4FF" : "#D1FF26"}` }} />
                  {/* Device label on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-30 px-2 py-1" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                        <p className="font-mono text-[7px] tracking-widest" style={{ color: isRelay ? "#4CB4FF" : "#D1FF26" }}>{dev.id.toUpperCase()} · {isRelay ? "RELAY" : "ACCESS"}</p>
                        <p className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>via {mp.name}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* HUD labels */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
              <span style={{ color: "rgba(209,255,38,0.5)" }}>◆</span> APPNET EDGE MAP v1.0
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 font-mono text-[9px] tracking-widest px-2 py-1" style={{ color: "#D1FF26", background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />LIVE
            </div>
            <div className="absolute bottom-3 left-3 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SECTOR: NEIGHBORHOOD</div>
            <div className="absolute bottom-3 right-3 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>REFRESH: 1s</div>

            {/* Legend */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 px-3 py-1.5" style={{ background: "rgba(16,20,29,0.85)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
              <div className="flex items-center gap-1.5">
                <Radio size={9} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>MICRO-PLUG</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 4px #D1FF26" }} />
                <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>ACCESS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#4CB4FF", boxShadow: "0 0 4px #4CB4FF" }} />
                <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>RELAY</span>
              </div>
            </div>
          </div>

          {/* Micro-Plug list */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {microPlugs.map((mp) => {
              const isSelected = selectedPlug === mp.id;
              const pct = Math.round((mp.active / mp.capacity) * 100);
              return (
                <button
                  key={mp.id}
                  onClick={() => setSelectedPlug(isSelected ? null : mp.id)}
                  onMouseEnter={() => setSelectedPlug(mp.id)}
                  onMouseLeave={() => setSelectedPlug(null)}
                  className="p-2.5 text-left transition-all"
                  style={{
                    background: isSelected ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.3)",
                    border: `0.5px solid ${isSelected ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.08)"}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Building2 size={10} style={{ color: "#D1FF26" }} />
                    <p className="text-[10px] truncate" style={{ color: "#F5F5F7" }}>{mp.name}</p>
                  </div>
                  <p className="font-mono text-[8px] mb-1" style={{ color: "#8A8F98" }}>{mp.active}/{mp.capacity} conn.</p>
                  <div className="h-1" style={{ background: "rgba(138,143,152,0.2)" }}>
                    <div className="h-full transition-all" style={{ width: `${pct}%`, background: "#D1FF26", boxShadow: "0 0 6px rgba(209,255,38,0.4)" }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel — active plug details + logs */}
        <div className="space-y-4">
          {/* Active plug details */}
          <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// EDGE NODE DETAIL</p>
            </div>
            {activePlug ? (
              <motion.div key={activePlug.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={16} style={{ color: "#D1FF26" }} />
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{activePlug.name}</p>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CAPACITY</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: "#F5F5F7" }}>{activePlug.capacity} devices</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ACTIVE NOW</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: "#D1FF26" }}>{activePlug.active}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>UTILIZATION</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: "#D1FF26" }}>{Math.round((activePlug.active / activePlug.capacity) * 100)}%</span>
                    </div>
                    <div className="h-1.5" style={{ background: "rgba(138,143,152,0.2)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(activePlug.active / activePlug.capacity) * 100}%` }} transition={{ duration: 0.5 }} className="h-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px rgba(209,255,38,0.5)" }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CONNECTED</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: "#F5F5F7" }}>{connectedDevices.length} devices</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>RELAYS</span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: "#4CB4FF" }}>{connectedDevices.filter((d) => d.role === "relay").length}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <p className="text-xs" style={{ color: "#8A8F98", lineHeight: "1.5" }}>
                Hover or tap a Micro-Plug node to see real-time edge details. Each node is a local business hosting data for nearby devices.
              </p>
            )}
          </div>

          {/* Layer breakdown */}
          <div className="p-5 space-y-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>// NETWORK LAYERS</p>
            <div className="flex items-center gap-2">
              <Cloud size={12} style={{ color: "#8A8F98" }} />
              <span className="font-mono text-[9px] flex-1" style={{ color: "#F5F5F7" }}>Cloud sync</span>
              <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>↓ packets</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio size={12} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] flex-1" style={{ color: "#F5F5F7" }}>Micro-Plug edge</span>
              <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{microPlugs.length} nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone size={12} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] flex-1" style={{ color: "#F5F5F7" }}>Device access</span>
              <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{devices.filter((d) => d.role === "access").length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi size={12} style={{ color: "#4CB4FF" }} />
              <span className="font-mono text-[9px] flex-1" style={{ color: "#F5F5F7" }}>Peer relay</span>
              <span className="font-mono text-[8px]" style={{ color: "#4CB4FF" }}>{devices.filter((d) => d.role === "relay").length}</span>
            </div>
          </div>

          {/* Live log */}
          <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <Zap size={11} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE EDGE LOG</p>
            </div>
            <div ref={logRef} className="h-36 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#D1FF26 rgba(16,20,29,0.3)" }}>
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 font-mono text-[8px]">
                  <span className="flex-shrink-0" style={{ color: "#8A8F98" }}>{log.ts}</span>
                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#D1FF26", animation: "dotPulse 1s ease-in-out infinite" }} />
                  <span style={{ color: "#F5F5F7" }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}