import React from "react";
import { Phone } from "lucide-react";

export default function DialInBanner() {
  return (
    <div
      className="relative z-50 flex items-center justify-between gap-3 px-4 py-2.5"
      style={{
        background: "linear-gradient(90deg, rgba(209,255,38,0.08), rgba(209,255,38,0.15), rgba(209,255,38,0.08))",
        borderBottom: "0.5px solid rgba(209,255,38,0.3)",
      }}
    >
      {/* Brand mark */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(209,255,38,0.5)" }}>▸</span>
        <span className="font-heading font-bold text-sm tracking-tight" style={{ color: "#D1FF26" }}>
          Dial Browser
        </span>
        <span className="font-mono text-[7px] align-super" style={{ color: "rgba(209,255,38,0.5)" }}>™</span>
      </div>

      {/* Dial-in info */}
      <div className="flex items-center gap-2">
        <Phone size={14} style={{ color: "#D1FF26" }} className="flex-shrink-0 hidden sm:block" />
        <p className="font-mono text-[10px] sm:text-xs tracking-widest" style={{ color: "#D1FF26" }}>
          DIAL-IN: <span className="font-bold">1-800-555-DIAL</span>
        </p>
      </div>
    </div>
  );
}