import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Search, Phone, MessageSquare, Play, CheckCircle2, Globe, Radio, X } from "lucide-react";

const newsFeed = [
  { id: "n1", country: "United States", region: "North America", flag: "🇺🇸", headline: "Senate passes broadband expansion bill targeting rural connectivity gaps", category: "Politics", time: "2 min ago", dialCode: "*401#", station: "1CALL News DC" },
  { id: "n2", country: "Nigeria", region: "Africa", flag: "🇳🇬", headline: "Lagos tech hub reports record startup funding in Q2 2026", category: "Business", time: "8 min ago", dialCode: "*402#", station: "1CALL News Lagos" },
  { id: "n3", country: "United Kingdom", region: "Europe", flag: "🇬🇧", headline: "London unveils plan for city-wide voice-accessible public services", category: "Tech", time: "15 min ago", dialCode: "*403#", station: "1CALL News London" },
  { id: "n4", country: "Brazil", region: "South America", flag: "🇧🇷", headline: "São Paulo launches mobile-first citizen helpline for public transit", category: "Local", time: "22 min ago", dialCode: "*404#", station: "1CALL News SP" },
  { id: "n5", country: "Japan", region: "Asia", flag: "🇯🇵", headline: "Tokyo expands AI assistant pilot to 1,000 elderly residents", category: "Tech", time: "31 min ago", dialCode: "*405#", station: "1CALL News Tokyo" },
  { id: "n6", country: "India", region: "Asia", flag: "🇮🇳", headline: "Mumbai's voice commerce pilot reaches 100,000 active users", category: "Business", time: "44 min ago", dialCode: "*406#", station: "1CALL News Mumbai" },
  { id: "n7", country: "Kenya", region: "Africa", flag: "🇰🇪", headline: "Nairobi rural connectivity project connects 50 new villages", category: "Local", time: "1 hour ago", dialCode: "*407#", station: "1CALL News Nairobi" },
  { id: "n8", country: "Germany", region: "Europe", flag: "🇩🇪", headline: "Berlin announces digital inclusion initiative for elderly citizens", category: "Politics", time: "1 hour ago", dialCode: "*408#", station: "1CALL News Berlin" },
  { id: "n9", country: "Mexico", region: "North America", flag: "🇲🇽", headline: "Mexico City SMS-based public services expand to 12 new districts", category: "Local", time: "2 hours ago", dialCode: "*409#", station: "1CALL News CDMX" },
  { id: "n10", country: "Australia", region: "Oceania", flag: "🇦🇺", headline: "Sydney trials voice-first emergency response system", category: "Politics", time: "2 hours ago", dialCode: "*410#", station: "1CALL News Sydney" },
];

const categories = ["All", "Politics", "Business", "Tech", "Local"];

