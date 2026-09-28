import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gamepad2, Smartphone, MessageSquare, Download, Play, ChevronRight } from "lucide-react";

const GAMES_BANNER =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/c608bbb10_Gemini_Generated_Image_xfameixfameixfam1.jpg";

const STEPS = [
  {
    num: "01",
    icon: Gamepad2,
    title: "Browse & Select a Game",
    desc: "Open the Dial Browser Games library and pick a title — Signal Runner, Dial Quest, Frequency Wars, or Pulse Arena. No app store required.",
  },
  {
    num: "02",
    icon: Smartphone,
    title: "Enter Your Phone Number",
    desc: "Type the phone number where you want the secure play link delivered. Works on any phone — smartphone or flip phone.",
  },
  {
    num: "03",
    icon: MessageSquare,
    title: "Receive the SMS Play Link",
    desc: "A verified, low-latency download link is texted straight to your phone within seconds via the secure SMS game cloud.",
  },
  {
    num: "04",
    icon: Download,
    title: "Open & Play Instantly",
    desc: "Tap the link in your SMS to launch the game in your browser and start playing immediately. No installs, no sign-ups.",
  },
];

export default function GamesShowcase() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="games-showcase"
      className="snap-section relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      {/* Signal line accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden pointer-events-none">
        <div
          className="h-full w-1/4"
          style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 6s linear infinite" }}
        />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
            <Gamepad2 size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// DIAL BROWSER GAMES</span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Play Games via <span style={{ color: "#D1FF26" }}>SMS</span>
          </h2>
          <p className="text-sm sm:text-base max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            The holographic SMS game delivery system — pick a game, get a secure play link texted to your phone, and start playing instantly. No app store, no WiFi, no downloads. Gaming for everyone, 1 call away.
          </p>
        </motion.div>

        {/* Banner image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="flex justify-center mb-12"
        >
          <div className="w-full overflow-hidden" style={{ maxWidth: "1200px", border: "0.5px solid rgba(209,255,38,0.2)", boxShadow: "0 0 40px rgba(209,255,38,0.08)" }}>
            <img
              src={GAMES_BANNER}
              alt="Dial Browser Games — SMS Game Delivery System"
              className="block w-full h-auto"
              draggable={false}
              style={{ userSelect: "none" }}
            />
          </div>
        </motion.div>

        {/* Step-by-step instructions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Smartphone size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// HOW TO PLAY — STEP BY STEP</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                className="relative p-5"
                style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[10px] font-bold" style={{ color: "rgba(209,255,38,0.5)" }}>{step.num}</span>
                  <div className="w-8 h-8 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <step.icon size={14} style={{ color: "#D1FF26" }} />
                  </div>
                </div>
                <p className="font-heading font-semibold text-sm mb-1.5" style={{ color: "#F5F5F7" }}>{step.title}</p>
                <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{step.desc}</p>
                {idx < STEPS.length - 1 && (
                  <ChevronRight size={14} className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(209,255,38,0.3)" }} />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Fingerprint skater + Ultra-red Play Now CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10"
        >
          {/* Fingerprint skater mascot */}
          <div className="relative flex-shrink-0" style={{ filter: "drop-shadow(0 0 30px rgba(209,255,38,0.25))" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/c153397ef_Gemini_Generated_Image_wb3aciwb3aciwb3a.jpg"
              alt="Dial Browser Games — fingerprint skater mascot"
              style={{ width: "min(70vw, 220px)", height: "auto", display: "block", mixBlendMode: "screen" }}
              draggable={false}
            />
          </div>

          <div className="flex flex-col items-center">
            <Link
              to="/games"
              className="group relative inline-flex items-center gap-3 px-10 py-5 font-heading font-black text-base sm:text-lg tracking-widest uppercase transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, #ff1a1a 0%, #e60000 100%)",
                color: "#fff",
                borderRadius: "2px",
                border: "1px solid #ff3333",
                boxShadow: "0 0 30px rgba(255,26,26,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
                textShadow: "0 0 12px rgba(255,80,80,0.6)",
              }}
            >
              <span
                className="absolute inset-0 -z-10 opacity-60 group-hover:opacity-90 transition-opacity"
                style={{ boxShadow: "0 0 50px rgba(255,26,26,0.6)", borderRadius: "2px" }}
              />
              <Play size={20} fill="#fff" /> Play Now
            </Link>
            <p className="font-mono text-[10px] mt-4" style={{ color: "#8A8F98" }}>
              // LAUNCH THE GAME LIBRARY & START PLAYING IMMEDIATELY
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}