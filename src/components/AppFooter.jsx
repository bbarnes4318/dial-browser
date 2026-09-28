import React from "react";
import { LOGO_URL } from "@/lib/brandLogo";

// Global footer rendered on every page. Carries the compass-dial mark
// (the previous hero logo, now demoted to the footer) plus the
// "Get Connected · Stay Connected" tagline from the brand banner.
export default function AppFooter() {
  return (
    <footer
      className="relative w-full"
      style={{ background: "#0a0e0a", borderTop: "0.5px solid rgba(140,243,72,0.25)" }}
    >
      {/* perspective grid accent — echoes the brand banner's floor grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(140,243,72,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(140,243,72,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Dial Browser" style={{ width: 44, height: "auto", display: "block" }} />
          <div className="text-left">
            <p className="font-heading font-black text-sm tracking-tight" style={{ color: "#8cf348" }}>
              DIAL BROWSER
            </p>
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase" style={{ color: "#8A8F98" }}>
              1 Call Away™
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase" style={{ color: "#8cf348" }}>
            Get Connected · Stay Connected
          </p>
          <a href="/sms-policy" className="font-mono text-[9px] tracking-widest uppercase hover:underline" style={{ color: "#8A8F98" }}>
            SMS Opt-In Policy
          </a>
        </div>

        <div className="flex items-center gap-2 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
          <span style={{ color: "#22d3ee" }}>●</span> SIGNAL 1.1.201{" "}
          <span style={{ color: "#8cf348", letterSpacing: "0.1em" }}>█████</span>
        </div>
      </div>

      {/* Legal disclaimer — shown on every page */}
      <div className="relative z-10 w-full" style={{ borderTop: "0.5px solid rgba(138,143,152,0.15)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-center text-[9px] sm:text-[10px] leading-relaxed" style={{ color: "#8A8F98" }}>
            <span className="font-mono tracking-widest uppercase" style={{ color: "#8cf348" }}>// LEGAL DISCLAIMER · </span>
            1 Call Away™ and Dial Browser provide informational and convenience services only and are <span style={{ color: "#F5F5F7" }}>not a replacement for emergency services</span>. This service does not support 911 or emergency calls — in an emergency, dial your local emergency number directly. Services, availability, and responses may vary by region and provider. Message and data rates may apply; by using SMS and voice features you consent to receive communications. No guarantees are made regarding third-party provider accuracy, pricing, or availability. Use of this platform constitutes acceptance of these terms.
          </p>
        </div>
      </div>
    </footer>
  );
}