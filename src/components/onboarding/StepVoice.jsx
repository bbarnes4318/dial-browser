import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ArrowLeft, ArrowRight, Check, Volume2 } from "lucide-react";

const STATES = { idle: "idle", recording: "recording", verifying: "verifying", verified: "verified" };
const RECORD_DURATION = 3;

export default function StepVoice({ profile, setProfile, onNext, onBack }) {
  const [recState, setRecState] = useState(STATES.idle);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const phrase = `I am ${profile.full_name || "___"}, and I authorize 1 CALL AWAY to connect my services.`;

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startRecording = () => {
    setRecState(STATES.recording);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((t) => {
        if (t + 1 >= RECORD_DURATION) {
          clearInterval(timerRef.current);
          setRecState(STATES.verifying);
          setTimeout(() => {
            setRecState(STATES.verified);
            setProfile({ ...profile, voice_verified: true });
          }, 1200);
          return RECORD_DURATION;
        }
        return t + 1;
      });
    }, 1000);
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setRecState(STATES.idle);
    setElapsed(0);
    setProfile({ ...profile, voice_verified: false });
  };

  const bars = Array.from({ length: 24 }, (_, i) => i);
  const isActive = recState === STATES.recording || recState === STATES.verifying;

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.3em] mb-2" style={{ color: "#D1FF26" }}>// STEP 2 — VOICE VERIFICATION</p>
      <h2 className="font-heading font-black text-2xl sm:text-3xl mb-4" style={{ color: "#F5F5F7" }}>Verify Your Voice</h2>
      <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Your voice is your password on the 1 CALL AWAY network. Read the phrase below clearly.
      </p>

      <div className="p-4 mb-6" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Volume2 size={12} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>READ THIS PHRASE</span>
        </div>
        <p className="text-sm italic" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>"{phrase}"</p>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center gap-[3px] h-20 mb-4">
          {bars.map((i) => {
            const centerDist = Math.abs(i - 12) / 12;
            const height = isActive ? Math.max(4, (1 - centerDist) * 60 * (0.5 + Math.random() * 0.5)) : 4;
            return (
              <div
                key={i}
                className="w-[2px] rounded-full transition-all duration-150"
                style={{
                  height: `${height}px`,
                  background: isActive || recState === STATES.verified ? "#D1FF26" : "rgba(138,143,152,0.2)",
                }}
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {recState === STATES.idle && (
            <motion.button
              key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              <Mic size={14} /> Start Recording
            </motion.button>
          )}
          {recState === STATES.recording && (
            <motion.p key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
              ● RECORDING… {elapsed}/{RECORD_DURATION}s
            </motion.p>
          )}
          {recState === STATES.verifying && (
            <motion.p key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-mono text-[10px] tracking-widest animate-pulse" style={{ color: "#D1FF26" }}>
              VERIFYING VOICEPRINT…
            </motion.p>
          )}
          {recState === STATES.verified && (
            <motion.div key="verified" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <Check size={16} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>VOICE VERIFIED</span>
              <button onClick={reset} className="ml-2 font-mono text-[9px] tracking-wider underline" style={{ color: "#8A8F98" }}>Redo</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-4 py-4 font-mono text-[10px] tracking-widest uppercase"
          style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
        >
          <ArrowLeft size={12} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={recState !== STATES.verified}
          className="flex-1 flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          Continue <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}