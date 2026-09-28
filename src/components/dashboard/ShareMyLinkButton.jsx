import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, Gift } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

// Compact "Share My Link" quick action for the member dashboard. Generates
// the member's unique referral code (full base64 of their user id, reversible
// by the complete-referral function) and exposes copy + native share. When a
// friend joins via the link, the inviter's referral points and milestone
// rewards update automatically.
export default function ShareMyLinkButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id ? btoa(user.id) : "GUEST";
  const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "1 Call Away — Find any service by voice",
          text: "Check out 1 Call Away! Find, book, and call any service just by using your voice. Join with my link:",
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
        style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
      >
        <Share2 size={13} /> Share My Link
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-full mt-2 w-72 p-4 z-50"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Gift size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// YOUR REFERRAL LINK</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                Share this link. When a friend joins, you earn <span style={{ color: "#D1FF26" }}>25 call credits</span> + loyalty points toward your next milestone reward — automatically.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-2 py-2 font-mono text-[9px] bg-transparent outline-none"
                  style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center w-9 h-9 flex-shrink-0"
                  style={{ background: copied ? "rgba(209,255,38,0.15)" : "#D1FF26", color: "#05070A", border: copied ? "0.5px solid #D1FF26" : "none" }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              >
                <Share2 size={12} /> Share with Friends
              </button>
              <p className="font-mono text-[8px] mt-2 text-center" style={{ color: "rgba(138,143,152,0.5)" }}>Code: {referralCode}</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}