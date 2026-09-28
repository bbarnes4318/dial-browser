import React from "react";

const IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/a5b67318f_Gemini_Generated_Image_95ixyr95ixyr95ix.jpg";

export default function TropicalConnectionBanner() {
  return (
    <section className="relative w-full" style={{ background: "#05070A" }}>
      <div className="relative w-full" style={{ aspectRatio: "16 / 7" }}>
        <img
          src={IMG}
          alt="1 Call Away — Tropical Connection Hub with global secure access, live-stream signal lock, and interactive 3D projected content"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          style={{ filter: "brightness(0.92) saturate(1.05)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,7,10,0.35) 0%, rgba(5,7,10,0.12) 40%, rgba(5,7,10,0.45) 100%)",
          }}
        />
      </div>
    </section>
  );
}