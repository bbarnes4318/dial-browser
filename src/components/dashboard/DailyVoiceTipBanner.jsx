import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, Mic, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function DailyVoiceTipBanner() {
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.AppNotification.filter({ related_type: "voice_tip" }, "-created_date", 1);
        if (data && data.length > 0) setTip(data[0]);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Dismiss for the session
  const dismiss = () => {
    setDismissed(true);
    if (tip?.id) {
      base44.entities.AppNotification.update(tip.id, { read: true }).catch(() => {});
    }
  };

  if (dismissed || loading || !tip) return null;

  // Parse the message: format is 'Say: "phrase" — hint'
  const message = tip.message || "";
  const phraseMatch = message.match(/"([^"]+)"/);
  const phrase = phraseMatch ? phraseMatch[1] : message;
  const hintPart = message.split("—")[1]?.trim() || "Try this on your next call.";
  const isToday = tip.created_date && (new Date() - new Date(tip.created_date)) < 86400000;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="relative mb-6 overflow-hidden"
        style={{ background: "rgba(10,13,20,0.95)", border: "0.5px solid rgba(209,255,38,0.35)", boxShadow: "0 0 20px rgba(209,255,38,0.06)" }}
      >
        {/* Pulsing top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div className="h-full w-1/3" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
        </div>

        <div className="flex items-center gap-3 p-4">
          {/* Pulsing icon */}
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)", animation: "phosphorPulse 2.5s ease-in-out infinite" }}
            >
              <Lightbulb size={16} style={{ color: "#D1FF26" }} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// DAILY VOICE TIP</p>
              {isToday && (
                <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  NEW TODAY
                </span>
              )}
            </div>
            <div className="flex items-start gap-1.5">
              <Mic size={12} className="flex-shrink-0 mt-1" style={{ color: "#D1FF26" }} />
              <p className="font-heading font-bold text-sm sm:text-base leading-snug" style={{ color: "#F5F5F7" }}>
                "{phrase}"
              </p>
            </div>
            <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>{hintPart}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              to={tip.action_url || "/dashboard"}
              className="hidden sm:flex items-center gap-1 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              Try It <ChevronRight size={11} />
            </Link>
            <button onClick={dismiss} className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]" title="Dismiss">
              <X size={14} style={{ color: "#8A8F98" }} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}