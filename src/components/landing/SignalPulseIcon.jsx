import React from "react";

// Custom pulse icon that reflects live signal health using the phosphor lime aesthetic.
// level: 'Optimal' | 'Active' | 'Degraded' | 'Limited'
const signalConfig = {
  Optimal: { color: "#D1FF26", pulseDuration: 1.6, ringOpacity: 0.45, label: "OPTIMAL" },
  Active: { color: "#8A8F98", pulseDuration: 2.4, ringOpacity: 0.3, label: "ACTIVE" },
  Degraded: { color: "#f59e0b", pulseDuration: 1.2, ringOpacity: 0.4, label: "DEGRADED" },
  Limited: { color: "#ef4444", pulseDuration: 0.9, ringOpacity: 0.5, label: "LIMITED" },
};

export default function SignalPulseIcon({ level = "Active", size = 16 }) {
  const cfg = signalConfig[level] || signalConfig.Active;
  const { color, pulseDuration, ringOpacity } = cfg;
  const wrapper = size;

  return (
    <div className="relative flex items-center justify-center" style={{ width: wrapper, height: wrapper }}>
      {/* Outer expanding pulse ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: wrapper,
          height: wrapper,
          border: `1px solid ${color}`,
          opacity: ringOpacity,
          animation: `converge ${pulseDuration}s ease-out infinite`,
        }}
      />
      {/* Staggered second ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: wrapper * 0.7,
          height: wrapper * 0.7,
          border: `0.5px solid ${color}`,
          opacity: ringOpacity * 0.7,
          animation: `converge ${pulseDuration * 1.4}s ease-out infinite`,
          animationDelay: `${pulseDuration * 0.4}s`,
        }}
      />
      {/* Soft glow halo */}
      <div
        className="absolute rounded-full"
        style={{
          width: wrapper * 0.9,
          height: wrapper * 0.9,
          background: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
        }}
      />
      {/* Core dot */}
      <div
        className="relative rounded-full"
        style={{
          width: wrapper * 0.32,
          height: wrapper * 0.32,
          background: color,
          boxShadow: `0 0 6px ${color}, 0 0 12px ${color}80`,
        }}
      />
    </div>
  );
}

export { signalConfig };