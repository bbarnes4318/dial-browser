import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Headphones } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const GENRE_COLORS = {
  Comedy: "#A3E635", Action: "#FB923C", Thriller: "#EF4444", Mystery: "#8B5CF6",
  Romance: "#F472B6", War: "#94A3B8", History: "#D4A574", Crime: "#DC2626",
  Educational: "#22D3EE", Documentaries: "#60A5FA", "Children's": "#FBBF24", Drama: "#60AFA0", Urban: "#94A3B8",
};

export default function ContinueListening({ onPlay }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [progress, books] = await Promise.all([
          base44.entities.AudiobookProgress.list("-updated_date", 50),
          base44.entities.Audiobook.list("-created_date", 300),
        ]);
        const map = new Map((books || []).map((b) => [b.id, b]));
        const inProgress = (progress || [])
          .filter((p) => p.position_seconds > 0 && !p.completed && map.has(p.audiobook_id))
          .sort((a, b) => new Date(b.last_listened_at || 0) - new Date(a.last_listened_at || 0))
          .slice(0, 8)
          .map((p) => ({ progress: p, book: map.get(p.audiobook_id) }));
        if (!cancelled) setItems(inProgress);
      } catch {
        /* not logged in or no progress */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Headphones size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CONTINUE LISTENING</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map(({ progress, book }) => {
          const genreColor = GENRE_COLORS[book.genre] || "#D1FF26";
          const pct = progress.duration_seconds > 0
            ? Math.min(100, (progress.position_seconds / progress.duration_seconds) * 100)
            : 0;
          return (
            <motion.button
              key={book.id}
              onClick={() => onPlay(book)}
              whileHover={{ scale: 1.03 }}
              className="flex-shrink-0 w-44 text-left"
              style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${genreColor}33` }}
            >
              <div className="relative aspect-[3/2] overflow-hidden" style={{ background: `linear-gradient(135deg, ${genreColor}12, rgba(5,7,10,0.9))` }}>
                {book.cover_art_url ? (
                  <img src={proxyMediaUrl(book.cover_art_url)} alt={book.title} className="w-full h-full object-cover" style={{ filter: "brightness(0.85)" }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Headphones size={24} style={{ color: `${genreColor}66` }} /></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(5,7,10,0.45)" }}>
                  <div className="flex items-center justify-center w-11 h-11" style={{ background: "#D1FF26", borderRadius: "50%" }}>
                    <Play size={18} style={{ color: "#05070A" }} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(5,7,10,0.6)" }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: "#D1FF26" }} />
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-bold truncate" style={{ color: "#F5F5F7" }}>{book.title}</p>
                <p className="font-mono text-[8px] mt-0.5" style={{ color: "#8A8F98" }}>
                  Resume at {formatTime(progress.position_seconds)}{progress.chapter_index > 0 ? ` · CH ${progress.chapter_index + 1}` : ""} · {Math.round(pct)}%
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}