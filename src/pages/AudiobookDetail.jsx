import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, Loader2, Headphones, Clock, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import AudiobookPlayer from "@/components/audiobooks/AudiobookPlayer";
import AudiobookReviewSection from "@/components/audiobooks/AudiobookReviewSection";
import ListenByPhone from "@/components/audiobooks/ListenByPhone";
import SocialShare from "@/components/audiobooks/SocialShare";

const GENRE_COLORS = {
  Comedy: "#A3E635", Action: "#FB923C", Thriller: "#EF4444", Mystery: "#8B5CF6",
  Romance: "#F472B6", War: "#94A3B8", History: "#D4A574", Crime: "#DC2626",
  Educational: "#22D3EE", Documentaries: "#60A5FA", "Children's": "#FBBF24",
  Drama: "#60AFA0", Urban: "#94A3B8",
};

export default function AudiobookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const b = await base44.entities.Audiobook.get(id);
        setBook(b);
      } catch {
        setBook(null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#05070A" }}>
        <BookOpen size={36} style={{ color: "rgba(209,255,38,0.3)" }} />
        <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>AUDIOBOOK NOT FOUND</p>
        <Link to="/library" className="mt-4 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>← Back to Library</Link>
      </div>
    );
  }

  const genreColor = GENRE_COLORS[book.genre] || "#D1FF26";
  const hasAudio = (book.audio_url && book.audio_url.length > 0) || (book.chapter_audio_urls && book.chapter_audio_urls.length > 0);
  const price = parseFloat(book.price) || 0;

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/library" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Library
        </Link>

        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {/* Cover */}
          <div className="w-full sm:w-48 flex-shrink-0">
            <div className="relative aspect-square overflow-hidden" style={{ background: `linear-gradient(135deg, ${genreColor}12, rgba(5,7,10,0.9))`, border: `0.5px solid ${genreColor}33` }}>
              {book.cover_art_url && !imgError ? (
                <img src={proxyMediaUrl(book.cover_art_url)} alt={book.title} onError={() => setImgError(true)} className="w-full h-full object-cover" style={{ filter: "brightness(0.92)" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><BookOpen size={40} style={{ color: `${genreColor}66` }} /></div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 font-mono text-[7px] tracking-widest uppercase" style={{ background: `${genreColor}33`, color: genreColor }}>{book.genre}</div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-1" style={{ color: "#F5F5F7" }}>{book.title}</h1>
            <p className="text-sm mb-1" style={{ color: "#8A8F98" }}>{book.author}</p>
            {book.narrator && (
              <Link to={`/narrator/${encodeURIComponent(book.narrator)}`} className="font-mono text-[8px] tracking-wider uppercase inline-block mb-3 transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                ▸ Narrated by {book.narrator}
              </Link>
            )}

            <div className="flex items-center gap-3 mb-4 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
              {book.duration_minutes > 0 && <span className="flex items-center gap-1"><Clock size={9} /> {book.duration_minutes}m</span>}
              {book.chapter_count > 1 && <span className="flex items-center gap-1"><Headphones size={9} /> {book.chapter_count} ch</span>}
              {book.series_name && <span className="truncate">{book.series_name}{book.series_number ? ` · ${book.series_number}` : ""}</span>}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] tracking-wider font-bold" style={{ color: price > 0 ? "#D1FF26" : "#8A8F98" }}>
                {price > 0 ? `$${price.toFixed(2)}` : "FREE"}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setPlaying(true)}
                disabled={!hasAudio}
                className="flex items-center gap-2 px-5 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)] disabled:opacity-30"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                <Play size={12} /> {hasAudio ? "Play" : "Coming Soon"}
              </button>
              <SocialShare book={book} />
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "rgba(138,143,152,0.9)" }}>
              {book.description || "No description available."}
            </p>
          </div>
        </div>

        {/* Listen by phone — metered phone bridge */}
        <ListenByPhone book={book} />

        {/* Reviews + ratings */}
        <AudiobookReviewSection book={book} />
      </div>

      {playing && <AudiobookPlayer book={book} onClose={() => setPlaying(false)} />}
    </div>
  );
}