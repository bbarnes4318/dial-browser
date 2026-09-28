import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Phone, Tv, Film, Radio, Star, Check, Zap, Search, DollarSign, MessageSquare, Send, X, Loader2, Volume2, Film as FilmIcon } from "lucide-react";
import NetworkShorts from "@/components/landing/NetworkShorts";
import CreatorEarningsDashboard from "@/components/landing/CreatorEarningsDashboard";
import ShareNetwork from "@/components/landing/ShareNetwork";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const tabs = [
  { id: "movies", label: "Movies", icon: Film, dial: "*401#" },
  { id: "tv", label: "TV Shows", icon: Tv, dial: "*402#" },
  { id: "streaming", label: "Streaming", icon: Radio, dial: "*403#" },
  { id: "influencer", label: "Influencer", icon: Star, dial: "*404#" },
  { id: "shorts", label: "Shorts", icon: Zap, dial: "*405#" },
  { id: "earnings", label: "Earnings", icon: DollarSign, dial: "*406#" },
];

// Real public domain content from the Internet Archive — all free to stream
const content = {
  movies: [
    { id: "m1", title: "Night of the Living Dead", meta: "Horror · 1h 36m · 1968", rating: 8.4, gradient: "from-red-900/50 to-rose-800/10", poster: "https://archive.org/services/img/night_of_the_living_dead", streamUrl: "https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4", desc: "The cult classic that started the zombie genre. A group of strangers barricade themselves in a farmhouse to survive the night." },
    { id: "m2", title: "Nosferatu", meta: "Silent Horror · 1h 34m · 1922", rating: 7.9, gradient: "from-cyan-900/50 to-blue-800/10", poster: "https://archive.org/services/img/nosferatu", streamUrl: "https://archive.org/download/nosferatu/nosferatu_512kb.mp4", desc: "The original vampire film. A real estate agent travels to Transylvania to meet Count Orlok, unaware of the horror that awaits." },
    { id: "m3", title: "Charade", meta: "Thriller · 1h 53m · 1963", rating: 8.1, gradient: "from-amber-900/50 to-orange-800/10", poster: "https://archive.org/services/img/Charade1963", streamUrl: "https://archive.org/download/Charade1963/Charade1963_512kb.mp4", desc: "A romantic thriller starring Cary Grant and Audrey Hepburn. After her husband's murder, a woman discovers he had a fortune." },
    { id: "m4", title: "His Girl Friday", meta: "Comedy · 1h 32m · 1940", rating: 7.6, gradient: "from-indigo-900/50 to-purple-800/10", poster: "https://archive.org/services/img/HisGirlFriday1940", streamUrl: "https://archive.org/download/HisGirlFriday1940/HisGirlFriday1940_512kb.mp4", desc: "A fast-talking newspaper editor tries to win back his ex-wife star reporter with one last story. Cary Grant at his comedic best." },
    { id: "m5", title: "The Stranger", meta: "Film Noir · 1h 35m · 1946", rating: 7.8, gradient: "from-slate-700/50 to-slate-800/10", poster: "https://archive.org/services/img/TheStranger1946", streamUrl: "https://archive.org/download/TheStranger1946/TheStranger1946_512kb.mp4", desc: "Orson Welles directs and stars as a Nazi war criminal hiding in a small Connecticut town, pursued by a federal investigator." },
    { id: "m6", title: "Penny Serenade", meta: "Drama · 1h 59m · 1941", rating: 7.5, gradient: "from-emerald-900/50 to-teal-800/10", poster: "https://archive.org/services/img/PennySerenade", streamUrl: "https://archive.org/download/PennySerenade/PennySerenade_512kb.mp4", desc: "Cary Grant and Irene Dunne star in this poignant drama about a couple reflecting on their life together through old records." },
  ],
  tv: [
    { id: "t1", title: "The Beverly Hillbillies", meta: "Sitcom · S1 E01 · 1962", rating: 7.4, gradient: "from-emerald-900/50 to-teal-800/10", poster: "https://archive.org/services/img/the_beverly_hillbillies", streamUrl: "https://archive.org/download/the_beverly_hillbillies/the_beverly_hillbillies_512kb.mp4", desc: "The Clampett family discovers oil on their land and moves to Beverly Hills in the pilot episode of this beloved sitcom." },
    { id: "t2", title: "Bonanza", meta: "Western · S1 E01 · 1959", rating: 7.6, gradient: "from-sky-900/50 to-blue-800/10", poster: "https://archive.org/services/img/bonanza", streamUrl: "https://archive.org/download/bonanza/bonanza_512kb.mp4", desc: "The Cartwrights protect a man and his wife from outlaws seeking revenge on the Ponderosa ranch." },
    { id: "t3", title: "The Lucy Show", meta: "Sitcom · S1 E01 · 1962", rating: 7.2, gradient: "from-fuchsia-900/50 to-pink-800/10", poster: "https://archive.org/services/img/the_lucy_show", streamUrl: "https://archive.org/download/the_lucy_show/the_lucy_show_512kb.mp4", desc: "Lucille Ball stars in this classic sitcom where Lucy's attempts to be helpful create hilarious chaos at the bank." },
    { id: "t4", title: "Popeye Cartoons", meta: "Animation · Compilation · 1950s", rating: 7.0, gradient: "from-slate-700/50 to-slate-800/10", poster: "https://archive.org/services/img/Popeye_cartoons", streamUrl: "https://archive.org/download/Popeye_cartoons/Popeye_cartoons_512kb.mp4", desc: "Classic Popeye the Sailor animated shorts. Watch Popeye, Olive Oyl, and Bluto in their timeless cartoon adventures." },
  ],
  streaming: [
    { id: "s1", title: "The Big Snit", meta: "Animated Short · 10m · 1985", rating: 8.0, gradient: "from-orange-900/50 to-red-800/10", poster: "https://archive.org/services/img/TheBigSnit", streamUrl: "https://archive.org/download/TheBigSnit/TheBigSnit_512kb.mp4", desc: "An Oscar-nominated animated short about a couple arguing over Scrabble while nuclear war unfolds outside." },
    { id: "s2", title: "Sinking of the Lusitania", meta: "Animated Doc · 12m · 1918", rating: 7.3, gradient: "from-blue-900/50 to-indigo-800/10", poster: "https://archive.org/services/img/Sinking_of_the_Lusitania", streamUrl: "https://archive.org/download/Sinking_of_the_Lusitania/Sinking_of_the_Lusitania_512kb.mp4", desc: "A groundbreaking animated documentary about the torpedoing of the Lusitania during World War I." },
    { id: "s3", title: "Comedy: 'You Natzy Spy'", meta: "Comedy Short · 18m · 1940", rating: 7.8, gradient: "from-yellow-900/50 to-amber-800/10", poster: "https://archive.org/services/img/YouNatzySpy", streamUrl: "https://archive.org/download/YouNatzySpy/YouNatzySpy_512kb.mp4", desc: "The Three Stooges parody of dictators, released nine months before Charlie Chaplin's The Great Dictator." },
    { id: "s4", title: "The Hulk vs Superman", meta: "Fan Animation · 3m · 1980", rating: 7.1, gradient: "from-violet-900/50 to-purple-800/10", poster: "https://archive.org/services/img/hulk_vs_superman", streamUrl: "https://archive.org/download/hulk_vs_superman/hulk_vs_superman_512kb.mp4", desc: "A vintage fan-made animated crossover featuring two iconic superheroes in an epic showdown." },
  ],
  influencer: [
    { id: "i1", title: "Creator Channel — Coming Soon", meta: "Creator Upload · TBD", rating: 0, gradient: "from-rose-900/50 to-pink-800/10", desc: "This tab will feature content uploaded by 1 Call Network creators. Creators can broadcast their own shows, cooking demos, tech reviews, travel vlogs, and more — all accessible via voice call and SMS." },
  ],
};

