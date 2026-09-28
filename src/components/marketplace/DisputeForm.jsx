import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, Check, Loader2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const disputeTypes = [
  { id: "item_not_received", label: "Item Not Received", icon: "📦" },
  { id: "item_not_as_described", label: "Item Not as Described", icon: "⚠️" },
  { id: "payment_not_received", label: "Payment Not Received", icon: "💰" },
  { id: "damaged_item", label: "Damaged Item", icon: "🔧" },
  { id: "other", label: "Other Issue", icon: "❓" },
];

export default function DisputeForm({ reporterName, onSubmitted, onClose }) {
  const [trades, setTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const [disputeType, setDisputeType] = useState("item_not_received");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTrades = async () => {
      try {
        const data = await base44.entities.Trade.filter({ status: "completed" }, "-created_date", 100);
        setTrades(data);
      } catch {
        setTrades([]);
      } finally {
        setLoadingTrades(false);
      }
    };
    loadTrades();
  }, []);

  const selectedTrade = trades.find((t) => t.id === selectedTradeId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTradeId) {
      setError("Please select a trade to dispute");
      return;
    }
    if (!description.trim()) {
      setError("Please describe the issue");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const counterparty =
        selectedTrade?.seller_name === reporterName
          ? selectedTrade?.buyer_name || "Unknown buyer"
          : selectedTrade?.seller_name || "Unknown seller";

      await base44.entities.Dispute.create({
        trade_id: selectedTradeId,
        listing_title: selectedTrade?.listing_title || "",
        reporter_name: reporterName,
        counterparty_name: counterparty,
        dispute_type: disputeType,
        description: description.trim(),
        status: "pending",
      });
      onSubmitted?.();
    } catch (err) {
      setError(err.message || "Failed to submit dispute");
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
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
          style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                <ShieldAlert size={20} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#ef4444" }}>
                  // REPORT A PROBLEM
                </p>
                <h3 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>
                  File a Dispute
                </h3>
              </div>
            </div>
            <button onClick={onClose} className="p-1" style={{ color: "#8A8F98" }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Trade selection */}
            <div>
              <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>
                SELECT TRADE
              </label>
              {loadingTrades ? (
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>Loading your trades…</span>
                </div>
              ) : trades.length === 0 ? (
                <div className="px-3 py-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                  <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>No completed trades found to dispute.</p>
                </div>
              ) : (
                <select
                  value={selectedTradeId}
                  onChange={(e) => setSelectedTradeId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm"
                  style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                  required
                >
                  <option value="" style={{ background: "#10141D" }}>Select a trade…</option>
                  {trades.map((t) => (
                    <option key={t.id} value={t.id} style={{ background: "#10141D" }}>
                      {t.listing_title} — {t.buyer_name} ↔ {t.seller_name} ({t.trade_type})
                    </option>
                  ))}
                </select>
              )}
              {selectedTrade && (
                <div className="mt-2 p-2.5 flex items-center justify-between" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                    Counterparty:{" "}
                    <span style={{ color: "#D1FF26" }}>
                      {selectedTrade.seller_name === reporterName ? selectedTrade.buyer_name : selectedTrade.seller_name}
                    </span>
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                    {selectedTrade.trade_type === "sale" ? `$${selectedTrade.price || 0}` : "Trade"}
                  </span>
                </div>
              )}
            </div>

            {/* Dispute type */}
            <div>
              <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>
                ISSUE TYPE
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {disputeTypes.map((dt) => {
                  const isSelected = disputeType === dt.id;
                  return (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDisputeType(dt.id)}
                      className="flex flex-col items-center gap-1 p-2.5 transition-all"
                      style={{
                        background: isSelected ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.6)",
                        border: `0.5px solid ${isSelected ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                      }}
                    >
                      <span className="text-lg">{dt.icon}</span>
                      <span className="font-mono text-[8px] text-center leading-tight" style={{ color: isSelected ? "#D1FF26" : "#8A8F98" }}>
                        {dt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>
                DESCRIBE THE ISSUE
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about what went wrong with this transaction. Include dates, communication, and any evidence you have…"
                rows={4}
                className="w-full px-3 py-2.5 text-sm resize-none"
                style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                required
              />
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 p-3" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle size={14} style={{ color: "#ef4444" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                Our team reviews all disputes within 48 hours. False reports may affect your account standing.
              </p>
            </div>

            {error && (
              <p className="font-mono text-[10px]" style={{ color: "#ef4444" }}>{error}</p>
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
                disabled={submitting || loadingTrades || trades.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-60"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {submitting ? (
                  <><Loader2 size={12} className="animate-spin" /> Submitting…</>
                ) : (
                  <><ShieldAlert size={12} /> Submit Dispute</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}