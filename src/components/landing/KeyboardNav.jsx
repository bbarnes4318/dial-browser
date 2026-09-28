import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, ArrowUp, ArrowDown, X } from "lucide-react";
import { keyboardKeyMap, allSectionAnchors, getActiveAnchor } from "@/components/landing/navSections";

export default function KeyboardNav() {
  const [showHelp, setShowHelp] = useState(false);
  const [flashKey, setFlashKey] = useState(null);
  const [activeAnchor, setActiveAnchor] = useState("#top");
  const navigate = useNavigate();

  const jumpTo = (item) => {
    if (typeof item === "string") {
      const el = document.querySelector(item);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (item.route) {
      navigate(item.route);
    } else if (item.anchor) {
      const el = document.querySelector(item.anchor);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const jumpByIndex = (dir) => {
    const mid = window.scrollY + window.innerHeight / 2;
    let currentIdx = 0;
    for (let i = 0; i < allSectionAnchors.length; i++) {
      const el = document.querySelector(allSectionAnchors[i]);
      if (el && el.getBoundingClientRect().top + window.scrollY <= mid) {
        currentIdx = i;
      }
    }
    const nextIdx = Math.max(0, Math.min(allSectionAnchors.length - 1, currentIdx + dir));
    jumpTo(allSectionAnchors[nextIdx]);
  };

  // Track active section for the help-overlay highlight + hint readout
  // Throttled via requestAnimationFrame to avoid scroll jank
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setActiveAnchor(getActiveAnchor());
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowHelp((s) => !s);
        return;
      }
      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        const match = keyboardKeyMap.find((k) => k.key === e.key);
        if (match) {
          e.preventDefault();
          setFlashKey(e.key);
          setTimeout(() => setFlashKey(null), 400);
          jumpTo(match);
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        jumpByIndex(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        jumpByIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const activeKeyItem = keyboardKeyMap.find((k) => k.anchor === activeAnchor);
  const hintReadout = flashKey
    ? `→ ${keyboardKeyMap.find((k) => k.key === flashKey)?.label.toUpperCase()}`
    : activeKeyItem
      ? `▸ ${activeKeyItem.label.toUpperCase()}`
      : '1-9 JUMP';

  return (
    <>
      {/* Persistent hint — bottom-left, desktop only */}
      <div className="hidden lg:flex fixed bottom-6 left-6 z-40 items-center gap-2 px-3 py-1.5"
        style={{
          background: 'rgba(16,20,29,0.7)',
          border: '0.5px solid rgba(209,255,38,0.15)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Keyboard size={11} style={{ color: '#D1FF26' }} />
        <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
          <span style={{ color: flashKey ? '#D1FF26' : '#8A8F98', transition: 'color 0.2s' }}>
            {hintReadout}
          </span>
          <span style={{ color: 'rgba(138,143,152,0.4)' }}> · ↑↓ SCROLL · ? HELP</span>
        </span>
      </div>

      {/* Help overlay */}
      <AnimatePresence>
        {showHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center p-6"
              style={{ background: 'rgba(5,7,10,0.9)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md p-6"
                style={{
                  background: '#10141D',
                  border: '0.5px solid rgba(209,255,38,0.3)',
                  boxShadow: '0 0 60px rgba(209,255,38,0.08)',
                }}
              >
                {/* Signal-line top accent with traveling data packet */}
                <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                  <div className="h-full w-1/4"
                    style={{ background: 'linear-gradient(90deg, transparent, #D1FF26, transparent)', animation: 'tickerScroll 3s linear infinite' }}
                  />
                </div>

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Keyboard size={14} style={{ color: '#D1FF26' }} />
                    <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: '#D1FF26' }}>
                      // KEYBOARD SHORTCUTS
                    </p>
                  </div>
                  <button onClick={() => setShowHelp(false)} style={{ color: '#8A8F98' }} className="hover:text-[#D1FF26] transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {/* Numeric key grid — active section highlighted */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {keyboardKeyMap.map((k) => {
                    const isActive = !k.route && activeAnchor === k.anchor;
                    return (
                      <button
                        key={k.key}
                        onClick={() => { jumpTo(k); setShowHelp(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200"
                        style={{
                          background: isActive ? 'rgba(209,255,38,0.08)' : 'rgba(16,20,29,0.6)',
                          border: `0.5px solid ${isActive ? 'rgba(209,255,38,0.5)' : 'rgba(209,255,38,0.1)'}`,
                          boxShadow: isActive ? '0 0 16px rgba(209,255,38,0.15)' : 'none',
                        }}
                      >
                        <span className="font-mono font-bold text-sm w-6 h-6 flex items-center justify-center"
                          style={{ background: 'rgba(209,255,38,0.12)', color: '#D1FF26', border: '0.5px solid rgba(209,255,38,0.3)' }}>
                          {k.key}
                        </span>
                        <span className="font-heading font-semibold text-sm" style={{ color: isActive ? '#D1FF26' : '#F5F5F7' }}>{k.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Other shortcuts */}
                <div className="space-y-2 pt-4" style={{ borderTop: '0.5px solid rgba(209,255,38,0.15)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-wider" style={{ color: '#8A8F98' }}>SCROLL DOWN</span>
                    <span className="flex items-center gap-1">
                      <kbd className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(209,255,38,0.1)', color: '#D1FF26', border: '0.5px solid rgba(209,255,38,0.25)' }}>
                        <ArrowDown size={10} className="inline" />
                      </kbd>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-wider" style={{ color: '#8A8F98' }}>SCROLL UP</span>
                    <span className="flex items-center gap-1">
                      <kbd className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(209,255,38,0.1)', color: '#D1FF26', border: '0.5px solid rgba(209,255,38,0.25)' }}>
                        <ArrowUp size={10} className="inline" />
                      </kbd>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-wider" style={{ color: '#8A8F98' }}>TOGGLE THIS PANEL</span>
                    <kbd className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(209,255,38,0.1)', color: '#D1FF26', border: '0.5px solid rgba(209,255,38,0.25)' }}>?</kbd>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}