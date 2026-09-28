import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Check, Volume2, RefreshCw, Radio } from "lucide-react";

export default function VoiceGreetingRecorder() {
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [greeting, setGreeting] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      setRecordTime((prev) => Math.min(prev + 1, 30));
    }, 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setPlayProgress((p) => {
        if (p >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(t);
  }, [isPlaying]);

  const startRecording = () => {
    setRecording(true);
    setRecordTime(0);
  };

  const stopRecording = () => {
    setRecording(false);
    setGreeting({ duration: Math.max(recordTime, 1) });
  };

  const reRecord = () => {
    setGreeting(null);
    setRecordTime(0);
    setPlayProgress(0);
    setIsPlaying(false);
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const greetingDuration = greeting ? greeting.duration : 0;
  const playDuration = 15;

  return (
    <div className="mt-4 p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// YOUR PERSONAL VOICE GREETING</p>
        </div>
        <span className="font-mono text-[9px] tracking-widest" style={{ color: greeting ? "#D1FF26" : "#8A8F98" }}>
          {greeting ? "● GREETING ACTIVE" : "○ NO GREETING SET"}
        </span>
      </div>

      <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Record a personal voice greeting that plays automatically when someone matches with your profile. This is the first thing your match will hear.
      </p>

      <AnimatePresence mode="wait">
        {!greeting ? (
          <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`w-full flex items-center justify-center gap-3 py-5 font-mono text-[11px] tracking-widest uppercase transition-all ${recording ? "animate-pulse" : ""}`}
              style={{
                background: recording ? "rgba(209,255,38,0.25)" : "#D1FF26",
                color: "#05070A",
                boxShadow: recording ? "0 0 24px rgba(209,255,38,0.4)" : "none",
              }}
            >
              {recording ? (
                <>
                  <span className="w-3 h-3 rounded-full" style={{ background: "#05070A" }} />
                  Stop Recording · {fmtTime(recordTime)}
                </>
              ) : (
                <>
                  <Mic size={16} /> Record Your Greeting
                </>
              )}
            </button>
            {recording && (
              <div className="flex items-center justify-center gap-1 mt-4 h-10">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full"
                    style={{
                      background: "#D1FF26",
                      animation: `eqBar ${0.3 + (i % 5) * 0.08}s ease-in-out infinite`,
                      animationDelay: `${i * 0.03}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="playback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-4 mb-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Volume2 size={14} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>GREETING PREVIEW</span>
              </div>
              <div className="h-1 w-full mb-2 overflow-hidden" style={{ background: "rgba(138,143,152,0.2)" }}>
                <div className="h-full" style={{ width: `${playProgress}%`, background: "#D1FF26", transition: "width 0.1s linear" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                  {fmtTime(Math.floor((playProgress / 100) * playDuration))} / {fmtTime(playDuration)}
                </span>
                <button
                  onClick={() => {
                    if (playProgress >= 100) setPlayProgress(0);
                    setIsPlaying(!isPlaying);
                  }}
                  className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  {isPlaying ? <><Check size={12} /> Playing</> : <><Volume2 size={12} /> Play</>}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <Check size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>Greeting saved · {fmtTime(greetingDuration)} recorded</span>
              </div>
              <button
                onClick={reRecord}
                className="flex items-center gap-2 px-5 py-3 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
              >
                <RefreshCw size={12} /> Re-record
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}