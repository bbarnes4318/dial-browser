import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Upload, Play, Pause, Trash2, Loader2, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoicemailGreeting() {
  const [greetingUrl, setGreetingUrl] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) { setLoading(false); return; }
      try {
        const members = await base44.entities.Member.filter({}, "-created_date", 50);
        const mine = (members || []).find((m) => m.created_by_id === u.id) || (members || [])[0];
        if (mine) {
          setMemberId(mine.id);
          setGreetingUrl(mine.voicemail_greeting_url || null);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveGreeting = async (file_url) => {
    if (memberId) {
      await base44.entities.Member.update(memberId, { voicemail_greeting_url: file_url });
    } else {
      const created = await base44.entities.Member.create({
        full_name: "Member",
        phone: "",
        voicemail_greeting_url: file_url,
      });
      setMemberId(created.id);
    }
    setGreetingUrl(file_url);
    setSuccess("Voicemail greeting saved!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await saveGreeting(file_url);
    } catch {
      setError("Could not upload audio. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "voicemail-greeting.webm", { type: "audio/webm" });
        await uploadFile(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access denied. Check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const togglePlay = () => {
    if (!greetingUrl) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      audioRef.current?.pause();
      const audio = new Audio(greetingUrl);
      audio.onended = () => setPlaying(false);
      audio.play();
      audioRef.current = audio;
      setPlaying(true);
    }
  };

  const deleteGreeting = async () => {
    if (!memberId) return;
    setUploading(true);
    try {
      await base44.entities.Member.update(memberId, { voicemail_greeting_url: "" });
      setGreetingUrl(null);
      setSuccess("Greeting removed.");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Could not remove greeting.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 size={14} className="animate-spin" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LOADING VOICEMAIL GREETING…</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICEMAIL GREETING (FREE)</p>
        {greetingUrl && <span className="font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>ACTIVE</span>}
      </div>

      <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Upload or record a custom audio greeting that callers hear when they reach your voicemail.
        </p>

        {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}
        {success && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>✓ {success}</p>}

        {greetingUrl && (
          <div className="flex items-center gap-3 mb-4 p-3" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <button onClick={togglePlay} className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "#D1FF26", color: "#05070A" }}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px]" style={{ color: "#D1FF26" }}>CURRENT GREETING</p>
              <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{greetingUrl.split("/").pop()}</p>
            </div>
            <button onClick={deleteGreeting} disabled={uploading} className="flex items-center justify-center w-10 h-10 transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }} title="Remove greeting">
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer hover:bg-[rgba(209,255,38,0.12)]" style={{ background: uploading ? "rgba(209,255,38,0.05)" : "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26", opacity: uploading ? 0.5 : 1 }}>
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? "Uploading…" : "Upload Audio File"}
            <input type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
          </label>

          {!recording ? (
            <button onClick={startRecording} disabled={uploading} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <Mic size={13} /> Record New
            </button>
          ) : (
            <button onClick={stopRecording} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "#ef4444", color: "#fff" }}>
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> Stop & Save
            </button>
          )}
        </div>

        <p className="font-mono text-[8px] tracking-widest mt-3 text-center" style={{ color: "rgba(138,143,152,0.5)" }}>
          SUPPORTED: MP3, WAV, WEBM · MAX 10MB
        </p>
      </div>
    </motion.div>
  );
}