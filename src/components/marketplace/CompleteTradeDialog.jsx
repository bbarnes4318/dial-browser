import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CompleteTradeDialog({ listing, sellerName, onComplete, onClose }) {
  const [buyerName, setBuyerName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const tradeType = listing.listing_type || "sale";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      setError("Buyer name is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const today = new Date().toISOString().split("T")[0];
      await base44.entities.Trade.create({
        listing_id: listing.id,
        listing_title: listing.title,
        seller_name: sellerName,
        buyer_name: buyerName.trim(),
        trade_type: tradeType,
        price: listing.price || 0,
        status: "completed",
        rating,
        review_text: reviewText.trim(),
        completed_date: today,
      });
      await base44.entities.MarketplaceListing.update(listing.id, {
        status: tradeType === "trade" ? "traded" : "sold",
      });
      onComplete();
    } catch (err) {
      setError(err.message || "Failed to complete trade");
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md p-6"
          style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>
                // COMPLETE {tradeType.toUpperCase()}
              </p>
              <h3 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>
                {listing.title}
              </h3>
            </div>
            <button onClick={onClose} className="p-1" style={{ color: "#8A8F98" }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Buyer name */}
            <div>
              <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>
                BUYER NAME
              </label>
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Who bought this item?"
                className="w-full px-3 py-2.5 text-sm"
                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
              />
            </div>

            {/* Rating */}
            <div>
              <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>
                FEEDBACK RATING
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={n <= rating ? "fill-current" : ""}
                      style={{ color: n <= rating ? "#D1FF26" : "rgba(138,143,152,0.25)" }}
                    />
                  </button>
                ))}
                <span className="font-mono text-xs self-center ml-2" style={{ color: "#D1FF26" }}>
                  {rating}/5
                </span>
              </div>
            </div>

            {/* Review */}
            <div>
              <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>
                REVIEW (OPTIONAL)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this buyer..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm resize-none"
                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
              />
            </div>

            {error && (
              <p className="font-mono text-[10px]" style={{ color: "#ef4444" }}>
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{ background: "transparent", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-60"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Completing...
                  </>
                ) : (
                  <>
                    <Check size={12} /> Complete & Review
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}