import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mic, BookOpen, Loader2, Play, X, ImageIcon, Headphones, Clock, Download,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import AudiobookPlayer from "@/components/audiobooks/AudiobookPlayer";

const GENRE_COLORS = {
  Comedy: "#A3E635", Action: "#FB923C", Thriller: "#EF4444", Mystery: "#8B5CF6",
  Romance: "#F472B6", War: "#94A3B8", History: "#D4A574", Crime: "#DC2626",
  Educational: "#22D3EE", Documentaries: "#60A5FA", "Children's": "#FBBF24", Drama: "#60AFA0", Urban: "#94A3B8",
};

function fileSafe(name) {
  return (name || "audiobook").replace(/[^a-z0-9 _-]/gi, "").trim().replace(/\s+/g, "_") || "audiobook";
}

export default function NarratorProfile() {
  const { name } = useParams();
  const decoded = decodeURIComponent(name || "");
  const [narrator, setNarrator] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [narrators, allBooks] = await Promise.all([
        base44.entities.Narrator.list("-created_date", 100),
        base44.entities.Audiobook.list("-created_date", 300),
      ]);
      const match = (narrators || []).find((n) => (n.name || "").toLowerCase() === decoded.toLowerCase());
      setNarrator(match || null);
      setBooks((allBooks || []).filter((b) => (b.narrator || "").toLowerCase() === decoded.toLowerCase()));
    } catch { setBooks([]); }
    finally { setLoading(false); }
  }, [decoded]);

  useEffect(() => { load(); }, [load]);

  const displayName = narrator?.name || decoded;
  const initials = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const gallery = narrator?.gallery_urls || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/library" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Library
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start gap-6 mb-10">
          <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: narrator?.photo_url ? "transparent" : "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            {narrator?.photo_url ? (
              <img src={proxyMediaUrl(narrator.photo_url)} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading font-black text-4xl" style={{ color: "#D1FF26" }}>{initials}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-mono text-xs tracking-[0.4em] mb-2" style={{ color: "#D1FF26" }}>// NARRATOR PROFILE</p>
            <h1 className="font-heading font-black text-3xl sm:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>{displayName}</h1>
            {narrator?.tagline && <p className="text-sm mb-3" style={{ color: "#8A8F98" }}>{narrator.tagline}</p>}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <Mic size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{books.length} TITLES</span>
              </div>
              {narrator?.accent && (
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{narrator.accent.toUpperCase()}</span>
                </div>
              )}
            </div>
            {narrator?.bio ? (
              <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "#8A8F98" }}>{narrator.bio}</p>
            ) : books.length > 0 ? (
              <p className="text-sm max-w-2xl" style={{ color: "rgba(138,143,152,0.6)" }}>Full narrator profile coming soon. Browse their recorded titles below.</p>
            ) : null}
          </div>
        </motion.div>

        {/* Photo gallery */}
        {gallery.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ PHOTO GALLERY</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((url, i) => (
                <motion.button
                  key={i}
                  onClick={() => setLightbox(url)}
                  whileHover={{ scale: 1.03 }}
                  className="aspect-square overflow-hidden"
                  style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.2)" }}
                >
                  <img src={proxyMediaUrl(url)} alt={`${displayName} ${i + 1}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Recorded titles */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ RECORDED TITLES</p>
          </div>
          {books.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={36} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO TITLES FOUND FOR THIS NARRATOR</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book, i) => {
                const genreColor = GENRE_COLORS[book.genre] || "#D1FF26";
                const hasAudio = (book.audio_url && book.audio_url.length > 0) || (book.chapter_audio_urls && book.chapter_audio_urls.length > 0);
                return (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    className="group flex flex-col overflow-hidden"
                    style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${genreColor}22` }}
                  >
                    <div className="relative aspect-[3/2] overflow-hidden" style={{ background: `linear-gradient(135deg, ${genreColor}12, rgba(5,7,10,0.9))` }}>
                      {book.cover_art_url ? (
                        <img src={proxyMediaUrl(book.cover_art_url)} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ filter: "brightness(0.92)" }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><BookOpen size={36} style={{ color: `${genreColor}66` }} /></div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 font-mono text-[7px] tracking-widest uppercase" style={{ background: `${genreColor}33`, color: genreColor }}>{book.genre}</div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: "rgba(5,7,10,0.72)" }}>
                        <button onClick={() => setSelectedBook(book)} disabled={!hasAudio} className="flex items-center justify-center w-14 h-14 transition-transform hover:scale-110 disabled:opacity-30" style={{ background: "#D1FF26", borderRadius: "50%" }}>
                          <Play size={22} style={{ color: "#05070A" }} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="font-heading font-bold text-sm leading-tight mb-1" style={{ color: "#F5F5F7" }}>{book.title}</p>
                      <p className="text-[11px] mb-2" style={{ color: "#8A8F98" }}>{book.author}</p>
                      <p className="text-xs leading-relaxed line-clamp-2 mb-3 flex-1" style={{ color: "rgba(138,143,152,0.85)" }}>{book.description || "No description available."}</p>
                      <div className="flex items-center gap-3 mb-3 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                        {book.duration_minutes > 0 && <span className="flex items-center gap-1"><Clock size={9} /> {book.duration_minutes}m</span>}
                        {book.chapter_count > 1 && <span className="flex items-center gap-1"><Headphones size={9} /> {book.chapter_count} ch</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedBook(book)} disabled={!hasAudio} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold disabled:opacity-30" style={{ background: "#D1FF26", color: "#05070A" }}>
                          <Play size={12} /> {hasAudio ? "Play" : "Soon"}
                        </button>
                        {hasAudio && (
                          <a href={`/functions/download-audiobook?id=${book.id}`} download={`${fileSafe(book.title)}.mp3`} className="flex items-center justify-center px-3" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }} title="Download MP3">
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)} className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.92)" }}>
            <button className="absolute top-4 right-4" onClick={() => setLightbox(null)}><X size={24} style={{ color: "#D1FF26" }} /></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={proxyMediaUrl(lightbox)} alt={displayName} className="max-w-full max-h-[88vh] object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBook && <AudiobookPlayer book={selectedBook} onClose={() => setSelectedBook(null)} />}
      </AnimatePresence>
    </div>
  );
}