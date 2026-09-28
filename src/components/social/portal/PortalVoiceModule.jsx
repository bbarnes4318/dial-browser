import React, { useState, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { PORTAL } from "./portalTheme";

/**
 * "TAP TO SPEAK" voice module — large mic button with a neon waveform.
 * Uses the browser SpeechRecognition API; on result calls onCommand(text).
 */
export default function PortalVoiceModule({ onCommand }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      onCommand?.("__unsupported__");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onCommand?.(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const bars = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="mt-auto" style={{ background: "rgba(0,240,255,0.04)", border: "0.5px solid rgba(0,240,255,0.22)", borderRadius: 10 }}>
      <p className="font-mono text-[8px] tracking-[0.3em] px-3 pt-2.5" style={{ color: PORTAL.cyan }}>// TAP TO SPEAK</p>
      <div className="flex flex-col items-center px-3 pb-3">
        <button
          onClick={toggle}
          className="relative flex items-center justify-center transition-transform active:scale-95"
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: listening ? "rgba(255,0,85,0.16)" : "rgba(0,240,255,0.10)",
            border: `1.5px solid ${listening ? PORTAL.pink : PORTAL.cyan}`,
            boxShadow: `0 0 24px ${listening ? "rgba(255,0,85,0.4)" : "rgba(0,240,255,0.35)"}`,
          }}
        >
          {listening ? <MicOff size={24} style={{ color: PORTAL.pink }} /> : <Mic size={24} style={{ color: PORTAL.cyan }} />}
        </button>
        <p className="font-mono text-[8px] tracking-widest mt-2 uppercase" style={{ color: PORTAL.muted }}>
          {listening ? "Listening…" : "Try: “Open Google”"}
        </p>
        {/* Waveform */}
        <div className="flex items-center gap-[2px] h-5 mt-2">
          {bars.map((i) => (
            <div
              key={i}
              className="w-[2px] rounded-full"
              style={{
                background: `linear-gradient(180deg, ${PORTAL.cyan}, ${PORTAL.magenta})`,
                height: listening ? `${20 + Math.abs(Math.sin(i)) * 80}%` : "20%",
                animation: listening ? `eqBar ${0.5 + (i % 4) * 0.2}s ease-in-out infinite` : "none",
                animationDelay: `${i * 0.04}s`,
                opacity: listening ? 1 : 0.35,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}