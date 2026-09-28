import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, BookOpen, Loader2, Library, Star,
  Headphones, RotateCcw, Filter, X, Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AudiobookCard from "@/components/audiobooks/AudiobookCard";
import AudiobookPlayer from "@/components/audiobooks/AudiobookPlayer";

const GENRES = [
  "Comedy", "Action", "Thriller", "Mystery", "Romance",
  "War", "History", "Crime", "Educational", "Documentaries", "Children's",
];

const MATURITY_FILTERS = [
  { value: "all", label: "All Ages" },
  { value: "G", label: "G" },
  { value: "PG", label: "PG" },
  { value: "PG-13", label: "PG-13" },
  { value: "R", label: "R" },
];

export default function Audiobooks() {
  const [books, setBooks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("all");
  const [maturityFilter, setMaturityFilter] = useState("all");
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [bookList, progressList] = await Promise.all([
        base44.entities.Audiobook.list("-created_date", 200),
        base44.entities.AudiobookProgress.list("-updated_date", 100).catch(() => []),
      ]);
      setBooks(bookList || []);
      setProgress(progressList || []);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const progressMap = {};
  (progress || []).forEach((p) => { progressMap[p.audiobook_id] = p; });

  const filtered = books.filter((b) => {
    const matchesGenre = activeGenre === "all" || b.genre === activeGenre;
    const matchesMaturity = maturityFilter === "all" || b.maturity_rating === maturityFilter;
    const matchesSeries = seriesFilter === "all" ||
      (seriesFilter === "standalone" && b.series_type === "standalone") ||
      (seriesFilter === "trilogy" && b.series_type === "trilogy") ||
      (seriesFilter === "series" && b.series_type === "series") ||
      (seriesFilter === "developing" && b.series_type === "developing");
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.series_name?.toLowerCase().includes(q);
    return matchesGenre && matchesMaturity && matchesSeries && matchesSearch;
  });

  // Group by series
  const seriesBooks = {};
  const standaloneBooks = [];
  filtered.forEach((b) => {
    if (b.series_name && b.series_type !== "standalone") {
      if (!seriesBooks[b.series_name]) seriesBooks[b.series_name] = [];
      seriesBooks[b.series_name].push(b);
    } else {
      standaloneBooks.push(b);
    }
  });

  // Sort series books by number
  Object.values(seriesBooks).forEach((arr) => arr.sort((a, b) => (a.series_number || 0) - (b.series_number || 0)));

  const continueListening = books.filter((b) => {
    const p = progressMap[b.id];
    return p && p.position_seconds > 0 && !p.completed;
  });

  const newReleases = books.filter((b) => b.is_new);
  const newTitles = new Set(newReleases.map((b) => b.title));
  const featured = books.filter((b) => b.featured && !b.is_new && !newTitles.has(b.title)).slice(0, 6);
  const displayFeatured = featured;

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 pt-8 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Library size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// AUDIOBOOK LIBRARY</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Dial. Listen. <span style={{ color: "#D1FF26" }}>Escape.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            {books.length} real audiobooks with human narration. Stream by phone or browser. Resume where you left off — your progress is saved automatically.
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or series…"
              className="w-full pl-9 pr-12 py-3 text-sm outline-none"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8"
              style={{ color: showFilters ? "#D1FF26" : "#8A8F98" }}
            >
              <Filter size={14} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="p-3 space-y-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div>
                  <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>MATURITY</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MATURITY_FILTERS.map((m) => (
                      <button key={m.value} onClick={() => setMaturityFilter(m.value)} className="px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase" style={{ background: maturityFilter === m.value ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)", border: `0.5px solid ${maturityFilter === m.value ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: maturityFilter === m.value ? "#D1FF26" : "#8A8F98" }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>SERIES TYPE</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[{ v: "all", l: "All" }, { v: "standalone", l: "Standalone" }, { v: "trilogy", l: "Trilogies" }, { v: "series", l: "Series" }, { v: "developing", l: "Ongoing" }].map((s) => (
                      <button key={s.v} onClick={() => setSeriesFilter(s.v)} className="px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase" style={{ background: seriesFilter === s.v ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)", border: `0.5px solid ${seriesFilter === s.v ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: seriesFilter === s.v ? "#D1FF26" : "#8A8F98" }}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Genre chips */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto overscroll-contain pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
          <button onClick={() => setActiveGenre("all")} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap" style={{ background: activeGenre === "all" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${activeGenre === "all" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: activeGenre === "all" ? "#D1FF26" : "#8A8F98" }}>
            All
          </button>
          {GENRES.map((g) => (
            <button key={g} onClick={() => setActiveGenre(g)} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap" style={{ background: activeGenre === g ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${activeGenre === g ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: activeGenre === g ? "#D1FF26" : "#8A8F98" }}>
              {g}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : (
          <>
            {/* New Releases — the 10 newly added audiobooks */}
            {newReleases.length > 0 && activeGenre === "all" && !search && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>NEW RELEASES</p>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{newReleases.length} NEW TITLES</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {newReleases.map((book) => (
                    <AudiobookCard key={book.id} book={book} onPlay={setSelectedBook} progress={progressMap[book.id]} />
                  ))}
                </div>
              </div>
            )}

            {/* Continue Listening */}
            {continueListening.length > 0 && activeGenre === "all" && !search && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>CONTINUE LISTENING</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {continueListening.slice(0, 6).map((book) => (
                    <AudiobookCard key={book.id} book={book} onPlay={setSelectedBook} progress={progressMap[book.id]} />
                  ))}
                </div>
              </div>
            )}

            {/* Featured */}
            {displayFeatured.length > 0 && activeGenre === "all" && !search && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>FEATURED</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {displayFeatured.map((book) => (
                    <AudiobookCard key={book.id} book={book} onPlay={setSelectedBook} progress={progressMap[book.id]} />
                  ))}
                </div>
              </div>
            )}

            {/* Series */}
            {Object.entries(seriesBooks).length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>SERIES & TRILOGIES</p>
                </div>
                {Object.entries(seriesBooks).map(([seriesName, seriesBooksList]) => (
                  <div key={seriesName} className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{seriesName}</p>
                      <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                        {seriesBooksList[0]?.series_type === "developing" ? "ONGOING SERIES" : `${seriesBooksList.length} BOOKS`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {seriesBooksList.map((book) => (
                        <AudiobookCard key={book.id} book={book} onPlay={setSelectedBook} progress={progressMap[book.id]} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All books */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Headphones size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>ALL AUDIOBOOKS</p>
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{filtered.length} TITLES</span>
              </div>
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen size={36} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO AUDIOBOOKS FOUND</p>
                  <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>Try a different search or filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {filtered.map((book) => (
                    <AudiobookCard key={book.id} book={book} onPlay={setSelectedBook} progress={progressMap[book.id]} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Player modal */}
      <AnimatePresence>
        {selectedBook && (
          <AudiobookPlayer book={selectedBook} onClose={() => setSelectedBook(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}