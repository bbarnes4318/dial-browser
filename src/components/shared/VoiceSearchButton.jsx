import React, { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";

/**
 * VoiceSearchButton — a microphone toggle that uses the browser's Web Speech
 * API to capture a spoken search phrase and feed it back via onResult.
 *
 * Purely client-side (no credits). Hides itself on browsers without
 * SpeechRecognition support so the search bar degrades gracefully to typing.
 *
 * @param {(transcript: string) => void} onResult
 */
export default function VoiceSearchButton({
  onResult,
  color = "#D1FF26",
  size = 16,
  className = "absolute right-2 top-1/2 -translate-y-1/2",
  title = "Search by voice",
}) {
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setUnsupported(true); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const t = e.results?.[0]?.[0]?.transcript || "";
      const clean = t.trim();
      if (clean && onResultRef.current) onResultRef.current(clean);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch {} recRef.current = null; };
  }, []);

  const toggle = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      try { rec.stop(); } catch {}
      setListening(false);
    } else {
      try { rec.start(); setListening(true); } catch {}
    }
  };

  if (unsupported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Listening… tap to stop" : title}
      aria-label={listening ? "Listening" : title}
      className={`${className} flex items-center justify-center w-9 h-9 transition-all hover:scale-105`}
      style={{
        background: listening ? color : "rgba(209,255,38,0.08)",
        border: `0.5px solid ${listening ? color : "rgba(209,255,38,0.3)"}`,
        color: listening ? "#05070A" : color,
        borderRadius: "50%",
        boxShadow: listening ? `0 0 16px ${color}66` : "none",
      }}
    >
      <Mic
        size={size}
        style={{ animation: listening ? "eqBar 0.9s ease-in-out infinite" : "none" }}
      />
    </button>
  );
}