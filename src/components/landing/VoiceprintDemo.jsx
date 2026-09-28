import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fingerprint,
  Mic,
  MicOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Volume2,
  AlertCircle,
} from "lucide-react";
import { WavRecorder } from "@/lib/wavRecorder";
import {
  extractVoiceprint,
  averageVoiceprints,
  cosineSimilarity,
  VERIFICATION_THRESHOLD,
} from "@/lib/voiceprint";
import LiveWaveform from "@/components/voiceprint/LiveWaveform";
import FingerprintChart from "@/components/voiceprint/FingerprintChart";

const PASSPHRASE = "My voice is my passport. Verify me.";

export default function VoiceprintDemo() {
  const [phase, setPhase] = useState("intro"); // intro | enroll | verify | result
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [enrollStep, setEnrollStep] = useState(0);
  const [enrollPrints, setEnrollPrints] = useState([]);
  const [enrolled, setEnrolled] = useState(null);
  const [currentPrint, setCurrentPrint] = useState(null);
  const [score, setScore] = useState(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [analyser, setAnalyser] = useState(null);

  const recorderRef = useRef(null);
  const autoStopRef = useRef(null);
  const stopRef = useRef(null);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setRecording(false);
    setAnalyser(null);
    setProcessing(true);
    try {
      const wavBlob = await recorderRef.current.stop();
      recorderRef.current = null;
      const voiceprint = await extractVoiceprint(wavBlob);
      setCurrentPrint(voiceprint);

      if (phase === "enroll") {
        const prints = [...enrollPrints, voiceprint];
        setEnrollPrints(prints);
        const next = enrollStep + 1;
        if (next >= 3) {
          setEnrolled(averageVoiceprints(prints));
          setPhase("verify");
        } else {
          setEnrollStep(next);
        }
      } else if (phase === "verify") {
        const s = cosineSimilarity(enrolled, voiceprint);
        setScore(s);
        setVerified(s >= VERIFICATION_THRESHOLD);
        setPhase("result");
      }
    } catch (err) {
      setError(err.message || "Voice processing failed. Try again in a quiet room.");
    } finally {
      setProcessing(false);
    }
  }, [phase, enrollStep, enrollPrints, enrolled]);

  stopRef.current = stopRecording;

  const startRecording = useCallback(async () => {
    setError("");
    setCurrentPrint(null);
    try {
      const recorder = new WavRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      try {
        const ctx = recorder.audioContext;
        const an = ctx.createAnalyser();
        an.fftSize = 256;
        recorder.source.connect(an);
        setAnalyser(an);
      } catch { /* waveform optional */ }
      setRecording(true);
      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current === recorder) stopRef.current();
      }, 4000);
    } catch {
      setError("Microphone access denied. Allow mic permissions to try the demo.");
      setRecording(false);
    }
  }, []);

  const reset = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setPhase("intro");
    setRecording(false);
    setProcessing(false);
    setEnrollStep(0);
    setEnrollPrints([]);
    setEnrolled(null);
    setCurrentPrint(null);
    setScore(null);
    setVerified(false);
    setError("");
  };

  const scorePct = score != null ? Math.round(score * 100) : null;

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      {/* Phosphor pulse background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${320 + i * 160}px`,
              height: `${320 + i * 160}px`,
              border: "0.5px solid rgba(209,255,38,0.06)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.04, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-6">
        {/* Fingerprint glyph — transparent PNG, rotating in 3D */}
        <div className="flex justify-center mb-6" style={{ perspective: "800px" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/0c3bcda2d_generated_c10ee067.png"
              alt="Neon voiceprint fingerprint with signal pulse"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              className="w-40 h-40 lg:w-48 lg:h-48 object-contain select-none pointer-events-none"
              style={{ transformStyle: "preserve-3d", filter: "drop-shadow(0 0 28px rgba(209,255,38,0.35))" }}
              draggable={false}
            />
          </motion.div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-4"
            style={{ border: "0.5px solid rgba(209,255,38,0.3)", background: "rgba(209,255,38,0.05)" }}
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }}
            />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
              PHOSPHOR PULSE · VOICEPRINT BIOMETRIC
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: "#F5F5F7" }}>
            Your voice is your <span style={{ color: "#D1FF26" }}>password.</span>
          </h2>
          <p className="text-sm lg:text-base" style={{ color: "#8A8F98" }}>
            A 32-dimension spectral fingerprint, extracted entirely in your browser — no audio leaves the device. Try the live demo below.
          </p>
        </div>

        {/* Demo panel */}
        <div
          className="relative p-6 lg:p-8"
          style={{
            background: "rgba(10,13,20,0.85)",
            border: "0.5px solid rgba(209,255,38,0.2)",
            boxShadow: "0 0 60px rgba(209,255,38,0.06)",
          }}
        >
          {/* HUD corner brackets */}
          {[
            "top-2 left-2 border-t border-l",
            "top-2 right-2 border-t border-r",
            "bottom-2 left-2 border-b border-l",
            "bottom-2 right-2 border-b border-r",
          ].map((pos, i) => (
            <div key={i} className={`absolute w-5 h-5 ${pos}`} style={{ borderColor: "rgba(209,255,38,0.5)" }} />
          ))}

          {/* Passphrase */}
          <div className="flex items-center gap-2 mb-4">
            <Fingerprint size={14} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>PASSPHRASE</span>
          </div>
          <div className="p-3 mb-5 text-center" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.18)" }}>
            <p className="font-mono text-sm italic" style={{ color: "#F5F5F7" }}>"{PASSPHRASE}"</p>
          </div>

          {/* Live waveform */}
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
              {recording ? "● LIVE WAVEFORM" : "WAVEFORM"}
            </span>
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
              {recording ? "SPEAK NOW" : "IDLE"}
            </span>
          </div>
          <div className="p-3 mb-5" style={{ background: "#05070A", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <LiveWaveform analyser={analyser} active={recording} />
          </div>

          {/* Spectral fingerprint viz */}
          <AnimatePresence>
            {currentPrint && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>SPECTRAL FINGERPRINT · 32 DIM</span>
                  {phase === "result" && scorePct != null && (
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: verified ? "#D1FF26" : "#ef4444" }}>
                      {scorePct}% SIMILARITY
                    </span>
                  )}
                </div>
                <div className="p-3" style={{ background: "#05070A", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                  <FingerprintChart
                    vector={phase === "result" ? enrolled : currentPrint}
                    compare={phase === "result" ? currentPrint : null}
                    label={phase === "result" ? "ENROLLED" : "YOUR VOICEPRINT"}
                    compareLabel={phase === "result" ? "VERIFYING" : undefined}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
            </div>
          )}

          {/* Phase controls */}
          <AnimatePresence mode="wait">
            {/* INTRO */}
            {phase === "intro" && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <button
                  onClick={() => { setPhase("enroll"); setError(""); }}
                  className="inline-flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  <Fingerprint size={14} /> Start Biometric Demo
                </button>
                <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>
                  STEP 1 — ENROLL YOUR VOICE (3 SAMPLES)
                </p>
              </motion.div>
            )}

            {/* ENROLL */}
            {phase === "enroll" && (
              <motion.div key="enroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                <RecordButton
                  recording={recording}
                  processing={processing}
                  onStart={startRecording}
                  onStop={stopRecording}
                  label={processing ? "EXTRACTING FINGERPRINT…" : "TAP TO RECORD"}
                />
                <p className="text-center font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>
                  SAMPLE {enrollStep + 1} OF 3
                </p>
              </motion.div>
            )}

            {/* VERIFY */}
            {phase === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-4" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  <ShieldCheck size={12} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>VOICEPRINT LOCKED IN — NOW VERIFY</span>
                </div>
                <RecordButton
                  recording={recording}
                  processing={processing}
                  onStart={startRecording}
                  onStop={stopRecording}
                  label={processing ? "COMPARING VOICEPRINT…" : "TAP TO VERIFY"}
                />
                <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>
                  STEP 2 — SPEAK THE SAME PASSPHRASE TO LOG IN
                </p>
              </motion.div>
            )}

            {/* RESULT */}
            {phase === "result" && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.div
                  animate={verified ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                  style={{
                    background: verified ? "rgba(209,255,38,0.15)" : "rgba(239,68,68,0.12)",
                    border: `2px solid ${verified ? "#D1FF26" : "#ef4444"}`,
                  }}
                >
                  {verified ? <CheckCircle2 size={32} style={{ color: "#D1FF26" }} /> : <AlertCircle size={32} style={{ color: "#ef4444" }} />}
                </motion.div>
                <p className="font-mono text-xs tracking-widest" style={{ color: verified ? "#D1FF26" : "#ef4444" }}>
                  {verified ? "VOICEPRINT VERIFIED — ACCESS GRANTED" : "VOICEPRINT REJECTED — NO MATCH"}
                </p>
                <p className="font-mono text-[9px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>
                  {scorePct}% SIMILARITY · THRESHOLD {Math.round(VERIFICATION_THRESHOLD * 100)}%
                </p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button onClick={() => { setPhase("verify"); setCurrentPrint(null); setScore(null); setError(""); }} className="px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                    Verify Again
                  </button>
                  <button onClick={reset} className="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "transparent", border: "0.5px solid rgba(138,143,152,0.25)", color: "#8A8F98" }}>
                    <RotateCcw size={11} /> Restart
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <div className="text-center mt-6 flex items-center justify-center gap-2">
          <Volume2 size={11} style={{ color: "rgba(138,143,152,0.5)" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
            100% ON-DEVICE · NO AUDIO UPLOADED · COSINE-SIMILARITY MATCHING
          </p>
        </div>
      </div>
    </section>
  );
}

function RecordButton({ recording, processing, onStart, onStop, label }) {
  if (processing) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{ background: "rgba(209,255,38,0.08)", border: "2px solid rgba(209,255,38,0.4)" }}>
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{label}</p>
      </div>
    );
  }
  if (recording) {
    return (
      <div className="flex flex-col items-center">
        <motion.button
          onClick={onStop}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="flex items-center justify-center w-16 h-16 rounded-full mb-3"
          style={{ background: "rgba(209,255,38,0.15)", border: "2px solid #D1FF26" }}
        >
          <Mic size={24} style={{ color: "#D1FF26" }} />
        </motion.button>
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>● RECORDING — SPEAK NOW</p>
        <button onClick={onStop} className="inline-flex items-center gap-1.5 px-5 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
          <MicOff size={11} /> Stop
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onStart}
        className="flex items-center justify-center w-16 h-16 rounded-full mb-3 transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
        style={{ background: "#D1FF26" }}
      >
        <Mic size={24} style={{ color: "#05070A" }} />
      </button>
      <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
    </div>
  );
}