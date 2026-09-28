import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Play, Pause, Loader2, Quote } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceReviewsList({ trackId, artistName }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(new Audio());

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.VoiceReview.list("-created_date", 50);
      let filtered = all || [];
      if (trackId) {
        filtered = filtered.filter((r) => r.track_id === trackId);
      } else if (artistName) {
        filtered = filtered.filter(
          (r) => r.artist_name?.toLowerCase() === artistName.toLowerCase()
        );
      }
      setReviews(filtered);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [trackId, artistName]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const togglePlay = (review) => {
    const audio = audioRef.current;
    if (playingId === review.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = review.audio_url;
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => {});
    setPlayingId(review.id);
  };

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-4">
        <Quote size={20} className="mx-auto mb-2" style={{ color: "rgba(209,255,38,0.3)" }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO REVIEWS YET</p>
        <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>Be the first to leave a voice review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reviews.map((review) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3"
          style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.12)" }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", borderRadius: "50%" }}>
                <span className="font-mono text-[9px] font-bold" style={{ color: "#D1FF26" }}>
                  {(review.reviewer_name || "?").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#F5F5F7" }}>{review.reviewer_name}</p>
                {artistName && !trackId && review.track_title && (
                  <p className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>{review.track_title}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={8}
                  style={{ color: s <= (review.rating || 5) ? "#D1FF26" : "rgba(138,143,152,0.2)" }}
                  fill={s <= (review.rating || 5) ? "#D1FF26" : "none"}
                />
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2">
            {review.audio_url && (
              <button
                onClick={() => togglePlay(review)}
                className="flex items-center justify-center w-8 h-8 flex-shrink-0 transition-all hover:scale-105"
                style={{ background: playingId === review.id ? "#D1FF26" : "rgba(209,255,38,0.1)", borderRadius: "50%" }}
              >
                {playingId === review.id ? <Pause size={11} style={{ color: "#05070A" }} /> : <Play size={11} style={{ color: "#D1FF26" }} />}
              </button>
            )}
            <p className="text-xs flex-1" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>
              "{review.transcript || "No transcript available."}"
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}