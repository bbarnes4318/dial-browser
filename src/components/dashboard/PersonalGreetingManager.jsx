import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Upload, Play, Pause, Trash2, Loader2, Check, X,
  Phone, RefreshCw, Volume2, AudioLines,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { WavRecorder } from "@/lib/wavRecorder";

export default function PersonalGreetingManager() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const autoStopRef = useRef(null);

  const loadMember = useCallback(async () => {
    try {
      const list = await base44.entities.Member.filter({}, "-created_date", 1);
      if (list && list.length > 0) {
        setMember(list[0]);
        setAudioUrl(list[0].voicemail_greeting_url || null);
      }
    } catch {
      // no member record yet
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadMember(); }, [loadMember]);

  // ── Upload ──
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setAudioUrl(result.file_url);
      setSaved(false);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Record ──
  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    try {
      const recorder = new WavRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current === recorder) stopRecording();
      }, 30000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    setRecording(false);
    setUploading(true);
    try {
      const wavBlob = await recorderRef.current.stop();
      recorderRef.current = null;
      const file = new File([wavBlob], `greeting_${Date.now()}.wav`, { type: "audio/wav" });
      const result = await base44.integrations.Core.UploadFile({ file });
      setAudioUrl(result.file_url);
      setSaved(false);
    } catch {
      setError("Recording failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Save greeting to Member record ──
  const handleSave = async () => {
    if (!audioUrl || !member) return;
    setSaving(true);
    setError(null);
    try {
      await base44.entities.Member.update(member.id, { voicemail_greeting_url: audioUrl });
      setMember((prev) => ({ ...prev, voicemail_greeting_url: audioUrl }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Could not save greeting. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete greeting ──
  const handleDelete = async () => {
    if (!member) return;
    setSaving(true);
    try {
      await base44.entities.Member.update(member.id, { voicemail_greeting_url: "" });
      setMember((prev) => ({ ...prev, voicemail_greeting_url: "" }));
      setAudioUrl(null);
      setSaved(false);
    } catch {
      setError("Could not remove greeting.");
    } finally {
      setSaving(false);
    }
  };

  // ── Playback ──
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.src = audioUrl;
      audio.onended = () => setPlaying(false);
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const hasGreeting = !!member?.voicemail_greeting_url;
  const isNewAudio = audioUrl && audioUrl !== member?.voicemail_greeting_url;

  return (
    <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Phone size={16} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
          // PERSONAL CALL GREETING
        </p>
      </div>

      <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Record or upload a greeting that callers hear when they dial into your account extension.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : !member ? (
        <div className="text-center py-8">
          <Volume2 size={24} className="mx-auto mb-2" style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
            COMPLETE ONBOARDING FIRST
          </p>
          <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>
            Create your member profile to set a personal greeting.
          </p>
        </div>
      ) : (
        <>
          {/* Current greeting status */}
          {hasGreeting && !isNewAudio && (
            <div className="flex items-center gap-3 p-3 mb-4" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <button
                onClick={togglePlay}
                className="flex items-center justify-center w-9 h-9 flex-shrink-0"
                style={{ background: playing ? "#D1FF26" : "rgba(209,255,38,0.1)", borderRadius: "50%" }}
              >
                {playing ? <Pause size={14} style={{ color: "#05070A" }} /> : <Play size={14} style={{ color: "#D1FF26" }} />}
              </button>
              <div className="flex-1">
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>● GREETING ACTIVE</p>
                <p className="text-[10px]" style={{ color: "#8A8F98" }}>Callers hear this when dialing your extension</p>
              </div>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                style={{ color: "#8A8F98" }}
                title="Remove greeting"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          {/* New audio preview (before saving) */}
          {isNewAudio && (
            <div className="flex items-center gap-3 p-3 mb-4" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <button
                onClick={togglePlay}
                className="flex items-center justify-center w-9 h-9 flex-shrink-0"
                style={{ background: playing ? "#D1FF26" : "rgba(209,255,38,0.1)", borderRadius: "50%" }}
              >
                {playing ? <Pause size={14} style={{ color: "#05070A" }} /> : <Play size={14} style={{ color: "#D1FF26" }} />}
              </button>
              <div className="flex-1">
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>AUDIO READY — NOT SAVED YET</p>
                <p className="text-[10px]" style={{ color: "#8A8F98" }}>Click "Save Greeting" below to activate</p>
              </div>
              <button onClick={() => { setAudioUrl(member?.voicemail_greeting_url || null); setSaved(false); }} className="flex items-center justify-center w-8 h-8" style={{ color: "#8A8F98" }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setMode("upload"); setAudioUrl(member?.voicemail_greeting_url || null); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: mode === "upload" ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                border: `0.5px solid ${mode === "upload" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                color: mode === "upload" ? "#D1FF26" : "#8A8F98",
              }}
            >
              <Upload size={12} /> Upload
            </button>
            <button
              onClick={() => { setMode("record"); setAudioUrl(member?.voicemail_greeting_url || null); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: mode === "record" ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                border: `0.5px solid ${mode === "record" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                color: mode === "record" ? "#D1FF26" : "#8A8F98",
              }}
            >
              <Mic size={12} /> Record
            </button>
          </div>

          {/* Upload / Record area */}
          <AnimatePresence mode="wait">
            {!isNewAudio && mode === "upload" && (
              <motion.label
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 cursor-pointer transition-all hover:bg-[rgba(209,255,38,0.04)]"
                style={{ background: "rgba(5,7,10,0.4)", border: "1px dashed rgba(209,255,38,0.3)" }}
              >
                {uploading ? (
                  <Loader2 size={24} className="animate-spin mb-2" style={{ color: "#D1FF26" }} />
                ) : (
                  <Upload size={24} className="mb-2" style={{ color: "rgba(209,255,38,0.4)" }} />
                )}
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                  {uploading ? "UPLOADING..." : "CLICK TO UPLOAD AUDIO"}
                </span>
                <span className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>MP3, WAV, M4A</span>
                <input type="file" accept="audio/*" onChange={handleUpload} disabled={uploading} className="hidden" />
              </motion.label>
            )}
            {!isNewAudio && mode === "record" && (
              <motion.div
                key="record"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                {uploading ? (
                  <>
                    <Loader2 size={28} className="animate-spin mx-auto mb-2" style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>PROCESSING...</p>
                  </>
                ) : recording ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                      style={{ background: "rgba(209,255,38,0.15)", border: "2px solid #D1FF26" }}
                    >
                      <Mic size={24} style={{ color: "#D1FF26" }} />
                    </motion.div>
                    <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>● RECORDING — SPEAK NOW</p>
                    <button
                      onClick={stopRecording}
                      className="px-6 py-2.5 font-mono text-[9px] tracking-widest uppercase"
                      style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                    >
                      Stop Recording
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startRecording}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
                      style={{ background: "#D1FF26" }}
                    >
                      <Mic size={24} style={{ color: "#05070A" }} />
                    </button>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>TAP TO RECORD</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

          {/* Save button */}
          {isNewAudio && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <RefreshCw size={14} />}
              {saving ? "SAVING..." : saved ? "GREETING SAVED!" : "SAVE GREETING"}
            </button>
          )}

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 p-2"
              style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}
            >
              <Check size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                YOUR GREETING IS NOW LIVE FOR INCOMING CALLS
              </p>
            </motion.div>
          )}
        </>
      )}

      <audio ref={audioRef} preload="none" />
    </div>
  );
}