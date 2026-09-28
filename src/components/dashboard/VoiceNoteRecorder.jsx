import React, { useState, useRef } from "react";
import { Mic, Square, Loader2, Check, Phone, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceNoteRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    setError(null);
    setSaved(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        handleUpload();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      let transcript = "";
      try {
        const result = (await base44.functions.invoke("transcribe-audio", { audio_url: file_url })).data;
        transcript = (result?.transcript || "").trim();
      } catch {
        /* transcription optional — save without transcript */
      }

      const title = transcript
        ? transcript.substring(0, 50) + (transcript.length > 50 ? "…" : "")
        : `Voice Note · ${new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true })} EST`;

      const dueDate = new Date(Date.now() + 86400000).toISOString();

      await base44.entities.Reminder.create({
        title,
        notes: transcript || "",
        audio_url: file_url,
        transcript,
        source: "voice_note",
        due_date: dueDate,
        phone: phone.trim() || "",
        completed: false,
        sms_sent: false,
      });

      setSaved(true);
      setRecordSecs(0);
      if (onRecorded) onRecorded();
    } catch (err) {
      setError("Could not save voice note.");
    } finally {
      setUploading(false);
    }
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-5 lg:p-6" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Mic size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// QUICK VOICE NOTE RECORDER</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={uploading}
          className="flex items-center justify-center w-14 h-14 rounded-full transition-all flex-shrink-0 disabled:opacity-50"
          style={{
            background: recording ? "rgba(239,68,68,0.15)" : "#D1FF26",
            border: `1px solid ${recording ? "#ef4444" : "#D1FF26"}`,
            boxShadow: recording ? "0 0 20px rgba(239,68,68,0.4)" : "0 0 20px rgba(209,255,38,0.2)",
          }}
          title={recording ? "Stop recording" : "Record a voice note"}
        >
          {recording ? (
            <Square size={20} style={{ color: "#ef4444" }} />
          ) : uploading ? (
            <Loader2 size={20} className="animate-spin" style={{ color: "#05070A" }} />
          ) : saved ? (
            <Check size={20} style={{ color: "#05070A" }} />
          ) : (
            <Mic size={20} style={{ color: "#05070A" }} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
            {uploading ? "SAVING & TRANSCRIBING…" : recording ? "RECORDING…" : saved ? "SAVED TO VOICE NOTES" : "READY TO RECORD"}
          </p>
          <p className="font-heading font-bold text-lg" style={{ color: recording ? "#ef4444" : "#F5F5F7" }}>
            {recording ? fmtTime(recordSecs) : uploading ? "Transcribing your note…" : saved ? "Voice note saved!" : "Tap to capture a quick note"}
          </p>
        </div>

        {recording && (
          <div className="flex items-end gap-0.5 h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-1" style={{ background: "#ef4444", animation: `eqBar ${0.5 + i * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Phone size={12} style={{ color: "#8A8F98" }} />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Optional: phone for SMS reminder"
          type="tel"
          className="flex-1 px-3 py-2 text-[16px] sm:text-sm"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 mt-3 font-mono text-[9px] tracking-widest" style={{ color: "#ef4444" }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}

      {saved && !error && (
        <p className="flex items-center gap-1.5 mt-3 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
          <Check size={11} /> Transcribed & saved — find it in your Voice Notes below.
        </p>
      )}
    </div>
  );
}