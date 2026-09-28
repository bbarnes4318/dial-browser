import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Fingerprint, X, CheckCircle2, AlertCircle, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { WavRecorder } from "@/lib/wavRecorder";
import { extractVoiceprint, averageVoiceprints, cosineSimilarity } from "@/lib/voiceprint";

const PASSPHRASE = "My voice is my passport. Verify me.";

export default function VoiceLoginButton({ email, onVerified }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("loading"); // loading | verify | enroll | success | error
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(null);

  // Enrollment state
  const [enrollStep, setEnrollStep] = useState(0); // 0, 1, 2 (three recordings)
  const [enrollPrints, setEnrollPrints] = useState([]);

  const recorderRef = useRef(null);
  const autoStopRef = useRef(null);

  const checkStatus = useCallback(async () => {
    if (!email) {
      setError("Enter your email first.");
      setView("error");
      return;
    }
    setView("loading");
    setError(null);
    try {
      const response = await base44.functions.invoke("voice-auth", { operation: "status", email });
      const data = response.data || response;
      if (data.enrolled) {
        setView("verify");
      } else {
        setView("enroll");
      }
    } catch {
      setView("enroll");
    }
  }, [email]);

  const handleOpen = () => {
    setOpen(true);
    checkStatus();
  };

  const handleClose = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setRecording(false);
    setProcessing(false);
    setOpen(false);
    setError(null);
    setScore(null);
    setEnrollStep(0);
    setEnrollPrints([]);
  };

  // ── Record passphrase ──
  const startRecording = useCallback(async () => {
    setError(null);
    setScore(null);
    try {
      const recorder = new WavRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);

      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current === recorder) stopRecording();
      }, 4000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
      setRecording(false);
    }
  }, []);

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
        // Send voiceprint to backend for comparison
        const response = await base44.functions.invoke("voice-auth", {
          operation: "verify",
          email,
          voiceprint,
        });
        const data = response.data || response;

        if (data.verified) {
          setScore(data.score);
          setView("success");
          setTimeout(() => {
           if (onVerified) onVerified(true);
          }, 1200);
        } else {
          setError(`Voice didn't match (${Math.round((data.score || 0) * 100)}% similarity). Please try again in a quiet room.`);
          setView("verify");
        }
      } else if (view === "enroll") {
        // Store voiceprint locally for averaging
        const newPrints = [...enrollPrints, voiceprint];
        setEnrollPrints(newPrints);
        const nextStep = enrollStep + 1;

        if (nextStep >= 3) {
         // All 3 samples collected — enroll
         const avgVoiceprint = averageVoiceprints(newPrints);
         const response = await base44.functions.invoke("voice-auth", {
           operation: "enroll",
           email,
           voiceprint: avgVoiceprint,
         });
          const data = response.data || response;

          if (data.enrolled) {
            setView("success");
            setTimeout(() => {
              if (onVerified) onVerified(data.accessToken || null);
            }, 1500);
          }
        } else {
          setEnrollStep(nextStep);
          setView("enroll");
        }
      }
    } catch (err) {
      const status = err?.response?.status || err?.status;
      const errMsg = err?.response?.data?.error || err?.message || "Voice processing failed. Please try again.";
      if (status === 401 || errMsg.includes("Authentication required")) {
        setError("Please log in with your password first, then set up voice login from your profile.");
      } else {
        setError(errMsg);
      }
      setView(view === "verify" ? "verify" : "enroll");
    } finally {
      setProcessing(false);
    }
  }, [view, email, enrollStep, enrollPrints, onVerified]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full h-12 flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
        style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
      >
        <Fingerprint size={16} /> Login with Voiceprint
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ background: "rgba(5,7,10,0.92)" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm p-8"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}
            >
              <button onClick={handleClose} className="absolute top-3 right-3" style={{ color: "#8A8F98" }}>
                <X size={18} />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <Fingerprint size={32} className="mx-auto mb-3" style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-[0.4em] mb-2" style={{ color: "#D1FF26" }}>
                  {view === "enroll" ? "// VOICEPRINT ENROLLMENT" : view === "success" ? "// VERIFIED" : "// VOICEPRINT LOGIN"}
                </p>
                {view !== "enroll" && (
                  <p className="text-sm" style={{ color: "#8A8F98" }}>Speak the passphrase to access your account</p>
                )}
                {view === "enroll" && (
                  <p className="text-sm" style={{ color: "#8A8F98" }}>Record your voice 3 times to create your voiceprint</p>
                )}
              </div>

              {/* Passphrase display */}
              {view !== "success" && (
                <div className="p-3 mb-4" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
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
                {/* ── LOADING ── */}
                {view === "loading" && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                    <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>CHECKING ENROLLMENT...</p>
                  </motion.div>
                )}

                {/* ── SUCCESS ── */}
                {view === "success" && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                    <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>VOICEPRINT VERIFIED</p>
                    {score && <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>{Math.round(score * 100)}% MATCH</p>}
                    <p className="text-xs mt-2" style={{ color: "#8A8F98" }}>Identity confirmed — logging you in…</p>
                  </motion.div>
                )}

                {/* ── VERIFY (existing user) ── */}
                {view === "verify" && (
                  <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <AnimatePresence mode="wait">
                      {processing ? (
                        <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
                          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: "#D1FF26" }} />
                          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>VERIFYING VOICEPRINT...</p>
                        </motion.div>
                      ) : recording ? (
                        <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: "rgba(209,255,38,0.15)", border: "2px solid #D1FF26" }}>
                            <Mic size={28} style={{ color: "#D1FF26" }} />
                          </motion.div>
                          <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>● RECORDING — SPEAK NOW</p>
                          <button onClick={stopRecording} className="px-6 py-2.5 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                            <MicOff size={12} className="inline mr-1" /> Stop & Verify
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <button onClick={startRecording} className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26" }}>
                            <Mic size={28} style={{ color: "#05070A" }} />
                          </button>
                          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>TAP TO RECORD PASSPHRASE</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ── ENROLL (new user) ── */}
                {view === "enroll" && (
                  <motion.div key="enroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Password input */}
                    {/* Enrollment progress */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[10px]" style={{
                            background: i < enrollStep ? "rgba(209,255,38,0.2)" : i === enrollStep ? "#D1FF26" : "rgba(138,143,152,0.1)",
                            border: `0.5px solid ${i <= enrollStep ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.2)"}`,
                            color: i < enrollStep ? "#D1FF26" : i === enrollStep ? "#05070A" : "#8A8F98",
                          }}>
                            {i < enrollStep ? "✓" : i + 1}
                          </div>
                          {i < 2 && <div className="w-6 h-px" style={{ background: i < enrollStep ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)" }} />}
                        </div>
                      ))}
                    </div>

                    <p className="font-mono text-[9px] tracking-widest text-center mb-4" style={{ color: "#8A8F98" }}>
                      SAMPLE {enrollStep + 1} OF 3
                    </p>

                    <div className="text-center">
                      <AnimatePresence mode="wait">
                        {processing ? (
                          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
                            <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: "#D1FF26" }} />
                            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>PROCESSING VOICEPRINT...</p>
                          </motion.div>
                        ) : recording ? (
                          <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: "rgba(209,255,38,0.15)", border: "2px solid #D1FF26" }}>
                              <Mic size={28} style={{ color: "#D1FF26" }} />
                            </motion.div>
                            <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>● RECORDING — SPEAK NOW</p>
                            <button onClick={stopRecording} className="px-6 py-2.5 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                              <MicOff size={12} className="inline mr-1" /> Stop Recording
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <button
                              onClick={startRecording}
                              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
                              style={{ background: "#D1FF26" }}
                            >
                              <Mic size={28} style={{ color: "#05070A" }} />
                            </button>
                            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
                              TAP TO RECORD
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {view !== "success" && (
                <p className="text-center text-[10px] mt-6" style={{ color: "rgba(138,143,152,0.5)" }}>
                  <Volume2 size={10} className="inline mr-1" />
                  Speak clearly in a quiet room for best results
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}