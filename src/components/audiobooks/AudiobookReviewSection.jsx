import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Star, Loader2, Send, MessageSquare } from "lucide-react";

function Stars({ value, size = 14, interactive = false, onPick }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onPick && onPick(n)}
          className={interactive ? "transition-transform hover:scale-110" : "cursor-default"}
          style={{ background: "transparent", border: 0, padding: 0 }}
        >
          <Star
            size={size}
            style={{ color: n <= value ? "#D1FF26" : "rgba(138,143,152,0.3)" }}
            fill={n <= value ? "#D1FF26" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export default function AudiobookReviewSection({ book }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.AudiobookReview.filter({ audiobook_id: book.id }, "-created_date", 100);
      setReviews(Array.isArray(list) ? list : []);
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }, [book.id]);

  useEffect(() => { load(); }, [load]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  const submit = async () => {
    if (!user) { setErr("Sign in to leave a review."); return; }
    if (!rating) { setErr("Select a rating."); return; }
    setSubmitting(true);
    setErr("");
    try {
      await base44.entities.AudiobookReview.create({
        audiobook_id: book.id,
        audiobook_title: book.title,
        rating,
        comment: comment.trim(),
        reviewer_name: user.full_name || user.email || "Listener",
      });
      setComment("");
      await load();
    } catch (e) {
      setErr(e?.message || "Could not submit review.");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LISTENER REVIEWS</p>
      </div>

      {/* Average */}
      <div className="flex items-center gap-3 mb-5">
        <Stars value={Math.round(avg)} size={18} />
        <span className="font-mono text-xs" style={{ color: "#F5F5F7" }}>
          {reviews.length > 0 ? avg.toFixed(1) : "—"}
        </span>
        <span className="font-mono text-[9px] tracking-wider" style={{ color: "#8A8F98" }}>
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Add review */}
      <div className="mb-5 p-4" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
          {user ? "WRITE A REVIEW" : "SIGN IN TO REVIEW"}
        </p>
        {user ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[9px] tracking-wider" style={{ color: "#8A8F98" }}>YOUR RATING</span>
              <Stars value={rating} size={18} interactive onPick={setRating} />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what you thought of the story…"
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2.5 text-sm outline-none resize-none mb-3"
              style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            />
            {err && <p className="font-mono text-[9px] mb-2" style={{ color: "#ef4444" }}>{err}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_14px_rgba(209,255,38,0.3)] disabled:opacity-50"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Post Review
            </button>
          </>
        ) : (
          <p className="text-xs" style={{ color: "#8A8F98" }}>
            <a href="/login" className="underline" style={{ color: "#D1FF26" }}>Sign in</a> to rate and comment on this audiobook.
          </p>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
      ) : reviews.length === 0 ? (
        <p className="text-center py-6 font-mono text-[10px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>NO REVIEWS YET — BE THE FIRST</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-heading font-bold text-xs" style={{ color: "#F5F5F7" }}>{r.reviewer_name || "Listener"}</span>
                <Stars value={r.rating || 0} size={12} />
              </div>
              {r.comment && <p className="text-xs leading-relaxed" style={{ color: "rgba(138,143,152,0.9)" }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}