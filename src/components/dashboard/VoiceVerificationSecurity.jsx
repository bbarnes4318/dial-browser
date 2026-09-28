import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mic, MicOff, Loader2, Check, Lock, Fingerprint, AlertCircle, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PASSPHRASES = [
  "My voice is my password",
  "One call away secure access",
  "Verify my identity by voice",
  "Dial secure verify access granted",
];

export default function VoiceVerificationSecurity() {
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedPassphrase, setSelectedPassphrase] = useState(PASSPHRASES[0]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    loadEnrollment();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const loadEnrollment = async () => {
    try {
      const existing = await base44.entities.VoiceVerification.filter({}, "-created_date", 1);
      if (existing && existing.length > 0) setEnrollment(existing[0]);
    } catch { /* not authed or no records */ }
    setLoading(false);
  };

  const startRecording = async () => {
    setError("");
    setStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleRecordingStop;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 5) { stopRecording(); return 5; }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions in your browser settings.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRecordingStop = async () => {
    setRecording(false);
    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }

    setProcessing(true);
    try {
      const file = new File([audioBlob], "voice_sample.webm", { type: "audio/webm" });
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const audioUrl = uploadRes.file_url;

      if (!enrollment) {
        await base44.entities.VoiceVerification.create({
          passphrase: selectedPassphrase,
          voice_sample_url: audioUrl,
          enrolled: true,
          verification_count: 0,
        });
        setStatus("enrolled");
        loadEnrollment();
      } else {
        const llmRes = (await base44.functions.invoke("voice-biometric-verify", {
          enrolledSampleUrl: enrollment.voice_sample_url,
          attemptUrl: audioUrl,
          passphrase: enrollment.passphrase,
        })).data;

        if (llmRes.is_match) {
          await base44.entities.VoiceVerification.update(enrollment.id, {
            last_verified_at: new Date().toISOString(),
            verification_count: (enrollment.verification_count || 0) + 1,
          });
          setStatus("verified");
          loadEnrollment();
        } else {
          setStatus("denied");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong during voice processing.");
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  const isEnrolled = enrollment?.enrolled;

  return (
    <div className="relative p-5 lg:p-6 overflow-hidden" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div style={{ animation: "phosphorPulse 2.5s ease-in-out infinite" }}>
            <Shield size={16} style={{ color: "#D1FF26" }} />
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE VERIFICATION SECURITY</p>
        </div>
        {isEnrolled && (
          <span className="font-mono text-[9px] tracking-widest flex items-center gap-1 px-2 py-1" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 10px rgba(209,255,38,0.1)" }}>
            <Check size={9} /> VOICE LOCK ACTIVE
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      <AnimatePresence>
        {status === "enrolled" && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 flex items-center gap-2" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 15px rgba(209,255,38,0.05)" }}>
            <Check size={13} style={{ color: "#D1FF26" }} />
            <p className="text-xs" style={{ color: "#D1FF26" }}>Voice enrolled successfully. Your voice is now your key.</p>
          </motion.div>
        )}
        {status === "verified" && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 flex items-center gap-2" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 15px rgba(209,255,38,0.05)" }}>
            <Fingerprint size={13} style={{ color: "#D1FF26" }} />
            <p className="text-xs" style={{ color: "#D1FF26" }}>Identity verified. Access granted.</p>
          </motion.div>
        )}
        {status === "denied" && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
            <Lock size={13} style={{ color: "#ef4444" }} />
            <p className="text-xs" style={{ color: "#ef4444" }}>Voice does not match. Verification denied.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isEnrolled ? (
        <div>
          <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Secure your account with voice biometrics. Choose a passphrase and record yourself speaking it. Your voice becomes your password — no pins, no codes, just your unique voiceprint.
          </p>

          <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>STEP 1 — CHOOSE YOUR PASSPHRASE</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {PASSPHRASES.map((pp) => (
              <button
                key={pp}
                onClick={() => setSelectedPassphrase(pp)}
                className="p-3 text-left text-xs transition-all"
                style={{
                  background: selectedPassphrase === pp ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${selectedPassphrase === pp ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                  color: selectedPassphrase === pp ? "#D1FF26" : "#F5F5F7",
                }}
              >
                "{pp}"
              </button>
            ))}
          </div>

          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>STEP 2 — RECORD YOUR VOICE</p>
          <div className="flex flex-col items-center">
            <div className="mb-4 p-3 text-center" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>SAY EXACTLY:</p>
              <p className="text-sm font-semibold" style={{ color: "#D1FF26" }}>"{selectedPassphrase}"</p>
            </div>
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40"
              style={{ background: recording ? "rgba(239,68,68,0.15)" : "#D1FF26", color: recording ? "#ef4444" : "#05070A", border: recording ? "0.5px solid rgba(239,68,68,0.4)" : "none" }}
            >
              {recording ? <MicOff size={14} /> : processing ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
              {recording ? `Stop (${recordSeconds}s)` : processing ? "Processing..." : "Record Passphrase"}
            </button>
            {recording && (
              <div className="flex items-center gap-2 mt-3">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#ef4444" }}>RECORDING — Speak clearly into your mic</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 p-3 flex items-center gap-3" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <Volume2 size={16} style={{ color: "#D1FF26" }} />
            <div className="flex-1">
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>YOUR ENROLLED PASSPHRASE</p>
              <p className="text-sm font-semibold" style={{ color: "#F5F5F7" }}>"{enrollment.passphrase}"</p>
            </div>
          </div>

          {enrollment.verification_count > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>VERIFICATIONS</p>
                <p className="font-heading font-black text-lg" style={{ color: "#D1FF26" }}>{enrollment.verification_count}</p>
              </div>
              <div className="w-px h-8" style={{ background: "rgba(138,143,152,0.15)" }} />
              <div>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>LAST VERIFIED</p>
                <p className="font-mono text-xs" style={{ color: "#F5F5F7" }}>
                  {enrollment.last_verified_at ? new Date(enrollment.last_verified_at).toLocaleString() : "Never"}
                </p>
              </div>
            </div>
          )}

          <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Speak your passphrase to verify your identity. Our system compares your voice against your enrolled sample.
          </p>

          <div className="flex flex-col items-center">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40"
              style={{ background: recording ? "rgba(239,68,68,0.15)" : "#D1FF26", color: recording ? "#ef4444" : "#05070A", border: recording ? "0.5px solid rgba(239,68,68,0.4)" : "none" }}
            >
              {recording ? <MicOff size={14} /> : processing ? <Loader2 size={14} className="animate-spin" /> : <Fingerprint size={14} />}
              {recording ? `Stop (${recordSeconds}s)` : processing ? "Verifying Voice..." : "Verify by Voice"}
            </button>
            {recording && (
              <div className="flex items-center gap-2 mt-3">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#ef4444" }}>RECORDING — Speak your passphrase</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}