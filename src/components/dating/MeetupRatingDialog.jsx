import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2, Check, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Lets a member rate a mutual match after they meet up (1-5 stars + optional
// note). The rating is private — only admins can read it (RLS), and it feeds
// the Community Quality panel in the admin dashboard.
export default function MeetupRatingDialog({ match, matchProfile, myProfile, onClose, onRated }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!rating) {
      setError("Pick a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.DatingMeetupRating.create({
        match_id: match.id,
        rated_profile_id: matchProfile.id,
        rated_name: matchProfile.full_name,
        rater_profile_id: myProfile ? myProfile.id : "",
        rater_name: myProfile ? myProfile.full_name : "",
        rating,
        note,
      });
      setDone(true);
      if (onRated) onRated();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Could not submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        style={{ background: "rgba(5,7,10,0.85)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          className="w-full max-w-md p-5"
          style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
                // RATE YOUR MEETUP
              </p>
            </div>
            <button onClick={onClose} aria-label="Close">
              <X size={15} style={{ color: "#8A8F98" }} />
            </button>
          </div>

          {done ? (
            <div className="text-center py-6">
              <div className="flex items-center justify-center mb-3">
                <Check size={28} style={{ color: "#D1FF26" }} />
              </div>
              <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>
                THANKS FOR YOUR FEEDBACK
              </p>
              <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                Your rating helps keep 1 Call Dating genuine and safe for everyone.
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-3 font-mono text-[10px] tracking-widest uppercase"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                Close
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-4" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>
                How did your meetup with <span style={{ color: "#D1FF26" }}>{matchProfile.full_name}</span> go? Your rating is private and only seen by our admin team.
              </p>
              {error && (
                <div className="mb-3 p-2.5 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  {error}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={30}
                      style={{
                        color: (hover || rating) >= s ? "#D1FF26" : "rgba(138,143,152,0.25)",
                        fill: (hover || rating) >= s ? "#D1FF26" : "transparent",
                      }}
                    />
                  </button>
                ))}
              </div>
              <p className="font-mono text-[8px] tracking-widest mb-1 flex items-center gap-1" style={{ color: "#8A8F98" }}>
                <MessageSquare size={10} /> OPTIONAL NOTE
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="How was it? (optional)"
                className="w-full p-2.5 text-sm outline-none resize-none"
                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
              />
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase disabled:opacity-40"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />} Submit Rating
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}