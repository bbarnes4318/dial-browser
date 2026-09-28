import React from "react";

const GLOBE_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/8ea4eafd8_Gemini_Generated_Image_aazq2eaazq2eaazq.jpg";

/**
 * Holographic globe — a 3D Y-axis spinning globe image tinted to the
 * neon-lime HUD palette. Sits next to the hero device graphic.
 */
export default function HolographicGlobe({ size = "min(38vw, 240px)" }) {
  return (
    <div
      className="relative hidden sm:flex items-center justify-center"
      style={{ perspective: "900px" }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          animation: "globeSpin 22s linear infinite",
        }}
      >
        <img
          src={GLOBE_URL}
          alt="Global network holographic globe"
          style={{
            width: size,
            height: size,
            objectFit: "contain",
            display: "block",
            mixBlendMode: "screen",
            opacity: 0.9,
            filter:
              "hue-rotate(-8deg) saturate(1.15) brightness(1.05) drop-shadow(0 0 36px rgba(209,255,38,0.45))",
          }}
        />
      </div>

      {/* Floating data readout */}
      <div
        className="absolute bottom-2 right-1 font-mono text-[8px] tracking-[0.3em] uppercase pointer-events-none"
        style={{ color: "#D1FF26", textShadow: "0 0 10px rgba(209,255,38,0.6)" }}
      >
        00:00
        <br />
        Global Network
      </div>
    </div>
  );
}