import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mic, Upload, Play, Pause, Trash2, Loader2, Check, X,
  Volume2, AudioLines, Phone, Plus, Power, Sparkles, User, Cpu, RefreshCw,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { WavRecorder } from "@/lib/wavRecorder";
import VoicePromptGenerator from "@/components/voice/VoicePromptGenerator";

const SERVICE_CODES = {
  "1": { name: "Medical", icon: "🏥" },
  "2": { name: "Dental", icon: "🦷" },
  "3": { name: "Pharmacy", icon: "💊" },
  "4": { name: "Grocery", icon: "🛒" },
  "5": { name: "Weather", icon: "🌤️" },
  "6": { name: "Plumbing", icon: "🔧" },
  "7": { name: "Electrical", icon: "⚡" },
  "8": { name: "Jobs", icon: "💼" },
  "9": { name: "Transport", icon: "🚗" },
  "0": { name: "Marketplace", icon: "🛍️" },
  "*": { name: "Music", icon: "🎵" },
  "#": { name: "SOS", icon: "🚨" },
};

const PROMPT_TYPES = [
  { value: "greeting", label: "Greeting", desc: "Played when caller first connects" },
  { value: "instructions", label: "Instructions", desc: "Menu options and navigation" },
  { value: "farewell", label: "Farewell", desc: "Played before disconnect" },
  { value: "custom", label: "Custom", desc: "Any other prompt" },
];