export default function OneCallNews() {
  const [inView, setInView] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [playing, setPlaying] = useState(null);
  const [selected, setSelected] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const filtered = newsFeed.filter((n) => {
    const matchesCat = activeCat === "All" || n.category === activeCat;
    const q = search.toLowerCase().trim();
    const matchesQ = !q || n.country.toLowerCase().includes(q) || n.headline.toLowerCase().includes(q) || n.region.toLowerCase().includes(q) || n.station.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const handlePlay = (item) => {
    setPlaying(item);
    // Simulate auto-play ending after a few seconds
    setTimeout(() => setPlaying(null), 6000);
  };

  return (
    <section ref={sectionRef} id="news-stream" className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
              <Globe size={12} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>FREE SERVICE · 24/7</span>
            </div>
          </div>
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// 1 CALL NEWS™</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Global News <span style={{ color: "#D1FF26" }}>by Voice &amp; SMS.</span>
          </h2>
          <p className="text-lg font-light max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            A 24/7 global news stream. Type any country to instantly browse its news right here in your browser. Always free.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="max-w-2xl mx-auto mb-4">
          <div className="relative">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a country, region, or topic..." className="w-full px-5 py-3 pl-12 text-sm outline-none" style={{ background: "rgba(16,20,29,0.8)", border: search.trim() ? "0.5px solid rgba(209,255,38,0.4)" : "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: search.trim() ? "#D1FF26" : "#8A8F98" }} />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }}><X size={16} /></button>}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {categories.map((cat) => {
              const isActive = activeCat === cat;
              return <button key={cat} onClick={() => setActiveCat(cat)} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>{cat}</button>;
            })}
          </div>
        </motion.div>

        {/* Live ticker bar */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="mb-6 overflow-hidden" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <div className="flex items-center">
            <div className="flex items-center gap-1.5 px-3 py-2 flex-shrink-0" style={{ background: "#D1FF26" }}>
              <Radio size={12} style={{ color: "#05070A" }} />
              <span className="font-mono text-[9px] font-bold tracking-widest" style={{ color: "#05070A" }}>LIVE</span>
            </div>
            <div className="overflow-hidden flex-1 py-2">
              <div className="flex gap-8 whitespace-nowrap" style={{ animation: "tickerScroll 30s linear infinite" }}>
                {[...newsFeed, ...newsFeed].map((n, i) => (
                  <span key={i} className="font-mono text-[10px] tracking-wide" style={{ color: "#8A8F98" }}>
                    {n.flag} {n.country}: <span style={{ color: "#F5F5F7" }}>{n.headline}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="text-center mb-4">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>{filtered.length} STOR{filtered.length !== 1 ? "IES" : "Y"} · FREE TO WATCH &amp; SHARE</p>
        </div>

        {/* News grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: Math.min(i * 0.04, 0.4) }} className="relative p-5 flex flex-col" style={{ background: "rgba(16,20,29,0.5)", border: playing?.id === item.id ? "0.5px solid rgba(209,255,38,0.5)" : "0.5px solid rgba(138,143,152,0.12)" }}>
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>{item.category.toUpperCase()}</span>
                <span className="text-xl">{item.flag}</span>
              </div>
              <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>{item.station.toUpperCase()}</p>
              <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{item.headline}</h3>
              <div className="flex items-center gap-2 mb-3 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                <span>{item.country}</span>·<span>{item.time}</span>
              </div>

              {/* Playback / SMS actions */}
              <div className="mt-auto pt-3 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                <button onClick={() => handlePlay(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: playing?.id === item.id ? "rgba(209,255,38,0.15)" : "#D1FF26", border: "0.5px solid #D1FF26", color: playing?.id === item.id ? "#D1FF26" : "#05070A" }}>
                  <Play size={11} /> {playing?.id === item.id ? "Playing..." : "Watch"}
                </button>
                <button onClick={() => setSelected(item)} className="flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  <MessageSquare size={11} /> SMS
                </button>
                <div className="flex items-center gap-1 px-2"><Phone size={10} style={{ color: "#D1FF26" }} /><span className="font-mono text-[9px] font-bold" style={{ color: "#D1FF26" }}>{item.dialCode}</span></div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16"><p className="font-mono text-sm tracking-widest" style={{ color: "#8A8F98" }}>NO STORIES FOUND</p></div>
        )}

        {/* Now playing bar */}
        <AnimatePresence>
          {playing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 flex items-center gap-3" style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.4)", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
              <div className="flex items-center gap-1">
                <span className="w-1 bg-[#D1FF26]" style={{ height: 8, animation: "eqBar 0.5s ease-in-out infinite" }} />
                <span className="w-1 bg-[#D1FF26]" style={{ height: 14, animation: "eqBar 0.7s ease-in-out infinite" }} />
                <span className="w-1 bg-[#D1FF26]" style={{ height: 10, animation: "eqBar 0.6s ease-in-out infinite" }} />
              </div>
              <div>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>NOW PLAYING · {playing.flag} {playing.country.toUpperCase()}</p>
                <p className="text-xs" style={{ color: "#F5F5F7" }}>{playing.headline.slice(0, 50)}...</p>
              </div>
              <button onClick={() => setPlaying(null)} className="ml-2"><X size={14} style={{ color: "#8A8F98" }} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SMS modal */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setSelected(null)}>
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md p-6" style={{ background: "#0A0D12", border: "0.5px solid rgba(209,255,38,0.3)" }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><MessageSquare size={14} style={{ color: "#D1FF26" }} /><p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SEND VIA SMS</p></div>
                  <button onClick={() => setSelected(null)}><X size={16} style={{ color: "#8A8F98" }} /></button>
                </div>
                <div className="p-3 mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                  <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>{selected.flag} {selected.station.toUpperCase()}</p>
                  <p className="text-sm" style={{ color: "#F5F5F7" }}>{selected.headline}</p>
                </div>
                <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.6 }}>News previews are shown right here in your browser. Full SMS delivery is coming soon — for now, browse and read any story instantly above.</p>
                <button onClick={() => setSelected(null)} className="w-full mt-3 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}