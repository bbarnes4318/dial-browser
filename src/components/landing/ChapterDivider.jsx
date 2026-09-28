import React from "react";

/**
 * Lightweight chapter divider — gives the homepage an itemized, organized
 * "table of contents" feel so every section is clearly delineated.
 */
export default function ChapterDivider({ number, title, subtitle }) {
  return (
    <div className="relative pt-8 pb-4 px-4 sm:px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>
            SECTION {number}
          </span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(209,255,38,0.4), transparent)" }} />
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-4xl mt-3 tracking-tight" style={{ color: "#F5F5F7" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}