import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Heart, X, Loader2, Lock, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PRESET_AMOUNTS = [1, 3, 5, 10];

export default function TipButton({ artistName, trackTitle, trackId, variant = "default" }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("");
  const [tipperName, setTipperName] = useState("");
  const [tipperEmail, setTipperEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleTip = async () => {
    if (!tipperName.trim() || !tipperEmail.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    if (!finalAmount || finalAmount < 0.50) {
      setError("Minimum tip is $0.50.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await base44.entities.Tip.create({
        artist_name: artistName,
        track_id: trackId || undefined,
        track_title: trackTitle || undefined,
        tipper_name: tipperName.trim(),
        tipper_email: tipperEmail.trim(),
        amount: finalAmount,
        message: message.trim() || undefined,
        status: "completed",
      });

      const res = await base44.functions.invoke("create-checkout", {
        plan: "creator_tip",
        amount: finalAmount,
        tipper_name: tipperName.trim(),
        tipper_email: tipperEmail.trim(),
        creator_name: artistName,
      });

      const redirectUrl = res.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setError("Could not start payment. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const isCompact = variant === "compact";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 ${isCompact ? "px-2 py-2 text-[8px]" : "px-3 py-2 text-[9px]"} font-mono tracking-widest uppercase transition-all flex-shrink-0 hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]`}
        style={{
          background: "rgba(209,255,38,0.08)",
          border: "0.5px solid rgba(209,255,38,0.3)",
          color: "#D1FF26",
        }}
      >
        <DollarSign size={isCompact ? 10 : 12} /> {isCompact ? "TIP" : "TIP ARTIST"}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }}
              onClick={() => !loading && setOpen(false)}
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-md pointer-events-auto overflow-hidden"
                style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => !loading && setOpen(false)} className="absolute top-4 right-4 p-1.5 z-10">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>

                <div className="p-6 pb-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <Heart size={24} style={{ color: "#D1FF26" }} />
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// SUPPORT THE ARTIST</p>
                      <h3 className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>Tip {artistName}</h3>
                    </div>
                  </div>
                  {trackTitle && <p className="text-xs" style={{ color: "#8A8F98" }}>For "{trackTitle}"</p>}
                </div>

                <div className="p-6 py-5" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                  <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>// SELECT AMOUNT</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => { setAmount(amt); setCustomAmount(""); }}
                        className="py-3 font-heading font-bold text-sm transition-all"
                        style={{
                          background: (!customAmount && amount === amt) ? "#D1FF26" : "rgba(209,255,38,0.06)",
                          border: `0.5px solid ${(!customAmount && amount === amt) ? "#D1FF26" : "rgba(209,255,38,0.2)"}`,
                          color: (!customAmount && amount === amt) ? "#05070A" : "#D1FF26",
                        }}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm" style={{ color: "#8A8F98" }}>$</span>
                    <input
                      type="number"
                      min="0.50"
                      step="0.50"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Custom amount"
                      className="w-full pl-7 pr-3 py-2.5 text-sm outline-none"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                    <span className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>Total</span>
                    <span className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>${finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-6 py-5 space-y-3" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                  <input value={tipperName} onChange={(e) => setTipperName(e.target.value)} placeholder="Your name *" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                  <input type="email" value={tipperEmail} onChange={(e) => setTipperEmail(e.target.value)} placeholder="Your email (for receipt) *" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message for the artist (optional)" rows={2} maxLength={500} className="w-full px-3 py-2.5 text-sm outline-none resize-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                </div>

                {error && <div className="mx-6 mt-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>⚠ {error}</div>}

                <div className="p-6">
                  <button onClick={handleTip} disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)] disabled:opacity-50" style={{ background: "#D1FF26", color: "#05070A" }}>
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Redirecting to checkout…</> : <><Lock size={14} /> Send ${finalAmount.toFixed(2)} Tip</>}
                  </button>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={10} style={{ color: "rgba(138,143,152,0.5)" }} />
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>Secure payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock size={10} style={{ color: "rgba(138,143,152,0.5)" }} />
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>Dial Pay</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}