import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Play, Pause, DollarSign, Heart, Zap, Volume2, Check, Search } from "lucide-react";

const shorts = [
  { id: "sh1", title: "60-Second Recipe: Jollof Rice", creator: "Chef Amara", handle: "@chefamara", category: "Cooking", duration: 28, plays: 142000, rate: 0.012, gradient: "from-rose-900/50 to-pink-800/10" },
  { id: "sh2", title: "Market Haggle Tips", creator: "Trader Bisi", handle: "@bisi", category: "Business", duration: 22, plays: 89000, rate: 0.010, gradient: "from-amber-900/50 to-orange-800/10" },
  { id: "sh3", title: "Afrobeats Snippet — 'Drop'", creator: "DJ Seye", handle: "@djseye", category: "Music", duration: 30, plays: 310000, rate: 0.015, gradient: "from-orange-900/50 to-red-800/10" },
  { id: "sh4", title: "Farm Hack: Drip Irrigation", creator: "Agric Tunde", handle: "@agricTunde", category: "Education", duration: 18, plays: 47000, rate: 0.008, gradient: "from-lime-900/50 to-green-800/10" },
  { id: "sh5", title: "Comedy Skit: Lagos Traffic", creator: "MC Wale", handle: "@mcwale", category: "Comedy", duration: 25, plays: 220000, rate: 0.012, gradient: "from-fuchsia-900/50 to-purple-800/10" },
  { id: "sh6", title: "News Flash: Fuel Price Update", creator: "Radio Ngozi", handle: "@ngozi", category: "News", duration: 15, plays: 95000, rate: 0.009, gradient: "from-sky-900/50 to-blue-800/10" },
];

const fmtPlays = (n) => (n >= 1000 ? (n / 1000).toFixed(0) + "K" : n);

