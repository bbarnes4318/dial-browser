import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Copy, Check, Hash, MessageCircle, Send, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

/**
 * Floating share widget — lives on the dashboard so members can copy
 * their unique referral code and instantly share branded invitation
 * cards to X, Facebook, WhatsApp, or SMS. Stacks vertically above the
 * other bottom-right floating controls (HUD electric-lime aesthetic).
 */
export default function FloatingShareWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id ? btoa(user.id).replace(/=/g, "").slice(0, 12) : "GUEST";
  const shareUrl = `${window.location.origin}/?ref=${referralCode}`;

  const platforms = [
    { key: "x", label: "X / Twitter", icon: Hash, accent: "#22D3EE",
      msg: `I've been calling services by voice on 1 Call Away — no app, no scrolling. Use my code ${referralCode} and we both get bonus credits:` },
    { key: "fb", label: "Facebook", icon: MessageCircle, accent: "#3B82F6",
      msg: `Find, book & call any service by voice on 1 Call Away. No smartphone app required. Join with my code ${referralCode} and we each get bonus call credits:` },
    { key: "wa", label: "WhatsApp", icon: Send, accent: "#22C55E",
      msg: `Try 1 Call Away — find & call any service by voice 🎙️ No app needed. Use my code ${referralCode} and we both get free credits.` },
    { key: "sms", label: "Text / SMS", icon: Smartphone, accent: "#D1FF26",
      msg: `Join me on 1 Call Away — find & call any service by voice. Use my code ${referralCode} for bonus credits:` },
  ];

  const flashCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyCode = async () => {
    try { await navigator.clipboard?.writeText(referralCode); } catch { /* clipboard blocked */ }
    flashCopied();
  };

  const share = async (p) => {
    const text = `${p.msg} ${shareUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: "1 Call Away", text, url: shareUrl }); return; } catch { /* user cancelled */ }
    }
    try { await navigator.clipboard?.writeText(text); } catch { /* clipboard blocked */ }
    flashCopied();
  };

  return (
    <div className="fixed z-[60] right-4 lg:right-6" style={{ bottom: "6.5rem" }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="absolute bottom-16 right-0 w-72 p-4"
            style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 12px 50px rgba(0,0,0,0.7)" }}
          >
            {/* Signal line accent */}
            <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
              <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 size={13} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// SHARE & EARN</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1"><X size={14} style={{ color: "#8A8F98" }} /></button>
            </div>

            {/* Referral code */}
            <div className="flex items-center justify-between p-2.5 mb-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px dashed rgba(209,255,38,0.4)" }}>
              <div>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>YOUR CODE</p>
                <p className="font-mono text-sm font-bold tracking-[0.2em]" style={{ color: "#D1FF26" }}>{referralCode}</p>
              </div>
              <button onClick={copyCode} className="flex items-center gap-1.5 px-2.5 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: copied ? "rgba(209,255,38,0.15)" : "#D1FF26", color: "#05070A", border: "0.5px solid #D1FF26" }}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Platform share buttons */}
            <div className="grid grid-cols-2 gap-2">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <button key={p.key} onClick={() => share(p)} className="flex items-center gap-2 px-2.5 py-2.5 transition-all hover:bg-[rgba(209,255,38,0.06)]" style={{ background: "rgba(5,7,10,0.5)", border: `0.5px solid ${p.accent}40` }}>
                    <Icon size={13} style={{ color: p.accent }} />
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#F5F5F7" }}>{p.label.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 font-mono text-[8px] tracking-widest text-center" style={{ color: "rgba(138,143,152,0.5)" }}>25 BONUS CREDITS PER FRIEND</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        className="flex items-center justify-center w-12 h-12 transition-all"
        style={{
          background: open ? "rgba(209,255,38,0.12)" : "#D1FF26",
          border: "0.5px solid #D1FF26",
          boxShadow: "0 0 20px rgba(209,255,38,0.3)",
        }}
        aria-label="Share your referral code"
      >
        {open ? <X size={18} style={{ color: "#D1FF26" }} /> : <Share2 size={18} style={{ color: "#05070A" }} />}
      </motion.button>
    </div>
  );
}