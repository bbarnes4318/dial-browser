import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, Loader2, Headphones, Download, Play, Clock, Library as LibraryIcon, Search, Bookmark,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import AudiobookPlayer from "@/components/audiobooks/AudiobookPlayer";
import ContinueListening from "@/components/audiobooks/ContinueListening";
import CollectionPicker from "@/components/audiobooks/CollectionPicker";
import SnippetPlayer from "@/components/audiobooks/SnippetPlayer";
import AudiobookPurchaseButton from "@/components/audiobooks/AudiobookPurchaseButton";
import SocialShare from "@/components/audiobooks/SocialShare";
import LibraryCardReviews from "@/components/audiobooks/LibraryCardReviews";
import VoiceSearchButton from "@/components/shared/VoiceSearchButton";
import RecommendedForYou from "@/components/audiobooks/RecommendedForYou";
import { useAuth } from "@/lib/AuthContext";

const GENRE_COLORS = {
  Comedy: "#A3E635", Action: "#FB923C", Thriller: "#EF4444", Mystery: "#8B5CF6",
  Romance: "#F472B6", War: "#94A3B8", History: "#D4A574", Crime: "#DC2626",
  Educational: "#22D3EE", Documentaries: "#60A5FA", "Children's": "#FBBF24", Drama: "#60AFA0", Urban: "#94A3B8",
};

function fileSafe(name) {
  return (name || "audiobook").replace(/[^a-z0-9 _-]/gi, "").trim().replace(/\s+/g, "_") || "audiobook";
}

export default function Library() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [pickerBook, setPickerBook] = useState(null);
  const [ownedIds, setOwnedIds] = useState(new Set());

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Audiobook.list("-created_date", 300);
      setBooks(list || []);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load the member's unlocked audiobooks so cards can show owned / buy state.
  useEffect(() => {
    if (!user) { setOwnedIds(new Set()); return; }
    (async () => {
      try {
        const purchases = await base44.entities.AudiobookPurchase.filter(
          { created_by_id: user.id, status: "paid" }, "-created_date", 200
        );
        setOwnedIds(new Set((purchases || []).map((p) => p.audiobook_id)));
      } catch {
        setOwnedIds(new Set());
      }
    })();
  }, [user]);

  const q = search.toLowerCase();
  const filtered = books.filter((b) =>
    !q ||
    b.title?.toLowerCase().includes(q) ||
    b.author?.toLowerCase().includes(q) ||
    b.genre?.toLowerCase().includes(q)
  );

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <LibraryIcon size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// AUDIOBOOK LIBRARY</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            The <span style={{ color: "#D1FF26" }}>Library.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Browse every audiobook in the collection. Tap play to listen to a sample, or download any title to keep.
          </p>
          <Link to="/my-library" className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_14px_rgba(209,255,38,0.25)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <Bookmark size={12} /> My Library
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or genre — or tap the mic and speak…"
            className="w-full pl-9 pr-14 py-3 text-sm outline-none"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
          />
          <VoiceSearchButton onResult={setSearch} title="Speak an audiobook title, author, or genre" />
        </div>

        {/* Continue Listening — resume from last position */}
        <ContinueListening onPlay={setSelectedBook} />

        {/* Recommended for You — based on genres/authors listened to */}
        <RecommendedForYou books={books} onPlay={setSelectedBook} />

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen size={36} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO AUDIOBOOKS FOUND</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((book, i) => (
              <LibraryCard key={book.id} book={book} index={i} onPlay={setSelectedBook} onSave={setPickerBook} owned={ownedIds.has(book.id)} user={user} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedBook && (
          <AudiobookPlayer book={selectedBook} onClose={() => setSelectedBook(null)} />
        )}
      </AnimatePresence>

      {pickerBook && (
        <CollectionPicker book={pickerBook} onClose={() => setPickerBook(null)} />
      )}
    </div>
  );
}

