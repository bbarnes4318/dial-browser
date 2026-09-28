import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, Check } from "lucide-react";
import { useLanguage, languages } from "@/lib/LanguageContext";

export default function NavLanguageButton({ variant = "mobile" }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const current = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
    if (!open) setQuery("");
  }, [open]);

  const filtered = languages.filter(
    (l) =>
      l.label.toLowerCase().includes(query.toLowerCase().trim()) ||
      l.native.toLowerCase().includes(query.toLowerCase().trim()) ||
      l.code.toLowerCase().includes(query.toLowerCase().trim())
  );

  if (variant === "header") {
    return (
      <div ref={containerRef} className="relative flex-shrink-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2.5 py-2.5 transition-all"
          style={{
            background: open ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.9)",
            border: `0.5px solid ${open ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.28)"}`,
          }}
          aria-label="Select language"
        >
          <Globe size={14} style={{ color: open ? "#D1FF26" : "#8A8F98" }} />
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>{current.code}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>▾</motion.span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-full mt-1 w-56 overflow-hidden z-50"
              style={{
                background: "rgba(10,13,20,0.98)",
                border: "0.5px solid rgba(209,255,38,0.25)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                backdropFilter: "blur(12px)",
              }}
            >
              <NavLanguageList
                searchRef={searchRef}
                query={query}
                setQuery={setQuery}
                filtered={filtered}
                lang={lang}
                setLang={(code) => { setLang(code); setOpen(false); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === "dock") {
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-center transition-all"
          style={{ padding: "8px 10px" }}
        >
          <div
            className="relative flex items-center justify-center transition-all duration-300"
            style={{
              width: 32,
              height: 32,
              background: open ? "rgba(209,255,38,0.12)" : "transparent",
              border: `0.5px solid ${open ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
            }}
          >
            <Globe size={14} style={{ color: open ? "#D1FF26" : "#8A8F98" }} />
          </div>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-full top-0 mr-2 w-56 overflow-hidden"
              style={{
                background: "rgba(10,13,20,0.98)",
                border: "0.5px solid rgba(209,255,38,0.25)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                backdropFilter: "blur(12px)",
              }}
            >
              <NavLanguageList
                searchRef={searchRef}
                query={query}
                setQuery={setQuery}
                filtered={filtered}
                lang={lang}
                setLang={(code) => { setLang(code); setOpen(false); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Mobile nav variant
  return (
    <div ref={containerRef} className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-3 transition-all"
        style={{
          background: open ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.6)",
          border: `0.5px solid ${open ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
        }}
      >
        <div className="flex items-center gap-3">
          <Globe size={14} style={{ color: open ? "#D1FF26" : "#8A8F98" }} />
          <span className="font-heading font-semibold text-sm" style={{ color: open ? "#D1FF26" : "#F5F5F7" }}>
            Language
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px]" style={{ color: "#D1FF26" }}>{current.native}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>▾</motion.span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            style={{ borderTop: open ? "0.5px solid rgba(209,255,38,0.15)" : "none" }}
          >
            <NavLanguageList
              searchRef={searchRef}
              query={query}
              setQuery={setQuery}
              filtered={filtered}
              lang={lang}
              setLang={(code) => { setLang(code); setOpen(false); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLanguageList({ searchRef, query, setQuery, filtered, lang, setLang }) {
  return (
    <div>
      <div className="relative p-2" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.12)" }}>
        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search languages..."
          className="w-full pl-8 pr-3 py-2 text-xs outline-none"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
        />
      </div>
      <div className="max-h-56 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#D1FF26 rgba(16,20,29,0.3)" }}>
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
            NO LANGUAGES FOUND
          </p>
        )}
        {filtered.map((l) => {
          const isActive = l.code === lang;
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left transition-all"
              style={{ background: isActive ? "rgba(209,255,38,0.08)" : "transparent" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[8px] tracking-widest uppercase flex-shrink-0" style={{ color: isActive ? "#D1FF26" : "#8A8F98" }}>
                  {l.code}
                </span>
                <span className="text-xs truncate" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>
                  {l.native}
                </span>
              </div>
              {isActive && <Check size={12} style={{ color: "#D1FF26" }} className="flex-shrink-0" />}
            </button>
          );
        })}
      </div>
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: "0.5px solid rgba(138,143,152,0.12)" }}>
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
          {languages.length} LANGUAGES
        </span>
      </div>
    </div>
  );
}