import React from "react";

const IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/00b771663_Gemini_Generated_Image_zdfwwazdfwwazdfw.jpg";

export default function SecurityPrivacyBanner() {
  return (
    <section className="relative w-full" style={{ background: "#05070A" }}>
      <div className="relative w-full" style={{ aspectRatio: "16 / 7" }}>
        <img
          src={IMG}
          alt="1 Call Away — Dial Browser Security & Privacy Department: global intelligence tapestry, zero tracking diagnostics, and secure destination-data links"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,7,10,0.10) 0%, rgba(5,7,10,0.05) 60%, rgba(5,7,10,0.55) 100%)",
          }}
        />
      </div>
    </section>
  );
}