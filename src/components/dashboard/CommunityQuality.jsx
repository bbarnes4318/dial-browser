import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp, Loader2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Admin-only panel monitoring dating community quality via post-meetup
// ratings. Shows the average rating, total ratings, and a feed of recent
// ratings with rater → rated names and optional notes.
export default function CommunityQuality() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await base44.entities.DatingMeetupRating.list("-created_date", 50);
      setRatings(r || []);
    } catch {
      /* non-admins can't read */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.DatingMeetupRating.subscribe(() => load());
    return unsub;
  }, []);

  const total = ratings.length;
  const avg = total ? (ratings.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1) : "—";
  const fiveStars = ratings.filter((r) => r.rating === 5).length;
  const fivePct = total ? Math.round((fiveStars / total) * 100) : 0;

  return (
    <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-5">
        <Star size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DATING COMMUNITY QUALITY</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 size={14} className="animate-spin" style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <Metric label="AVG RATING" value={avg} sub={`${total} ratings`} accent="#D1FF26" />
            <Metric label="TOTAL RATINGS" value={total} sub="post-meetup reviews" accent="#5AE0C8" />
            <Metric label="5-STAR RATE" value={`${fivePct}%`} sub={`${fiveStars} five-star reviews`} accent="#E0A85A" />
          </div>

          {total === 0 ? (
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO MEETUP RATINGS YET — RATINGS APPEAR HERE AS MEMBERS REVIEW THEIR MATCHES</p>
          ) : (
            <div className="space-y-2">
              {ratings.slice(0, 8).map((r) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 flex items-start justify-between gap-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs" style={{ color: "#F5F5F7" }}>
                      <span style={{ color: "#D1FF26" }}>{r.rater_name || "A member"}</span> rated <span style={{ color: "#F5F5F7" }}>{r.rated_name || "a match"}</span>
                    </p>
                    {r.note && <p className="text-[11px] mt-1 italic" style={{ color: "#8A8F98", lineHeight: 1.4 }}>"{r.note}"</p>}
                    <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "rgba(138,143,152,0.6)" }}>{new Date(r.created_date).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={11} style={{ color: s <= (r.rating || 0) ? "#D1FF26" : "rgba(138,143,152,0.2)", fill: s <= (r.rating || 0) ? "#D1FF26" : "transparent" }} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub, accent }) {
  return (
    <div className="p-4" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${accent}40` }}>
      <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>{label}</p>
      <p className="font-heading font-black text-2xl" style={{ color: accent }}>{value}</p>
      <p className="font-mono text-[8px] tracking-wider mt-0.5" style={{ color: "rgba(138,143,152,0.7)" }}>{sub}</p>
    </div>
  );
}