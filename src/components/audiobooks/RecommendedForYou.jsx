import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AudiobookCard from "@/components/audiobooks/AudiobookCard";
import { Sparkles } from "lucide-react";

// Suggests audiobooks the member hasn't listened to yet, drawn from the genres
// and authors of titles they have progress on. Hidden for guests or when there
// is not enough listening history to make a recommendation.
export default function RecommendedForYou({ books, onPlay }) {
  const { user } = useAuth();
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    if (!user || !books.length) { setRecs([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const progress = await base44.entities.AudiobookProgress.filter(
          { created_by_id: user.id }, "-updated_date", 100
        );
        const listenedIds = new Set((progress || []).map((p) => p.audiobook_id));
        if (listenedIds.size === 0) { if (!cancelled) setRecs([]); return; }
        const listenedBooks = books.filter((b) => listenedIds.has(b.id));
        const genres = new Set(listenedBooks.map((b) => b.genre).filter(Boolean));
        const authors = new Set(listenedBooks.map((b) => b.author).filter(Boolean));
        const recommended = books.filter((b) =>
          !listenedIds.has(b.id) && (genres.has(b.genre) || authors.has(b.author))
        ).slice(0, 12);
        if (!cancelled) setRecs(recommended);
      } catch {
        if (!cancelled) setRecs([]);
      }
    })();
    return () => { cancelled = true; };
  }, [user, books]);

  if (!user || recs.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// RECOMMENDED FOR YOU</p>
      </div>
      <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>Based on the genres and authors you've listened to.</p>
      <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "thin" }}>
        {recs.map((b) => (
          <div key={b.id} className="flex-shrink-0 w-36">
            <AudiobookCard book={b} onPlay={onPlay} />
          </div>
        ))}
      </div>
    </div>
  );
}