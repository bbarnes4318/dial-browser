import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Phone, Mic } from "lucide-react";
import { dialServices } from "@/data/dialServices";
import { base44 } from "@/api/base44Client";

// Minimal Web Speech Recognition wrapper (Chrome/Edge). Returns the transcript
// via a callback while listening, and stops on demand.
function getVoiceRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  return rec;
}

// Prominent voice-service lookup bar for the landing page.
// Filters the shared dialServices catalog by name, category, or tags.
export default function ServiceSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [listening, setListening] = useState(false);
  const wrapRef = useRef(null);
  const recRef = useRef(null);
  const navigate = useNavigate();
  const srSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggleVoice = () => {
    if (!srSupported) return;
    if (listening) {
      try { recRef.current && recRef.current.stop(); } catch {}
      setListening(false);
      return;
    }
    try {
      const rec = getVoiceRecognition();
      recRef.current = rec;
      rec.onresult = (e) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        setQuery(text);
        setOpen(true);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      rec.start();
      setListening(true);
    } catch { setListening(false); }
  };

  // Click outside / Escape to close
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const q = query.trim().toLowerCase();

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(dialServices.map((s) => s.category)))],
    []
  );

  const results = useMemo(() => {
    let list = dialServices;
    if (activeCategory && activeCategory !== "All") {
      list = list.filter((s) => s.category === activeCategory);
    }
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.desc.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list.slice(0, 12);
  }, [q, activeCategory]);

  const select = (service) => {
    // Log the confirmed search intent (PII stripped server-side)
    base44.functions.invoke("logServiceSearch", {
      query,
      category: activeCategory || "All",
      region: "All",
      collection: "all",
      result_count: results.length,
      source: "landing",
    }).catch(() => {});
    setOpen(false);
    setQuery("");
    setActiveCategory(null);
    navigate(`/directory/${service.id}`);
  };

  return (
    <div ref={wrapRef} className="relative z-30 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto -mt-6 mb-4">
      <div className="flex items-center gap-2 mb-2 justify-center">
        <Phone size={11} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>
          // SEARCH VOICE SERVICES
        </p>
      </div>

      {/* Input */}
      <div className="relative" style={{ background: "rgba(16,20,29,0.9)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 30px rgba(209,255,38,0.06)" }}>
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
        </div>
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#D1FF26" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={listening ? "Listening… speak a service name" : "Search by name or category — e.g. flights, health, food…"}
          className="w-full pl-11 pr-20 py-3.5 bg-transparent font-mono outline-none"
          style={{ color: "#F5F5F7", fontSize: "16px" }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setActiveCategory(null); }}
            className="absolute right-10 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X size={14} style={{ color: "#8A8F98" }} />
          </button>
        )}
        <button
          onClick={toggleVoice}
          disabled={!srSupported}
          aria-label={listening ? "Stop voice search" : "Search by voice"}
          title={srSupported ? (listening ? "Stop voice search" : "Speak your search") : "Voice search not supported in this browser"}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-all"
          style={{ color: listening ? "#D1FF26" : "#8A8F98" }}
        >
          <Mic size={15} className={listening ? "animate-pulse" : ""} style={{ color: listening ? "#D1FF26" : undefined }} />
        </button>
      </div>

      {/* Category quick-filter chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
        {categories.map((cat) => {
          const active = (activeCategory || "All") === cat;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(active && cat === "All" ? null : cat); setOpen(true); }}
              className="px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: active ? "#D1FF26" : "rgba(16,20,29,0.6)",
                color: active ? "#05070A" : "#8A8F98",
                border: active ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.15)",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {open && (q || (activeCategory && activeCategory !== "All")) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 mt-2 max-h-[60vh] overflow-y-auto overscroll-contain"
            style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 12px 40px rgba(0,0,0,0.7)", WebkitOverflowScrolling: "touch" }}
          >
            {results.length === 0 ? (
              <p className="font-mono text-[11px] text-center py-8" style={{ color: "#8A8F98" }}>
                No services match "{query || activeCategory}"
              </p>
            ) : (
              results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => select(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-[rgba(209,255,38,0.07)]"
                  style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}
                >
                  <span className="text-xl flex-shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{s.name}</p>
                      <span className="font-mono text-[8px] px-1.5 py-0.5 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>{s.category}</span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: "#8A8F98" }}>{s.desc}</p>
                  </div>
                  <span className="font-mono text-[10px] flex-shrink-0" style={{ color: "#D1FF26" }}>{s.dial}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}