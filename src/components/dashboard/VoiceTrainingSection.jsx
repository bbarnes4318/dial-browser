import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, Check, Lightbulb, Trash2, Sparkles, ChevronRight, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SERVICE_GUIDES } from "@/pages/VoiceInstructionGuide";

export default function VoiceTrainingSection() {
  const [selectedServiceId, setSelectedServiceId] = useState("grocery");
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activePhrase, setActivePhrase] = useState(null);
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const [tips, setTips] = useState(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const service = SERVICE_GUIDES.find((s) => s.id === selectedServiceId);
  const phrases = service?.commands || [];

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    setLoadingRecordings(true);
    try {
      const data = await base44.entities.VoiceCommand.filter({ source: "voice" }, "-created_date", 50);
      setSavedRecordings(data);
    } catch {
      // empty state
    } finally {
      setLoadingRecordings(false);
    }
  };

  const startRecording = (phrase) => {
    setError("");
    setActivePhrase(phrase);
    setRecording(true);
    chunksRef.current = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          if (audioBlob.size < 1000) {
            setError("Recording too short. Please try again and speak the full phrase.");
            setActivePhrase(null);
            return;
          }
          await uploadRecording(audioBlob, phrase);
        };

        recorder.start();
      })
      .catch(() => {
        setError("Microphone access denied. Please allow microphone permissions.");
        setRecording(false);
        setActivePhrase(null);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setUploading(true);
  };

  const uploadRecording = async (audioBlob, phrase) => {
    try {
      const file = new File([audioBlob], `voice-training-${Date.now()}.webm`, { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      await base44.entities.VoiceCommand.create({
        command_text: phrase.phrase,
        service_category: service.name,
        intent: "search",
        source: "voice",
        region: "",
      });

      await loadRecordings();
      setActivePhrase(null);
    } catch {
      setError("Failed to save recording. Please try again.");
      setActivePhrase(null);
    } finally {
      setUploading(false);
    }
  };

  const deleteRecording = async (rec) => {
    try {
      await base44.entities.VoiceCommand.delete(rec.id);
      setSavedRecordings((prev) => prev.filter((r) => r.id !== rec.id));
    } catch {
      // ignore
    }
  };

  const generateTips = async () => {
    setLoadingTips(true);
    setTips(null);
    try {
      const recentCommands = savedRecordings.slice(0, 10).map((r) => r.command_text);
      const res = (await base44.functions.invoke("voice-training-tips", {
        commands: recentCommands,
        count: savedRecordings.length,
      })).data;
      setTips(res);
    } catch {
      setTips({
        tips: [
          "Speak at a steady, moderate pace — not too fast or too slow.",
          "Hold your phone about 6 inches from your mouth in a quiet room.",
          "Enunciate the start and end of each word clearly.",
        ],
        encouragement: "Keep practicing — every recording helps the AI understand your unique voice!",
      });
    } finally {
      setLoadingTips(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 p-5 lg:p-6"
      style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 0 30px rgba(209,255,38,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div style={{ animation: "phosphorPulse 2.5s ease-in-out infinite" }}>
          <Mic size={15} style={{ color: "#D1FF26" }} />
        </div>
        <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE TRAINING STUDIO</p>
      </div>
      <h2 className="font-heading font-black text-2xl lg:text-3xl mb-2" style={{ color: "#F5F5F7" }}>
        Train Your <span style={{ color: "#D1FF26" }}>Voice</span>
      </h2>
      <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Record yourself saying key service commands. Your voice samples help our AI recognize your speech patterns and improve accuracy over time.
      </p>

      {/* Personalized Tips Button */}
      <div className="mb-5">
        <button
          onClick={generateTips}
          disabled={loadingTips || savedRecordings.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40"
          style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          {loadingTips ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
          {loadingTips ? "Generating Tips..." : "Get Personalized Voice Tips"}
        </button>
        {savedRecordings.length === 0 && (
          <span className="font-mono text-[8px] tracking-widest ml-3" style={{ color: "rgba(138,143,152,0.5)" }}>
            RECORD AT LEAST 1 COMMAND TO UNLOCK TIPS
          </span>
        )}
      </div>

      {/* Tips Panel */}
      <AnimatePresence>
        {tips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="p-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>YOUR PERSONALIZED TIPS</p>
              </div>
              <div className="space-y-2.5 mb-3">
                {tips.tips?.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 font-mono text-[9px] font-bold" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>{i + 1}</span>
                    <p className="text-sm" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs italic pt-2" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)", color: "#D1FF26" }}>{tips.encouragement}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Service selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        {SERVICE_GUIDES.map((svc) => {
          const isActive = selectedServiceId === svc.id;
          const Icon = svc.icon;
          return (
            <button
              key={svc.id}
              onClick={() => { setSelectedServiceId(svc.id); setActivePhrase(null); setError(""); }}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase whitespace-nowrap transition-all"
              style={{
                background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                color: isActive ? "#D1FF26" : "#8A8F98",
              }}
            >
              <Icon size={10} style={{ color: isActive ? "#D1FF26" : svc.color }} /> {svc.name}
            </button>
          );
        })}
      </div>

      {/* Phrase list */}
      <div className="space-y-2 mb-6">
        {phrases.map((cmd, i) => {
          const isActivePhrase = activePhrase === cmd;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="p-3 flex items-center gap-3"
              style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${isActivePhrase && recording ? "rgba(239,68,68,0.4)" : "rgba(138,143,152,0.1)"}` }}
            >
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>"{cmd.phrase}"</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#8A8F98" }}>{cmd.result}</p>
              </div>
              {isActivePhrase && recording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase transition-all flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                >
                  <Square size={11} fill="#ef4444" /> Stop
                </button>
              ) : isActivePhrase && uploading ? (
                <div className="flex items-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase flex-shrink-0" style={{ color: "#D1FF26" }}>
                  <Loader2 size={11} className="animate-spin" /> Saving
                </div>
              ) : (
                <button
                  onClick={() => startRecording(cmd)}
                  disabled={recording || uploading}
                  className="flex items-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.3)] disabled:opacity-30 flex-shrink-0"
                  style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                >
                  <Mic size={11} /> Record
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Recording indicator */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.2)" }}
          >
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#ef4444" }}>RECORDING — SPEAK THE PHRASE NOW</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved recordings log */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>YOUR TRAINING HISTORY</p>
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{savedRecordings.length} RECORDED</span>
        </div>
        {loadingRecordings ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : savedRecordings.length === 0 ? (
          <div className="text-center py-8" style={{ border: "0.5px dashed rgba(209,255,38,0.15)" }}>
            <Mic size={28} style={{ color: "rgba(209,255,38,0.2)" }} className="mx-auto mb-2" />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO RECORDINGS YET</p>
            <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Record a command above to start training</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
            {savedRecordings.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3 p-2.5"
                style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.08)" }}
              >
                <Check size={11} style={{ color: "#D1FF26", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] truncate" style={{ color: "#F5F5F7" }}>"{rec.command_text}"</p>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                    {rec.service_category?.toUpperCase()} · {new Date(rec.created_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteRecording(rec)}
                  className="p-1.5 transition-all hover:bg-[rgba(239,68,68,0.1)]"
                  title="Delete recording"
                >
                  <Trash2 size={11} style={{ color: "rgba(239,68,68,0.5)" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}