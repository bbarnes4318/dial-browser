import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Fixed top-center pill button linking to the Dial Social experience.
 * Visible at the top of the homepage in the holographic HUD style.
 */
export default function SocialEntryButton() {
  return (
    <Link
      to="/social"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.35)]"
      style={{
        background: "rgba(10,13,20,0.92)",
        border: "0.5px solid rgba(209,255,38,0.4)",
        color: "#D1FF26",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 12px rgba(209,255,38,0.12)",
      }}
    >
      <Sparkles size={13} />
      Dial Social
    </Link>
  );
}