import React from "react";
import { Loader2, Volume2, VolumeX, Pause } from "lucide-react";

// Central analog tuning knob — the focal "now playing" control of the
// Dial Sports infotainment panel. A brushed-metal radial face sits inside a
// knurled ring with radial ticks; a neon-lime pointer rotates toward the
// active station. Idle reads "DIAL SPORTS"; playing shows the station name +
// LIVE, with the existing mute + stop controls surfaced onto the dial face.
export default function TuningKnob({ current, loading, muted, onToggleMute, onStop, tuneAngle, accent = "#D4FF00" }) {
  const active = !!current;
  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative" style={{ width: 176, height: 176 }}>
        {/* outer knurled ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "repeating-conic-gradient(#5e5e5e 0deg 3deg, #2a2a2a 3deg 6deg)",
            boxShadow: "0 8px 22px rgba(0,0,0,0.75), inset 0 0 0 2px rgba(255,255,255,0.05)",
          }}
        />
        {/* brushed metal face */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            inset: 14,
            background: "radial-gradient(circle at 38% 30%, #d2d2d2 0%, #909090 42%, #4e4e4e 80%, #2a2a2a 100%)",
            boxShadow: "inset 0 2px 6px rgba(255,255,255,0.55), inset 0 -5px 12px rgba(0,0,0,0.65)",
          }}
        >
          {/* radial ticks */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }}>
            {Array.from({ length: 36 }).map((_, i) => {
              const a = (i * 10) * Math.PI / 180;
              const r1 = 44;
              const r2 = i % 3 === 0 ? 37 : 41;
              return (
                <line
                  key={i}
                  x1={50 + r1 * Math.cos(a)}
                  y1={50 + r1 * Math.sin(a)}
                  x2={50 + r2 * Math.cos(a)}
                  y2={50 + r2 * Math.sin(a)}
                  stroke="#1c1c1c"
                  strokeWidth={i % 3 === 0 ? 0.9 : 0.4}
                />
              );
            })}
          </svg>

          {/* lime pointer — rotates around the dial center */}
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: 0,
              height: 0,
              transform: `rotate(${tuneAngle}deg)`,
              transformOrigin: "0 0",
              transition: "transform 0.6s cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -1.5,
                top: -54,
                width: 3,
                height: 48,
                borderRadius: 3,
                background: accent,
                boxShadow: `0 0 10px ${accent}, 0 0 18px ${accent}80`,
              }}
            />
          </div>

          {/* center cap */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
            {active ? (
              <>
                <span className="font-mono text-[8px] tracking-[0.3em]" style={{ color: "#FF3838" }}>● LIVE</span>
                <span className="font-heading font-bold text-[11px] leading-tight mt-0.5 max-w-[120px] truncate" style={{ color: "#F5F5F7" }}>
                  {current.station.name}
                </span>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={onToggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: "radial-gradient(circle at 35% 30%, #d8d8d8, #6a6a6a 70%, #2a2a2a)",
                      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.6)",
                    }}
                  >
                    {muted ? <VolumeX size={12} style={{ color: "#1a1a1a" }} /> : <Volume2 size={12} style={{ color: "#1a1a1a" }} />}
                  </button>
                  <button
                    onClick={onStop}
                    aria-label="Stop"
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: "radial-gradient(circle at 35% 30%, #ff7070, #b21a1a 70%, #5a0a0a)",
                      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.6)",
                    }}
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" style={{ color: "#fff" }} /> : <Pause size={12} style={{ color: "#fff" }} />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="font-heading font-black text-[15px] tracking-tight leading-none" style={{ color: accent }}>DIAL</span>
                <span className="font-heading font-black text-[15px] tracking-tight leading-none mt-0.5" style={{ color: "#F5F5F7" }}>SPORTS</span>
                <span className="font-mono text-[7px] tracking-[0.25em] mt-2" style={{ color: "#8c8c8c" }}>SELECT A STATION</span>
              </>
            )}
          </div>
        </div>
      </div>
      <span className="font-mono text-[7px] tracking-[0.3em] mt-2.5" style={{ color: "#8c8c8c" }}>
        TUNING DIAL · {active ? "LOCKED" : "READY"}
      </span>
    </div>
  );
}