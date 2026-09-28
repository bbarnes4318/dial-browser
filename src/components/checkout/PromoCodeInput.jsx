import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Check, X, Loader2, Percent } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PromoCodeInput({ onApplied, originalPrice, plan }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | success | error
  const [appliedCode, setAppliedCode] = useState(null);
  const [discount, setDiscount] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleApply = async () => {
    if (!code.trim()) return;
    setStatus("checking");
    setErrorMsg("");

    const upperCode = code.trim().toUpperCase();

    try {
      const response = await base44.functions.invoke("validate-promo-code", {
        code: upperCode,
        plan: plan || "",
        original_price: originalPrice,
      });
      const result = response.data;

      if (!result || !result.valid) {
        setStatus("error");
        setErrorMsg(result?.error || "Invalid or expired promo code");
        return;
      }

      setDiscount({
        code: result.code,
        label: result.label || result.description || "",
        amount: result.discount_amount,
        discounted_price: result.discounted_price,
      });
      setAppliedCode(upperCode);
      setStatus("success");
      if (onApplied) {
        onApplied({
          code: upperCode,
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          amount: result.discount_amount,
          discounted_price: result.discounted_price,
        });
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Could not validate promo code. Please try again.");
    }
  };

  const handleRemove = () => {
    setCode("");
    setAppliedCode(null);
    setDiscount(null);
    setStatus("idle");
    if (onApplied) onApplied(null);
  };

  const finalPrice = discount ? discount.discounted_price : originalPrice;

  return (
    <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Tag size={12} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// PROMO CODE</p>
      </div>

      {status === "success" && discount ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.15)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
              <Check size={14} style={{ color: "#D1FF26" }} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-widest truncate" style={{ color: "#D1FF26" }}>{appliedCode}</p>
              <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{discount.label} · Save ${discount.amount.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="flex-shrink-0 p-1.5 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
            style={{ border: "0.5px solid rgba(138,143,152,0.2)" }}
          >
            <X size={12} style={{ color: "#8A8F98" }} />
          </button>
        </motion.div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (status === "error") setStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="ENTER CODE"
              disabled={status === "checking"}
              className="w-full pl-9 pr-3 py-2.5 font-mono text-[11px] tracking-widest uppercase outline-none disabled:opacity-50"
              style={{
                background: "rgba(5,7,10,0.6)",
                border: `0.5px solid ${status === "error" ? "rgba(239,68,68,0.4)" : "rgba(209,255,38,0.2)"}`,
                color: "#F5F5F7",
              }}
            />
          </div>
          <button
            onClick={handleApply}
            disabled={!code.trim() || status === "checking"}
            className="px-4 py-2.5 font-mono text-[9px] tracking-widest font-bold uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.2)] disabled:opacity-30 flex items-center gap-1.5"
            style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            {status === "checking" ? <Loader2 size={11} className="animate-spin" /> : <Tag size={11} />} Apply
          </button>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            <p className="font-mono text-[9px] flex items-center gap-1" style={{ color: "#ef4444" }}>
              <X size={10} /> {errorMsg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price breakdown when discount applied */}
      {discount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 pt-3 space-y-1.5"
          style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ORIGINAL</span>
            <span className="font-mono text-[10px] line-through" style={{ color: "rgba(138,143,152,0.5)" }}>${originalPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>DISCOUNT</span>
            <span className="font-mono text-[10px] font-bold" style={{ color: "#D1FF26" }}>−${discount.amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#F5F5F7" }}>NEW TOTAL</span>
            <span className="font-heading font-black text-lg" style={{ color: "#D1FF26" }}>${finalPrice.toFixed(2)}</span>
          </div>
        </motion.div>
      )}

      {/* Hint */}
      {status === "idle" && !discount && (
        <p className="font-mono text-[8px] mt-2" style={{ color: "rgba(138,143,152,0.4)" }}>
          Enter your code for a limited-time discount
        </p>
      )}
    </div>
  );
}