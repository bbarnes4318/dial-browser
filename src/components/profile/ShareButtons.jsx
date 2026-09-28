import React, { useState } from "react";
import { Share2, Twitter, Facebook, MessageCircle, Link2, Check } from "lucide-react";

/**
 * Social sharing buttons (X/Twitter, Facebook, WhatsApp, native share, copy link).
 * Shares a public milestone + link — never exposes the member's private records.
 */
export default function ShareButtons({ text, url }) {
  const [copied, setCopied] = useState(false);

  const open = (u) => window.open(u, "_blank", "noopener,noreferrer");

  const shareNative = async () => {
    try { await navigator.share({ title: "1 Call Away", text, url }); } catch {}
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const encText = encodeURIComponent(text);
  const encUrl = encodeURIComponent(url);

  const Btn = ({ onClick, icon: Icon, title }) => (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-9 h-9 transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
      style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <Btn onClick={() => open(`https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`)} icon={Twitter} title="Share on X" />
      <Btn onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}&quote=${encText}`)} icon={Facebook} title="Share on Facebook" />
      <Btn onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)} icon={MessageCircle} title="Share on WhatsApp" />
      {typeof navigator !== "undefined" && navigator.share && <Btn onClick={shareNative} icon={Share2} title="Share" />}
      <Btn onClick={copy} icon={copied ? Check : Link2} title={copied ? "Copied!" : "Copy link"} />
    </div>
  );
}