export default function VoicePrompts() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState("1");
  const [promptName, setPromptName] = useState("");
  const [promptType, setPromptType] = useState("greeting");
  const [mode, setMode] = useState("upload"); // upload | record | generate
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [generatedMeta, setGeneratedMeta] = useState(null); // { voice_type, tts_text, tts_voice, source_method }
  const [swapTarget, setSwapTarget] = useState(null); // prompt being swapped

  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const autoStopRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadPrompts = useCallback(async () => {
    try {
      const list = await base44.entities.DialVoicePrompt.list("-updated_date", 100);
      setPrompts(list || []);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  // ── Upload audio file ──
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setRecordedBlob(result.file_url);
    } catch {
      setError("Could not upload audio file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Record audio ──
  const startRecording = async () => {
    setError(null);
    setRecordedBlob(null);
    try {
      const recorder = new WavRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current === recorder) stopRecording();
      }, 15000);
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
      const file = new File([wavBlob], `prompt_${Date.now()}.wav`, { type: "audio/wav" });
      const result = await base44.integrations.Core.UploadFile({ file });
      setRecordedBlob(result.file_url);
    } catch {
      setError("Recording failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Save prompt (create new or swap audio on existing) ──
  const handleSave = async () => {
    if (!recordedBlob) return;
    if (!swapTarget && !promptName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (swapTarget) {
        // Swap audio on existing prompt
        await base44.entities.DialVoicePrompt.update(swapTarget.id, {
          audio_url: recordedBlob,
          voice_type: generatedMeta?.voice_type || swapTarget.voice_type || "human",
          tts_text: generatedMeta?.tts_text || "",
          tts_voice: generatedMeta?.tts_voice || "",
          source_method: generatedMeta?.source_method || mode,
        });
        setSwapTarget(null);
      } else {
        await base44.entities.DialVoicePrompt.create({
          dial_code: selectedCode,
          prompt_name: promptName.trim(),
          audio_url: recordedBlob,
          prompt_type: promptType,
          voice_type: generatedMeta?.voice_type || "human",
          tts_text: generatedMeta?.tts_text || "",
          tts_voice: generatedMeta?.tts_voice || "",
          source_method: generatedMeta?.source_method || mode,
          active: true,
        });
      }
      setPromptName("");
      setRecordedBlob(null);
      setGeneratedMeta(null);
      await loadPrompts();
    } catch {
      setError("Could not save voice prompt.");
    } finally {
      setSaving(false);
    }
  };

  // ── Start swap mode for an existing prompt ──
  const startSwap = (prompt) => {
    setSwapTarget(prompt);
    setSelectedCode(prompt.dial_code);
    setPromptName(prompt.prompt_name);
    setPromptType(prompt.prompt_type);
    setMode("upload");
    setRecordedBlob(null);
    setGeneratedMeta(null);
    setError(null);
    // Scroll to top creator panel
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelSwap = () => {
    setSwapTarget(null);
    setRecordedBlob(null);
    setGeneratedMeta(null);
    setPromptName("");
  };

  const handleGenerated = (data) => {
    setRecordedBlob(data.audio_url);
    setGeneratedMeta(data);
  };

  // ── Play / pause ──
  const togglePlay = (prompt) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === prompt.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = prompt.audio_url;
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => {});
    setPlayingId(prompt.id);
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    try {
      await base44.entities.DialVoicePrompt.delete(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      if (playingId === id) setPlayingId(null);
    } catch {
      setError("Could not delete prompt.");
    }
  };

  // ── Toggle active ──
  const toggleActive = async (prompt) => {
    try {
      await base44.entities.DialVoicePrompt.update(prompt.id, { active: !prompt.active });
      setPrompts((prev) => prev.map((p) => p.id === prompt.id ? { ...p, active: !p.active } : p));
    } catch {
      // ignore
    }
  };

  const selectedService = SERVICE_CODES[selectedCode];
  const promptsForCode = prompts.filter((p) => p.dial_code === selectedCode);
  const isSwapMode = !!swapTarget;

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AudioLines size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE PROMPTS STUDIO</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Custom <span style={{ color: "#D1FF26" }}>Dial Prompts.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Upload or record custom voice prompts for each dial code. Callers will hear your instructions when they dial in.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Left: Dial code selector + prompt creator ── */}
          <div className="space-y-4">
            {/* Dial code selector */}
            <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>SELECT DIAL CODE</p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(SERVICE_CODES).map(([code, svc]) => (
                  <button
                    key={code}
                    onClick={() => { setSelectedCode(code); setRecordedBlob(null); setPromptName(""); }}
                    className="flex flex-col items-center gap-1 py-3 transition-all"
                    style={{
                      background: selectedCode === code ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                      border: `0.5px solid ${selectedCode === code ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.1)"}`,
                    }}
                  >
                    <span className="font-heading font-bold text-base" style={{ color: selectedCode === code ? "#D1FF26" : "#F5F5F7" }}>{code}</span>
                    <span className="text-xs">{svc.icon}</span>
                    <span className="font-mono text-[7px] tracking-wider" style={{ color: selectedCode === code ? "#D1FF26" : "#8A8F98" }}>{svc.name.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt creator */}
            <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              {/* Swap mode banner */}
              {isSwapMode && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  <RefreshCw size={12} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[9px] tracking-widest flex-1" style={{ color: "#D1FF26" }}>
                    SWAPPING AUDIO · {swapTarget.prompt_name}
                  </p>
                  <button onClick={cancelSwap} style={{ color: "#8A8F98" }}>
                    <X size={12} />
                  </button>
                </div>
              )}
              <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>
                {isSwapMode
                  ? `REPLACE AUDIO FOR "${swapTarget.prompt_name.toUpperCase()}"`
                  : `NEW PROMPT FOR ${selectedService.icon} ${selectedService.name.toUpperCase()} (CODE: ${selectedCode})`}
              </p>

              {/* Name + type — hidden in swap mode (updating existing prompt) */}
              {!isSwapMode && (
                <>
                  <input
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Prompt name (e.g. 'Welcome greeting')"
                    className="w-full px-3 py-2.5 text-sm mb-3 outline-none"
                    style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                  />
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {PROMPT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setPromptType(t.value)}
                        className="px-3 py-2 text-left transition-all"
                        style={{
                          background: promptType === t.value ? "rgba(209,255,38,0.1)" : "rgba(5,7,10,0.4)",
                          border: `0.5px solid ${promptType === t.value ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                        }}
                      >
                        <p className="font-mono text-[9px] tracking-widest" style={{ color: promptType === t.value ? "#D1FF26" : "#F5F5F7" }}>{t.label.toUpperCase()}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#8A8F98" }}>{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Mode tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setMode("upload"); setRecordedBlob(null); setGeneratedMeta(null); }}
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
                  onClick={() => { setMode("record"); setRecordedBlob(null); setGeneratedMeta(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                  style={{
                    background: mode === "record" ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                    border: `0.5px solid ${mode === "record" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                    color: mode === "record" ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  <Mic size={12} /> Record
                </button>
                <button
                  onClick={() => { setMode("generate"); setRecordedBlob(null); setGeneratedMeta(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                  style={{
                    background: mode === "generate" ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                    border: `0.5px solid ${mode === "generate" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                    color: mode === "generate" ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  <Sparkles size={12} /> Generate
                </button>
              </div>

              {/* Upload / Record area */}
              <AnimatePresence mode="wait">
                {recordedBlob ? (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4">
                    <div className="p-3 flex items-center gap-3" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <Check size={14} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>AUDIO READY</span>
                      <button onClick={() => setRecordedBlob(null)} className="ml-auto" style={{ color: "#8A8F98" }}>
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ) : mode === "generate" ? (
                  <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <VoicePromptGenerator onGenerated={handleGenerated} />
                  </motion.div>
                ) : mode === "upload" ? (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <label
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
                      <input type="file" accept="audio/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                    </label>
                  </motion.div>
                ) : (
                  <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                    {uploading ? (
                      <>
                        <Loader2 size={28} className="animate-spin mx-auto mb-2" style={{ color: "#D1FF26" }} />
                        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>PROCESSING...</p>
                      </>
                    ) : recording ? (
                      <>
                        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{ background: "rgba(209,255,38,0.15)", border: "2px solid #D1FF26" }}>
                          <Mic size={24} style={{ color: "#D1FF26" }} />
                        </motion.div>
                        <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>● RECORDING — SPEAK NOW</p>
                        <button onClick={stopRecording} className="px-6 py-2.5 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                          Stop Recording
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={startRecording} className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26" }}>
                          <Mic size={24} style={{ color: "#05070A" }} />
                        </button>
                        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>TAP TO RECORD</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

              {/* Save / Swap button */}
              <button
                onClick={handleSave}
                disabled={(!isSwapMode && !promptName.trim()) || !recordedBlob || saving}
                className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : isSwapMode ? <RefreshCw size={14} /> : <Plus size={14} />}
                {saving ? "SAVING..." : isSwapMode ? "SWAP AUDIO" : "SAVE PROMPT"}
              </button>
            </div>
          </div>

          {/* ── Right: Existing prompts for selected code ── */}
          <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
                {selectedService.icon} {selectedService.name.toUpperCase()} PROMPTS
              </p>
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{promptsForCode.length} TOTAL</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
              </div>
            ) : promptsForCode.length === 0 ? (
              <div className="text-center py-12">
                <Volume2 size={28} className="mx-auto mb-2" style={{ color: "rgba(209,255,38,0.3)" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO PROMPTS YET</p>
                <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>Upload or record a prompt to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {promptsForCode.map((prompt) => (
                    <motion.div
                      key={prompt.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-3 p-3"
                      style={{
                        background: playingId === prompt.id ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.4)",
                        border: `0.5px solid ${playingId === prompt.id ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                      }}
                    >
                      <button
                        onClick={() => togglePlay(prompt)}
                        className="flex items-center justify-center w-9 h-9 flex-shrink-0 transition-all"
                        style={{ background: playingId === prompt.id ? "#D1FF26" : "rgba(209,255,38,0.1)", borderRadius: "50%" }}
                      >
                        {playingId === prompt.id ? <Pause size={13} style={{ color: "#05070A" }} /> : <Play size={13} style={{ color: "#D1FF26" }} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#F5F5F7" }}>{prompt.prompt_name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>
                            {PROMPT_TYPES.find((t) => t.value === prompt.prompt_type)?.label.toUpperCase() || "CUSTOM"}
                          </span>
                          {prompt.voice_type === "robotic" ? (
                            <span className="flex items-center gap-0.5 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                              <Cpu size={7} /> ROBOTIC
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>
                              <User size={7} /> HUMAN
                            </span>
                          )}
                          {prompt.source_method === "generate" && (
                            <span className="flex items-center gap-0.5 font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>
                              <Sparkles size={7} /> AI
                            </span>
                          )}
                          <span className="font-mono text-[7px]" style={{ color: prompt.active ? "#D1FF26" : "#8A8F98" }}>
                            {prompt.active ? "● ACTIVE" : "○ INACTIVE"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => startSwap(prompt)}
                        className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                        style={{ color: "#8A8F98" }}
                        title="Swap audio"
                      >
                        <RefreshCw size={12} />
                      </button>
                      <button
                        onClick={() => toggleActive(prompt)}
                        className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                        style={{ color: prompt.active ? "#D1FF26" : "#8A8F98" }}
                        title={prompt.active ? "Deactivate" : "Activate"}
                      >
                        <Power size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                        style={{ color: "#8A8F98" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* All prompts summary */}
            <div className="mt-4 pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>ALL PROMPTS: {prompts.length}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(SERVICE_CODES).map(([code, svc]) => {
                  const count = prompts.filter((p) => p.dial_code === code).length;
                  return (
                    <button
                      key={code}
                      onClick={() => setSelectedCode(code)}
                      className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] transition-all"
                      style={{
                        background: count > 0 ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.3)",
                        border: `0.5px solid ${count > 0 ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.05)"}`,
                        color: count > 0 ? "#D1FF26" : "#8A8F98",
                      }}
                    >
                      {code} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Link to FAQ */}
        <div className="mt-6 text-center">
          <Link to="/dial-faq" className="inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <Phone size={14} /> View Dial Code FAQ
          </Link>
        </div>
      </div>

      <audio ref={audioRef} preload="none" />
    </div>
  );
}