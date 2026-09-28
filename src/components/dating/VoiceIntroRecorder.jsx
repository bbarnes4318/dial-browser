import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Loader2, Play, Pause, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MAX_SECONDS = 30;

// Records a 30-second voice intro using the browser MediaRecorder, uploads it
// via UploadPublicFile, and reports the resulting URL + duration. A real
// recorded clip plays on the member's profile so matches hear their actual
// voice instead of a TTS rendering of the text greeting.
export default function VoiceIntroRecorder({ value, duration, onChange }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [audioPlaying, setAudioPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => () => stopAll(), []);

  const stopAll = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = handleStop;
      mr.start();
      mediaRecorderRef.current = mr;
      elapsedRef.current = 0;
      setElapsed(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= MAX_SECONDS) stopRecording();
      }, 1000);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
  };

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: (chunksRef.current[0] && chunksRef.current[0].type) || "audio/webm" });
    if (blob.size < 2000) { setError("Recording too short — try again."); return; }
    setUploading(true);
    try {
      const file = new File([blob], `voice-intro-${Date.now()}.webm`, { type: blob.type });
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      const url = (res && (res.file_url || (res.data && res.data.file_url))) || "";
      if (!url) throw new Error("Upload returned no URL.");
      onChange(url, Math.min(MAX_SECONDS, elapsedRef.current || MAX_SECONDS));
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const clearRecording = () => {
    if (audioRef.current) { audioRef.current.pause(); }
    setAudioPlaying(false);
    onChange("", 0);
  };

  const togglePlayback = () => {
    const a = audioRef.current;
    if (!a) return;
    if (audioPlaying) { a.pause(); setAudioPlaying(false); }
    else { a.play().then(() => setAudioPlaying(true)).catch(() => {}); }
  };

  const pct = Math.min(100, (elapsed / MAX_SECONDS) * 100);
  const hasClip = Boolean(value);

  return (
    <div className="p-4" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Mic size={13} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// 30-SEC VOICE INTRO (OPTIONAL)</p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Let matches hear your real voice. Record up to 30 seconds — it plays right on your profile.
      </p>

      {error && (
        <div className="mb-3 p-2 text-[11px]" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>
      )}

      {hasClip && (
        <div className="mb-3 flex items-center gap-3 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
          <audio ref={audioRef} src={value} onEnded={() => setAudioPlaying(false)} preload="metadata" />
          <button onClick={togglePlayback} className="flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ background: "#D1FF26", color: "#05070A" }}>
            {audioPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>VOICE INTRO READY</p>
            <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{duration || MAX_SECONDS}s · plays on your profile</p>
          </div>
          <button onClick={clearRecording} className="flex items-center gap-1 px-2 py-1.5 font-mono text-[8px] tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            <Trash2 size={11} /> Redo
          </button>
        </div>
      )}

      {recording ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>REC {String(elapsed).padStart(2, "0")}s / {MAX_SECONDS}s</span>
          </div>
          <div className="h-1.5 w-full mb-3" style={{ background: "rgba(138,143,152,0.12)" }}>
            <div className="h-full transition-all" style={{ width: `${pct}%`, background: "#ef4444" }} />
          </div>
          <button onClick={stopRecording} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
            <Square size={13} /> Stop & Save
          </button>
        </div>
      ) : uploading ? (
        <div className="flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
          <Loader2 size={13} className="animate-spin" /> UPLOADING…
        </div>
      ) : (
        <button onClick={startRecording} disabled={uploading} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: hasClip ? "rgba(16,20,29,0.6)" : "#D1FF26", border: hasClip ? "0.5px solid rgba(209,255,38,0.3)" : "0.5px solid #D1FF26", color: hasClip ? "#D1FF26" : "#05070A" }}>
          {hasClip ? <RefreshCw size={13} /> : <Mic size={13} />} {hasClip ? "Record Again" : "Start Recording"}
        </button>
      )}
    </div>
  );
}