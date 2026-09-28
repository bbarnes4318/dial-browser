import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function ResourcePageShell({ badge, title, subtitle, children }) {
  return (
    <div className="min-h-screen pt-16 pb-16" style={{ background: "#05070A" }}>
      <header
        className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between"
        style={{
          background: "rgba(5,7,10,0.9)",
          borderBottom: "0.5px solid rgba(209,255,38,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
        >
          <Home size={12} /> Home
        </Link>
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
          {badge}
        </p>
      </header>
      <div className="px-4 lg:px-8 py-8 max-w-6xl mx-auto">
        <p className="font-mono text-xs tracking-[0.4em] mb-3" style={{ color: "#D1FF26" }}>
          {badge}
        </p>
        <h1
          className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-2"
          style={{ color: "#F5F5F7" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm lg:text-base max-w-2xl mb-8"
            style={{ color: "#8A8F98", lineHeight: 1.6 }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}