import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Terminal, Loader2, Search, Mic, ShieldCheck, MapPin, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { formatEST } from "@/lib/timeFormat";

const INTENTS = ["all", "search", "book", "call", "navigate", "play", "purchase", "other"];
const SOURCES = ["all", "voice", "text", "dial_code"];

const INTENT_META = {
  search: { label: "Search", color: "#8A8F98", bg: "rgba(138,143,152,0.12)" },
  book: { label: "Book", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  call: { label: "Call", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  navigate: { label: "Navigate", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  play: { label: "Play", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  purchase: { label: "Purchase", color: "#D1FF26", bg: "rgba(209,255,38,0.12)" },
  other: { label: "Other", color: "#8A8F98", bg: "rgba(138,143,152,0.12)" },
};

const SOURCE_META = {
  voice: "🎙 Voice",
  text: "⌨ Text",
  dial_code: "# Dial",
};

const FETCH_LIMIT = 200;

export default function VoiceCommandLogViewer() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.VoiceCommand.filter({}, "-created_date", FETCH_LIMIT);
      setCommands(data || []);
    } catch {
      setCommands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = ["all", ...Array.from(new Set(commands.map((c) => c.service_category).filter(Boolean)))];

  const filtered = commands.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      (c.command_text || "").toLowerCase().includes(q) ||
      (c.service_category || "").toLowerCase().includes(q) ||
      (c.region || "").toLowerCase().includes(q);
    const matchesIntent = intentFilter === "all" || c.intent === intentFilter;
    const matchesSource = sourceFilter === "all" || c.source === sourceFilter;
    const matchesCategory = categoryFilter === "all" || c.service_category === categoryFilter;
    return matchesQuery && matchesIntent && matchesSource && matchesCategory;
  });

  const intentCounts = INTENTS.filter((i) => i !== "all").reduce((acc, i) => {
    acc[i] = commands.filter((c) => c.intent === i).length;
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Terminal size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE COMMAND LOG</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{commands.length} ENTRIES</span>
        {isAdmin && (
          <span className="inline-flex items-center gap-1 font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <ShieldCheck size={10} /> ADMIN VIEW · ALL USERS
          </span>
        )}
      </div>

      {/* Privacy note — identity excluded */}
      <div className="flex items-start gap-2 p-3 mb-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <ShieldCheck size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px] leading-relaxed" style={{ color: "#8A8F98" }}>
          IDENTITY EXCLUDED — no user IDs, names, or emails are shown. Only the spoken command, detected category, intent, entry source, inferred region, clarity rating, and EST timestamp are logged.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
          <Search size={14} style={{ color: "#8A8F98" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, categories, regions…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#F5F5F7" }}
          />
          {(query || intentFilter !== "all" || sourceFilter !== "all" || categoryFilter !== "all") && (
            <button
              onClick={() => { setQuery(""); setIntentFilter("all"); setSourceFilter("all"); setCategoryFilter("all"); }}
              className="font-mono text-[9px] tracking-widest uppercase"
              style={{ color: "#8A8F98" }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterGroup label="INTENT" options={INTENTS} value={intentFilter} onChange={setIntentFilter} meta={INTENT_META} />
          <FilterGroup label="SOURCE" options={SOURCES} value={sourceFilter} onChange={setSourceFilter} />
          <FilterGroup label="CATEGORY" options={categories} value={categoryFilter} onChange={setCategoryFilter} />
        </div>
      </div>

      {/* Intent summary chips */}
      {!loading && commands.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {INTENTS.filter((i) => i !== "all" && intentCounts[i] > 0).map((i) => {
            const meta = INTENT_META[i];
            return (
              <span key={i} className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: meta.bg, border: `0.5px solid ${meta.color}30`, color: meta.color }}>
                {meta.label.toUpperCase()} · {intentCounts[i]}
              </span>
            );
          })}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>LOADING LOG…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Mic size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO COMMANDS LOGGED</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>
            {commands.length === 0 ? "Voice commands will appear here as members use the network" : "No entries match your filters"}
          </p>
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
                transition={{ duration: 0.2, delay: Math.min(idx * 0.015, 0.12) }}
                className="p-3 lg:p-4 flex items-start gap-3"
                style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.12)" }}
              >
                <div className="flex items-center justify-center w-8 h-8 flex-shrink-0" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <Mic size={13} style={{ color: "#D1FF26" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed mb-2 break-words" style={{ color: "#F5F5F7" }}>
                    "{cmd.command_text}"
                  </p>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: meta.bg, color: meta.color, border: `0.5px solid ${meta.color}40` }}>
                      {meta.label.toUpperCase()}
                    </span>
                    {cmd.service_category && (
                      <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(138,143,152,0.08)", color: "#8A8F98" }}>
                        {cmd.service_category.toUpperCase()}
                      </span>
                    )}
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{sourceLabel}</span>
                    {cmd.region && (
                      <span className="inline-flex items-center gap-1 font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>
                        <MapPin size={9} /> {cmd.region}
                      </span>
                    )}
                    {cmd.audio_clarity_rating > 0 && (
                      <span className="inline-flex items-center gap-0.5" style={{ color: "#D1FF26" }}>
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} size={8} fill={s < cmd.audio_clarity_rating ? "#D1FF26" : "none"} style={{ opacity: s < cmd.audio_clarity_rating ? 1 : 0.25 }} />
                        ))}
                      </span>
                    )}
                    <span className="font-mono text-[8px] tracking-widest ml-auto" style={{ color: "rgba(138,143,152,0.6)" }}>
                      {formatEST(cmd.created_date)}
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

function FilterGroup({ label, options, value, onChange, meta }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.6)" }}>{label}</span>
      {options.map((opt) => {
        const active = value === opt;
        const m = meta?.[opt];
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase whitespace-nowrap transition-all"
            style={{
              background: active ? (m?.bg || "rgba(209,255,38,0.12)") : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${active ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`,
              color: active ? (m?.color || "#D1FF26") : "#8A8F98",
            }}
          >
            {opt === "all" ? "All" : (m?.label || opt)}
          </button>
        );
      })}
    </div>
  );
}