import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Loader2, Mic, Search, Phone, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";

const INTENT_META = {
  search: { label: "Searched", color: "#8A8F98", bg: "rgba(138,143,152,0.1)" },
  book: { label: "Booked", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  call: { label: "Called", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  navigate: { label: "Navigated", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  play: { label: "Played", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  purchase: { label: "Purchased", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  other: { label: "Processed", color: "#8A8F98", bg: "rgba(138,143,152,0.1)" },
};

const SOURCE_META = {
  voice: "🎙 Voice",
  text: "⌨️ Text",
  dial_code: "🔢 Dial",
};

function fmtDate(d) {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VoiceHistorySection() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.VoiceCommand.list("-created_date", 100);
        setCommands(data || []);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const intents = ["all", ...Array.from(new Set(commands.map((c) => c.intent).filter(Boolean)))];

  const filtered = commands.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      (c.command_text || "").toLowerCase().includes(q) ||
      (c.service_category || "").toLowerCase().includes(q);
    const matchesIntent = intentFilter === "all" || c.intent === intentFilter;
    return matchesQuery && matchesIntent;
  });

  const totalCompleted = commands.filter((c) => c.intent && c.intent !== "other").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <History size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE COMMAND HISTORY</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{commands.length} TOTAL · {totalCompleted} COMPLETED</span>
      </div>

      {/* Search + intent filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
          <Search size={14} style={{ color: "#8A8F98" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search past commands…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {intents.map((intent) => {
            const meta = INTENT_META[intent] || { label: intent, color: "#8A8F98", bg: "rgba(138,143,152,0.1)" };
            const active = intentFilter === intent;
            return (
              <button
                key={intent}
                onClick={() => setIntentFilter(intent)}
                className="px-3 py-2.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap transition-all"
                style={{
                  background: active ? meta.bg : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${active ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`,
                  color: active ? meta.color : "#8A8F98",
                }}
              >
                {intent === "all" ? "All" : meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>LOADING HISTORY…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Mic size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO VOICE COMMANDS YET</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Your past commands and their outcomes will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cmd, idx) => {
            const meta = INTENT_META[cmd.intent] || INTENT_META.other;
            const sourceLabel = SOURCE_META[cmd.source] || "🎙 Voice";
            return (
              <motion.div
                key={cmd.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.15) }}
                className="p-4 flex items-start gap-3"
                style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}
              >
                <div className="flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <Mic size={14} style={{ color: "#D1FF26" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "#F5F5F7" }}>
                    "{cmd.command_text}"
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="font-mono text-[9px] tracking-widest px-2 py-0.5"
                      style={{ background: meta.bg, color: meta.color, border: `0.5px solid ${meta.color}40` }}
                    >
                      {meta.label}
                    </span>
                    {cmd.service_category && (
                      <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(138,143,152,0.08)", color: "#8A8F98" }}>
                        {cmd.service_category.toUpperCase()}
                      </span>
                    )}
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{sourceLabel}</span>
                    {cmd.region && (
                      <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>📍 {cmd.region}</span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                      <Calendar size={9} /> {fmtDate(cmd.created_date)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}