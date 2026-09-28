import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Voicemail as VoicemailIcon, Play, Pause, Trash2, Pin, Clock, Loader2, FileText, Volume2, Phone, MailOpen, Mail, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoicemailBox({ dialCode }) {
  const [voicemails, setVoicemails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [transcribingId, setTranscribingId] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread | pinned
  const [query, setQuery] = useState("");
  const audioRef = useRef(null);

  const loadVoicemails = async () => {
    try {
      const data = await base44.entities.Voicemail.list("-created_date", 50);
      setVoicemails(data || []);
    } catch {
      setError("Could not load voicemails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoicemails();
  }, []);

  const togglePlay = async (vm) => {
    if (!vm.audio_url) return;
    if (playingId === vm.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(vm.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(vm.id);
    // Mark as listened
    if (!vm.listened) {
      try {
        await base44.entities.Voicemail.update(vm.id, { listened: true });
        setVoicemails((prev) => prev.map((v) => (v.id === vm.id ? { ...v, listened: true } : v)));
      } catch { /* ignore */ }
    }
  };

  const playTranscript = (vm) => {
    if (!vm.transcript || !("speechSynthesis" in window)) return;
    if (playingId === `t-${vm.id}`) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Voicemail from ${vm.caller_name}. ${vm.transcript}`);
    utterance.rate = 0.98;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
    setPlayingId(`t-${vm.id}`);
  };

  const transcribeVoicemail = async (vm) => {
    if (!vm.audio_url || transcribingId) return;
    setTranscribingId(vm.id);
    try {
      const result = (await base44.functions.invoke("transcribe-audio", { audio_url: vm.audio_url })).data;
      const transcript = (result?.transcript || "").trim();
      if (transcript) {
        await base44.entities.Voicemail.update(vm.id, { transcript });
        setVoicemails((prev) => prev.map((v) => (v.id === vm.id ? { ...v, transcript } : v)));
      } else {
        setError("Transcription returned no text.");
      }
    } catch {
      setError("Could not transcribe voicemail.");
    } finally {
      setTranscribingId(null);
    }
  };

  const togglePin = async (vm) => {
    try {
      await base44.entities.Voicemail.update(vm.id, { pinned: !vm.pinned });
      setVoicemails((prev) => prev.map((v) => (v.id === vm.id ? { ...v, pinned: !v.pinned } : v)));
    } catch {
      setError("Could not update voicemail.");
    }
  };

  const deleteVoicemail = async (vm) => {
    try {
      await base44.entities.Voicemail.delete(vm.id);
      setVoicemails((prev) => prev.filter((v) => v.id !== vm.id));
      if (playingId === vm.id || playingId === `t-${vm.id}`) {
        if (audioRef.current) audioRef.current.pause();
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        setPlayingId(null);
      }
    } catch {
      setError("Could not delete voicemail.");
    }
  };

  const filtered = voicemails
    .filter((v) => filter === "all" || (filter === "unread" ? !v.listened : v.pinned))
    .filter(
      (v) =>
        !query.trim() ||
        v.caller_name?.toLowerCase().includes(query.toLowerCase()) ||
        v.caller_phone?.toLowerCase().includes(query.toLowerCase()) ||
        v.transcript?.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const unreadCount = voicemails.filter((v) => !v.listened).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.14 }} className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <VoicemailIcon size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICEMAIL BOX</p>
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{unreadCount} NEW · {voicemails.length} TOTAL</span>
        </div>
      </div>

      {/* Search + filters */}
      {voicemails.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search voicemails by caller or transcript…"
              className="w-full pl-9 pr-3 py-2.5 text-[16px] sm:text-sm"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: "New" },
              { id: "pinned", label: "Pinned" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="px-3 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{
                  background: filter === f.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${filter === f.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                  color: filter === f.id ? "#D1FF26" : "#8A8F98",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
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
          <VoicemailIcon size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>
            {voicemails.length === 0 ? "NO VOICEMAILS YET" : "NO MATCHING VOICEMAILS"}
          </p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>
            {voicemails.length === 0
              ? "When callers leave a message on your Dial Browser number, it appears here"
              : "Try a different filter or search term"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((vm, idx) => (
              <motion.div
                key={vm.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.1) }}
                className="p-4"
                style={{
                  background: vm.listened ? "#10141D" : "rgba(209,255,38,0.03)",
                  border: `0.5px solid ${vm.pinned ? "rgba(209,255,38,0.35)" : vm.listened ? "rgba(209,255,38,0.12)" : "rgba(209,255,38,0.25)"}`,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!vm.listened ? <Mail size={13} style={{ color: "#D1FF26" }} /> : <MailOpen size={13} style={{ color: "#8A8F98" }} />}
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                      {vm.call_type?.toUpperCase() || "UNKNOWN"}
                    </span>
                    {vm.pinned && <Pin size={11} style={{ color: "#D1FF26" }} />}
                    {!vm.listened && (
                      <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "#D1FF26", color: "#05070A" }}>NEW</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => togglePin(vm)} className="p-1 transition-colors hover:bg-[rgba(209,255,38,0.08)]" title={vm.pinned ? "Unpin" : "Pin"}>
                      <Pin size={13} style={{ color: vm.pinned ? "#D1FF26" : "#8A8F98" }} />
                    </button>
                    <button onClick={() => deleteVoicemail(vm)} className="p-1 transition-colors hover:bg-[rgba(239,68,68,0.1)]" title="Delete">
                      <Trash2 size={13} style={{ color: "#8A8F98" }} />
                    </button>
                  </div>
                </div>

                {/* Caller info */}
                <div className="flex items-center gap-2 mb-1">
                  <Phone size={11} style={{ color: "#8A8F98" }} />
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{vm.caller_name || "Unknown Caller"}</p>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{vm.caller_phone}</span>
                </div>

                {/* Transcript */}
                {vm.transcript && (
                  <p className="text-xs leading-relaxed mb-3 line-clamp-3 pl-5" style={{ color: "#8A8F98", borderLeft: "0.5px solid rgba(209,255,38,0.2)" }}>
                    "{vm.transcript}"
                  </p>
                )}
                {transcribingId === vm.id && (
                  <p className="flex items-center gap-1.5 text-xs leading-relaxed mb-3 font-mono text-[9px] tracking-widest pl-5" style={{ color: "#D1FF26" }}>
                    <Loader2 size={11} className="animate-spin" /> TRANSCRIBING VOICEMAIL…
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <div className="flex items-center gap-1.5">
                    {vm.audio_url && (
                      <button
                        onClick={() => togglePlay(vm)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: playingId === vm.id ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        {playingId === vm.id ? <Pause size={10} /> : <Play size={10} />} Play
                      </button>
                    )}
                    {vm.transcript && (
                      <button
                        onClick={() => playTranscript(vm)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: playingId === `t-${vm.id}` ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        <Volume2 size={10} /> {playingId === `t-${vm.id}` ? "Stop" : "Read"}
                      </button>
                    )}
                    {vm.audio_url && !vm.transcript && transcribingId !== vm.id && (
                      <button
                        onClick={() => transcribeVoicemail(vm)}
                        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                      >
                        <FileText size={10} /> Transcribe
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                    {vm.duration_sec > 0 && (
                      <span className="flex items-center gap-1"><Clock size={9} /> {fmtTime(vm.duration_sec)}</span>
                    )}
                    <span>{new Date(vm.created_date).toLocaleDateString()}</span>
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