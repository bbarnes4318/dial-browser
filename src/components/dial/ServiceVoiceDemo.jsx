import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, Play, Square, RotateCcw } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

/**
 * Dedicated voice-demo audio player for a Dial service detail page.
 * Reads a short, service-specific script aloud using the platform's
 * human-sounding neural voice (via the shared voiceSynthesis utility),
 * so members can hear exactly how Dial Browser handles that request.
 */
export default function ServiceVoiceDemo({ service }) {
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);

  const script = service
    ? `Welcome to 1 Call Away. Here's how ${service.name} works. ${service.example}. ${service.desc} It's that simple — no app, no typing, just your voice.`
    : "";

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handlePlay = async () => {
    if (playing) return;
    setDone(false);
    setPlaying(true);
    await speak(script, {
      onEnd: () => { setPlaying(false); setDone(true); },
      onError: () => { setPlaying(false); },
    });
  };

  const handleStop = () => {
    stopSpeaking();
    setPlaying(false);
  };

  const handleReplay = () => {
    handleStop();
    setTimeout(handlePlay, 80);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.13 }}
      className="mb-10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Volume2 size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE DEMO — HEAR HOW IT WORKS</p>
      </div>

      <div
        className="relative p-5 overflow-hidden"
        style={{
          background: "rgba(16,20,29,0.6)",
          border: "0.5px solid rgba(209,255,38,0.25)",
          boxShadow: playing ? "0 0 30px rgba(209,255,38,0.12)" : "none",
        }}
      >
        {/* Signal line accent */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
        </div>

        <div className="flex items-center gap-4">
          {/* Play / stop control */}
          <button
            onClick={playing ? handleStop : handlePlay}
            className="flex items-center justify-center w-14 h-14 flex-shrink-0 transition-all"
            style={{
              background: playing ? "rgba(209,255,38,0.12)" : "#D1FF26",
              border: "0.5px solid #D1FF26",
              boxShadow: playing ? "0 0 24px rgba(209,255,38,0.4)" : "none",
            }}
            aria-label={playing ? "Stop demo" : "Play voice demo"}
          >
            {playing ? <Square size={20} style={{ color: "#D1FF26" }} /> : <Play size={20} style={{ color: "#05070A" }} />}
          </button>

          {/* Transcript / status */}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: playing ? "#D1FF26" : "#8A8F98" }}>
              {playing ? "● PLAYING — REAL HUMAN VOICE" : done ? "DEMO COMPLETE" : "TAP PLAY TO PREVIEW"}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#F5F5F7" }}>{script}</p>
          </div>

          {/* Equalizer — animates only while playing */}
          <div className="hidden sm:flex items-end gap-1 h-10 flex-shrink-0" style={{ visibility: playing ? "visible" : "hidden" }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="w-1"
                style={{ background: "#D1FF26", height: "30%", animation: `eqBar 0.8s ease-in-out ${i * 0.12}s infinite` }}
              />
            ))}
          </div>
        </div>

        {/* Replay */}
        {done && (
          <button
            onClick={handleReplay}
            className="mt-3 flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase"
            style={{ color: "#D1FF26" }}
          >
            <RotateCcw size={11} /> Replay Demo
          </button>
        )}
      </div>
    </motion.div>
  );
}