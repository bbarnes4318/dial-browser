import React from "react";

const IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/277672dd8_Gemini_Generated_Image_dpavltdpavltdpav.jpg";

export default function HelpDeskBanner() {
  return (
    <section className="relative w-full" style={{ background: "#05070A" }}>
      <div className="relative w-full" style={{ aspectRatio: "16 / 7" }}>
        <img
          src={IMG}
          alt="1 Call Away — Dial Browser Help Desk: global intelligence tapestry, secure service access, and 3D interactive support content"
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