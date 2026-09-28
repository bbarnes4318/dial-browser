import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, Star, Send, Check, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceReviewRecorder({ track, onReviewSubmitted }) {
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [recording, setRecording] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle, recording, uploading, transcribing, saving, done
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await uploadAndTranscribe(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setPhase("recording");
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow mic access.");
      setPhase("idle");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const uploadAndTranscribe = async (blob) => {
    try {
      setPhase("uploading");
      const file = new File([blob], "voice-review.webm", { type: "audio/webm" });
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const url = uploadRes.file_url;
      setAudioUrl(url);

      setPhase("transcribing");
      const transRes = (await base44.functions.invoke("transcribe-audio", { audio_url: url })).data;
      setTranscript(transRes?.transcript || "(No speech detected)");
      setPhase("idle");
    } catch {
      setError("Could not process voice clip. Please try again.");
      setPhase("idle");
    }
  };

  const submitReview = async () => {
    if (!reviewerName.trim() || !audioUrl) return;
    setPhase("saving");
    setError(null);
    try {
      await base44.entities.VoiceReview.create({
        track_id: track.id,
        track_title: track.track_title,
        artist_name: track.artist_name,
        reviewer_name: reviewerName.trim(),
        audio_url: audioUrl,
        transcript: transcript || "",
        rating,
      });
      setPhase("done");
      setReviewerName("");
      setRating(5);
      setAudioUrl(null);
      setTranscript("");
      if (onReviewSubmitted) onReviewSubmitted();
    } catch {
      setError("Could not save review. Please log in and try again.");
      setPhase("idle");
    }
  };

  const reset = () => {
    setPhase("idle");
    setError(null);
    setAudioUrl(null);
    setTranscript("");
    setRecordSeconds(0);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isProcessing = ["uploading", "transcribing", "saving"].includes(phase);

  return (
    <div className="p-4" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Mic size={12} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE REVIEW</span>
        <span className="font-mono text-[8px] truncate" style={{ color: "#8A8F98" }}>{track.track_title}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-3 p-2" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={12} style={{ color: "#ef4444" }} />
          <p className="font-mono text-[9px]" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "done" ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
            <Check size={24} className="mx-auto mb-2" style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>REVIEW SUBMITTED</p>
            <p className="text-xs mb-3" style={{ color: "#8A8F98" }}>Your voice review is now live for the artist.</p>
            <button onClick={reset} className="px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
              Leave Another
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Reviewer name + rating */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Your name *"
                className="flex-1 px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
              />
              <div className="flex items-center gap-1 px-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                    <Star size={14} style={{ color: s <= rating ? "#D1FF26" : "rgba(138,143,152,0.3)" }} fill={s <= rating ? "#D1FF26" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Record button */}
            {!audioUrl && (
              <div className="flex items-center justify-center gap-3">
                {recording ? (
                  <button
                    onClick={stopRecording}
                    className="flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase animate-pulse"
                    style={{ background: "rgba(239,68,68,0.2)", border: "0.5px solid rgba(239,68,68,0.5)", color: "#ef4444" }}
                  >
                    <Square size={12} /> STOP · {formatTime(recordSeconds)}
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-50 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    <Mic size={12} /> RECORD VOICE REVIEW
                  </button>
                )}
              </div>
            )}

            {/* Processing state */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 size={14} className="animate-spin" style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                  {phase === "uploading" ? "UPLOADING..." : phase === "transcribing" ? "TRANSCRIBING AUDIO..." : "SAVING REVIEW..."}
                </span>
              </div>
            )}

            {/* Transcript preview */}
            {audioUrl && transcript && (
              <div className="p-3" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>▸ TRANSCRIBED REVIEW</p>
                <p className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>"{transcript}"</p>
                <button onClick={reset} className="mt-2 font-mono text-[8px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
                  ✕ Re-record
                </button>
              </div>
            )}

            {/* Submit button */}
            {audioUrl && (
              <button
                onClick={submitReview}
                disabled={!reviewerName.trim() || isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                <Send size={12} /> SUBMIT REVIEW
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}