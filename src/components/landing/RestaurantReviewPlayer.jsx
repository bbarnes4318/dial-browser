import React, { useState, useRef, useEffect } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Search, Loader2, Play, Pause, Volume2, Star, MapPin, Radio, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function RestaurantReviewPlayer() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setReviews(null);
    setAudioUrl(null);
    setPlaying(false);
    try {
      const result = (await base44.functions.invoke("restaurant-reviews", { query: query.trim() })).data;
      setReviews(result);
    } catch (err) {
      setError("Unable to fetch reviews. Please try again.");
    }
    setLoading(false);
  };

  const handleListen = async () => {
    if (!reviews) return;
    if (audioUrl) {
      // toggle play/pause
      if (playing) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return;
    }
    setGeneratingAudio(true);
    try {
      const result = (await base44.functions.invoke("restaurant-review-audio", reviews)).data;
      setAudioUrl(result.url);
      // auto-play once URL is set
      setTimeout(() => audioRef.current?.play(), 300);
    } catch {
      setError("Unable to generate audio. Please try again.");
    }
    setGeneratingAudio(false);
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      const audio = audioRef.current;
      const onPlay = () => setPlaying(true);
      const onPause = () => setPlaying(false);
      const onEnded = () => setPlaying(false);
      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("ended", onEnded);
      return () => {
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("ended", onEnded);
      };
    }
  }, [audioUrl]);

  const EXAMPLES = ["Joe's Pizza, New York", "Nobu, London", "Tour d'Argent, Paris", "Gaggan Anand, Bangkok"];

  return (
    <section id="restaurant-reviews" className="snap-section relative py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-1/4 w-px h-full" style={{ background: "linear-gradient(180deg, transparent, rgba(209,255,38,0.3), transparent)" }} />
        <div className="absolute top-0 right-1/3 w-px h-full" style={{ background: "linear-gradient(180deg, transparent, rgba(209,255,38,0.2), transparent)" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Utensils size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// 1 CALL DINING</span>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Listen to <span style={{ color: "#D1FF26" }}>Restaurant Reviews</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Search any restaurant in the world and listen to real diner reviews read aloud — perfect for on-the-go decisions, accessibility, or hands-free dining research.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.form initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} onSubmit={handleSearch} className="mb-4">
          <div className="flex items-center gap-2 p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <Globe size={16} style={{ color: "#8A8F98" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any restaurant worldwide (e.g. 'Le Bernardin, New York')…"
              className="flex-1 bg-transparent text-sm sm:text-base outline-none"
              style={{ color: "#F5F5F7" }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40 whitespace-nowrap"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} {loading ? "Searching…" : "Find Reviews"}
            </button>
          </div>
        </motion.form>

        {/* Example searches */}
        {!reviews && !loading && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>TRY:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); }}
                className="font-mono text-[8px] tracking-widest px-2.5 py-1 transition-all hover:bg-[rgba(209,255,38,0.08)]"
                style={{ border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}
              >
                {ex.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 text-xs text-center" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin mb-3" style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SEARCHING GLOBAL REVIEWS…</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {reviews && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Restaurant header card */}
              <div className="p-5 mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-black text-xl sm:text-2xl" style={{ color: "#F5F5F7" }}>{reviews.restaurant_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={10} style={{ color: "#8A8F98" }} />
                      <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{reviews.location}</p>
                    </div>
                  </div>
                  {reviews.overall_rating > 0 && (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star size={14} fill="#D1FF26" style={{ color: "#D1FF26" }} />
                        <span className="font-heading font-black text-lg" style={{ color: "#D1FF26" }}>{reviews.overall_rating}</span>
                      </div>
                      {reviews.total_reviews > 0 && <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{reviews.total_reviews.toLocaleString()} REVIEWS</span>}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {reviews.cuisine && <Badge label={reviews.cuisine} />}
                  {reviews.price_range && <Badge label={`${reviews.price_range} PRICE`} />}
                  {reviews.vibe && <Badge label={reviews.vibe} />}
                </div>

                {/* Listen button */}
                <button
                  onClick={handleListen}
                  disabled={generatingAudio}
                  className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40"
                  style={{ background: audioUrl ? "rgba(209,255,38,0.12)" : "#D1FF26", color: audioUrl ? "#D1FF26" : "#05070A", border: audioUrl ? "0.5px solid rgba(209,255,38,0.4)" : "none" }}
                >
                  {generatingAudio ? <Loader2 size={14} className="animate-spin" /> : playing ? <Pause size={14} /> : <Play size={14} />}
                  {generatingAudio ? "Generating Audio…" : playing ? "Pause Reviews" : audioUrl ? "Resume Reviews" : "🎧 Listen to Reviews"}
                </button>

                {audioUrl && (
                  <audio ref={audioRef} src={proxyMediaUrl(audioUrl)} className="hidden" />
                )}

                {/* Now playing indicator */}
                {playing && (
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <Volume2 size={10} style={{ color: "#D1FF26" }} />
                    <div className="flex items-end gap-0.5 h-3">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-0.5"
                          style={{
                            background: "#D1FF26",
                            height: "100%",
                            animation: `eqBar 0.8s ease-in-out ${i * 0.1}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>NOW PLAYING</span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 mb-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// REVIEW SUMMARY</p>
                <p className="text-sm" style={{ color: "#F5F5F7", lineHeight: 1.6 }}>{reviews.review_summary}</p>
              </div>

              {/* Top reviews */}
              {reviews.top_reviews && reviews.top_reviews.length > 0 && (
                <div>
                  <p className="font-mono text-[8px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>// TOP REVIEWS</p>
                  <div className="space-y-3">
                    {reviews.top_reviews.map((r, i) => (
                      <div key={i} className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[9px] font-bold" style={{ color: "#F5F5F7" }}>{r.author}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={8} fill={s <= r.rating ? "#D1FF26" : "transparent"} style={{ color: "#D1FF26" }} />
                              ))}
                            </div>
                            <span className="font-mono text-[7px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>{r.source}</span>
                          </div>
                        </div>
                        <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Badge({ label }) {
  return (
    <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#8A8F98" }}>
      {typeof label === "string" ? label.toUpperCase() : label}
    </span>
  );
}

function buildAudioScript(r) {
  let script = `Welcome to 1 Call Dining. Here are the reviews for ${r.restaurant_name}, located in ${r.location}. `;
  script += `This restaurant serves ${r.cuisine} cuisine, with a price range of ${r.price_range}. `;
  if (r.overall_rating > 0) {
    script += `It has an overall rating of ${r.overall_rating} out of 5 stars, based on approximately ${r.total_reviews} reviews. `;
  }
  script += `Here's what diners are saying: ${r.review_summary} `;
  if (r.top_reviews && r.top_reviews.length > 0) {
    script += "Here are some top reviews. ";
    r.top_reviews.forEach((rev, i) => {
      script += `Review ${i + 1}, from ${rev.author} on ${rev.source}, rated ${rev.rating} out of 5 stars. ${rev.text} `;
    });
  }
  script += `That's all for ${r.restaurant_name}. Dial star 500 hash to hear more restaurant reviews anywhere in the world.`;
  return script;
}