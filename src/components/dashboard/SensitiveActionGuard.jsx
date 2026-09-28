import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldCheck, Mic, MicOff, Loader2, Lock, Fingerprint, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SensitiveActionGuard() {
  const [enabled, setEnabled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.require_voice_guard) setEnabled(true);
        const existing = await base44.entities.VoiceVerification.filter({}, "-created_date", 1);
        if (existing && existing.length > 0) setEnrollment(existing[0]);
      } catch { /* not authed */ }
      setLoading(false);
    };
    load();
  }, []);

  const toggle = async () => {
    if (!enrollment?.enrolled) return;
    setSaving(true);
    const newVal = !enabled;
    setEnabled(newVal);
    try {
      await base44.auth.updateMe({ require_voice_guard: newVal });
    } catch {
      setEnabled(!newVal);
    }
    setSaving(false);
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
            <Lock size={16} style={{ color: "#D1FF26" }} />
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// SENSITIVE ACTION GUARD</p>
        </div>
        {enabled && (
          <span className="font-mono text-[9px] tracking-widest flex items-center gap-1 px-2 py-1" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 10px rgba(209,255,38,0.1)" }}>
            <ShieldCheck size={9} /> GUARD ACTIVE
          </span>
        )}
      </div>

      <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        When enabled, sensitive actions like account changes, premium payments, and subscription modifications will require a spoken passphrase verification before proceeding.
      </p>

      {!isEnrolled ? (
        <div className="p-4 flex items-start gap-3" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <AlertCircle size={16} style={{ color: "#D1FF26", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#F5F5F7" }}>Voice enrollment required</p>
            <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
              Enroll your voiceprint above first. Once enrolled, you can enable this guard to protect sensitive actions with your voice.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Toggle */}
          <button
            onClick={toggle}
            disabled={saving}
            className="w-full flex items-center justify-between p-4 transition-all"
            style={{
              background: enabled ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${enabled ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`,
            }}
          >
            <div className="flex items-center gap-3">
              {enabled ? <ToggleRight size={24} style={{ color: "#D1FF26" }} /> : <ToggleLeft size={24} style={{ color: "#8A8F98" }} />}
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: enabled ? "#D1FF26" : "#F5F5F7" }}>
                  {enabled ? "Voice guard enabled" : "Enable voice guard"}
                </p>
                <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                  {enabled ? "Sensitive actions require your voiceprint" : "Sensitive actions proceed without verification"}
                </p>
              </div>
            </div>
            {saving && <Loader2 size={14} className="animate-spin" style={{ color: "#D1FF26" }} />}
          </button>

          {/* Protected actions list */}
          {enabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4">
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>// PROTECTED ACTIONS</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Premium payments", icon: Lock },
                  { label: "Subscription changes", icon: Shield },
                  { label: "Account settings", icon: Fingerprint },
                  { label: "Bill payments", icon: ShieldCheck },
                ].map((action) => {
                  const AIcon = action.icon;
                  return (
                    <div key={action.label} className="flex items-center gap-2 p-2.5" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                      <AIcon size={12} style={{ color: "#D1FF26" }} />
                      <span className="text-xs" style={{ color: "#F5F5F7" }}>{action.label}</span>
                      <span className="ml-auto font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>GUARDED</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * VoiceGuardModal — reusable modal that requires voice passphrase verification
 * before a sensitive action proceeds. Used by payment/account-change buttons.
 */
export function VoiceGuardModal({ open, action, passphrase, enrolledSampleUrl, onVerified, onClose }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!open) { setError(""); setDenied(false); setRecording(false); setProcessing(false); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [open]);

  const startRecording = async () => {
    setError(""); setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleStop;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => { if (s >= 5) { stopRecording(); return 5; } return s + 1; });
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const handleStop = async () => {
    setRecording(false);
    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setProcessing(true);
    try {
      const file = new File([audioBlob], "verify.webm", { type: "audio/webm" });
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const llmRes = (await base44.functions.invoke("voice-biometric-verify", {
        enrolledSampleUrl,
        attemptUrl: uploadRes.file_url,
        passphrase,
        action,
      })).data;
      if (llmRes.is_match) {
        onVerified();
        onClose();
      } else {
        setDenied(true);
      }
    } catch {
      setError("Verification failed. Please try again.");
    }
    setProcessing(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        style={{ background: "rgba(5,7,10,0.9)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6"
            style={{ background: "#0A0D14", border: "0.5px solid rgba(209,255,38,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-5">
              <Shield size={16} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE VERIFICATION REQUIRED</p>
            </div>

            <h3 className="font-heading font-black text-xl mb-2" style={{ color: "#F5F5F7" }}>{action}</h3>
            <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
              This action is protected. Speak your passphrase to verify your identity and proceed.
            </p>

            <div className="mb-5 p-3 text-center" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>SAY YOUR PASSPHRASE:</p>
              <p className="text-sm font-semibold" style={{ color: "#D1FF26" }}>"{passphrase}"</p>
            </div>

            {error && <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}
            {denied && <div className="mb-4 p-3 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
              <Lock size={13} style={{ color: "#ef4444" }} />
              <p className="text-xs" style={{ color: "#ef4444" }}>Voice does not match. Verification denied.</p>
            </div>}

            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40"
              style={{ background: recording ? "rgba(239,68,68,0.15)" : "#D1FF26", color: recording ? "#ef4444" : "#05070A", border: recording ? "0.5px solid rgba(239,68,68,0.4)" : "none" }}
            >
              {recording ? <MicOff size={14} /> : processing ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
              {recording ? `Stop (${seconds}s)` : processing ? "Verifying..." : "Verify by Voice"}
            </button>

            <button onClick={onClose} className="w-full mt-3 py-2.5 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
              Cancel
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}