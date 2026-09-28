import React, { useState } from "react";
import { Link2, Send, Share2, Check } from "lucide-react";

// Compact social-share control for an audiobook. Shares a real, deep link to the
// audiobook detail page so recipients land on the exact title.
export default function SocialShare({ book, variant = "row" }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/library/${book.id}`;
  const text = `Check out "${book.title}" by ${book.author || "an author"} on 1 Call Away Audiobooks`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — ignore
    }
  };

  const postX = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: book.title, text, url }); } catch { /* cancelled */ }
    } else {
      copy();
    }
  };

  const btn = (onClick, icon, label) => (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center justify-center w-8 h-8 transition-all hover:scale-105"
      style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-1.5">
      {btn(copy, copied ? <Check size={13} /> : <Link2 size={13} />, "Copy link")}
      {btn(postX, <Send size={13} />, "Share on X")}
      {typeof navigator !== "undefined" && navigator.share && btn(nativeShare, <Share2 size={13} />, "Share")}
    </div>
  );
}