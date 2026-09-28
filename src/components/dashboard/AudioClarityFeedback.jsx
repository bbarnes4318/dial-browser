import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Loader2, Mic, Calendar, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

function StarRating({ value, onChange, saving }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            disabled={saving}
            className="p-1 transition-all disabled:opacity-50"
            style={{ filter: filled ? "drop-shadow(0 0 4px rgba(209,255,38,0.5))" : "none" }}
          >
            <Star
              size={16}
              fill={filled ? "#D1FF26" : "none"}
              color={filled ? "#D1FF26" : "#3a3f48"}
              strokeWidth={filled ? 0 : 2}
            />
          </button>
        );
      })}
    </div>
  );
}

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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const RATING_LABELS = {
  0: "Not rated",
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Crystal clear",
};

export default function AudioClarityFeedback() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.VoiceCommand.list("-created_date", 20);
        setCommands(data || []);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rateCommand = async (cmd, rating) => {
    setSavingId(cmd.id);
    try {
      await base44.entities.VoiceCommand.update(cmd.id, { audio_clarity_rating: rating });
      setCommands((prev) => prev.map((c) => (c.id === cmd.id ? { ...c, audio_clarity_rating: rating } : c)));
      setSavedId(cmd.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch { /* ignore */ } finally {
      setSavingId(null);
    }
  };

  const ratedCount = commands.filter((c) => c.audio_clarity_rating && c.audio_clarity_rating > 0).length;
  const avgRating = ratedCount > 0
    ? (commands.reduce((sum, c) => sum + (c.audio_clarity_rating || 0), 0) / ratedCount).toFixed(1)
    : "—";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Star size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// AUDIO CLARITY FEEDBACK</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{ratedCount}/{commands.length} RATED · AVG {avgRating}★</span>
      </div>

      <div className="p-4 mb-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
          Rate the audio clarity of each recent voice command. Your feedback helps improve speech recognition and call quality across the platform.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>LOADING RECENT COMMANDS…</p>
        </div>
      ) : commands.length === 0 ? (
        <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Mic size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO VOICE COMMANDS YET</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Make a voice request to start rating audio clarity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {commands.map((cmd, idx) => {
            const rating = cmd.audio_clarity_rating || 0;
            const isSaving = savingId === cmd.id;
            const justSaved = savedId === cmd.id;
            return (
              <motion.div
                key={cmd.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2) }}
                className="p-4"
                style={{
                  background: justSaved ? "rgba(209,255,38,0.06)" : "#10141D",
                  border: `0.5px solid ${justSaved ? "rgba(209,255,38,0.4)" : rating > 0 ? "rgba(209,255,38,0.2)" : "rgba(209,255,38,0.12)"}`,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Mic icon */}
                  <div className="flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <Mic size={14} style={{ color: "#D1FF26" }} />
                  </div>

                  {/* Command content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed mb-1" style={{ color: "#F5F5F7" }}>
                      "{cmd.command_text}"
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {cmd.service_category && (
                        <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(138,143,152,0.08)", color: "#8A8F98" }}>
                          {cmd.service_category.toUpperCase()}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                        <Calendar size={8} /> {fmtDate(cmd.created_date)}
                      </span>
                      {rating > 0 && (
                        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>
                          {RATING_LABELS[rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Star rating */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" style={{ color: "#D1FF26" }} />
                    ) : justSaved ? (
                      <Check size={14} style={{ color: "#D1FF26" }} />
                    ) : (
                      <StarRating value={rating} onChange={(r) => rateCommand(cmd, r)} saving={isSaving} />
                    )}
                    <span className="font-mono text-[7px] tracking-widest" style={{ color: "rgba(138,143,152,0.4)" }}>
                      {rating > 0 ? `${rating}/5` : "RATE"}
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