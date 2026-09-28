import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Activity, Zap, Trophy, Hash, ChevronLeft, ChevronRight } from "lucide-react";
import NavLanguageButton from "@/components/landing/NavLanguageButton";

// Quick-jump targets — the key high-tech sections users need to reach fast
const dockSections = [
  { id: "coverage", label: "Network Map", anchor: "#coverage", icon: Globe, code: "MAP" },
  { id: "regional-status", label: "Signal Status", anchor: "#regional-status", icon: Activity, code: "SIG" },
  { id: "simulator", label: "Simulator", anchor: "#simulator", icon: Zap, code: "SIM" },
  { id: "leaderboard", label: "Top Regions", anchor: "#leaderboard", icon: Trophy, code: "TOP" },
  { id: "dialguide", label: "Dial Guide", anchor: "#dialguide", icon: Hash, code: "DIAL" },
];

export default function FloatingHudNav() {
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Track which dock section is currently in view
  // Throttled via requestAnimationFrame to avoid scroll jank
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const mid = window.scrollY + window.innerHeight / 2;
        let current = null;
        for (const sec of dockSections) {
          const el = document.querySelector(sec.anchor);
          if (el && el.getBoundingClientRect().top + window.scrollY <= mid) {
            current = sec.id;
          }
        }
        setActiveId(current);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleJump = (anchor) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.querySelector(anchor);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 400);
    } else {
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 z-[60] flex-col items-end gap-2">
      {/* HUD header bracket */}
      <div className="flex items-center gap-1.5 px-2 py-1 mb-0.5" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", backdropFilter: "blur(8px)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>DIAL BROWSER</span>
      </div>

      {/* Dock container */}
      <div className="relative" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", backdropFilter: "blur(8px)", boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
        {/* Scanning line accent */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div className="h-full w-1/3" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.5), transparent)", animation: "tickerScroll 4s linear infinite" }} />
        </div>

        {/* Dock items */}
        <div className="flex flex-col py-1.5">
          {dockSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => handleJump(sec.anchor)}
                onMouseEnter={() => setExpanded(true)}
                className="group flex items-center justify-end gap-0 transition-all duration-300"
                style={{ padding: "8px 10px" }}
              >
                {/* Label — expands on hover */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap flex items-center gap-2"
                    >
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.6)" }}>{sec.code}</span>
                      <span className="font-heading font-semibold text-xs" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>{sec.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon button */}
                <div
                  className="relative flex items-center justify-center transition-all duration-300 flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    background: isActive ? "rgba(209,255,38,0.12)" : "transparent",
                    border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                    boxShadow: isActive ? "0 0 12px rgba(209,255,38,0.2)" : "none",
                  }}
                >
                  <Icon size={14} style={{ color: isActive ? "#D1FF26" : "#8A8F98", transition: "color 0.2s" }} />
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Collapse/expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center py-1.5 transition-colors hover:bg-[rgba(209,255,38,0.06)]"
          style={{ borderTop: "0.5px solid rgba(209,255,38,0.12)" }}
        >
          {expanded ? <ChevronRight size={12} style={{ color: "#8A8F98" }} /> : <ChevronLeft size={12} style={{ color: "#8A8F98" }} />}
        </button>

        {/* Language switcher */}
        <div style={{ borderTop: "0.5px solid rgba(209,255,38,0.12)" }}>
          <NavLanguageButton variant="dock" />
        </div>
      </div>

      {/* HUD footer bracket */}
      <div className="flex items-center gap-1.5 px-2 py-1 mt-0.5" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", backdropFilter: "blur(8px)" }}>
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{dockSections.length} NODES</span>
      </div>
    </div>
  );
}