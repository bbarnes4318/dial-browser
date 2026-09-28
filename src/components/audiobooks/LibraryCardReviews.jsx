import React, { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AudiobookReviewSection from "@/components/audiobooks/AudiobookReviewSection";

function MiniStars({ value, size = 11 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          style={{ color: n <= value ? "#D1FF26" : "rgba(138,143,152,0.3)" }}
          fill={n <= value ? "#D1FF26" : "none"}
        />
      ))}
    </div>
  );
}

/**
 * Compact rating summary + expandable review section for a Library card.
 * Shows the average star rating and review count, then reveals the full
 * review/comment UI when expanded.
 */
export default function LibraryCardReviews({ book }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.AudiobookReview.filter(
        { audiobook_id: book.id },
        "-created_date",
        100
      );
      setReviews(Array.isArray(list) ? list : []);
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }, [book.id]);

  useEffect(() => {
    if (open && loading) load();
    // load summary on mount for the count
    if (!open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="mt-2.5">
      {/* Summary row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 transition-all hover:bg-[rgba(209,255,38,0.06)]"
        style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.12)" }}
      >
        <span className="flex items-center gap-2">
          <MessageSquare size={12} style={{ color: "#D1FF26" }} />
          {loading ? (
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
              REVIEWS…
            </span>
          ) : reviews.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <MiniStars value={Math.round(avg)} />
              <span className="font-mono text-[9px] tracking-wider" style={{ color: "#D1FF26" }}>
                {avg.toFixed(1)}
              </span>
              <span className="font-mono text-[9px] tracking-wider" style={{ color: "#8A8F98" }}>
                · {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            </span>
          ) : (
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
              NO REVIEWS — BE FIRST
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp size={12} style={{ color: "#8A8F98" }} />
        ) : (
          <ChevronDown size={12} style={{ color: "#8A8F98" }} />
        )}
      </button>

      {/* Expandable full review + comment section */}
      {open && (
        <div className="mt-1">
          <AudiobookReviewSection book={book} />
        </div>
      )}
    </div>
  );
}