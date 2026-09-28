import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Volume2, Square, Search, Loader2, ArrowLeft, Radio, HelpCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "getting_started", label: "Getting Started" },
  { id: "services", label: "Services" },
  { id: "pricing", label: "Pricing" },
  { id: "devices", label: "Devices" },
  { id: "dial_codes", label: "Dial Codes" },
  { id: "privacy", label: "Privacy" },
  { id: "other", label: "Other" },
];

const catLabel = (id) => (CATEGORIES.find((c) => c.id === id) || {}).label || id;

// Searchable Voice FAQ flow: callers search a question, then tap "Listen" to
// hear the answer spoken aloud — simulating the call-in experience. Content
// is admin-managed (FaqManager) and stays on-brand with the Dial Browser HUD.
export default function FaqVoiceFlow() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.FaqEntry.filter({ active: true }, "sort_order", 200);
        setEntries(data || []);
      } catch { /* */ }
      finally { setLoading(false); }
    })();
    return () => stopSpeaking();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return entries.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (!q) return true;
      return (e.question + " " + e.answer + " " + (e.dial_code || "")).toLowerCase().includes(q);
    });
  }, [entries, query, category]);

  const togglePlay = (e) => {
    if (playingId === e.id) { stopSpeaking(); setPlayingId(null); return; }
    stopSpeaking();
    setPlayingId(e.id);
    const text = e.dial_code ? `${e.answer} Dial code ${e.dial_code}.` : e.answer;
    speak(text, { onEnd: () => setPlayingId(null), onError: () => setPlayingId(null) });
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <Radio size={16} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE FAQ — LISTEN TO ANSWERS</p>
        </div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
          Call-In <span style={{ color: "#D1FF26" }}>FAQ Flow</span>
        </h1>
        <p className="text-base font-light max-w-2xl mb-8" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Search a question, then tap <span style={{ color: "#D1FF26" }}>Listen</span> to hear the answer spoken aloud — just like calling in. Admins keep these answers up to date in the dashboard.
        </p>

        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#43C6AC" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#43C6AC" }}>VOICE FLOW · TAP A QUESTION TO LISTEN</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-3 mb-4" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Search size={15} style={{ color: "#8A8F98" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions and answers…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
          {query && <button onClick={() => setQuery("")}><X size={14} style={{ color: "#8A8F98" }} /></button>}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {CATEGORIES.map((c) => {
            const on = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: on ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${on ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`, color: on ? "#D1FF26" : "#8A8F98" }}>
                {c.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <HelpCircle size={28} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 10px" }} />
            <p className="font-mono text-[11px] tracking-widest" style={{ color: "#8A8F98" }}>NO ANSWERS MATCH YOUR SEARCH</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((e) => {
              const isPlaying = playingId === e.id;
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${isPlaying ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.15)"}` }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-heading font-bold text-sm sm:text-base" style={{ color: "#F5F5F7" }}>{e.question}</p>
                    <button onClick={() => togglePlay(e)} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase flex-shrink-0" style={{ background: isPlaying ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                      {isPlaying ? <><Square size={11} /> Stop</> : <><Volume2 size={11} /> Listen</>}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm mb-2" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{e.answer}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5" style={{ background: "rgba(138,143,152,0.1)", color: "#8A8F98", border: "0.5px solid rgba(138,143,152,0.15)" }}>{catLabel(e.category)}</span>
                    {e.dial_code && (
                      <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 flex items-center gap-1" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                        <Phone size={9} /> {e.dial_code}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}