export default function NetworkShorts() {
  const [activeShort, setActiveShort] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tips, setTips] = useState({}); // shortId -> tip count
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("plays");
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // 30s playback progress
  useEffect(() => {
    if (!activeShort || !playing) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setPlaying(false);
          return 100;
        }
        return p + 100 / (activeShort.duration * 10); // 100ms ticks
      });
    }, 100);
    return () => clearInterval(t);
  }, [activeShort, playing]);

  const listen = (short) => {
    setConnecting(true);
    setActiveShort(null);
    setPlaying(false);
    setProgress(0);
    setTimeout(() => {
      setActiveShort(short);
      setPlaying(true);
      setProgress(0);
      setConnecting(false);
    }, 1200);
  };

  const tip = (id) => setTips((t) => ({ ...t, [id]: (t[id] || 0) + 1 }));

  const categories = ["all", ...new Set(shorts.map((s) => s.category))];
  const visibleShorts = shorts
    .filter((s) => (catFilter === "all" || s.category === catFilter) && (s.title.toLowerCase().includes(query.toLowerCase()) || s.creator.toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => (sortBy === "plays" ? b.plays - a.plays : b.rate - a.rate));

  const liveEarnings = activeShort ? activeShort.rate * (progress / 100) + (tips[activeShort.id] || 0) : 0;
  const totalPlays = shorts.reduce((s, x) => s + x.plays, 0);
  const totalEarned = shorts.reduce((s, x) => s + x.plays * x.rate, 0);

  return (
    <div ref={sectionRef} className="grid lg:grid-cols-3 gap-4">
      {/* Shorts feed */}
      <div className="lg:col-span-2">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SHORTS FEED · 30s OR LESS</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shorts or creators…" className="w-full pl-9 pr-3 py-2 text-[16px] sm:text-sm" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }} />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 text-[16px] sm:text-sm bg-transparent" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}>
            <option value="plays" style={{ background: "#10141D" }}>Most Played</option>
            <option value="rate" style={{ background: "#10141D" }}>Top Earning</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} className="px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: catFilter === c ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${catFilter === c ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: catFilter === c ? "#D1FF26" : "#8A8F98" }}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {visibleShorts.map((short, idx) => {
            const isActive = activeShort?.id === short.id;
            return (
              <motion.div key={short.id} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: idx * 0.05 }} className="overflow-hidden" style={{ background: "#10141D", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.12)"}` }}>
                <div className={`relative h-20 flex items-end justify-between p-3 bg-gradient-to-br ${short.gradient}`}>
                  <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                    <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
                  </div>
                  <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: "rgba(5,7,10,0.7)", color: "#D1FF26" }}>{short.category.toUpperCase()}</span>
                  <span className="font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(5,7,10,0.7)", color: "#F5F5F7" }}>0:{String(short.duration).padStart(2, "0")}</span>
                </div>
                <div className="p-3">
                  <h3 className="font-heading font-bold text-sm mb-0.5" style={{ color: "#F5F5F7" }}>{short.title}</h3>
                  <p className="font-mono text-[10px] mb-2" style={{ color: "#8A8F98" }}>{short.creator} · {short.handle}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                      <span>▶ {fmtPlays(short.plays)}</span>
                      <span style={{ color: "#D1FF26" }}>${(short.plays * short.rate).toFixed(0)} earned</span>
                    </div>
                    <button onClick={() => listen(short)} className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: isActive && playing ? "rgba(209,255,38,0.25)" : "#D1FF26", color: "#05070A" }}>
                      {isActive && playing ? <><Pause size={11} /> Playing</> : <><Play size={11} /> Listen</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {visibleShorts.length === 0 && (
            <div className="sm:col-span-2 flex flex-col items-center justify-center py-10 text-center">
              <Search size={22} style={{ color: "rgba(209,255,38,0.3)" }} />
              <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>No shorts match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Creator studio / monetization */}
      <div className="p-5 h-fit" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CREATOR STUDIO</p>
        </div>

        <AnimatePresence mode="wait">
          {connecting ? (
            <motion.div key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-10">
              <Phone size={28} className="animate-pulse" style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#D1FF26" }}>Connecting via *405#…</p>
            </motion.div>
          ) : activeShort ? (
            <motion.div key={activeShort.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`relative h-20 mb-3 flex items-center justify-center bg-gradient-to-br ${activeShort.gradient}`} style={{ border: "0.5px solid rgba(209,255,38,0.15)" }}>
                {playing && (
                  <div className="flex items-end gap-0.5 h-8">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="w-1" style={{ background: "#D1FF26", animation: `eqBar ${0.6 + i * 0.12}s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
                <span className="absolute top-2 right-2 font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(5,7,10,0.7)", color: "#F5F5F7" }}>0:{String(activeShort.duration).padStart(2, "0")}</span>
              </div>
              <h3 className="font-heading font-bold text-base mb-0.5" style={{ color: "#F5F5F7" }}>{activeShort.title}</h3>
              <p className="font-mono text-[10px] mb-3" style={{ color: "#8A8F98" }}>{activeShort.creator} · {activeShort.handle}</p>

              {/* Progress */}
              <div className="h-1 w-full mb-2 overflow-hidden" style={{ background: "rgba(138,143,152,0.15)" }}>
                <div className="h-full" style={{ width: `${progress}%`, background: "#D1FF26", transition: "width 0.1s linear" }} />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{Math.floor((progress / 100) * activeShort.duration)}s / {activeShort.duration}s</span>
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>LIVE · *405#</span>
              </div>

              {/* Live earnings */}
              <div className="p-3 mb-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>LIVE EARNINGS THIS LISTEN</p>
                <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>${liveEarnings.toFixed(3)}</p>
                <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>${activeShort.rate.toFixed(3)} per play · {tips[activeShort.id] || 0} tip(s)</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setPlaying(!playing)} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
                  {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
                </button>
                <button onClick={() => tip(activeShort.id)} className="flex items-center justify-center gap-1.5 px-4 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
                  <Heart size={13} /> Tip $1
                </button>
              </div>
              <p className="flex items-center justify-center gap-1.5 mt-3 font-mono text-[9px]" style={{ color: "#D1FF26" }}>
                <Check size={10} /> Streaming as audio over your call
              </p>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-8 text-center">
              <Volume2 size={26} style={{ color: "rgba(209,255,38,0.3)" }} />
              <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>Tap a short to listen</p>
              <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>or dial *405# and say "play shorts"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aggregate monetization */}
        <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>// NETWORK SHORTS · ALL CREATORS</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>TOTAL PLAYS</p>
              <p className="font-mono text-lg font-bold" style={{ color: "#F5F5F7" }}>{fmtPlays(totalPlays)}</p>
            </div>
            <div className="p-2.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>CREATORS PAID</p>
              <p className="font-mono text-lg font-bold" style={{ color: "#D1FF26" }}>${totalEarned.toFixed(0)}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { label: "Per-play royalty", val: "$0.008–$0.015" },
              { label: "Listener tips", val: "100% to creator" },
              { label: "Sponsorships", val: "Brand-matched" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between font-mono text-[9px]">
                <span style={{ color: "#8A8F98" }}>{r.label}</span>
                <span style={{ color: "#F5F5F7" }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}