import React, { useState, useRef } from "react";
import { Play, Pause, FileText } from "lucide-react";
import { proxyMediaUrl } from "@/lib/mediaProxy";

/**
 * Pulsing neon frequency-bar voice player.
 * Bars pulse with a cyan→magenta gradient glow while playing.
 */
export default function SocialVoicePlayer({ url, transcript, compact = false }) {
  const [playing, setPlaying] = useState(false);
  const [showT, setShowT] = useState(false);
  const audioRef = useRef(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => {}); setPlaying(true); }
  };

  const bars = Array.from({ length: compact ? 18 : 32 }, (_, i) => i);

  return (
    <div className="w-full">
      <div
        className="relative flex items-center gap-3 p-3 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(0,255,255,0.05), rgba(204,0,255,0.05))",
          border: "0.5px solid rgba(0,255,255,0.3)",
          boxShadow: playing ? "0 0 24px rgba(0,255,255,0.15), inset 0 0 20px rgba(204,0,255,0.06)" : "none",
          borderRadius: "2px",
        }}
      >
        <audio ref={audioRef} src={proxyMediaUrl(url)} onEnded={() => setPlaying(false)} preload="none" />

        {/* Play / pause button */}
        <button
          onClick={toggle}
          className="flex items-center justify-center w-9 h-9 flex-shrink-0 transition-all hover:shadow-[0_0_14px_rgba(0,255,255,0.5)]"
          style={{
            background: "linear-gradient(135deg, rgba(0,255,255,0.15), rgba(204,0,255,0.15))",
            border: "0.5px solid rgba(0,255,255,0.5)",
            color: "#00FFFF",
            boxShadow: playing ? "0 0 16px rgba(0,255,255,0.4)" : "none",
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>

        {/* Pulsing neon frequency bars */}
        <div className="flex items-end gap-[2px] flex-1 h-7">
          {bars.map((i) => {
            const center = bars.length / 2;
            const dist = Math.abs(i - center) / center;
            const baseH = 25 + (1 - dist) * 65;
            const h = playing ? baseH + Math.abs(Math.sin(i * 0.9)) * 35 : baseH * 0.45;
            return (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: `${Math.min(100, h)}%`,
                  background: playing
                    ? `linear-gradient(180deg, #00FFFF 0%, #42E1F6 40%, #CC00FF 100%)`
                    : "linear-gradient(180deg, rgba(0,255,255,0.35), rgba(204,0,255,0.25))",
                  boxShadow: playing ? `0 0 6px rgba(0,255,255,${0.3 + (1 - dist) * 0.4})` : "none",
                  animation: playing
                    ? `waveFloat ${0.6 + (i % 5) * 0.18}s ease-in-out infinite`
                    : "none",
                  animationDelay: `${i * 0.03}s`,
                  transition: "height 0.2s ease",
                }}
              />
            );
          })}
        </div>

        {transcript && (
          <button
            onClick={() => setShowT(!showT)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all hover:opacity-80 flex-shrink-0"
            style={{
              color: showT ? "#CC00FF" : "#8A8F98",
              border: showT ? "0.5px solid rgba(204,0,255,0.4)" : "0.5px solid rgba(138,143,152,0.2)",
              boxShadow: showT ? "0 0 10px rgba(204,0,255,0.15)" : "none",
            }}
          >
            <FileText size={11} /> TXT
          </button>
        )}
      </div>

      {/* Transcript */}
      {showT && transcript && (
        <p
          className="mt-2 px-3 py-2 text-xs leading-relaxed"
          style={{
            background: "linear-gradient(135deg, rgba(0,255,255,0.04), rgba(204,0,255,0.04))",
            border: "0.5px solid rgba(0,255,255,0.15)",
            color: "#8A8F98",
            borderRadius: "2px",
          }}
        >
          {transcript}
        </p>
      )}
    </div>
  );
}