import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Loader2, Fingerprint, CheckCircle2, AlertCircle,
  ShieldCheck, Lock, Volume2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { WavRecorder } from "@/lib/wavRecorder";
import { extractVoiceprint, averageVoiceprints } from "@/lib/voiceprint";

const PASSPHRASE = "My voice is my passport. Verify me.";

/**
 * VoiceLessonUnlock — a voiceprint gate for course lessons. A student speaks
 * a short passphrase; if it matches their enrolled voiceprint, lessons are
 * unlocked for the session. If they have no voiceprint yet, they enroll inline
 * (3 samples) then verify. Uses the existing `voice-auth` backend function.
 */
export default function VoiceLessonUnlock({ user, onUnlocked }) {
  const [view, setView] = useState("loading"); // loading | verify | enroll | success
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [enrollStep, setEnrollStep] = useState(0);
  const [enrollPrints, setEnrollPrints] = useState([]);

  const recorderRef = useRef(null);
  const autoStopRef = useRef(null);
  const stopRef = useRef(null);

  const checkStatus = useCallback(async () => {
    if (!user?.email) { setView("enroll"); return; }
    try {
      const res = await base44.functions.invoke("voice-auth", { operation: "status", email: user.email });
      const data = res.data || res;
      setView(data.enrolled ? "verify" : "enroll");
    } catch {
      setView("enroll");
    }
  }, [user]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setRecording(false);
    setProcessing(true);
    try {
      const wavBlob = await recorderRef.current.stop();
      recorderRef.current = null;
      const voiceprint = await extractVoiceprint(wavBlob);

      if (view === "verify") {
        const res = await base44.functions.invoke("voice-auth", {
          operation: "verify", email: user.email, voiceprint,
        });
        const data = res.data || res;
        if (data.verified) {
          setView("success");
          sessionStorage.setItem("voiceLessonUnlocked", "1");
          setTimeout(() => onUnlocked && onUnlocked(true), 900);
        } else {
          setError(`Voice didn't match (${Math.round((data.score || 0) * 100)}% similarity). Try again in a quiet room.`);
          setView("verify");
        }
      } else if (view === "enroll") {
        const prints = [...enrollPrints, voiceprint];
        setEnrollPrints(prints);
        const next = enrollStep + 1;
        if (next >= 3) {
          const avg = averageVoiceprints(prints);
          const res = await base44.functions.invoke("voice-auth", {
            operation: "enroll", email: user.email, voiceprint: avg,
          });
          const data = res.data || res;
          if (data.enrolled) {
            setEnrollPrints([]);
            setEnrollStep(0);
            setView("verify");
          } else {
            setError(data.error || "Enrollment failed. Please try again.");
            setView("enroll");
          }
        } else {
          setEnrollStep(next);
          setView("enroll");
        }
      }
    } catch (e) {
      setError(e?.message || "Voice processing failed. Try again in a quiet room.");
      setView(view === "verify" ? "verify" : "enroll");
    } finally {
      setProcessing(false);
    }
  }, [view, user, enrollStep, enrollPrints, onUnlocked]);

  stopRef.current = stopRecording;

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const recorder = new WavRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current === recorder) stopRef.current();
      }, 4000);
    } catch {
      setError("Microphone access denied. Allow mic permissions to unlock by voice.");
      setRecording(false);
    }
  }, []);

  const isEnroll = view === "enroll";

  return (
    <div
      className="relative p-5 lg:p-6"
      style={{ background: "rgba(10,13,20,0.85)", border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 0 40px rgba(209,255,38,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Lock size={14} style={{ color: "#D1FF26" }} />
        </motion.div>
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
          {isEnroll ? "// VOICEPRINT ENROLLMENT" : view === "success" ? "// VERIFIED" : "// VOICE LESSON UNLOCK"}
        </span>
      </div>

      <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        {isEnroll
          ? "Lock in your voiceprint once, then speak a short phrase to access your lessons — no password needed."
          : "Speak the passphrase to unlock your lessons for this session."}
      </p>

      {view !== "success" && (
        <div className="p-3 mb-4" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.18)" }}>
          <p className="font-mono text-xs italic text-center" style={{ color: "#F5F5F7" }}>"{PASSPHRASE}"</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CHECKING ENROLLMENT...</p>
          </motion.div>
        )}

        {view === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <CheckCircle2 size={40} className="mx-auto mb-2" style={{ color: "#D1FF26" }} />
            </motion.div>
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>LESSONS UNLOCKED</p>
            <p className="font-mono text-[9px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>YOUR VOICE IS YOUR KEY</p>
          </motion.div>
        )}

        {(view === "verify" || view === "enroll") && (
          <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isEnroll && (
              <div className="flex items-center justify-center gap-2 mb-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px]" style={{
                      background: i < enrollStep ? "rgba(209,255,38,0.2)" : i === enrollStep ? "#D1FF26" : "rgba(138,143,152,0.1)",
                      border: `0.5px solid ${i <= enrollStep ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.2)"}`,
                      color: i < enrollStep ? "#D1FF26" : i === enrollStep ? "#05070A" : "#8A8F98",
                    }}>
                      {i < enrollStep ? "✓" : i + 1}
                    </div>
                    {i < 2 && <div className="w-5 h-px" style={{ background: i < enrollStep ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)" }} />}
                  </div>
                ))}
              </div>
            )}

            <div className="text-center">
              <AnimatePresence mode="wait">
                {processing ? (
                  <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
                    <Loader2 size={26} className="animate-spin mx-auto mb-2" style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                      {view === "verify" ? "VERIFYING VOICEPRINT..." : "PROCESSING SAMPLE..."}
                    </p>
                  </motion.div>
                ) : recording ? (
                  <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                      style={{ background: "rgba(209,255,38,0.15)", border: "2px solid #D1FF26" }}
                    >
                      <Mic size={24} style={{ color: "#D1FF26" }} />
                    </motion.div>
                    <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>● RECORDING — SPEAK NOW</p>
                    <button onClick={stopRecording} className="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                      <MicOff size={11} /> Stop & {view === "verify" ? "Verify" : "Save"}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button
                      onClick={startRecording}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
                      style={{ background: "#D1FF26" }}
                    >
                      <Mic size={24} style={{ color: "#05070A" }} />
                    </button>
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
                      {isEnroll ? `TAP TO RECORD · SAMPLE ${enrollStep + 1} OF 3` : "TAP TO SPEAK PASSPHRASE"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view !== "success" && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <ShieldCheck size={11} style={{ color: "rgba(138,143,152,0.5)" }} />
          <p className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
            ON-DEVICE SPECTRAL FINGERPRINT · NO AUDIO STORED
          </p>
        </div>
      )}
    </div>
  );
}