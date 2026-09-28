import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Phone, ChevronRight } from "lucide-react";
import { dialServices } from "@/data/dialServices";
import NavLanguageButton from "@/components/landing/NavLanguageButton";

// Sticky homepage header search. Lets a visitor jump straight to a digital
// service detail page (and its dial-in instructions) by typing or picking a
// result. Sits at the top of the homepage content column, above the hero.
export default function HomeSearchHeader() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return dialServices.slice(0, 6);
    return dialServices
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.desc.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [q]);

  const select = (service) => {
    setOpen(false);
    setQuery("");
    navigate(`/directory/${service.id}`);
  };

  return (
    <div
      ref={wrapRef}
      className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-2.5"
      style={{
        background: "rgba(5,7,10,0.85)",
        backdropFilter: "blur(10px)",
        borderBottom: "0.5px solid rgba(209,255,38,0.18)",
      }}
    >
      <div className="flex items-center gap-3 max-w-5xl mx-auto">
        {/* Brand wordmark */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <span
            className="flex items-center justify-center w-7 h-7 font-heading font-black text-[11px]"
            style={{ background: "#D1FF26", color: "#05070A", borderRadius: 4 }}
          >
            DB
          </span>
          <span className="font-heading font-black text-sm tracking-tight" style={{ color: "#F5F5F7" }}>
            DIAL <span style={{ color: "#D1FF26" }}>BROWSER</span>
          </span>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <div
            className="relative"
            style={{
              background: "rgba(16,20,29,0.9)",
              border: "0.5px solid rgba(209,255,38,0.28)",
              boxShadow: "0 0 20px rgba(209,255,38,0.05)",
            }}
          >
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#D1FF26" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Find a digital service — e.g. weather, food, doctor, jobs…"
              className="w-full pl-9 pr-9 py-2.5 bg-transparent font-mono outline-none"
              style={{ color: "#F5F5F7", fontSize: "14px" }}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X size={13} style={{ color: "#8A8F98" }} />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {open && (
            <div
              className="absolute left-0 right-0 mt-1 max-h-[60vh] overflow-y-auto overscroll-contain"
              style={{
                background: "rgba(10,13,20,0.98)",
                border: "0.5px solid rgba(209,255,38,0.25)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {results.length === 0 ? (
                <p className="font-mono text-[11px] text-center py-6" style={{ color: "#8A8F98" }}>
                  No services match "{query}"
                </p>
              ) : (
                results.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => select(s)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all duration-150 hover:bg-[rgba(209,255,38,0.07)]"
                    style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}
                  >
                    <span className="text-lg flex-shrink-0">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-semibold text-[13px] truncate" style={{ color: "#F5F5F7" }}>{s.name}</p>
                        <span className="font-mono text-[7px] px-1.5 py-0.5 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>{s.category}</span>
                      </div>
                      <p className="text-[10px] truncate" style={{ color: "#8A8F98" }}>{s.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Phone size={10} style={{ color: "#D1FF26" }} />
                      <ChevronRight size={13} style={{ color: "#8A8F98" }} />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Language selector — right margin clears the fixed Live Signal indicator */}
        <div className="mr-[130px]">
          <NavLanguageButton variant="header" />
        </div>
      </div>
    </div>
  );
}