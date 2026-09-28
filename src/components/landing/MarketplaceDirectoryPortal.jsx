import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";

const LIME = "#D1FF26";

// MarketplaceDirectoryPortal — a compact search entry placed under each
// marketplace banner on the homepage. Users search or click through to the
// dedicated directory page (/motors, /real-estate, /foods) where the full
// browseable marketplace grid lives. No images are rendered here.
export default function MarketplaceDirectoryPortal({
  id,
  glyph,
  eyebrow,
  searchPlaceholder,
  route,
  ctaLabel,
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const go = () => {
    const query = q.trim();
    navigate(query ? `${route}?q=${encodeURIComponent(query)}` : route);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    go();
  };

  return (
    <section id={id} className="relative py-8 lg:py-10" style={{ background: "#05070A" }}>
      <div className="px-3 lg:px-6 max-w-3xl mx-auto w-full">
        <div className="relative p-6 lg:p-8" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          {/* top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full w-1/4" style={{ background: `linear-gradient(90deg, transparent, ${LIME}, transparent)`, animation: "tickerScroll 3s linear infinite" }} />
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="flex items-center justify-center w-11 h-11 text-xl mb-3" style={{ background: "rgba(209,255,38,0.10)", border: `0.5px solid ${LIME}55` }}>
              {glyph}
            </span>
            <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: LIME }}>{eyebrow}</p>

            {/* search directory portal */}
            <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-2 w-full max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "#8A8F98" }} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-3 py-3 text-[16px] sm:text-sm outline-none"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: LIME, color: "#05070A" }}>
                <Search size={14} /> Search
              </button>
            </form>

            <button
              onClick={() => navigate(route)}
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]"
              style={{ color: "#8A8F98" }}
            >
              {ctaLabel} <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}