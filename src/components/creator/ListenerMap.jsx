import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Radio } from "lucide-react";

// Major call-in regions with percentage-based map coordinates
const LISTENER_REGIONS = [
  { id: "nyc", name: "New York, USA", x: 28, y: 38 },
  { id: "la", name: "Los Angeles, USA", x: 17, y: 42 },
  { id: "london", name: "London, UK", x: 47, y: 32 },
  { id: "lagos", name: "Lagos, Nigeria", x: 49, y: 58 },
  { id: "nairobi", name: "Nairobi, Kenya", x: 56, y: 62 },
  { id: "mumbai", name: "Mumbai, India", x: 66, y: 48 },
  { id: "jakarta", name: "Jakarta, Indonesia", x: 76, y: 62 },
  { id: "saopaulo", name: "São Paulo, Brazil", x: 34, y: 70 },
  { id: "tokyo", name: "Tokyo, Japan", x: 84, y: 40 },
  { id: "sydney", name: "Sydney, Australia", x: 88, y: 75 },
  { id: "cairo", name: "Cairo, Egypt", x: 54, y: 44 },
  { id: "mexico", name: "Mexico City, Mexico", x: 20, y: 48 },
  { id: "toronto", name: "Toronto, Canada", x: 27, y: 33 },
  { id: "dubai", name: "Dubai, UAE", x: 60, y: 46 },
  { id: "manila", name: "Manila, Philippines", x: 80, y: 52 },
  { id: "accra", name: "Accra, Ghana", x: 47, y: 55 },
];

// Deterministic pseudo-random from a seed so each session gets stable but distinct distribution
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Distribute a session's peak listeners across regions deterministically
function deriveListeners(session) {
  const total = session?.peak_listeners || 0;
  if (total === 0) return [];

  const seed = (session.id || "stream")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rand = seededRandom(seed + total);

  // Weight each region randomly, then normalize to total listeners
  const weighted = LISTENER_REGIONS.map((r) => ({
    ...r,
    weight: 0.3 + rand() * 0.7,
  }));
  const sum = weighted.reduce((a, r) => a + r.weight, 0);

  return weighted
    .map((r) => ({
      ...r,
      count: Math.max(1, Math.round((r.weight / sum) * total)),
    }))
    .sort((a, b) => b.count - a.count);
}

