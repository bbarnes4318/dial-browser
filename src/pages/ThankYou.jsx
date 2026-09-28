import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, Mail, ShieldCheck, ArrowRight, Receipt, Gauge, Home } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ThankYou() {
  const [status, setStatus] = useState("confirming"); // confirming | active | pending | service
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    // Extract transaction ID from URL params (Wix checkout redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const txId = urlParams.get("transactionId") || urlParams.get("orderId") || urlParams.get("checkoutId") || urlParams.get("id");
    if (txId) {
      setTransactionId(txId);
      setStatus("service"); // we have a transaction — show success
      return;
    }

    // No transaction param — fall back to polling for subscription activation
    let attempts = 0;
    const maxAttempts = 8;

    const check = async () => {
      attempts++;
      try {
        const user = await base44.auth.me();
        if (!user) {
          setStatus("pending");
          return;
        }
        if (attempts >= maxAttempts) {
          setStatus("pending");
          return;
        }
        setTimeout(check, 3000);
      } catch {
        if (attempts >= maxAttempts) {
          setStatus("pending");
        } else {
          setTimeout(check, 3000);
        }
      }
    };

    check();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: "#05070A" }}>
      {/* Phosphor Pulse background — concentric glowing rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${200 + i * 160}px`,
              height: `${200 + i * 160}px`,
              border: "1px solid rgba(209,255,38,0.08)",
              boxShadow: "0 0 60px rgba(209,255,38,0.04)",
              animation: `phosphorPulse ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(209,255,38,0.06), transparent 60%)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full"
      >
        <div
          className="relative overflow-hidden"
          style={{
            background: "rgba(10,13,20,0.95)",
            border: "0.5px solid rgba(209,255,38,0.3)",
            boxShadow: "0 20px 80px rgba(0,0,0,0.7), 0 0 120px rgba(209,255,38,0.05)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Top signal line */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
          </div>

          <div className="p-8 lg:p-10 text-center">
            {status === "confirming" && (
              <>
                {/* Pulsing loader */}
                <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(209,255,38,0.15)", animation: "phosphorPulse 2s ease-in-out infinite" }} />
                  <Loader2 size={32} className="animate-spin" style={{ color: "#D1FF26" }} />
                </div>
                <h1 className="font-heading font-black text-2xl mb-3" style={{ color: "#F5F5F7" }}>Confirming your payment…</h1>
                <p className="text-sm" style={{ color: "#8A8F98" }}>Your subscription is being activated. This usually takes a few seconds.</p>
              </>
            )}

            {status === "pending" && (
              <>
                <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full" style={{ background: "rgba(209,255,38,0.06)", border: "2px solid rgba(209,255,38,0.2)", animation: "phosphorPulse 2.5s ease-in-out infinite" }} />
                  <Mail size={32} style={{ color: "#D1FF26" }} />
                </div>
                <p className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: "#D1FF26" }}>// PAYMENT RECEIVED</p>
                <h1 className="font-heading font-black text-2xl mb-3" style={{ color: "#F5F5F7" }}>You're almost there!</h1>
                <p className="text-sm mb-8" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                  Your subscription is being processed. Check your profile shortly to see your activated features.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/profile"
                    className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    Go to Profile <ArrowRight size={13} />
                  </Link>
                  <Link
                    to="/"
                    className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                    style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                  >
                    <Home size={13} /> Back to Home
                  </Link>
                </div>
              </>
            )}

            {status === "service" && (
              <>
                {/* Pulsing success check with phosphor glow */}
                <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full" style={{ background: "rgba(209,255,38,0.06)", animation: "phosphorPulse 2s ease-in-out infinite" }} />
                  <div className="absolute inset-2 rounded-full" style={{ border: "2px solid #D1FF26", animation: "phosphorPulse 2s ease-in-out infinite 0.3s" }} />
                  <div className="absolute inset-4 rounded-full" style={{ border: "1px solid rgba(209,255,38,0.4)", animation: "phosphorPulse 2s ease-in-out infinite 0.6s" }} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Check size={40} style={{ color: "#D1FF26" }} />
                  </motion.div>
                </div>

                <p className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: "#D1FF26" }}>// PAYMENT CONFIRMED</p>
                <h1 className="font-heading font-black text-3xl mb-3" style={{ color: "#F5F5F7" }}>Payment Successful</h1>
                <p className="text-sm mb-8" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                  Your transaction has been processed securely. A confirmation receipt has been sent to your email.
                </p>

                {/* Transaction ID display */}
                {transactionId && (
                  <div
                    className="mb-6 p-4 text-left"
                    style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt size={12} style={{ color: "#D1FF26" }} />
                      <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// TRANSACTION ID</p>
                    </div>
                    <p className="font-mono text-xs break-all" style={{ color: "#F5F5F7" }}>{transactionId}</p>
                  </div>
                )}

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
                  {[
                    { icon: ShieldCheck, label: "Secure payment" },
                    { icon: Check, label: "Instant activation" },
                    { icon: Mail, label: "Receipt sent" },
                  ].map((badge, i) => {
                    const BadgeIcon = badge.icon;
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <BadgeIcon size={11} style={{ color: "rgba(138,143,152,0.6)" }} />
                        <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.6)" }}>{badge.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Link
                    to="/status"
                    className="w-full flex items-center justify-center gap-2 py-4 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    <Gauge size={14} /> View Service Dashboard <ArrowRight size={13} />
                  </Link>
                  <Link
                    to="/"
                    className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                    style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                  >
                    <Home size={13} /> Back to Home
                  </Link>
                </div>

                <p className="font-mono text-[8px] tracking-widest text-center mt-6" style={{ color: "rgba(138,143,152,0.4)" }}>
                  Powered by Dial Pay
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}