import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Loader2, Volume2, Phone, Mic, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SOURCE_META = {
  dial_browser: { label: "DIAL BROWSER", icon: Globe, color: "#D1FF26" },
  voice_memo: { label: "VOICE MEMO", icon: Mic, color: "#D1FF26" },
  service_call: { label: "SERVICE CALL", icon: Phone, color: "#D1FF26" },
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function LiveTranscriptViewer() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const feedRef = useRef(null);

  const loadInteractions = useCallback(async () => {
    try {
      const data = await base44.entities.VoiceInteraction.list("-created_date", 30);
      setInteractions(data || []);
    } catch {
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInteractions();
    // Realtime subscription — new transcripts appear live
    const unsub = base44.entities.VoiceInteraction.subscribe((event) => {
      if (event.type === "create") {
        setInteractions((prev) => [event.data, ...prev.filter((i) => i.id !== event.data.id)].slice(0, 30));
      } else if (event.type === "update") {
        setInteractions((prev) => prev.map((i) => (i.id === event.data.id ? event.data : i)));
      } else if (event.type === "delete") {
        setInteractions((prev) => prev.filter((i) => i.id !== event.data.id));
      }
    });
    return unsub;
  }, [loadInteractions]);

  const speakText = (text, id) => {
    if (!text || !("speechSynthesis" in window)) return;
    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
    setPlayingId(id);
  };

  const liveCount = interactions.filter((i) => {
    if (!i.created_date) return false;
    return Math.floor((new Date() - new Date(i.created_date)) / 1000) < 120;
  }).length;

  return (
    <div className="p-5 lg:p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE CALL TRANSCRIPT</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "dotPulse 1.5s ease-in-out infinite" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#22c55e" }}>{liveCount > 0 ? `${liveCount} LIVE` : "MONITORING"}</span>
        </div>
      </div>

      {/* Live transcript feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : interactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Phone size={32} style={{ color: "rgba(209,255,38,0.3)", marginBottom: 12 }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO ACTIVE TRANSCRIPTS</p>
          <p className="text-xs" style={{ color: "#8A8F98" }}>Transcripts from voice calls will appear here in real time.</p>
        </div>
      ) : (
        <div ref={feedRef} className="space-y-3 max-h-[500px] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
          <AnimatePresence>
            {interactions.map((interaction) => {
              const meta = SOURCE_META[interaction.source] || SOURCE_META.voice_memo;
              const SourceIcon = meta.icon;
              const isLive = interaction.created_date && Math.floor((new Date() - new Date(interaction.created_date)) / 1000) < 120;
              const transcript = interaction.transcript || interaction.query || "";
              return (
                <motion.div
                  key={interaction.id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative p-4"
                  style={{
                    background: "rgba(5,7,10,0.6)",
                    border: isLive ? "0.5px solid rgba(209,255,38,0.4)" : "0.5px solid rgba(138,143,152,0.1)",
                    boxShadow: isLive ? "0 0 16px rgba(209,255,38,0.08)" : "none",
                  }}
                >
                  {/* Live accent line */}
                  {isLive && (
                    <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                      <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 2s linear infinite" }} />
                    </div>
                  )}

                  {/* Entry header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                        <SourceIcon size={12} style={{ color: "#D1FF26" }} />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{interaction.title || "Voice Call"}</p>
                        <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{meta.label} · {formatTime(interaction.created_date)}</p>
                      </div>
                    </div>
                    {isLive && (
                      <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest" style={{ color: "#22c55e" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e", animation: "dotPulse 1s ease-in-out infinite" }} />
                        LIVE
                      </span>
                    )}
                  </div>

                  {/* Transcript text */}
                  {transcript ? (
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "#F5F5F7", lineHeight: 1.7 }}>
                      {transcript}
                    </p>
                  ) : (
                    <p className="text-xs italic mb-3" style={{ color: "#8A8F98" }}>No transcript available for this interaction.</p>
                  )}

                  {/* Playback */}
                  {transcript && (
                    <button
                      onClick={() => speakText(transcript, interaction.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.15)]"
                      style={{
                        background: playingId === interaction.id ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)",
                        border: "0.5px solid rgba(209,255,38,0.25)",
                        color: "#D1FF26",
                      }}
                    >
                      <Volume2 size={11} />
                      {playingId === interaction.id ? "Stop" : "Replay"}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}