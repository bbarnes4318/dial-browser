import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Phone, Sparkles } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

// Narration spoken live via on-device natural voice synthesis (no external audio/video).
const NARRATION_TEXT = "One number. Endless possibilities. Medical info, jobs, music, dating, and audiobooks — all just one call away. No apps to download. Any phone, anywhere.";

const BENEFITS = [
  { icon: Phone, label: "Medical Info" },
  { icon: Phone, label: "Jobs" },
  { icon: Sparkles, label: "Music" },
  { icon: Phone, label: "Dating" },
  { icon: Sparkles, label: "Audiobooks" },
];

export default function PhosphorPulseCommercial() {
  const sectionRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeBenefit, setActiveBenefit] = useState(-1);

  // Cycle through benefits during playback to sync with narration
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveBenefit((prev) => (prev + 1) % BENEFITS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Auto-play when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          stopSpeaking();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePlay = () => {
    if (!isMuted) {
      speak(NARRATION_TEXT, { rate: 0.95, onEnd: () => setIsPlaying(false) });
    }
    setIsPlaying(true);
    setActiveBenefit(0);
  };

  const handlePause = () => {
    stopSpeaking();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      stopSpeaking();
    } else if (isPlaying) {
      speak(NARRATION_TEXT, { rate: 0.95, onEnd: () => setIsPlaying(false) });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-16 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      {/* Phosphor pulse background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${300 + i * 150}px`,
              height: `${300 + i * 150}px`,
              border: "0.5px solid rgba(209,255,38,0.06)",
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.04, 0.15],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-6">
        {/* Section header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4" style={{ border: "0.5px solid rgba(209,255,38,0.3)", background: "rgba(209,255,38,0.05)" }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }}
            />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
              1 CALL AWAY™ · COMMERCIAL
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-2" style={{ color: "#F5F5F7" }}>
            One Number. <span style={{ color: "#D1FF26" }}>Endless Possibilities.</span>
          </h2>
          <p className="text-sm lg:text-base" style={{ color: "#8A8F98" }}>
            Voice-narrated. Real benefits. No apps to download.
          </p>
        </div>

        {/* Commercial video player */}
        <div
          className="relative w-full overflow-hidden group"
          style={{
            aspectRatio: "16/9",
            border: "0.5px solid rgba(209,255,38,0.2)",
            boxShadow: "0 0 60px rgba(209,255,38,0.08), 0 0 120px rgba(209,255,38,0.04)",
            background: "#05070A",
          }}
        >
          {/* Animated visual stage (on-device, replaces hosted video) */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(209,255,38,0.10) 0%, transparent 60%), #05070A" }}>
            <div className="relative flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ width: `${120 + i * 90}px`, height: `${120 + i * 90}px`, border: "0.5px solid rgba(209,255,38,0.25)" }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                />
              ))}
              <motion.div
                animate={{ scale: isPlaying ? [1, 1.08, 1] : 1, opacity: isPlaying ? [0.85, 1, 0.85] : 0.45 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center justify-center w-20 h-20 rounded-full"
                style={{ background: "rgba(209,255,38,0.1)", border: "2px solid #D1FF26", boxShadow: "0 0 40px rgba(209,255,38,0.3)" }}
              >
                <Phone size={32} style={{ color: "#D1FF26" }} />
              </motion.div>
            </div>
          </div>

          {/* Dark gradient overlay for HUD aesthetic */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(5,7,10,0.3) 0%, transparent 40%, rgba(5,7,10,0.6) 100%)" }}
          />

          {/* HUD corner brackets */}
          {[
            "top-3 left-3 border-t border-l",
            "top-3 right-3 border-t border-r",
            "bottom-3 left-3 border-b border-l",
            "bottom-3 right-3 border-b border-r",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute w-6 h-6 ${pos}`}
              style={{ borderColor: "rgba(209,255,38,0.5)" }}
            />
          ))}

          {/* Active benefit overlay — cycling highlights */}
          <AnimatePresence mode="wait">
            {isPlaying && activeBenefit >= 0 && (
              <motion.div
                key={activeBenefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="absolute top-1/2 left-6 lg:left-10 -translate-y-1/2"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: "rgba(5,7,10,0.85)",
                    backdropFilter: "blur(8px)",
                    border: "0.5px solid rgba(209,255,38,0.4)",
                    boxShadow: "0 0 24px rgba(209,255,38,0.15)",
                  }}
                >
                  {React.createElement(BENEFITS[activeBenefit].icon, {
                    size: 18,
                    style: { color: "#D1FF26" },
                  })}
                  <span className="font-mono text-xs lg:text-sm tracking-wider" style={{ color: "#F5F5F7" }}>
                    {BENEFITS[activeBenefit].label}
                  </span>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Play/Pause button overlay */}
          {!isPlaying && (
            <motion.button
              onClick={handlePlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(5,7,10,0.4)" }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full"
                style={{
                  background: "#D1FF26",
                  boxShadow: "0 0 40px rgba(209,255,38,0.5), 0 0 80px rgba(209,255,38,0.2)",
                }}
              >
                <Play size={28} style={{ color: "#05070A", marginLeft: 4 }} fill="#05070A" />
              </motion.div>
            </motion.button>
          )}

          {/* Bottom controls bar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3"
            style={{ background: "linear-gradient(0deg, rgba(5,7,10,0.9), transparent)" }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                ● PHOSPHOR PULSE
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="flex items-center justify-center w-8 h-8 transition-all hover:opacity-80"
                style={{ background: "rgba(209,255,38,0.15)", border: "0.5px solid rgba(209,255,38,0.3)" }}
              >
                {isPlaying ? (
                  <Pause size={14} style={{ color: "#D1FF26" }} />
                ) : (
                  <Play size={14} style={{ color: "#D1FF26" }} />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-8 h-8 transition-all hover:opacity-80"
                style={{ background: "rgba(209,255,38,0.15)", border: "0.5px solid rgba(209,255,38,0.3)" }}
              >
                {isMuted ? (
                  <VolumeX size={14} style={{ color: "#D1FF26" }} />
                ) : (
                  <Volume2 size={14} style={{ color: "#D1FF26" }} />
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Benefit chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {BENEFITS.map((benefit, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 transition-all"
              style={{
                background: isPlaying && activeBenefit === i ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${isPlaying && activeBenefit === i ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
              }}
            >
              {React.createElement(benefit.icon, {
                size: 12,
                style: { color: isPlaying && activeBenefit === i ? "#D1FF26" : "#8A8F98" },
              })}
              <span
                className="font-mono text-[9px] tracking-wider uppercase"
                style={{ color: isPlaying && activeBenefit === i ? "#D1FF26" : "#8A8F98" }}
              >
                {benefit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-center mt-8"
        >
          <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "#D1FF26" }}>
            Dial in. Get connected. Stay empowered.
          </p>
        </motion.div>
      </div>
    </section>
  );
}