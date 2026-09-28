import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";
import { HERO_DEVICE_LOGO_URL } from "@/lib/brandLogo";
import HolographicGlobe from "@/components/landing/HolographicGlobe";
import HeroSocialDevice from "@/components/landing/HeroSocialDevice";

export default function HeroSection({ heroImage }) {
  const { t } = useLanguage();
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const sectionRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const bars = Array.from({ length: 48 }, (_, i) => i);
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date()
        .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        .toUpperCase()
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="snap-section relative flex flex-col items-center overflow-hidden min-h-screen pt-24 sm:pt-20 pb-8"
      style={{ background: '#05070A' }}
    >
      {/* Audio waveform visualization */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-[3px] opacity-30">
          {bars.map((i) => {
            const centerDist = Math.abs(i - 24) / 24;
            const mouseFactor = 1 - Math.abs(mousePos.x - (i / 48)) * 2;
            const height = Math.max(4, (1 - centerDist) * 120 * Math.max(0.3, mouseFactor));
            return (
              <div
                key={i}
                className="w-[2px] rounded-full transition-all duration-300"
                style={{
                  height: `${height}px`,
                  background: `linear-gradient(180deg, #D1FF26, rgba(209,255,38,0.2))`,
                  animation: `waveFloat ${1.5 + (i % 5) * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <p className="font-mono text-xs tracking-[0.4em] text-[#8A8F98] mb-8 uppercase">
            {t("hero.signal")}
          </p>
          {/* Unified device cluster — phone · social dial · globe, equal weight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="flex items-center justify-center gap-5 sm:gap-10 mb-8"
          >
            <img
              src={HERO_DEVICE_LOGO_URL}
              alt="Dial Browser phone-dial device"
              style={{
                width: "min(28vw, 180px)",
                height: "auto",
                display: "block",
                mixBlendMode: "screen",
                filter: "contrast(1.45) saturate(1.05)",
              }}
            />
            <HeroSocialDevice />
            <HolographicGlobe size="min(28vw, 180px)" />
          </motion.div>
          <h1
            className="font-heading font-black text-5xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tight mb-3"
            style={{ color: "#F5F5F7", textShadow: "0 0 30px rgba(209,255,38,0.25)" }}
          >
            DIAL <span style={{ color: "#D1FF26" }}>BROWSER</span>
          </h1>
          <p className="font-mono text-[10px] sm:text-xs tracking-[0.35em] mb-5 uppercase flex items-center justify-center gap-2" style={{ color: "#8cf348" }}>
            <span style={{ color: "#22d3ee" }}>●</span> CALL. CONNECT. BROWSE <span style={{ color: "#fb923c" }}>●</span>
          </p>
          <p className="text-lg sm:text-xl font-light tracking-wide max-w-xl mx-auto mb-4"
             style={{ color: '#F5F5F7', lineHeight: '1.6' }}>
            {t("hero.tagline")}
          </p>
          <p className="font-mono text-xs sm:text-sm tracking-[0.4em] mb-8 uppercase font-bold" style={{ color: '#8cf348' }}>
            NO WIFI REQUIRED
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <button
            onClick={() => openRegistrationModal()}
            className="group relative inline-flex items-center gap-3 px-8 py-4 font-semibold text-sm tracking-widest uppercase transition-all duration-500 hover:shadow-[0_0_60px_rgba(209,255,38,0.3)]"
            style={{
              background: '#D1FF26',
              color: '#05070A',
              borderRadius: '2px',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#05070A] group-hover:animate-pulse" />
            Registration
          </button>
        </motion.div>
      </div>

      {/* Bottom technical readout */}
      <div className="relative z-10 w-full flex flex-wrap justify-between gap-x-4 gap-y-1 px-8 lg:pr-24 mt-6 font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
        <span>LAT 40.7128° N</span>
        {today && <span style={{ color: "#D1FF26" }}>DATE {today}</span>}
        <span>SIGNAL STRENGTH ████████░░ 82%</span>
        <span>FREQ 1.8 GHz</span>
      </div>
    </section>
  );
}