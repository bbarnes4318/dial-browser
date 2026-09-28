import React from "react";
import { MapPin, Clock, Lock, Gauge, Users, Signal, Globe } from "lucide-react";

/**
 * LocationHeader — promotional banner for the Share My Location page.
 * Polished dark HUD hero: refined globe emblem, phone mock with live map,
 * and crisp status panels. Decorative only.
 */
export default function LocationHeader() {
  return (
    <div
      className="relative overflow-hidden mb-8"
      style={{
        background: "linear-gradient(135deg, #14171b 0%, #0c0e11 50%, #16191d 100%)",
        border: "0.5px solid rgba(209,255,38,0.2)",
      }}
    >
      {/* Faint world-map / orbit overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 900 320" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="#D1FF26" strokeWidth="0.5">
            <circle cx="450" cy="160" r="140" />
            <circle cx="450" cy="160" r="100" />
            <circle cx="450" cy="160" r="64" />
            <line x1="310" y1="160" x2="590" y2="160" />
            <line x1="450" y1="20" x2="450" y2="300" />
            <path d="M330 90 Q450 150 570 90" />
            <path d="M330 230 Q450 170 570 230" />
            <path d="M380 40 Q420 160 380 280" />
            <path d="M520 40 Q480 160 520 280" />
          </g>
        </svg>
      </div>

      <div className="relative grid lg:grid-cols-[1.1fr_auto_0.9fr] gap-8 items-center px-6 lg:px-12 py-10">
        {/* Left — headline */}
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 mb-4 px-2.5 py-1" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.35)" }}>
            <Globe size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>DIAL BROWSER</span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-[2.4rem] leading-[1.05] uppercase" style={{ color: "#F5F5F7" }}>
            Location Tracking <span style={{ color: "#D1FF26" }}>Service</span>
          </h2>
          <p className="font-mono text-xs sm:text-sm tracking-[0.35em] mt-4" style={{ color: "#b3e64d" }}>
            INSTANT &middot; SECURE &middot; GLOBAL
          </p>
          <p className="text-[11px] mt-3 max-w-sm mx-auto lg:mx-0" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Share a live track or one-time ping with friends and emergency contacts — recipients accept before anything is revealed.
          </p>
        </div>

        {/* Center — globe emblem + overlapping phone */}
        <div className="relative flex items-center justify-center order-1 lg:order-2 py-2 self-center">
          <div
            className="relative rounded-full flex items-center justify-center"
            style={{
              width: 168,
              height: 168,
              background: "radial-gradient(circle at 32% 28%, #2c3035 0%, #181b1f 55%, #0c0e11 100%)",
              border: "1px solid rgba(138,143,152,0.35)",
              boxShadow: "0 0 30px rgba(209,255,38,0.14), inset 0 0 22px rgba(0,0,0,0.65)",
            }}
          >
            {/* orbit ring */}
            <div className="absolute inset-2 rounded-full" style={{ border: "0.5px dashed rgba(209,255,38,0.25)" }} />
            <Globe size={72} style={{ color: "#9aa0a8" }} strokeWidth={1.1} />
            {/* location pin */}
            <div
              className="absolute flex items-center justify-center"
              style={{ top: -8, right: 10, width: 30, height: 30, background: "#D1FF26", borderRadius: "9999px", boxShadow: "0 0 16px rgba(209,255,38,0.65)" }}
            >
              <MapPin size={16} style={{ color: "#05070A" }} />
            </div>
          </div>

          {/* Overlapping phone */}
          <div className="absolute" style={{ right: -6, bottom: -14, width: 92, height: 160, transform: "rotate(7deg)" }}>
            <div
              className="w-full h-full rounded-[16px] overflow-hidden"
              style={{ background: "#0a0c0f", border: "1.5px solid #3a3d42", boxShadow: "0 10px 26px rgba(0,0,0,0.65)" }}
            >
              <div className="flex justify-center pt-1.5">
                <div style={{ width: 28, height: 3, borderRadius: 2, background: "#2a2d31" }} />
              </div>
              {/* mini map */}
              <div className="relative mx-1.5 mt-1" style={{ height: 98, background: "#0d1115", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <svg width="100%" height="100%" viewBox="0 0 84 98" preserveAspectRatio="xMidYMid slice">
                  <g fill="none" stroke="rgba(209,255,38,0.2)" strokeWidth="0.6">
                    <path d="M0 32 L84 32 M0 65 L84 65 M22 0 L22 98 M54 0 L54 98" />
                    <path d="M10 10 Q34 44 74 20" />
                    <path d="M8 80 Q40 60 78 86" />
                  </g>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div style={{ filter: "drop-shadow(0 0 6px rgba(209,255,38,0.7))" }}>
                    <MapPin size={20} style={{ color: "#D1FF26" }} />
                  </div>
                </div>
              </div>
              {/* track now */}
              <div className="mx-1.5 mt-1.5">
                <div
                  className="text-center py-1.5 font-mono text-[7.5px] tracking-[0.2em] uppercase font-bold"
                  style={{ background: "#D1FF26", color: "#05070A", borderRadius: 4 }}
                >
                  Track Now
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — status panels */}
        <div className="order-3 space-y-3 max-w-[300px] mx-auto lg:ml-auto lg:mr-0 w-full">
          <Panel icon={Clock} title="Active Session">
            <div className="flex gap-1 mt-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: "12.5%", height: 7, background: "#D1FF26", opacity: 0.3 + (i / 8) * 0.7, borderRadius: 1 }}
                />
              ))}
            </div>
          </Panel>
          <Panel icon={MapPin} title="Location Status">
            <div className="flex items-center gap-2.5 mt-2.5">
              <Chip icon={Lock} />
              <Chip icon={Gauge} />
              <Chip icon={Users} />
            </div>
          </Panel>
          <Panel icon={Signal} title="Device Data" compact />
        </div>
      </div>

      {/* Branding bottom-right */}
      <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 pointer-events-none">
        <div className="relative">
          <Globe size={13} style={{ color: "#D1FF26" }} />
          <MapPin size={7} style={{ color: "#D1FF26", position: "absolute", top: -2, right: -2 }} />
        </div>
        <span className="font-heading font-bold text-[11px] tracking-wide" style={{ color: "#8A8F98" }}>Dial Browser</span>
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, children, compact }) {
  return (
    <div
      className="px-3.5 py-2.5"
      style={{
        background: "linear-gradient(180deg, #1d2024 0%, #131519 100%)",
        border: "0.5px solid rgba(138,143,152,0.28)",
        borderRadius: 6,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={11} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color: "#8A8F98" }}>{title.toUpperCase()}</span>
      </div>
      {!compact && children}
    </div>
  );
}

function Chip({ icon: Icon }) {
  return (
    <div
      className="w-7 h-7 flex items-center justify-center"
      style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.35)", borderRadius: 9999 }}
    >
      <Icon size={12} style={{ color: "#D1FF26" }} />
    </div>
  );
}