import React from "react";
import { HERO_LOGO_URL } from "@/lib/brandLogo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#05070A" }}>
      {/* Background signal lines */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 4s ease-in-out infinite" }} />
        <div className="absolute bottom-1/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.2), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={HERO_LOGO_URL} alt="Dial Browser" style={{ width: "min(100%, 240px)", height: "auto", display: "block" }} />
          </div>
          <p className="font-mono text-[10px] tracking-[0.4em] mb-2" style={{ color: "#D1FF26" }}>// DIAL BROWSER™</p>
          <h1 className="font-heading font-black text-3xl tracking-tight" style={{ color: "#F5F5F7" }}>{title}</h1>
          {subtitle && <p className="mt-2 text-sm font-light" style={{ color: "#8A8F98" }}>{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="p-8" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm mt-6" style={{ color: "#8A8F98" }}>{footer}</p>
        )}
      </div>
    </div>
  );
}