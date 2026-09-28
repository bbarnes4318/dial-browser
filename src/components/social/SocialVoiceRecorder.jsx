import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Check, RotateCcw, X } from "lucide-react";
import { WavRecorder } from "@/lib/wavRecorder";
import { base44 } from "@/api/base44Client";

/**
 * Reusable voice recorder: records WAV, uploads, transcribes, calls onComplete.
 * States: idle → recording → uploading → transcribing → done.
 * onComplete({ url, duration, transcript }) on success; onClear() to reset.
 */
export default function SocialVoiceRecorder({ onComplete, onClear, compact = false }) {
  const [state, setState] = useState("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const start = async () => {
    setError("");
    completedRef.current = false;
    try {
      const rec = new WavRecorder();
      await rec.start();
      recorderRef.current = rec;
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setError("Microphone access denied");
    }
  };

  const stop = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const rec = recorderRef.current;
    if (!rec) return;
    setState("uploading");
    const dur = duration;
    try {
      const wav = await rec.stop();
      const file = new File([wav], "voice.wav", { type: "audio/wav" });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setState("transcribing");
      let transcript = "";
      try {
        const res = await base44.functions.invoke("transcribe-audio", { audio_url: file_url });
        transcript = res?.transcript || "";
      } catch { /* non-blocking */ }
      completedRef.current = true;
      setState("done");
      onComplete?.({ url: file_url, duration: dur, transcript });
    } catch {
      setError("Upload failed");
      setState("idle");
    }
  };

  const cancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setState("idle");
    setDuration(0);
  };

  const reset = () => {
    setState("idle");
    setDuration(0);
    completedRef.current = false;
    onClear?.();
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (state === "done") {
    return (
      <div className={`flex items-center gap-2 ${compact ? "text-[10px]" : "text-xs"}`}>
        <span className="flex items-center gap-1.5 px-2 py-1" style={{ background: "rgba(66,225,246,0.08)", border: "0.5px solid rgba(66,225,246,0.3)", color: "#42E1F6" }}>
          <Check size={12} /> Voice {fmt(duration)}
        </span>
        <button onClick={reset} className="flex items-center gap-1 px-2 py-1 hover:opacity-80" style={{ color: "#8A8F98" }}>
          <RotateCcw size={11} /> Re-record
        </button>
        <button onClick={reset} className="p-1 hover:opacity-80" style={{ color: "#ef4444" }}>
          <X size={12} />
        </button>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-2">
        <button onClick={stop} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]" style={{ background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
          REC {fmt(duration)}
        </button>
        <button onClick={cancel} className="p-1.5 hover:opacity-80" style={{ color: "#8A8F98" }}>
          <X size={13} />
        </button>
      </div>
    );
  }

  if (state === "uploading" || state === "transcribing") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "#8A8F98" }}>
        <Loader2 size={13} className="animate-spin" />
        {state === "uploading" ? "Uploading..." : "Transcribing..."}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={start} className={`flex items-center gap-1.5 px-3 py-1.5 font-mono uppercase tracking-wider transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.25)] ${compact ? "text-[10px]" : "text-xs"}`} style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
        <Mic size={13} /> Voice
      </button>
      {error && <span className="text-[10px]" style={{ color: "#ef4444" }}>{error}</span>}
    </div>
  );
}