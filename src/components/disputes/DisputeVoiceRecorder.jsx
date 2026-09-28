import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Play, Pause, X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MAX_SECONDS = 60;

// Simple voice-note recorder for the dispute form. Records up to 60s via
// MediaRecorder, uploads the clip through UploadPublicFile, and reports the
// resulting URL + duration back to the parent form.
export default function DisputeVoiceRecorder({ onRecorded, onClear, existingUrl, existingDuration }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [voiceUrl, setVoiceUrl] = useState(existingUrl || "");
  const [duration, setDuration] = useState(existingDuration || 0);
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, []);

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = handleStop;
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stop();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size === 0) return;
    setUploading(true);
    try {
      const file = new File([blob], `dispute-voice-${Date.now()}.webm`, { type: blob.type });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const dur = seconds || MAX_SECONDS;
      setVoiceUrl(file_url);
      setDuration(dur);
      if (onRecorded) onRecorded(file_url, dur);
    } catch (e) {
      setError("Could not upload the voice note. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setVoiceUrl("");
    setDuration(0);
    setSeconds(0);
    if (onClear) onClear();
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  if (voiceUrl) {
    return (
      <div className="p-3 flex items-center justify-between gap-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <Check size={12} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px]" style={{ color: "#F5F5F7" }}>Voice note attached · {duration}s</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={togglePlay} className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            {playing ? <Pause size={11} /> : <Play size={11} />} {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={clear} className="p-1 hover:bg-[rgba(239,68,68,0.1)]">
            <X size={12} style={{ color: "#ef4444" }} />
          </button>
        </div>
        <audio ref={audioRef} src={voiceUrl} onEnded={() => setPlaying(false)} className="hidden" />
      </div>
    );
  }

  return (
    <div>
      {recording ? (
        <button
          type="button"
          onClick={stop}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 transition-all"
          style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
        >
          <Square size={12} className="animate-pulse" /> Stop recording · {seconds}s / {MAX_SECONDS}s
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 transition-all disabled:opacity-40"
          style={{ background: "rgba(5,7,10,0.6)", border: "0.5px dashed rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          {uploading ? <><Loader2 size={12} className="animate-spin" /> Uploading…</> : <><Mic size={12} /> Record a brief voice note (max 60s)</>}
        </button>
      )}
      {error && <p className="mt-2 font-mono text-[9px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>}
    </div>
  );
}