import React from "react";
import { motion } from "framer-motion";
import { Megaphone, ArrowDown } from "lucide-react";

const HERO_IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/14ec575e5_Gemini_Generated_Image_osyoznosyoznosyo.jpg";
const LIME = "#A4FF00";
const PURPLE = "#BC00FF";

export default function AdvertiseHero({ onStart }) {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#05070A" }}>
      {/* Hero image banner */}
      <div className="relative w-full">
        <img
          src={HERO_IMG}
          alt="Advertise with Dial Browser — futuristic command center"
          className="w-full h-auto block"
          style={{ maxHeight: "620px", objectFit: "cover", objectPosition: "center", opacity: 0.92 }}
        />
        {/* Gradient scrim for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,7,10,0.55) 0%, rgba(5,7,10,0.35) 40%, rgba(5,7,10,0.92) 100%)",
          }}
        />
        {/* Neon edge glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: `inset 0 0 120px rgba(188,0,255,0.18), inset 0 0 220px rgba(164,255,0,0.10)` }}
        />

        {/* Overlaid headline */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-3"
          >
            <Megaphone size={16} style={{ color: LIME }} />
            <p className="font-mono text-[10px] sm:text-xs tracking-[0.4em]" style={{ color: LIME }}>
              // ADVERTISE WITH DIAL BROWSER
            </p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight"
            style={{ color: "#F5F5F7", textShadow: `0 0 30px rgba(164,255,0,0.25), 0 0 60px rgba(188,0,255,0.18)` }}
          >
            ADVERTISE WITH <span style={{ color: LIME }}>DIAL BROWSER.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-4 text-sm sm:text-lg max-w-2xl"
            style={{ color: "#E6E8EC" }}
          >
            With over <span style={{ color: PURPLE, fontWeight: 700 }}>2 Billion</span> potential customers — what are you waiting for?
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            onClick={onStart}
            className="mt-7 inline-flex items-center gap-2 px-6 py-3 font-mono text-[11px] tracking-widest uppercase transition-all hover:shadow-[0_0_28px_rgba(164,255,0,0.4)]"
            style={{ background: LIME, color: "#05070A" }}
          >
            <ArrowDown size={14} /> Start Your Campaign
          </motion.button>
        </div>
      </div>
    </section>
  );
}