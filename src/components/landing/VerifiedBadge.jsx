import React, { useState } from "react";
import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 14, showTooltip = true }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowInfo(!showInfo);
        }}
        className="inline-flex items-center gap-1 transition-all"
        aria-label="Verified member"
      >
        <BadgeCheck size={size} className="text-[#D1FF26]" style={{ color: "#D1FF26" }} />
      </button>
      {showInfo && showTooltip && (
        <span className="absolute top-5 left-0 z-50 w-48 p-3" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}>
          <span className="absolute top-0 left-2 w-2 h-2 transform -translate-y-1/2 rotate-45" style={{ background: "#10141D", borderTop: "0.5px solid rgba(209,255,38,0.3)", borderLeft: "0.5px solid rgba(209,255,38,0.3)" }} />
          <div className="flex items-center gap-1.5 mb-1.5">
            <BadgeCheck size={10} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>VERIFIED MEMBER</p>
          </div>
          <p className="font-mono text-[8px] leading-relaxed" style={{ color: "#8A8F98" }}>
            Premium member who has submitted verified profile details — building trust across the 1 CALL AWAY™ network.
          </p>
        </span>
      )}
    </span>
  );
}