function VideoPlayerModal({ item, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(5,7,10,0.92)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// NOW PLAYING</p>
            <h3 className="font-heading font-bold text-lg lg:text-xl" style={{ color: "#F5F5F7" }}>{item.title}</h3>
            <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{item.meta}</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-9 h-9 transition-all hover:scale-105" style={{ background: "rgba(138,143,152,0.1)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
            <X size={16} style={{ color: "#8A8F98" }} />
          </button>
        </div>
        <div className="relative overflow-hidden" style={{ background: "#000", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#000" }}>
              <Loader2 size={32} className="animate-spin" style={{ color: "#D1FF26" }} />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "#000" }}>
              <FilmIcon size={32} style={{ color: "rgba(209,255,38,0.2)", marginBottom: 12 }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>UNABLE TO LOAD VIDEO</p>
              <p className="text-xs mt-2" style={{ color: "#8A8F98" }}>Please try another title</p>
            </div>
          )}
          <video
            src={item.streamUrl}
            poster={item.poster}
            controls
            autoPlay
            className="w-full h-full"
            style={{ display: error ? "none" : "block", aspectRatio: "16/9" }}
            onLoadStart={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </div>
        {item.desc && (
          <div className="mt-3 p-4 flex items-start gap-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
            <p className="text-xs flex-1" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{item.desc}</p>
            <button
              onClick={() => speak(item.desc, { rate: 0.95 })}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)] flex-shrink-0"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
            >
              <Volume2 size={11} /> Listen
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function NetworkSection() {
  const [activeTab, setActiveTab] = useState("movies");
  const [playingItem, setPlayingItem] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [smsMode, setSmsMode] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const sendSmsLink = (e) => {
    e.preventDefault();
    if (!smsPhone.trim()) return;
    setSmsSent(true);
    setTimeout(() => {
      setSmsSent(false);
      setSmsMode(false);
      setSmsPhone("");
    }, 3500);
  };

  const activeDial = tabs.find((t) => t.id === activeTab).dial;
  const activeContent = content[activeTab] || [];

  const visibleContent = activeContent
    .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.meta.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sortBy === "rating" ? (b.rating || 0) - (a.rating || 0) : 0));

  return (
    <section ref={sectionRef} className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden min-h-[800px]" style={{ background: "#05070A" }}>
      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-10 lg:mb-14">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// 1 CALL NETWORK™</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Movies, TV & Creator TV <span style={{ color: "#D1FF26" }}>Over a Call.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Stream real public-domain films, classic TV shows, animated shorts, and live content — delivered as audio through any phone. No broadband, no smart TV, no subscription maze. All content is copyright-free and legal to stream.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setPlayingItem(null); }} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 transition-all" style={{ background: activeTab === t.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${activeTab === t.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}` }}>
                <Icon size={14} style={{ color: activeTab === t.id ? "#D1FF26" : "#8A8F98" }} />
                <span className="font-heading font-semibold text-sm" style={{ color: activeTab === t.id ? "#D1FF26" : "#F5F5F7" }}>{t.label}</span>
                <span className="hidden sm:inline font-mono text-[9px]" style={{ color: "#8A8F98" }}>{t.dial}</span>
              </button>
            );
          })}
        </div>

        {activeTab !== "shorts" && activeTab !== "earnings" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${tabs.find((t) => t.id === activeTab).label.toLowerCase()}…`} className="w-full pl-9 pr-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }} />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
            </div>
            <div className="flex gap-2">
              {[
                { id: "default", label: "Default" },
                { id: "rating", label: "Top Rated" },
              ].map((s) => (
                <button key={s.id} onClick={() => setSortBy(s.id)} className="px-3 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: sortBy === s.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${sortBy === s.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: sortBy === s.id ? "#D1FF26" : "#8A8F98" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "shorts" ? (
          <NetworkShorts />
        ) : activeTab === "earnings" ? (
          <CreatorEarningsDashboard />
        ) : activeTab === "influencer" ? (
          <div className="p-6 text-center" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <Star size={32} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-heading font-bold text-lg mb-2" style={{ color: "#F5F5F7" }}>Creator Content Channel</p>
            <p className="text-sm max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              This channel features shows, vlogs, and live streams created by 1 Call Network creators. Creators can upload their own content and reach audiences through voice calls and SMS — no app or smart TV required.
            </p>
            <p className="font-mono text-[9px] tracking-widest mt-4" style={{ color: "#D1FF26" }}>▸ CREATORS: DIAL *404# TO UPLOAD YOUR CONTENT</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleContent.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.06 }}
                className="group cursor-pointer overflow-hidden"
                style={{ background: "#10141D", border: `0.5px solid rgba(209,255,38,0.12)` }}
                onClick={() => { setPlayingItem(item); speak(`${item.title}. ${item.desc}`, { rate: 0.95 }); }}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
                  <img
                    src={item.poster}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x250/0A0D14/D1FF26?text=${encodeURIComponent(item.title)}`; }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,7,10,0.95), transparent 50%)" }} />
                  {item.rating > 0 && (
                    <span className="absolute top-2 left-2 font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: "rgba(5,7,10,0.7)", color: "#D1FF26" }}>★ {item.rating}</span>
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: "rgba(5,7,10,0.7)" }}>
                    <div className="flex items-center gap-1 px-3 py-2" style={{ background: "#D1FF26" }}>
                      <Play size={10} fill="#05070A" style={{ color: "#05070A" }} />
                      <span className="font-mono text-[8px] tracking-widest font-bold" style={{ color: "#05070A" }}>WATCH NOW</span>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-heading font-bold text-sm mb-0.5 truncate" style={{ color: "#F5F5F7" }}>{item.title}</h3>
                  <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{item.meta}</p>
                </div>
              </motion.div>
            ))}
            {visibleContent.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-10 text-center">
                <Search size={24} style={{ color: "rgba(209,255,38,0.3)" }} />
                <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>No results for "{query}"</p>
              </div>
            )}
          </div>
        )}

        {/* SMS link bar for movie/TV tabs */}
        {(activeTab === "movies" || activeTab === "tv" || activeTab === "streaming") && (
          <div className="mt-6 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ background: "rgba(209,255,38,0.03)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <Phone size={16} style={{ color: "#D1FF26", flexShrink: 0 }} />
            <p className="text-[11px] flex-1" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
              Stream directly here — voice dial-in ({activeDial}) and SMS link delivery are preview features coming soon. All content is public domain — free and legal.
            </p>
            {!smsSent ? (
              !smsMode ? (
                <button onClick={() => setSmsMode(true)} className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)] flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  <MessageSquare size={11} /> Send SMS Link
                </button>
              ) : (
                <form onSubmit={sendSmsLink} className="flex gap-2 w-full sm:w-auto">
                  <input value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} placeholder="Your phone number" type="tel" className="flex-1 px-3 py-2 text-[16px] sm:text-xs" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
                    <Send size={11} /> Send
                  </button>
                </form>
              )
            ) : (
              <div className="flex items-center gap-2">
                <Check size={16} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>SMS DELIVERY IS A PREVIEW FEATURE (COMING SOON)</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ShareNetwork />

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingItem && (
          <VideoPlayerModal item={playingItem} onClose={() => { setPlayingItem(null); stopSpeaking(); }} />
        )}
      </AnimatePresence>
    </section>
  );
}