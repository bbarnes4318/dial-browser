import React, { useState, useRef, useEffect } from "react";
import { Star, Mic, Square, Play, Pause, Loader2, X, Send, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * PostCallRatingDialog — pops up after a call ends. Member picks a 1–5 score
 * and optionally records a voice-note feedback clip (saved to PhoneCallRating).
 */
export default function PostCallRatingDialog({ open, remoteNumber, direction, userId, onClose }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (open) {
      setScore(0); setComment(""); setAudioUrl(null); setDuration(0); setError(null); setRecording(false); setPlaying(false);
    }
    return () => { stopTimer(); cleanupRecorder(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const cleanupRecorder = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try { recorderRef.current.stop(); } catch { /* ignore */ }
    }
    recorderRef.current = null;
    chunksRef.current = [];
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording(false);
    stopTimer();
  };

  const clearRecording = () => {
    cleanupRecorder();
    setAudioUrl(null);
    setDuration(0);
    setPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) { audioRef.current.play(); setPlaying(true); } else { audioRef.current.pause(); setPlaying(false); }
  };

  const submit = async () => {
    if (score < 1) { setError("Please tap a star to rate the call."); return; }
    setSaving(true);
    let voiceUrl = "";
    let voiceDur = 0;
    try {
      if (audioUrl) {
        const blob = await (await fetch(audioUrl)).blob();
        const file = new File([blob], `voice-feedback-${Date.now()}.webm`, { type: "audio/webm" });
        const up = await base44.integrations.Core.UploadPublicFile({ file });
        voiceUrl = up?.file_url || "";
        voiceDur = duration;
      }
      await base44.entities.PhoneCallRating.create({
        owner_user_id: userId,
        remote_number: remoteNumber || "",
        direction: direction || "outbound",
        score,
        voice_note_url: voiceUrl,
        voice_note_duration: voiceDur,
        comment: comment.trim(),
      });
      onClose();
    } catch (e) {
      setError(e?.message || "Could not save feedback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="max-w-md w-full p-6" style={{ background: "rgba(16,20,29,0.97)", border: "0.5px solid rgba(209,255,38,0.3)", borderRadius: 12 }}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// RATE THIS CALL</p>
          <button onClick={onClose} className="p-1" style={{ color: "#8A8F98" }}><X size={16} /></button>
        </div>
        <h2 className="font-heading font-black text-xl mb-1" style={{ color: "#F5F5F7" }}>How was the call quality?</h2>
        <p className="font-mono text-[11px] mb-4" style={{ color: "#8A8F98" }}>{remoteNumber || "Unknown"} · {direction || "outbound"}</p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setScore(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="p-1 transition-transform hover:scale-110">
              <Star size={30} fill={n <= (hover || score) ? "#D1FF26" : "none"} style={{ color: n <= (hover || score) ? "#D1FF26" : "#8A8F98" }} />
            </button>
          ))}
        </div>

        {/* Voice note */}
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>// VOICE FEEDBACK (OPTIONAL)</p>
        {!audioUrl ? (
          <div className="flex items-center gap-3">
            <button onClick={recording ? stopRecording : startRecording}
              className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all active:scale-95"
              style={{ background: recording ? "rgba(239,68,68,0.12)" : "rgba(209,255,38,0.1)", border: `0.5px solid ${recording ? "rgba(239,68,68,0.4)" : "rgba(209,255,38,0.4)"}`, color: recording ? "#ef4444" : "#D1FF26", borderRadius: 8 }}>
              {recording ? <><Square size={13} fill="#ef4444" /> Stop · {String(duration).padStart(2, "0")}s</> : <><Mic size={13} /> Record</>}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.25)", borderRadius: 8 }}>
            <button onClick={togglePlay} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#D1FF26", color: "#05070A" }}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1">
              <p className="font-mono text-[10px]" style={{ color: "#D1FF26" }}>Voice note · {String(duration).padStart(2, "0")}s</p>
              <div className="h-1 mt-1" style={{ background: "rgba(138,143,152,0.2)", borderRadius: 2 }}>
                <div className="h-full" style={{ width: playing ? "60%" : "100%", background: "#D1FF26", borderRadius: 2 }} />
              </div>
            </div>
            <button onClick={clearRecording} className="p-1.5" style={{ color: "#8A8F98" }}><Trash2 size={14} /></button>
          </div>
        )}
        <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setPlaying(false)} hidden />

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          placeholder="Add a written note (optional)…"
          rows={2}
          className="w-full mt-4 px-3 py-2.5 bg-transparent outline-none text-sm resize-none"
          style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7", borderRadius: 8 }}
        />

        {error && <p className="font-mono text-[10px] mt-3" style={{ color: "#ef4444" }}>{error}</p>}

        <button onClick={submit} disabled={saving}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.35)] disabled:opacity-50"
          style={{ background: "#D1FF26", color: "#05070A", borderRadius: 8 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit feedback
        </button>
      </div>
    </div>
  );
}