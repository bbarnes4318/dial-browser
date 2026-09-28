import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Cpu, User, Volume2, Check, X, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TTS_VOICES } from "@/lib/voiceProfiles";

const SAMPLE_SCRIPTS = [
  "Welcome to 1 Call Away. Press a dial code to connect with the service you need.",
  "You've reached the Medical line. For appointments, press 1. For prescriptions, press 2.",
  "Thank you for calling. Your call is important to us. Please stay on the line.",
  "Connecting you to a local provider now. Please hold for just a moment.",
  "You've reached the end of this service. Press star to return to the main menu.",
];

export default function VoicePromptGenerator({ onGenerated }) {
  const [voiceType, setVoiceType] = useState("human");
  const [selectedVoice, setSelectedVoice] = useState("river");
  const [scriptText, setScriptText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const voices = TTS_VOICES[voiceType];

  const handleVoiceTypeChange = (type) => {
    setVoiceType(type);
    setSelectedVoice(TTS_VOICES[type][0].id);
  };

  const handleGenerate = async () => {
    if (!scriptText.trim()) return;
    setGenerating(true);
    setError(null);
    setGeneratedUrl(null);
    try {
      const result = (await base44.functions.invoke("generate-voice-prompt", {
        text: scriptText.trim(),
        voice: selectedVoice,
        language_code: "en",
      })).data;
      if (result?.url) {
        setGeneratedUrl(result.url);
      } else {
        setError("Voice generation failed — no audio returned.");
      }
    } catch (e) {
      setError("Could not generate voice. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    if (!generatedUrl) return;
    const audio = new Audio(generatedUrl);
    audio.onplay = () => setPreviewing(true);
    audio.onended = () => setPreviewing(false);
    audio.onerror = () => setPreviewing(false);
    audio.play().catch(() => setPreviewing(false));
  };

  const handleConfirm = () => {
    if (generatedUrl) {
      onGenerated?.({
        audio_url: generatedUrl,
        voice_type: voiceType,
        tts_text: scriptText.trim(),
        tts_voice: selectedVoice,
        source_method: "generate",
      });
      // Reset
      setScriptText("");
      setGeneratedUrl(null);
      setError(null);
    }
  };

  const handleClear = () => {
    setGeneratedUrl(null);
    setScriptText("");
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Voice Type Selector */}
      <div>
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>VOICE TYPE</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleVoiceTypeChange("human")}
            className="flex items-center gap-2 px-3 py-2.5 transition-all"
            style={{
              background: voiceType === "human" ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
              border: `0.5px solid ${voiceType === "human" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
            }}
          >
            <User size={14} style={{ color: voiceType === "human" ? "#D1FF26" : "#8A8F98" }} />
            <div className="text-left">
              <p className="font-mono text-[9px] tracking-widest" style={{ color: voiceType === "human" ? "#D1FF26" : "#F5F5F7" }}>HUMAN</p>
              <p className="text-[9px]" style={{ color: "#8A8F98" }}>Natural, neural</p>
            </div>
          </button>
          <button
            onClick={() => handleVoiceTypeChange("robotic")}
            className="flex items-center gap-2 px-3 py-2.5 transition-all"
            style={{
              background: voiceType === "robotic" ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
              border: `0.5px solid ${voiceType === "robotic" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
            }}
          >
            <Cpu size={14} style={{ color: voiceType === "robotic" ? "#D1FF26" : "#8A8F98" }} />
            <div className="text-left">
              <p className="font-mono text-[9px] tracking-widest" style={{ color: voiceType === "robotic" ? "#D1FF26" : "#F5F5F7" }}>ROBOTIC</p>
              <p className="text-[9px]" style={{ color: "#8A8F98" }}>Metallic, formal</p>
            </div>
          </button>
        </div>
      </div>

      {/* Voice Selector */}
      <div>
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>VOICE</p>
        <div className="flex flex-wrap gap-2">
          {voices.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVoice(v.id)}
              className="flex items-center gap-1.5 px-3 py-2 transition-all"
              style={{
                background: selectedVoice === v.id ? "rgba(209,255,38,0.1)" : "rgba(5,7,10,0.4)",
                border: `0.5px solid ${selectedVoice === v.id ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
              }}
            >
              <span className="text-sm">{v.icon}</span>
              <div className="text-left">
                <p className="font-mono text-[8px] tracking-widest" style={{ color: selectedVoice === v.id ? "#D1FF26" : "#F5F5F7" }}>{v.label.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Script Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SCRIPT</p>
          <button
            onClick={() => setScriptText(SAMPLE_SCRIPTS[Math.floor(Math.random() * SAMPLE_SCRIPTS.length)])}
            className="flex items-center gap-1 font-mono text-[8px] tracking-widest transition-colors hover:text-[#D1FF26]"
            style={{ color: "#8A8F98" }}
          >
            <Wand2 size={9} /> SAMPLE
          </button>
        </div>
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Type the greeting or instructions callers will hear..."
          rows={3}
          maxLength={1000}
          className="w-full px-3 py-2.5 text-sm outline-none resize-none"
          style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
        />
        <p className="font-mono text-[7px] mt-1 text-right" style={{ color: "rgba(138,143,152,0.5)" }}>{scriptText.length}/1000</p>
      </div>

      {/* Generate Button / Preview */}
      <AnimatePresence mode="wait">
        {generatedUrl ? (
          <motion.div key="generated" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-3 flex items-center gap-3 mb-2" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <Check size={14} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>VOICE GENERATED</span>
              <button onClick={handleClear} className="ml-auto" style={{ color: "#8A8F98" }}>
                <X size={14} />
              </button>
            </div>
            <button
              onClick={handlePreview}
              disabled={previewing}
              className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all mb-2"
              style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
            >
              {previewing ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
              {previewing ? "PLAYING..." : "PREVIEW VOICE"}
            </button>
            <button
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              <Check size={12} /> USE THIS VOICE
            </button>
          </motion.div>
        ) : (
          <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              onClick={handleGenerate}
              disabled={!scriptText.trim() || generating}
              className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
              style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? "GENERATING..." : "GENERATE VOICE"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="font-mono text-[9px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>}
    </div>
  );
}