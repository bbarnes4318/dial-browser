import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Tv, Monitor, Star, ChevronRight, Play, X, Volume2, Phone, Loader2 } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

// Real public domain movies and TV shows from the Internet Archive
// All content is in the public domain and free to stream
const contentLibrary = {
  movies: [
    { id: "m1", title: "Night of the Living Dead", genre: "Horror", year: 1968, rating: "R", duration: "1h 36m", poster: "https://archive.org/services/img/night_of_the_living_dead", streamUrl: "https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4", desc: "The cult classic that started the zombie genre. Radiation brings the dead back to life, and a group of strangers barricade themselves in a farmhouse to survive the night." },
    { id: "m2", title: "Nosferatu", genre: "Silent Horror", year: 1922, rating: "NR", duration: "1h 34m", poster: "https://archive.org/services/img/nosferatu", streamUrl: "https://archive.org/download/nosferatu/nosferatu_512kb.mp4", desc: "The original vampire film. A real estate agent travels to Transylvania to meet Count Orlok, not realizing the horror that awaits." },
    { id: "m3", title: "Charade", genre: "Thriller", year: 1963, rating: "NR", duration: "1h 53m", poster: "https://archive.org/services/img/Charade1963", streamUrl: "https://archive.org/download/Charade1963/Charade1963_512kb.mp4", desc: "A romantic thriller starring Cary Grant and Audrey Hepburn. After her husband's murder, a woman discovers he had a fortune — and several men want it." },
    { id: "m4", title: "His Girl Friday", genre: "Comedy", year: 1940, rating: "NR", duration: "1h 32m", poster: "https://archive.org/services/img/HisGirlFriday1940", streamUrl: "https://archive.org/download/HisGirlFriday1940/HisGirlFriday1940_512kb.mp4", desc: "A fast-talking newspaper editor tries to win back his ex-wife star reporter with one last story. Cary Grant at his comedic best." },
    { id: "m5", title: "The Stranger", genre: "Film Noir", year: 1946, rating: "NR", duration: "1h 35m", poster: "https://archive.org/services/img/TheStranger1946", streamUrl: "https://archive.org/download/TheStranger1946/TheStranger1946_512kb.mp4", desc: "Orson Welles directs and stars as a Nazi war criminal hiding in a small Connecticut town, pursued by a federal investigator." },
    { id: "m6", title: "Penny Serenade", genre: "Drama", year: 1941, rating: "NR", duration: "1h 59m", poster: "https://archive.org/services/img/PennySerenade", streamUrl: "https://archive.org/download/PennySerenade/PennySerenade_512kb.mp4", desc: "Cary Grant and Irene Dunne star in this poignant drama about a couple reflecting on their life together through old records." },
  ],
  tv: [
    { id: "t1", title: "The Beverly Hillbillies — The Clampetts Strike Oil", genre: "Sitcom", year: 1962, rating: "TV-G", duration: "25m", poster: "https://archive.org/services/img/the_beverly_hillbillies", streamUrl: "https://archive.org/download/the_beverly_hillbillies/the_beverly_hillbillies_512kb.mp4", desc: "The pilot episode of the beloved sitcom. The Clampett family discovers oil on their land and moves to Beverly Hills." },
    { id: "t2", title: "Bonanza — Escape to Ponderosa", genre: "Western", year: 1960, rating: "TV-G", duration: "47m", poster: "https://archive.org/services/img/bonanza", streamUrl: "https://archive.org/download/bonanza/bonanza_512kb.mp4", desc: "A classic Western episode. The Cartwrights protect a man and his wife from outlaws seeking revenge on the Ponderosa ranch." },
    { id: "t3", title: "The Lucy Show — Lucy Meets the Bank Guard", genre: "Sitcom", year: 1962, rating: "TV-G", duration: "25m", poster: "https://archive.org/services/img/the_lucy_show", streamUrl: "https://archive.org/download/the_lucy_show/the_lucy_show_512kb.mp4", desc: "Lucille Ball stars in this classic sitcom episode where Lucy's attempts to be helpful create hilarious chaos at the bank." },
    { id: "t4", title: "Popeye — Cartoons Collection", genre: "Animation", year: 1950, rating: "NR", duration: "Compilation", poster: "https://archive.org/services/img/Popeye_cartoons", streamUrl: "https://archive.org/download/Popeye_cartoons/Popeye_cartoons_512kb.mp4", desc: "Classic Popeye the Sailor animated shorts. Watch Popeye, Olive Oyl, and Bluto in their timeless cartoon adventures." },
  ],
  streaming: [
    { id: "s1", title: "The Big Snit", genre: "Animated Short", year: 1985, rating: "PG", duration: "10m", poster: "https://archive.org/services/img/TheBigSnit", streamUrl: "https://archive.org/download/TheBigSnit/TheBigSnit_512kb.mp4", desc: "An Oscar-nominated animated short about a couple arguing over a game of Scrabble while a nuclear war unfolds outside." },
    { id: "s2", title: "The Sinking of the Lusitania", genre: "Animated Short", year: 1918, rating: "NR", duration: "12m", poster: "https://archive.org/services/img/Sinking_of_the_Lusitania", streamUrl: "https://archive.org/download/Sinking_of_the_Lusitania/Sinking_of_the_Lusitania_512kb.mp4", desc: "A groundbreaking animated documentary about the torpedoing of the Lusitania during World War I." },
    { id: "s3", title: "The Hulk vs Superman", genre: "Fan Animation", year: 1980, rating: "NR", duration: "3m", poster: "https://archive.org/services/img/hulk_vs_superman", streamUrl: "https://archive.org/download/hulk_vs_superman/hulk_vs_superman_512kb.mp4", desc: "A vintage fan-made animated crossover featuring two iconic superheroes in an epic showdown." },
  ],
};

