import React from "react";

const NEXUS_IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/cf2613ea0_Gemini_Generated_Image_ob04pcob04pcob04.jpg";

export default function ConsortiumNexusBanner() {
  return (
    <section id="consortium-nexus" className="px-6 lg:px-8 py-16 lg:py-24" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }} />
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE PRINT BIOMETRICS — GLOBAL SECURE ACCESS</p>
        </div>
        <h2 className="font-heading font-black text-3xl lg:text-5xl mb-3" style={{ color: "#F5F5F7" }}>
          Your Voice Is Your <span style={{ color: "#D1FF26" }}>Password</span>
        </h2>
        <p className="text-sm lg:text-base max-w-2xl mb-10" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Voice-print biometrics with secure remote authentication, global voice access, and zero-tracking
          diagnostics — log in with just your voice. Get connected, stay connected.
        </p>
        <div className="relative w-full overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 0 60px rgba(209,255,38,0.06)" }}>
          {/* Top signal line accent */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden z-10">
            <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
          </div>
          <img
            src={NEXUS_IMG}
            alt="Dial Browser Voice Print Biometrics — global secure voice access"
            className="w-full h-auto block"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}