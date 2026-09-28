import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Play, Pause, Trash2, Clock, Phone, Volume2, FileText, Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CallHistoryLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [transcribingId, setTranscribingId] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const audioRef = useRef(null);

  const loadItems = async () => {
    try {
      const data = await base44.entities.VoiceInteraction.list("-created_date", 50);
      setItems((data || []).filter((i) => i.source === "service_call" || i.source === "dial_browser"));
    } catch {
      setError("Could not load call history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const togglePlay = (item) => {
    if (!item.audio_url) return;
    if (playingId === item.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(item.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(item.id);
  };

  const playTranscript = (item) => {
    if (!item.transcript || !("speechSynthesis" in window)) return;
    if (playingId === `t-${item.id}`) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.transcript);
    utterance.rate = 0.98;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
    setPlayingId(`t-${item.id}`);
  };

  const transcribeItem = async (item) => {
    if (!item.audio_url || transcribingId) return;
    setTranscribingId(item.id);
    try {
      const result = (await base44.functions.invoke("transcribe-audio", { audio_url: item.audio_url })).data;
      const transcript = (result?.transcript || "").trim();
      if (transcript) {
        await base44.entities.VoiceInteraction.update(item.id, { transcript });
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, transcript } : i)));
      } else {
        setError("Transcription returned no text.");
      }
    } catch {
      setError("Could not transcribe audio.");
    } finally {
      setTranscribingId(null);
    }
  };

  const deleteItem = async (item) => {
    try {
      await base44.entities.VoiceInteraction.delete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (playingId === item.id || playingId === `t-${item.id}`) {
        if (audioRef.current) audioRef.current.pause();
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        setPlayingId(null);
      }
    } catch {
      setError("Could not delete.");
    }
  };

  const filtered = items.filter(
    (i) =>
      !query.trim() ||
      i.title?.toLowerCase().includes(query.toLowerCase()) ||
      i.transcript?.toLowerCase().includes(query.toLowerCase()) ||
      i.query?.toLowerCase().includes(query.toLowerCase()) ||
      i.service_name?.toLowerCase().includes(query.toLowerCase())
  );

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <History size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CALL HISTORY LOG</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{items.length} CONSULTATIONS</span>
      </div>

      {items.length > 0 && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past consultations by keyword…"
            className="w-full pl-9 pr-3 py-2.5 text-[16px] sm:text-sm"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
          />
        </div>
      )}

      {error && (
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>
      )}

      {loading ? (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <History size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO CONSULTATIONS RECORDED YET</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Service calls and Dial Browser searches you save will appear here for playback</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="p-4"
                style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.12)" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5 flex-shrink-0" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                      {item.source === "dial_browser" ? "DIAL SEARCH" : "SERVICE CALL"}
                    </span>
                    {item.service_name && (
                      <span className="flex items-center gap-1 font-mono text-[9px] flex-shrink-0" style={{ color: "#8A8F98" }}>
                        <Phone size={9} /> {item.service_name}
                      </span>
                    )}
                  </div>
                  <button onClick={() => deleteItem(item)} className="p-1 transition-colors hover:bg-[rgba(239,68,68,0.1)] flex-shrink-0" title="Delete">
                    <Trash2 size={13} style={{ color: "#8A8F98" }} />
                  </button>
                </div>

                <h3 className="font-heading font-semibold text-sm mb-1 line-clamp-1" style={{ color: "#F5F5F7" }}>{item.title}</h3>

                {item.query && (
                  <p className="font-mono text-[9px] mb-1" style={{ color: "#8A8F98" }}>Q: {item.query}</p>
                )}

                {item.transcript && (
                  <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: "#8A8F98" }}>{item.transcript}</p>
                )}

                {transcribingId === item.id && (
                  <p className="flex items-center gap-1.5 text-xs leading-relaxed mb-3 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                    <Loader2 size={11} className="animate-spin" /> TRANSCRIBING AUDIO…
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <div className="flex items-center gap-1.5">
                    {item.audio_url && (
                      <button
                        onClick={() => togglePlay(item)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: playingId === item.id ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        {playingId === item.id ? <Pause size={10} /> : <Play size={10} />} Play
                      </button>
                    )}
                    {item.transcript && (
                      <button
                        onClick={() => playTranscript(item)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: playingId === `t-${item.id}` ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        <Volume2 size={10} /> {playingId === `t-${item.id}` ? "Stop" : "Read"}
                      </button>
                    )}
                    {item.audio_url && !item.transcript && transcribingId !== item.id && (
                      <button
                        onClick={() => transcribeItem(item)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        <FileText size={10} /> Transcribe
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                    {item.duration_sec > 0 && (
                      <span className="flex items-center gap-1"><Clock size={9} /> {fmtTime(item.duration_sec)}</span>
                    )}
                    <span>{new Date(item.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}