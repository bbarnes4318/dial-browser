import React, { useState, useEffect } from "react";

// Geographically accurate compass widget for the top of the landing page.
// - Cardinal ring (N/E/S/W + intercardinal) rotates to true north using the
//   device compass (webkitCompassHeading on iOS, alpha elsewhere). On devices
//   without a magnetometer (most desktops), the rose rests with N pointing up.
// - Fixed pointer at top shows the direction the user is facing.
// - Auto-hides once the user scrolls past the hero so it never overlaps
//   content further down the page.
// - Desktop only (hidden on mobile where corner space is taken by MobileNav).

const clamp = (a, b) => (a % 360 + 360) % 360;

function facingLabel(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export default function CompassWidget() {
  const [heading, setHeading] = useState(0);
  const [hasHeading, setHasHeading] = useState(false);
  const [visible, setVisible] = useState(true);

  // Fade out past the hero so it never overlaps lower content
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 460);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Device compass -> true north heading
  useEffect(() => {
    if (typeof window === "undefined" || !window.DeviceOrientationEvent) return;

    const handler = (e) => {
      let h = null;
      if (typeof e.webkitCompassHeading === "number") {
        h = e.webkitCompassHeading; // iOS: degrees clockwise from true north
      } else if (typeof e.alpha === "number") {
        h = 360 - e.alpha; // Android approximate compass heading
      }
      if (h !== null && !Number.isNaN(h)) {
        setHasHeading(true);
        setHeading(clamp(h));
      }
    };

    // iOS 13+ requires an explicit permission request from a user gesture;
    // we still attach the listener for non-iOS / already-permitted devices.
    try {
      if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
        // Defer permission prompt to a tap (see enable button below)
        window.addEventListener("deviceorientation", handler, true);
      } else {
        window.addEventListener("deviceorientationabsolute", handler, true);
        window.addEventListener("deviceorientation", handler, true);
      }
    } catch { /* no-op */ }

    return () => {
      window.removeEventListener("deviceorientation", handler, true);
      window.removeEventListener("deviceorientationabsolute", handler, true);
    };
  }, []);

  const requestPermission = async () => {
    try {
      const perm = await window.DeviceOrientationEvent.requestPermission();
      if (perm !== "granted") setHasHeading(false);
    } catch { /* ignore */ }
  };

  const SIZE = 84;
  const C = SIZE / 2;
  const r = C - 6;

  // Tick marks every 30°, majors at cardinals
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const deg = i * 15;
    const isMajor = deg % 90 === 0;
    const isCardinal = deg % 45 === 0;
    const rad = (deg - 90) * (Math.PI / 180);
    const inner = r - (isMajor ? 8 : isCardinal ? 5 : 3);
    const outer = r;
    return {
      x1: C + inner * Math.cos(rad),
      y1: C + inner * Math.sin(rad),
      x2: C + outer * Math.cos(rad),
      y2: C + outer * Math.sin(rad),
      isMajor,
    };
  });

  const label = facingLabel(heading);

  return (
    <div
      className="hidden lg:block fixed z-[45] transition-opacity duration-500 select-none"
      style={{
        top: 118,
        left: 18,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-label={`Compass: facing ${label}, ${Math.round(heading)}°`}
    >
      {/* Signal-line accent above */}
      <div className="h-px w-full mb-1.5 overflow-hidden opacity-60">
        <div
          className="h-full w-1/3"
          style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }}
        />
      </div>

      <div
        className="relative flex items-center gap-2 px-2 py-2"
        style={{
          background: "rgba(10,13,20,0.78)",
          border: "0.5px solid rgba(209,255,38,0.3)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 0 30px rgba(0,0,0,0.5)",
        }}
      >
        {/* Compass face */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          onClick={requestPermission}
          style={{ cursor: hasHeading ? "default" : "pointer" }}
          role="img"
        >
          {/* Outer ring */}
          <circle cx={C} cy={C} r={r} fill="rgba(5,7,10,0.6)" stroke="rgba(209,255,38,0.25)" strokeWidth="0.75" />

          {/* Ticks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.isMajor ? "#D1FF26" : "rgba(138,143,152,0.5)"}
              strokeWidth={t.isMajor ? 1.1 : 0.6}
            />
          ))}

          {/* Rotating rose: N points to true north */}
          <g transform={`rotate(${-heading} ${C} ${C})`}>
            {/* Intercardinal labels */}
            <text x={C} y={12} textAnchor="middle" fontSize="9" fontWeight="700" fill="#D1FF26" fontFamily="ui-monospace, monospace">N</text>
            <text x={C + r - 3} y={C + 3} textAnchor="middle" fontSize="7" fill="#8A8F98" fontFamily="ui-monospace, monospace">E</text>
            <text x={C} y={C + r + 1} textAnchor="middle" fontSize="7" fill="#8A8F98" fontFamily="ui-monospace, monospace">S</text>
            <text x={C - r + 3} y={C + 3} textAnchor="middle" fontSize="7" fill="#8A8F98" fontFamily="ui-monospace, monospace">W</text>

            {/* Needle: north half lime, south half muted */}
            <polygon points={`${C},${C - r + 10} ${C - 3.5},${C} ${C + 3.5},${C}`} fill="#D1FF26" />
            <polygon points={`${C},${C + r - 10} ${C - 3.5},${C} ${C + 3.5},${C}`} fill="rgba(138,143,152,0.55)" />
            <circle cx={C} cy={C} r="2" fill="#05070A" stroke="#D1FF26" strokeWidth="0.75" />
          </g>

          {/* Fixed facing pointer at top */}
          <polygon points={`${C},3 ${C - 4},9 ${C + 4},9`} fill="#D1FF26" />
        </svg>

        {/* Readout */}
        <div className="flex flex-col gap-0.5 pr-1">
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>// TRUE NORTH</span>
          <span className="font-mono text-[16px] font-bold leading-none" style={{ color: "#F5F5F7" }}>
            {Math.round(heading)}<span style={{ color: "#8A8F98", fontSize: 10 }}>°</span>
          </span>
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
            {hasHeading ? `FACING ${label}` : "N UP"}
          </span>
        </div>
      </div>
    </div>
  );
}