import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, DollarSign, Loader2, Check, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PRESET_AMOUNTS = [5, 10, 20];

export default function TipPanel({ open, onClose, creatorName = "DJ Signal", onTipSent }) {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [tipperName, setTipperName] = useState("");
  const [tipperEmail, setTipperEmail] = useState("");
  const [step, setStep] = useState("select"); // select | confirm | processing | success | error
  const [error, setError] = useState(null);

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const isValid = finalAmount >= 0.5 && tipperName.trim() && tipperEmail.trim();

  const resetAndClose = () => {
    setStep("select");
    setSelectedAmount(10);
    setCustomAmount("");
    setError(null);
    onClose();
  };

  const handleCheckout = async () => {
    if (!isValid) return;
    setStep("processing");
    setError(null);
    try {
      const response = await base44.functions.invoke("create-checkout", {
        plan: "creator_tip",
        amount: finalAmount.toFixed(2),
        tipper_name: tipperName.trim(),
        tipper_email: tipperEmail.trim(),
        creator_name: creatorName,
      });
      if (response.data?.redirectUrl) {
        if (onTipSent) onTipSent(finalAmount);
        window.location.href = response.data.redirectUrl;
      } else {
        setError("Could not start checkout. Please try again.");
        setStep("error");
      }
    } catch {
      setError("Could not process your tip. Please try again.");
      setStep("error");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
            style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
            onClick={resetAndClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[92] w-[92%] max-w-md p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Heart size={16} style={{ color: "#D1FF26", fill: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SUPPORT {creatorName.toUpperCase()}</p>
              </div>
              <button onClick={resetAndClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                <X size={16} style={{ color: "#8A8F98" }} />
              </button>
            </div>

            {step === "success" ? (
              <div className="text-center py-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4" style={{ background: "rgba(209,255,38,0.1)", border: "1px solid rgba(209,255,38,0.3)" }}>
                  <Check size={28} style={{ color: "#D1FF26" }} />
                </div>
                <p className="font-heading font-black text-xl mb-2" style={{ color: "#F5F5F7" }}>Tip Sent!</p>
                <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                  Your ${finalAmount.toFixed(2)} tip is on its way to {creatorName}. 💚
                </p>
                <button onClick={resetAndClose} className="w-full mt-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
                  Close
                </button>
              </div>
            ) : step === "error" ? (
              <div className="text-center py-6">
                <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>
                <button onClick={() => setStep("select")} className="w-full py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Amount selection */}
                <div className="mb-5">
                  <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>CHOOSE AMOUNT</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((amt) => {
                      const active = !customAmount && selectedAmount === amt;
                      return (
                        <button
                          key={amt}
                          onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                          className="py-3 font-heading font-bold text-lg transition-all"
                          style={{
                            background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                            border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                            color: active ? "#D1FF26" : "#F5F5F7",
                          }}
                        >
                          ${amt}
                        </button>
                      );
                    })}
                  </div>
                  {/* Custom amount */}
                  <div className="mt-2 relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                    <input
                      type="number"
                      min="0.50"
                      step="0.50"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Custom amount"
                      className="w-full pl-9 pr-3 py-2.5 text-[16px] sm:text-sm"
                      style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${customAmount ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`, color: "#F5F5F7" }}
                    />
                  </div>
                  {finalAmount < 0.5 && (customAmount || selectedAmount) && (
                    <p className="font-mono text-[8px] tracking-widest mt-1.5" style={{ color: "#ef4444" }}>⚠ MINIMUM TIP IS $0.50</p>
                  )}
                </div>

                {/* Tipper info */}
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>YOUR NAME</label>
                    <input
                      value={tipperName}
                      onChange={(e) => setTipperName(e.target.value)}
                      className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>EMAIL (for receipt)</label>
                    <input
                      type="email"
                      value={tipperEmail}
                      onChange={(e) => setTipperEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </div>
                </div>

                {/* Summary + confirm */}
                <div className="p-3 mb-4 flex items-center justify-between" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>TIP AMOUNT</span>
                  <span className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>${finalAmount.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!isValid || step === "processing"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  {step === "processing" ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} fill="#05070A" />}
                  {step === "processing" ? "Processing…" : `Tip $${finalAmount.toFixed(2)}`}
                </button>
                <p className="font-mono text-[8px] text-center mt-3" style={{ color: "rgba(138,143,152,0.5)" }}>
                  <Sparkles size={8} className="inline mr-1" />Secure payment via Dial Pay · 100% goes to the creator
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}