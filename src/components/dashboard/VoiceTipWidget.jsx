import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, ChevronRight, Mic, RotateCw } from "lucide-react";

const TIPS = [
  { category: "Medical", phrase: "I need a doctor for a fever", hint: "Say this to find nearby medical providers" },
  { category: "Weather", phrase: "What's the weather in Miami?", hint: "Get a spoken forecast over the call" },
  { category: "Jobs", phrase: "Search for warehouse jobs nearby", hint: "Pulls local job matches" },
  { category: "Marketplace", phrase: "List a used bicycle for sale", hint: "Creates a marketplace listing" },
  { category: "Emergency", phrase: "I need help — SOS", hint: "Triggers an emergency alert immediately" },
];

export default function VoiceTipWidget() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  const nextTip = useCallback(() => {
    setIndex((prev) => (prev + 1) % TIPS.length);
  }, []);

  // Auto-rotate the collapsed preview
  useEffect(() => {
    if (open || dismissed) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [open, dismissed]);

  if (dismissed) return null;

  const tip = TIPS[index];

  return (
    <div className="fixed bottom-4 right-4 z-50" style={{ maxWidth: "340px" }}>
      <AnimatePresence mode="wait">
        {!open ? (
          /* Collapsed — floating preview chip */
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 text-left transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.2)]"
            style={{
              background: "rgba(10,13,20,0.95)",
              border: "0.5px solid rgba(209,255,38,0.4)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 12px rgba(209,255,38,0.08)",
            }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
                <Lightbulb size={14} style={{ color: "#D1FF26" }} />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE TIP</p>
              <p className="text-xs truncate" style={{ color: "#F5F5F7" }}>"{tip.phrase}"</p>
            </div>
            <ChevronRight size={14} style={{ color: "#8A8F98" }} className="flex-shrink-0" />
          </motion.button>
        ) : (
          /* Expanded — full tip panel */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative"
            style={{
              background: "rgba(10,13,20,0.98)",
              border: "0.5px solid rgba(209,255,38,0.3)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 16px rgba(209,255,38,0.06)",
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
              <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}>
              <div className="flex items-center gap-2">
                <Lightbulb size={13} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE TIPS</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={nextTip} title="Next tip" className="p-1.5 transition-colors hover:bg-[rgba(209,255,38,0.08)]">
                  <RotateCw size={12} style={{ color: "#8A8F98" }} />
                </button>
                <button onClick={() => { setOpen(false); setDismissed(true); }} title="Dismiss" className="p-1.5 transition-colors hover:bg-[rgba(239,68,68,0.1)]">
                  <X size={13} style={{ color: "#8A8F98" }} />
                </button>
              </div>
            </div>

            {/* Tip content */}
            <div className="p-5">
              <span className="font-mono text-[8px] tracking-widest px-2 py-1 mb-3 inline-block" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                {tip.category.toUpperCase()}
              </span>
              <div className="flex items-start gap-2.5 mb-3">
                <Mic size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                <p className="font-heading font-bold text-base leading-snug" style={{ color: "#F5F5F7" }}>
                  "{tip.phrase}"
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>{tip.hint}</p>

              {/* Dot indicators */}
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div className="flex items-center gap-1.5">
                  {TIPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        background: i === index ? "#D1FF26" : "rgba(138,143,152,0.2)",
                        boxShadow: i === index ? "0 0 6px #D1FF26" : "none",
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="font-mono text-[9px] tracking-widest uppercase transition-all hover:text-[#D1FF26]"
                  style={{ color: "#8A8F98" }}
                >
                  Minimize
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}