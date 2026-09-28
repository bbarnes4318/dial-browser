import React, { useState, useRef, useEffect } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Upload, Play, Pause, Trash2, Check, Loader2, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CustomGreetingRecorder() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [greetingUrl, setGreetingUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  // Playback state
  const [playing, setPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      try {
        const members = await base44.entities.Member.filter({}, "-created_date", 50);
        const mine = (members || []).find((m) => m.created_by_id === u.id) || (members || [])[0];
        if (mine) {
          setMember(mine);
          setGreetingUrl(mine.dial_browser_greeting_url || "");
          if (mine.dial_browser_greeting_url) setAudioUrl(mine.dial_browser_greeting_url);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const startRecording = async () => {
    setError(null);
    setSaved(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setAudioUrl(url);
        setRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      setError("Microphone access denied. Please allow mic permissions or upload a file instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSaved(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAudioUrl(file_url);
      setRecordedBlob(null);
      setGreetingUrl(file_url);
    } catch (err) {
      setError("Upload failed. Please try again.");
    }
  };

  const saveGreeting = async () => {
    if (!audioUrl || !member) return;
    setSaving(true);
    setError(null);
    try {
      // If we have a freshly recorded blob, upload it first
      let finalUrl = audioUrl;
      if (recordedBlob) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: recordedBlob });
        finalUrl = file_url;
      }
      await base44.entities.Member.update(member.id, { dial_browser_greeting_url: finalUrl });
      setGreetingUrl(finalUrl);
      setRecordedBlob(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Could not save greeting. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteGreeting = async () => {
    if (!member) return;
    setSaving(true);
    try {
      await base44.entities.Member.update(member.id, { dial_browser_greeting_url: "" });
      setGreetingUrl("");
      setAudioUrl("");
      setRecordedBlob(null);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING…</span>
      </div>
    );
  }

  return (
    <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Volume2 size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DIAL BROWSER GREETING</p>
      </div>
      <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Record or upload a custom audio greeting that plays when you connect to the Dial Browser. Callers will hear this before your session begins.
      </p>

      {error && (
        <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Recording interface */}
      <div className="flex flex-col items-center justify-center p-6 mb-4" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        {recording ? (
          <>
            {/* Animated waveform */}
            <div className="flex items-end gap-1 h-12 mb-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <span
                  key={i}
                  className="w-1"
                  style={{
                    background: "#D1FF26",
                    animation: `eqBar ${0.4 + i * 0.08}s ease-in-out ${i * 0.05}s infinite`,
                    height: "100%",
                  }}
                />
              ))}
            </div>
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: "#D1FF26" }}>● RECORDING… {formatTime(recordingTime)}</p>
            <button
              onClick={stopRecording}
              className="mt-3 flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(239,68,68,0.3)]"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              <Square size={12} /> Stop Recording
            </button>
          </>
        ) : (
          <button
            onClick={startRecording}
            className="relative flex items-center justify-center w-16 h-16 rounded-full transition-all hover:scale-105"
            style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.5)", boxShadow: "0 0 20px rgba(209,255,38,0.15)" }}
          >
            <motion.span
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: "1px solid #D1FF26" }}
              animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <Mic size={22} style={{ color: "#D1FF26" }} />
          </button>
        )}
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: "rgba(138,143,152,0.15)" }} />
        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>OR UPLOAD</span>
        <div className="flex-1 h-px" style={{ background: "rgba(138,143,152,0.15)" }} />
      </div>

      {/* Upload button */}
      <label className="flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase cursor-pointer transition-all hover:bg-[rgba(209,255,38,0.04)] mb-4"
        style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#8A8F98" }}
      >
        <Upload size={13} style={{ color: "#D1FF26" }} /> Choose Audio File
        <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
      </label>

      {/* Current/preview audio */}
      {audioUrl && (
        <div className="p-4 mb-4" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                {recordedBlob ? "NEW RECORDING" : greetingUrl ? "SAVED GREETING" : "UPLOADED FILE"}
              </p>
              <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>
                {recordedBlob ? `Recorded ${formatTime(recordingTime)}` : "Audio ready"}
              </p>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={proxyMediaUrl(audioUrl)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            className="hidden"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={saveGreeting}
          disabled={saving || !audioUrl}
          className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)] disabled:opacity-40"
          style={{ background: saved ? "rgba(209,255,38,0.15)" : "#D1FF26", color: "#05070A", border: `0.5px solid ${saved ? "rgba(209,255,38,0.5)" : "#D1FF26"}` }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Greeting"}
        </button>
        {greetingUrl && (
          <button
            onClick={deleteGreeting}
            disabled={saving}
            className="flex items-center justify-center gap-1 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-40"
            style={{ border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
          >
            <Trash2 size={13} /> Remove
          </button>
        )}
      </div>
    </div>
  );
}