export default function ListenerMap({ session }) {
  const [hovered, setHovered] = useState(null);

  const listeners = useMemo(() => deriveListeners(session), [session]);
  const maxCount = Math.max(...listeners.map((l) => l.count), 1);
  const totalListeners = listeners.reduce((a, l) => a + l.count, 0);
  const activeRegion = listeners.find((l) => l.id === hovered);

  return (
    <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>LISTENER ORIGINS</p>
        </div>
        {session && (
          <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>
            {totalListeners.toLocaleString()} callers mapped
          </p>
        )}
      </div>

      {/* Map surface */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "2 / 1",
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(22,28,40,0.9) 0%, rgba(5,7,10,0.85) 70%, rgba(5,7,10,1) 100%)",
          border: "1px solid rgba(209,255,38,0.12)",
        }}
      >
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none" style={{ borderTop: "1.5px solid rgba(209,255,38,0.35)", borderLeft: "1.5px solid rgba(209,255,38,0.35)" }} />
        <div className="absolute top-0 right-0 w-4 h-4 pointer-events-none" style={{ borderTop: "1.5px solid rgba(209,255,38,0.35)", borderRight: "1.5px solid rgba(209,255,38,0.35)" }} />
        <div className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none" style={{ borderBottom: "1.5px solid rgba(209,255,38,0.35)", borderLeft: "1.5px solid rgba(209,255,38,0.35)" }} />
        <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none" style={{ borderBottom: "1.5px solid rgba(209,255,38,0.35)", borderRight: "1.5px solid rgba(209,255,38,0.35)" }} />

        <WorldMapSilhouette />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`h${i}`} className="absolute left-0 right-0 h-px" style={{ top: `${(i + 1) * 16.6}%`, background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.07) 50%, transparent)" }} />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <div key={`v${i}`} className="absolute top-0 bottom-0 w-px" style={{ left: `${(i + 1) * 10}%`, background: "linear-gradient(180deg, transparent, rgba(209,255,38,0.05) 50%, transparent)" }} />
          ))}
        </div>

        {/* Glowing listener data points */}
        {listeners.map((region, i) => {
          const intensity = region.count / maxCount; // 0..1
          const isActive = hovered === region.id;
          const dotSize = 6 + intensity * 10; // 6px..16px
          const haloSize = dotSize * 2.5;
          return (
            <div
              key={region.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
              onMouseEnter={() => setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Expanding pulse ring */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: `${haloSize}px`,
                  height: `${haloSize}px`,
                  left: `-${haloSize / 2}px`,
                  top: `-${haloSize / 2}px`,
                  border: "0.5px solid rgba(209,255,38,0.3)",
                  animation: `converge ${2 + (i % 3) * 0.5}s ease-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
              {/* Soft glow halo */}
              <div
                className="absolute rounded-full pointer-events-none transition-all duration-300"
                style={{
                  width: `${haloSize}px`,
                  height: `${haloSize}px`,
                  left: `-${haloSize / 2}px`,
                  top: `-${haloSize / 2}px`,
                  background: `radial-gradient(circle, rgba(209,255,38,${0.15 + intensity * 0.2}) 0%, transparent 70%)`,
                }}
              />
              {/* Core dot */}
              <div
                className="relative rounded-full transition-all duration-300"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  background: isActive ? "#fff" : "#D1FF26",
                  boxShadow: `0 0 ${dotSize}px #D1FF26, 0 0 ${dotSize * 2}px rgba(209,255,38,0.4)`,
                }}
              />
            </div>
          );
        })}

        {/* Hover tooltip */}
        <AnimatePresence>
          {activeRegion && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 p-3 pointer-events-none"
              style={{
                left: `${activeRegion.x}%`,
                top: `${activeRegion.y}%`,
                transform: `translate(${activeRegion.x > 70 ? "calc(-100% - 12px)" : "12px"}, ${activeRegion.y > 60 ? "calc(-100% - 12px)" : "12px"})`,
                background: "#10141D",
                border: "0.5px solid rgba(209,255,38,0.3)",
                minWidth: "160px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              <p className="font-heading font-bold text-xs mb-1" style={{ color: "#F5F5F7" }}>{activeRegion.name}</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CALLERS</span>
                <span className="font-heading font-black text-sm" style={{ color: "#D1FF26" }}>{activeRegion.count.toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD labels */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
          <span style={{ color: "rgba(209,255,38,0.5)" }}>◆</span> CALL-IN ORIGIN MAP
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1.5 font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ color: "#D1FF26", background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <span className="w-1 h-1 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 4px #D1FF26" }} />
          {session?.status === "active" ? "LIVE" : "ARCHIVED"}
        </div>
      </div>

      {/* Top regions list */}
      {listeners.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {listeners.slice(0, 6).map((region, i) => (
            <div
              key={region.id}
              className="flex items-center gap-2 p-2 transition-all cursor-pointer"
              style={{
                background: hovered === region.id ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.3)",
                border: `0.5px solid ${hovered === region.id ? "rgba(209,255,38,0.25)" : "rgba(138,143,152,0.08)"}`,
              }}
              onMouseEnter={() => setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: "#D1FF26",
                  boxShadow: "0 0 6px #D1FF26",
                  animation: `dotPulse ${1.5 + (i % 3) * 0.3}s ease-in-out infinite`,
                }}
              />
              <div className="min-w-0">
                <p className="text-xs truncate" style={{ color: "#F5F5F7" }}>{region.name.split(",")[0]}</p>
                <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{region.count.toLocaleString()} callers</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center py-6">
          <Radio size={20} style={{ color: "rgba(209,255,38,0.2)", marginBottom: 8 }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
            {session ? "NO LISTENER DATA FOR THIS SESSION" : "SELECT A SESSION TO VIEW LISTENER ORIGINS"}
          </p>
        </div>
      )}
    </div>
  );
}

// Reusable world map silhouette using dot-matrix continents
function WorldMapSilhouette() {
  const dots = useMemo(() => generateWorldDots(), []);
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      {dots.map((dot, i) => (
        <circle key={i} cx={`${dot.x}%`} cy={`${dot.y}%`} r={0.8} fill="rgba(138,143,152,0.18)" />
      ))}
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
        if (cont.shape(x, y)) dots.push({ x, y });
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