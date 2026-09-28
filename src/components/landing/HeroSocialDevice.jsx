import React from "react";
import { motion } from "framer-motion";

// Social-perception HUD device render — a floating, glowing product shot
// placed under the rotating holographic globe in the hero. The source photo
// sits on a white background, so a radial mask feathers its edges into the
// dark hero while a rotating lime halo + glow sells the "active device" feel.

const DEVICE_IMG =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/17402e7aa_generated_image.png";

export default function HeroSocialDevice() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut", delay: 0.35 }}
      className="relative flex items-center justify-center"
      style={{ width: "min(28vw, 180px)", height: "min(28vw, 180px)" }}
    >
      {/* Rotating lime halo — two bright arcs orbiting the rim */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, #D1FF26 36deg, transparent 84deg, transparent 196deg, #D1FF26 244deg, transparent 292deg)",
          opacity: 0.55,
          filter: "blur(5px)",
          animation: "spin 7s linear infinite",
          maskImage:
            "radial-gradient(circle, transparent 57%, #000 60%, #000 70%, transparent 73%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 57%, #000 60%, #000 70%, transparent 73%)",
        }}
      />

      {/* Static outer glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 0 55px rgba(209,255,38,0.35), inset 0 0 0 1px rgba(209,255,38,0.4)" }}
      />

      {/* Floating device — gentle vertical bob. Source is on a pure black
          background, so screen blend drops the black and leaves only the
          HUD interface, no white box. */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
        style={{ width: "100%", height: "100%" }}
      >
        <img
          src={DEVICE_IMG}
          alt="Dial Browser social-perception HUD device"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            borderRadius: "9999px",
            mixBlendMode: "screen",
            filter: "contrast(1.4) saturate(1.05)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}