const categories = [
  { id: "movies", label: "Movies", icon: Film },
  { id: "tv", label: "Television", icon: Tv },
  { id: "streaming", label: "Streaming", icon: Monitor },
];

export default function CallMedia() {
  const [activeCategory, setActiveCategory] = useState("movies");
  const [playingItem, setPlayingItem] = useState(null);

  const items = contentLibrary[activeCategory];
  const activeCat = categories.find((c) => c.id === activeCategory);

  const handleSpeak = (text) => {
    speak(text, { rate: 0.95 });
  };

  return (
    <>
      <section id="media" className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

        <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                <Star size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>PREMIUM SERVICE</span>
              </div>
            </div>
            <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// 1 CALL MEDIA™</p>
            <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
              Movies & TV <span style={{ color: "#D1FF26" }}>On Demand</span>
            </h2>
            <p className="text-lg font-light max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              Browse the library and stream public-domain movies and television right in your browser — or tap a title to hear its description read aloud.
            </p>
          </motion.div>

          {/* Category tabs */}
          <div className="flex justify-center gap-2 mb-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>
                  <Icon size={12} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 + i * 0.05 }}>
                <div className="group cursor-pointer" onClick={() => { setPlayingItem(item); handleSpeak(`${item.title}. ${item.desc}`); }}>
                  <div className="relative overflow-hidden mb-2" style={{ aspectRatio: "2/3", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                    <img src={item.poster} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x600/0A0D14/D1FF26?text=${encodeURIComponent(item.title)}`; }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,7,10,0.95), transparent 50%)" }} />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="font-mono text-[7px] tracking-widest" style={{ color: "#D1FF26" }}>{item.rating} · {item.duration}</p>
                    </div>
                    {/* Hover overlay — play button */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: "rgba(5,7,10,0.7)" }}>
                      <div className="flex items-center gap-1 px-3 py-2" style={{ background: "#D1FF26" }}>
                        <Play size={10} fill="#05070A" style={{ color: "#05070A" }} />
                        <span className="font-mono text-[8px] tracking-widest font-bold" style={{ color: "#05070A" }}>WATCH NOW</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold truncate transition-colors group-hover:text-[#D1FF26]" style={{ color: "#F5F5F7" }}>{item.title}</p>
                  <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{item.genre} · {item.year}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Note footer */}
          <div className="flex items-center justify-between p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div>
              <p className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>Public-domain library</p>
              <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>Stream free classics in your browser</p>
            </div>
            <div className="flex items-center gap-1 px-3 py-2" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <Film size={10} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>1 CALL MEDIA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              style={{ background: "rgba(5,7,10,0.92)", backdropFilter: "blur(8px)" }}
              onClick={() => { setPlayingItem(null); stopSpeaking(); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Title bar */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// NOW PLAYING</p>
                    <h3 className="font-heading font-bold text-lg lg:text-xl" style={{ color: "#F5F5F7" }}>{playingItem.title}</h3>
                    <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{playingItem.genre} · {playingItem.year} · {playingItem.rating} · {playingItem.duration}</p>
                  </div>
                  <button onClick={() => { setPlayingItem(null); stopSpeaking(); }} className="flex items-center justify-center w-9 h-9 transition-all hover:scale-105" style={{ background: "rgba(138,143,152,0.1)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
                    <X size={16} style={{ color: "#8A8F98" }} />
                  </button>
                </div>

                {/* Video player */}
                <div className="relative overflow-hidden" style={{ background: "#000", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <VideoPlayer src={playingItem.streamUrl} poster={playingItem.poster} />
                </div>

                {/* Description */}
                <div className="mt-3 p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <div className="flex items-start gap-3">
                    <p className="text-xs flex-1" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{playingItem.desc}</p>
                    <button
                      onClick={() => handleSpeak(playingItem.desc)}
                      className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)] flex-shrink-0"
                      style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                    >
                      <Volume2 size={11} /> Listen
                    </button>
                  </div>

                  {/* In-browser note */}
                  <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                    <Phone size={12} style={{ color: "#D1FF26" }} />
                    <p className="text-[11px]" style={{ color: "#8A8F98" }}>Streaming plays right here in your browser — tap the Listen button to hear the description read aloud.</p>
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

// Video player with loading state
function VideoPlayer({ src, poster }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const videoRef = useRef(null);

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#000" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "#000" }}>
          <Film size={32} style={{ color: "rgba(209,255,38,0.2)", marginBottom: 12 }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>UNABLE TO LOAD VIDEO</p>
          <p className="text-xs mt-2" style={{ color: "#8A8F98" }}>Please try another title</p>
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        autoPlay
        className="w-full h-full"
        style={{ display: error ? "none" : "block" }}
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </div>
  );
}