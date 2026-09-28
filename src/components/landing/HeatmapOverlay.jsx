import React, { useMemo } from "react";
import { motion } from "framer-motion";

// Outage report volume data — same coordinates as ActiveMap nodes
// severity: 1-5 scale (5 = critical), reports = number of submitted outage reports
const outageZones = [
  { id: "jakarta", x: 76, y: 62, city: "Jakarta", reports: 47, severity: 5 },
  { id: "nairobi", x: 56, y: 62, city: "Nairobi", reports: 38, severity: 4 },
  { id: "cairo", x: 54, y: 44, city: "Cairo", reports: 31, severity: 4 },
  { id: "lagos", x: 49, y: 58, city: "Lagos", reports: 24, severity: 3 },
  { id: "saopaulo", x: 34, y: 70, city: "São Paulo", reports: 18, severity: 3 },
  { id: "sydney", x: 88, y: 75, city: "Sydney", reports: 12, severity: 2 },
  { id: "mexico", x: 20, y: 48, city: "Mexico City", reports: 9, severity: 2 },
];

const severityColors = {
  5: { core: "rgba(239,68,68,0.55)", mid: "rgba(239,68,68,0.25)", edge: "rgba(239,68,68,0)" },
  4: { core: "rgba(249,115,22,0.5)", mid: "rgba(249,115,22,0.22)", edge: "rgba(249,115,22,0)" },
  3: { core: "rgba(245,158,11,0.45)", mid: "rgba(245,158,11,0.18)", edge: "rgba(245,158,11,0)" },
  2: { core: "rgba(234,179,8,0.35)", mid: "rgba(234,179,8,0.14)", edge: "rgba(234,179,8,0)" },
};

export default function HeatmapOverlay({ active }) {
  const zones = useMemo(() => outageZones, []);

  if (!active) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      <defs>
        {Object.entries(severityColors).map(([level, colors]) => (
          <radialGradient key={level} id={`heat-${level}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.core} />
            <stop offset="50%" stopColor={colors.mid} />
            <stop offset="100%" stopColor={colors.edge} />
          </radialGradient>
        ))}
      </defs>

      {zones.map((zone, i) => {
        const radius = 4 + zone.severity * 1.8;
        const colors = severityColors[zone.severity];
        return (
          <g key={zone.id}>
            {/* Outer glow */}
            <motion.circle
              cx={`${zone.x}%`}
              cy={`${zone.y}%`}
              r={radius * 1.5}
              fill={`url(#heat-${zone.severity})`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{ transformOrigin: `${zone.x}% ${zone.y}%` }}
            />
            {/* Core pulse */}
            <motion.circle
              cx={`${zone.x}%`}
              cy={`${zone.y}%`}
              r={radius * 0.5}
              fill={colors.core}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export { outageZones };