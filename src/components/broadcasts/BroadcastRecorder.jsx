import React, { useState, useRef, useCallback } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, CheckCircle2, AlertCircle, Trash2, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { WavRecorder } from "@/lib/wavRecorder";

export default function BroadcastRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);

  const recorderRef = useRef(null);
  const autoStopRef = useRef(null);
  const durationRef = useRef(null);

  const cleanupTimers = () => {
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    if (durationRef.current) clearInterval(durationRef.current);
    autoStopRef.current = null;
    durationRef.current = null;
  };

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    cleanupTimers();
    setRecording(false);
    setProcessing(true);
    setError(null);

    try {
      const wavBlob = await recorderRef.current.stop();
      recorderRef.current = null;

      const file = new File([wavBlob], `broadcast-${Date.now()}.wav`, { type: "audio/wav" });
      const result = await base44.integrations.Core.UploadFile({ file });

      setAudioUrl(result.file_url);
      if (onRecorded) onRecorded(result.file_url, duration);
    } catch {
      setError("Failed to upload recording. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [duration, onRecorded]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
    setDuration(0);
    if (onRecorded) onRecorded(null);

    try {
      const recorder = new WavRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
      setDuration(0);

      durationRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current === recorder) stopRecording();
      }, 120000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
      setRecording(false);
    }
  }, [stopRecording, onRecorded]);

  const handleReset = () => {
    cleanupTimers();
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setRecording(false);
    setProcessing(false);
    if (onRecorded) onRecorded(null);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
          Voice Message
        </label>
        {audioUrl && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase transition-opacity hover:opacity-70"
            style={{ color: "#8A8F98" }}
          >
            <Trash2 size={11} /> Discard
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {processing ? (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-6 gap-2">
            <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>UPLOADING...</span>
          </motion.div>
        ) : audioUrl ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <CheckCircle2 size={16} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>RECORDED — {formatTime(duration)}</span>
            </div>
            <audio controls src={proxyMediaUrl(audioUrl)} className="w-full h-10" style={{ filter: "invert(0.85) hue-rotate(70deg)" }} />
          </motion.div>
        ) : recording ? (
          <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444" }}
            >
              <Mic size={28} style={{ color: "#ef4444" }} />
            </motion.div>
            <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>● RECORDING — {formatTime(duration)}</p>
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-6 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
            >
              <Square size={12} /> Stop & Upload
            </button>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <button
              onClick={startRecording}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
              style={{ background: "#D1FF26" }}
            >
              <Mic size={28} style={{ color: "#05070A" }} />
            </button>
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>TAP TO RECORD</p>
            <p className="flex items-center justify-center gap-1 text-[10px] mt-2" style={{ color: "rgba(138,143,152,0.5)" }}>
              <Volume2 size={10} /> Speak clearly — up to 2 minutes
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}