function LibraryCard({ book, index, onPlay, onSave, owned, user }) {
  const [imgError, setImgError] = useState(false);
  const genreColor = GENRE_COLORS[book.genre] || "#D1FF26";
  const hasAudio = (book.audio_url && book.audio_url.length > 0) || (book.chapter_audio_urls && book.chapter_audio_urls.length > 0);
  const price = parseFloat(book.price) || 0;
  const firstAudio = (book.chapter_audio_urls && book.chapter_audio_urls.length > 0) ? book.chapter_audio_urls[0] : book.audio_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      className="group flex flex-col overflow-hidden"
      style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${genreColor}22` }}
    >
      {/* Cover */}
      <div className="relative aspect-[3/2] overflow-hidden" style={{ background: `linear-gradient(135deg, ${genreColor}12, rgba(5,7,10,0.9))` }}>
        {book.cover_art_url && !imgError ? (
          <img
            src={proxyMediaUrl(book.cover_art_url)}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ filter: "brightness(0.92)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={40} style={{ color: `${genreColor}66` }} />
          </div>
        )}

        {/* Genre badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 font-mono text-[7px] tracking-widest uppercase" style={{ background: `${genreColor}33`, color: genreColor }}>
          {book.genre}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: "rgba(5,7,10,0.72)" }}>
          <button
            onClick={() => onPlay(book)}
            disabled={!hasAudio}
            className="flex items-center justify-center w-14 h-14 transition-transform hover:scale-110 disabled:opacity-30"
            style={{ background: "#D1FF26", borderRadius: "50%" }}
            title={hasAudio ? "Play sample" : "No audio yet"}
          >
            <Play size={22} style={{ color: "#05070A" }} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link to={`/library/${book.id}`} className="font-heading font-bold text-sm leading-tight transition-colors hover:text-[#D1FF26] block" style={{ color: "#F5F5F7" }}>{book.title}</Link>
          {book.is_new && (
            <span className="flex-shrink-0 font-mono text-[7px] tracking-widest uppercase font-bold px-1.5 py-0.5" style={{ background: "#D1FF26", color: "#05070A" }}>NEW</span>
          )}
        </div>
        <p className="text-[11px] mb-1" style={{ color: "#8A8F98" }}>{book.author}</p>
        {book.narrator && (
          <Link to={`/narrator/${encodeURIComponent(book.narrator)}`} className="font-mono text-[8px] tracking-wider uppercase mb-2 inline-block transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
            ▸ Narrated by {book.narrator}
          </Link>
        )}
        <p className="text-xs leading-relaxed line-clamp-3 mb-3 flex-1" style={{ color: "rgba(138,143,152,0.85)" }}>
          {book.description || "No description available."}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-2 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
          {book.duration_minutes > 0 && (
            <span className="flex items-center gap-1"><Clock size={9} /> {book.duration_minutes}m</span>
          )}
          {book.chapter_count > 1 && (
            <span className="flex items-center gap-1"><Headphones size={9} /> {book.chapter_count} ch</span>
          )}
          {book.series_name && (
            <span className="truncate">{book.series_name}{book.series_number ? ` · ${book.series_number}` : ""}</span>
          )}
        </div>

        {/* Price tag */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="font-mono text-[10px] tracking-wider font-bold" style={{ color: price > 0 ? "#D1FF26" : "#8A8F98" }}>
            {price > 0 ? `$${price.toFixed(2)}` : "FREE"}
          </span>
          {price > 0 && owned && (
            <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)" }}>OWNED</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => onPlay(book)}
            disabled={!hasAudio}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)] disabled:opacity-30"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            <Play size={12} /> {hasAudio ? "Play" : "Soon"}
          </button>
          {hasAudio && firstAudio && <SnippetPlayer url={firstAudio} />}
          {onSave && (
            <button
              onClick={() => onSave(book)}
              className="flex items-center justify-center px-3 transition-all hover:scale-105"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              title="Save to collection"
            >
              <Bookmark size={14} />
            </button>
          )}
          {price <= 0 && hasAudio && (
            <a
              href={`/functions/download-audiobook?id=${book.id}`}
              download={`${fileSafe(book.title)}.mp3`}
              className="flex items-center justify-center px-3 transition-all hover:scale-105"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              title="Download MP3"
            >
              <Download size={14} />
            </a>
          )}
        </div>

        {/* Buy / unlock full download (paid titles only) */}
        {price > 0 && (
          <AudiobookPurchaseButton book={book} owned={owned} user={user} />
        )}

        {/* Share */}
        <SocialShare book={book} />

        {/* Star rating + reviews */}
        <LibraryCardReviews book={book} />
      </div>
    </motion.div>
  );
}