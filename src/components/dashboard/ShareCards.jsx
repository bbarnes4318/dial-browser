import React, { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Copy, Check, Send, MessageCircle, Camera, Smartphone, Hash } from "lucide-react";

/**
 * Pre-designed social media share cards featuring Dial Browser branding.
 * Each card shows a platform-styled preview with the member's unique referral
 * code and a one-tap copy of a ready-to-paste invite message + link.
 */
export default function ShareCards({ referralCode, shareUrl, userName }) {
  const [copied, setCopied] = useState(null);

  const messages = {
    x: `I've been calling services by voice on 1 Call Away — no app, no scrolling. Find, book & connect to any service just by talking. Use my code ${referralCode} and we both get bonus credits:`,
    facebook: `Found something genuinely useful: 1 Call Away lets you reach any service — medical, grocery, jobs, bills — by voice call or text. No smartphone app required. Join with my referral code ${referralCode} and we each get bonus call credits. Tap the link to start:`,
    whatsapp: `Hey! Try this — 1 Call Away lets you find and call any service by voice 🎙️ No app needed. Use my code ${referralCode} and we both get free credits. Link:`,
    instagram: `Talk to any service. No app, no typing. 🎙️📞 Join 1 Call Away with my code ${referralCode} for bonus credits — link in bio energy. ⚡`,
    sms: `Join me on 1 Call Away — find & call any service by voice. Use my code ${referralCode} for bonus credits:`,
  };

  const cards = [
    { key: "x", label: "X / Twitter", icon: Hash, accent: "#22D3EE", message: messages.x, handle: "@1callaway" },
    { key: "facebook", label: "Facebook", icon: MessageCircle, accent: "#3B82F6", message: messages.facebook, handle: "1 Call Away" },
    { key: "whatsapp", label: "WhatsApp", icon: Send, accent: "#22C55E", message: messages.whatsapp, handle: "Voice Invite" },
    { key: "instagram", label: "Instagram", icon: Camera, accent: "#E879F9", message: messages.instagram, handle: "@1callaway" },
    { key: "sms", label: "Text / SMS", icon: Smartphone, accent: "#D1FF26", message: messages.sms, handle: "1 Call Away" },
  ];

  const handleCopy = async (card) => {
    const text = `${card.message} ${shareUrl}`;
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard may be blocked; copy still attempted */
    }
    setCopied(card.key);
    setTimeout(() => setCopied((c) => (c === card.key ? null : c)), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="p-6"
      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Compass size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SHARE CARDS — DIAL BROWSER</p>
      </div>
      <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Pre-designed invite cards with your referral code baked in. Tap <span style={{ color: "#D1FF26" }}>Copy</span> to grab the ready-to-paste message and share it anywhere.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <ShareCard key={card.key} card={card} copied={copied === card.key} onCopy={() => handleCopy(card)} referralCode={referralCode} userName={userName} />
        ))}
      </div>
    </motion.div>
  );
}

function ShareCard({ card, copied, onCopy, referralCode, userName }) {
  const Icon = card.icon;
  return (
    <div
      className="relative flex flex-col overflow-hidden transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.12)]"
      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}
    >
      {/* Signal line accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)`, animation: "tickerScroll 4s linear infinite" }} />
      </div>

      {/* Branded header band — Dial Browser identity on every card */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
        <div className="w-7 h-7 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.1)", border: `0.5px solid ${card.accent}` }}>
          <Compass size={13} style={{ color: "#D1FF26" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-[11px] tracking-tight truncate" style={{ color: "#F5F5F7" }}>DIAL BROWSER</p>
          <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>1 CALL AWAY™</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1" style={{ background: `${card.accent}14`, border: `0.5px solid ${card.accent}40` }}>
          <Icon size={10} style={{ color: card.accent }} />
          <span className="font-mono text-[8px] tracking-widest" style={{ color: card.accent }}>{card.label.toUpperCase()}</span>
        </div>
      </div>

      {/* Card body — platform-styled preview */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Referrer handle */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: card.accent, color: "#05070A" }}>
            {(userName || "M").charAt(0).toUpperCase()}
          </div>
          <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{userName || "Member"} · {card.handle}</p>
        </div>

        {/* Pre-written message preview */}
        <p className="text-[12px] leading-relaxed flex-1" style={{ color: "#F5F5F7" }}>
          {card.message}
        </p>

        {/* Referral code slot — the unique code prominently displayed */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ background: "rgba(209,255,38,0.06)", border: "0.5px dashed rgba(209,255,38,0.4)" }}
        >
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>YOUR CODE</span>
          <span className="font-mono text-sm font-bold tracking-[0.2em]" style={{ color: "#D1FF26" }}>{referralCode}</span>
        </div>
      </div>

      {/* Copy action */}
      <button
        onClick={onCopy}
        className="flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
        style={{
          background: copied ? "rgba(209,255,38,0.15)" : "#D1FF26",
          color: "#05070A",
          borderTop: "0.5px solid rgba(138,143,152,0.1)",
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy Invite"}
      </button>
    </div>
  );
}