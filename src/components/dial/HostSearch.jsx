import React, { useState, useEffect, useMemo } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, X, Mic, Star, BadgeCheck, Loader2, Radio, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";

const RATING_FILTERS = [
  { value: 0, label: "Any" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
];

export default function HostSearch() {
  const [hosts, setHosts] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hostList = await base44.entities.VoiceHost.list("-created_date", 100);
        if (cancelled) return;
        setHosts(hostList || []);
      } catch (err) {
        console.error("Failed to load voice hosts", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const genres = useMemo(() => {
    const set = new Set(hosts.map((h) => h.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [hosts]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return hosts.filter((h) => {
      const matchesGenre = genre === "All" || h.category === genre;
      const r = ratings[h.id];
      const matchesRating = !r || (r.avg || 0) >= minRating;
      const shows = (h.hosted_shows || []).join(" ").toLowerCase();
      const matchesQuery =
        !q ||
        (h.host_name || "").toLowerCase().includes(q) ||
        (h.category || "").toLowerCase().includes(q) ||
        shows.includes(q) ||
        (h.bio || "").toLowerCase().includes(q);
      return matchesGenre && matchesRating && matchesQuery;
    });
  }, [hosts, ratings, query, genre, minRating]);

  return (
    <div className="mb-12">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Mic size={16} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE HOST DIRECTORY</p>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
          Find Your <span style={{ color: "#D1FF26" }}>Host</span>
        </h2>
        <p className="text-sm font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Search voice hosts by name, show genre, or service rating. Tap a host to view their profile.
        </p>
      </motion.div>

      {/* Search + filters */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: query.trim() ? "#D1FF26" : "#8A8F98" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hosts by name, show, or genre..."
            className="w-full pl-12 pr-12 py-3.5 font-mono text-sm tracking-wide outline-none transition-all"
            style={{
              background: "#10141D",
              border: query.trim() ? "0.5px solid rgba(209,255,38,0.35)" : "0.5px solid rgba(209,255,38,0.15)",
              color: "#F5F5F7",
              boxShadow: query.trim() ? "0 0 20px rgba(209,255,38,0.08)" : "none",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Genre chips */}
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all duration-300"
              style={{
                background: genre === g ? "#D1FF26" : "transparent",
                border: `0.5px solid ${genre === g ? "#D1FF26" : "rgba(209,255,38,0.15)"}`,
                color: genre === g ? "#05070A" : "#8A8F98",
              }}
            >
              {g}
            </button>
          ))}

          <div className="flex-1" />

          {/* Min rating filter */}
          <div className="flex items-center gap-1.5">
            <Star size={12} style={{ color: "#D1FF26" }} />
            {RATING_FILTERS.map((r) => (
              <button
                key={r.value}
                onClick={() => setMinRating(r.value)}
                className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all duration-300"
                style={{
                  background: minRating === r.value ? "rgba(209,255,38,0.12)" : "transparent",
                  border: `0.5px solid ${minRating === r.value ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.15)"}`,
                  color: minRating === r.value ? "#D1FF26" : "#8A8F98",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
          {loading ? "LOADING..." : `${filtered.length} HOST${filtered.length !== 1 ? "S" : ""} FOUND`}
        </p>
        {(query || genre !== "All" || minRating > 0) && !loading && (
          <button
            onClick={() => { setQuery(""); setGenre("All"); setMinRating(0); }}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors"
            style={{ color: "#D1FF26" }}
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      )}

      {/* Host grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((host, i) => {
              const r = ratings[host.id];
              return (
                <motion.div
                  key={host.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.2) }}
                >
                  <Link
                    to={`/host/${host.id}`}
                    className="block group relative p-5 transition-all duration-300 hover:shadow-[0_0_24px_rgba(209,255,38,0.1)]"
                    style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.08)" }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                        {host.headshot_url ? (
                          <img src={proxyMediaUrl(host.headshot_url)} alt={host.host_name} className="w-full h-full object-cover" />
                        ) : (
                          <Mic size={18} style={{ color: "#D1FF26" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{host.host_name}</h3>
                          {host.verified && <BadgeCheck size={14} style={{ color: "#D1FF26" }} />}
                        </div>
                        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{(host.category || "GENERAL").toUpperCase()}</p>
                      </div>
                    </div>

                    {host.bio && (
                      <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "#8A8F98" }}>{host.bio}</p>
                    )}

                    {host.hosted_shows && host.hosted_shows.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {host.hosted_shows.slice(0, 3).map((show) => (
                          <span key={show} className="flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                            <Radio size={8} /> {show}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => {
                            const avg = r?.avg || 0;
                            return (
                              <Star
                                key={n}
                                size={10}
                                style={{ color: n <= Math.round(avg) ? "#D1FF26" : "rgba(138,143,152,0.25)" }}
                                fill={n <= Math.round(avg) ? "#D1FF26" : "transparent"}
                              />
                            );
                          })}
                        </div>
                        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                          {r ? `${r.avg.toFixed(1)} (${r.count})` : "NEW"}
                        </span>
                      </div>
                      {host.phone && (
                        <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                          <Phone size={10} /> View
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Mic size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO MATCHING HOSTS</p>
          <p className="text-sm" style={{ color: "#8A8F98" }}>Try a different name, genre, or rating.</p>
        </div>
      )}
    </div>
  );
}