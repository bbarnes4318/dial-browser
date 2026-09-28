import React, { useState, useEffect, useRef } from "react";

export default function SignalStrengthIndicator() {
  const [strength, setStrength] = useState(82);
  const [active, setActive] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Map mouse X position to signal strength (40-100%)
        const xPercent = e.clientX / window.innerWidth;
        // Add some Y-based variance for organic feel
        const yPercent = e.clientY / window.innerHeight;
        const base = 45 + xPercent * 50;
        const variance = Math.sin(Date.now() / 800) * 5;
        const value = Math.max(35, Math.min(100, base + variance + (1 - yPercent) * 8));
        setStrength(Math.round(value));
        setActive(true);
      });
    };

    // Idle drift when mouse isn't moving — 1s cadence is smooth enough for a subtle drift
    const idleInterval = setInterval(() => {
      setStrength((prev) => {
        const drift = Math.sin(Date.now() / 1200) * 4;
        return Math.max(35, Math.min(100, Math.round(prev + drift * 0.3)));
      });
    }, 1000);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(idleInterval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Determine active bars based on strength
  const barCount = 5;
  const activeBars = Math.ceil((strength / 100) * barCount);

  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div
      className="fixed top-16 left-0 right-0 z-40 pointer-events-none"
      style={{
        background: active
          ? `linear-gradient(180deg, rgba(209,255,38,${0.04 + (strength / 100) * 0.06}) 0%, transparent 100%)`
          : 'transparent',
        transition: 'background 0.4s ease-out',
      }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Status label */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: '#D1FF26',
              boxShadow: '0 0 8px #D1FF26, 0 0 16px rgba(209,255,38,0.6)',
              animation: 'dotPulse 1.5s ease-in-out infinite',
            }}
          />
          <span className="font-mono text-[10px] tracking-[0.3em] hidden sm:inline" style={{ color: '#8A8F98' }}>
            SIGNAL ACTIVE
          </span>
        </div>

        {/* Center: Signal strength bars */}
        <div className="flex items-end gap-1">
          {bars.map((i) => {
            const isActive = i < activeBars;
            const height = 4 + i * 3;
            return (
              <div
                key={i}
                className="w-1.5 rounded-sm transition-all duration-300"
                style={{
                  height: `${height}px`,
                  background: isActive ? '#D1FF26' : 'rgba(138,143,152,0.15)',
                  boxShadow: isActive ? `0 0 ${4 + i}px #D1FF26` : 'none',
                  opacity: isActive ? 1 : 0.3,
                  animation: isActive ? `signalFlicker ${1.5 + i * 0.2}s ease-in-out infinite` : 'none',
                  animationDelay: isActive ? `${i * 0.1}s` : undefined,
                }}
              />
            );
          })}
        </div>

        {/* Right: Numeric readout */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
            STR
          </span>
          <span
            className="font-mono text-xs font-bold tabular-nums transition-colors duration-300"
            style={{ color: strength > 75 ? '#D1FF26' : strength > 50 ? '#F5F5F7' : '#8A8F98' }}
          >
            {String(strength).padStart(3, '0')}%
          </span>
        </div>
      </div>

      {/* Bottom border line — glows with signal strength */}
      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(209,255,38,${0.1 + (strength / 100) * 0.3}) 50%, transparent)`,
          transition: 'background 0.4s ease-out',
        }}
      />
    </div>
  );
}