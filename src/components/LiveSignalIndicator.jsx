import React from "react";

/**
 * Fixed, always-visible "LIVE SIGNAL" status indicator rendered once
 * in the global app shell so it appears on every page. Purely decorative.
 */
export default function LiveSignalIndicator() {
  return (
    <div
      aria-hidden="true"
      className="fixed z-[90] pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1.5 font-mono"
      style={{
        right: 14,
        top: 14,
        background: "rgba(5,7,10,0.72)",
        border: "0.5px solid rgba(209,255,38,0.35)",
        boxShadow: "0 0 18px rgba(209,255,38,0.12)",
        backdropFilter: "blur(4px)",
      }}
    >
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: 10, height: 10 }}
      >
        {/* Expanding ring */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: "rgba(209,255,38,0.35)",
            animation: "emergencyPulse 1.6s ease-out infinite",
          }}
        />
        {/* Solid core */}
        <span
          className="relative rounded-full"
          style={{
            width: 7,
            height: 7,
            background: "#D1FF26",
            boxShadow: "0 0 8px rgba(209,255,38,0.9)",
            animation: "signalFlicker 1.6s ease-in-out infinite",
          }}
        />
      </span>
      <span
        className="tracking-[0.25em] uppercase"
        style={{ color: "#D1FF26", fontSize: 8.5 }}
      >
        Live&nbsp;Signal
      </span>
    </div>
  );
}