import React, { useState } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion } from "framer-motion";
import { Play, BookOpen, Clock, Star } from "lucide-react";

const GENRE_COLORS = {
  Comedy: "#A3E635",
  Action: "#FB923C",
  Thriller: "#EF4444",
  Mystery: "#8B5CF6",
  Romance: "#F472B6",
  War: "#94A3B8",
  History: "#D4A574",
  Crime: "#DC2626",
  Educational: "#22D3EE",
  Documentaries: "#60A5FA",
  "Children's": "#FBBF24",
};

const MATURITY_LABELS = {
  G: "G — All Ages",
  PG: "PG — Guidance",
  "PG-13": "PG-13 — Teen+",
  R: "R — Adult",
  Children: "Kids",
};

// High-resolution genre-matched cover images (replaces broken archive.org URLs)
const GENRE_COVERS = {
  Comedy: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=4000&auto=format&fit=crop",
  Action: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=4000&auto=format&fit=crop",
  Thriller: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=4000&auto=format&fit=crop",
  Mystery: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=4000&auto=format&fit=crop",
  Romance: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=4000&auto=format&fit=crop",
  War: "https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=4000&auto=format&fit=crop",
  History: "https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=4000&auto=format&fit=crop",
  Crime: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=4000&auto=format&fit=crop",
  Educational: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=4000&auto=format&fit=crop",
  Documentaries: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=4000&auto=format&fit=crop",
  "Children's": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=4000&auto=format&fit=crop",
};

function getCoverUrl(book) {
  if (book.cover_art_url) return book.cover_art_url;
  return GENRE_COVERS[book.genre] || "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=4000&auto=format&fit=crop";
}

export default function AudiobookCard({ book, onPlay, progress }) {
  const [imgError, setImgError] = useState(false);
  const genreColor = GENRE_COLORS[book.genre] || "#D1FF26";
  const hasProgress = progress && progress.position_seconds > 0 && !progress.completed;
  const pct = hasProgress && progress.duration_seconds > 0
    ? Math.min(100, (progress.position_seconds / progress.duration_seconds) * 100)
    : 0;
  const coverUrl = getCoverUrl(book);
  const showFallback = !coverUrl || imgError;

  if (showFallback) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="group cursor-pointer relative"
      onClick={() => onPlay(book)}
    >
      {/* Cover */}
      <div className="relative aspect-square overflow-hidden" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${genreColor}30` }}>
        {showFallback ? (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${genreColor}15, rgba(5,7,10,0.8))` }}>
            <BookOpen size={32} style={{ color: `${genreColor}80` }} />
          </div>
        ) : (
          <img
            src={proxyMediaUrl(coverUrl)}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: "rgba(5,7,10,0.7)" }}>
          <div className="flex items-center justify-center w-12 h-12" style={{ background: "#D1FF26", borderRadius: "50%" }}>
            <Play size={18} style={{ color: "#05070A" }} />
          </div>
        </div>

        {/* Genre badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 font-mono text-[7px] tracking-widest uppercase" style={{ background: `${genreColor}30`, color: genreColor }}>
          {book.genre}
        </div>

        {/* NEW badge */}
        {book.is_new && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 font-mono text-[7px] tracking-widest uppercase font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
            NEW
          </div>
        )}

        {/* Maturity badge */}
        {!book.is_new && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 font-mono text-[7px] tracking-wider" style={{ background: book.maturity_rating === "R" ? "rgba(239,68,68,0.3)" : "rgba(5,7,10,0.7)", color: book.maturity_rating === "R" ? "#ef4444" : "#F5F5F7" }}>
            {book.maturity_rating}
          </div>
        )}

        {/* Series badge */}
        {book.series_type !== "standalone" && book.series_name && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 font-mono text-[7px] tracking-wider" style={{ background: "rgba(5,7,10,0.8)", color: "#D1FF26" }}>
            <Star size={7} /> {book.series_type === "developing" ? "ONGOING" : book.series_type.toUpperCase()}
          </div>
        )}

        {/* Progress bar */}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(5,7,10,0.6)" }}>
            <div className="h-full" style={{ width: `${pct}%`, background: "#D1FF26" }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2">
        {book.series_number && book.series_name && (
          <p className="font-mono text-[7px] tracking-wider" style={{ color: "#8A8F98" }}>{book.series_name} · BOOK {book.series_number}</p>
        )}
        <p className="text-xs font-semibold truncate" style={{ color: "#F5F5F7" }}>{book.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] truncate" style={{ color: "#8A8F98" }}>{book.author}</p>
          {book.duration_minutes && (
            <span className="flex items-center gap-0.5 font-mono text-[7px]" style={{ color: "#8A8F98" }}>
              <Clock size={7} /> {book.duration_minutes}m
            </span>
          )}
        </div>
        {hasProgress && (
          <p className="font-mono text-[7px] mt-0.5" style={{ color: "#D1FF26" }}>▸ CONTINUE LISTENING</p>
        )}
      </div>
    </motion.div>
  );
}