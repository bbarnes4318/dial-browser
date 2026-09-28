import React from "react";

const IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/c2cff8181_Gemini_Generated_Image_umqzloumqzloumqz.jpg";

export default function CreatorAccessBanner() {
  return (
    <section className="px-6 lg:px-8 py-12 lg:py-16" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto">
        <div className="relative w-full overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 0 60px rgba(209,255,38,0.06)" }}>
          {/* Top signal line accent */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden z-10">
            <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
          </div>
          <img
            src={IMG}
            alt="1 Call Away — live-stream global connectivity, signal-lock optimization, and interactive cloud access"
            className="w-full h-auto block"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}