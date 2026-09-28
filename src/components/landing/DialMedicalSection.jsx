import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic, Stethoscope, Volume2, UserRound, ChevronRight, Activity } from "lucide-react";
import TelemedicalDisclaimer from "@/components/landing/TelemedicalDisclaimer";

// 8K holographic AI hospital staff — generated on a solid black background,
// screen-blended so the black drops out against the dark app backdrop.
const HOLOGRAM_IMG =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/68c93d019_generated_image.png";

const STEPS = [
  {
    num: "01",
    icon: Mic,
    title: "Describe Your Symptom",
    desc: "Type it or tap the mic and speak it aloud — in your own words, any language.",
  },
  {
    num: "02",
    icon: Stethoscope,
    title: "Get General Wellness Info",
    desc: "Dial Medical's AI estimates urgency and surfaces topics to raise with a clinician — not a diagnosis.",
  },
  {
    num: "03",
    icon: Volume2,
    title: "Hear Guidance & Ask Follow-Ups",
    desc: "Listen to spoken guidance, then ask follow-up questions to go deeper on your symptom.",
  },
  {
    num: "04",
    icon: UserRound,
    title: "See a Licensed Provider",
    desc: "Use the suggested timeframe to visit a real, licensed healthcare provider for diagnosis and treatment.",
  },
];

export default function DialMedicalSection() {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.15 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);

  return (
    <section ref={ref} id="dial-medical" className="relative py-16 lg:py-20 overflow-hidden" style={{ background: "#05070A" }}>
      {/* ambient scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg, #D1FF26 0px, transparent 1px, transparent 3px)" }} />

      <div className="relative z-10 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Activity size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.35em]" style={{ color: "#D1FF26" }}>// DIAL MEDICAL — AI TELEHEALTH</span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Meet <span style={{ color: "#D1FF26" }}>Dial Medical</span>
          </h2>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Your AI hospital staff — a holographic telehealth portal that listens to your symptoms and guides you, by voice, in seconds.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Holographic image — screen-blended so the black background drops out */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.8 }} className="relative flex justify-center order-1 lg:order-none">
            <div className="relative" style={{ filter: "drop-shadow(0 0 60px rgba(209,255,38,0.25))" }}>
              <motion.img
                src={HOLOGRAM_IMG}
                alt="Dial Medical — holographic AI hospital staff"
                className="block"
                style={{ width: "min(90vw, 520px)", height: "auto", mixBlendMode: "screen", opacity: 0.92 }}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                draggable={false}
              />
              {/* floating vital-sign chips */}
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-2 right-2 sm:right-6 font-mono text-[9px] px-2 py-1" style={{ background: "rgba(5,7,10,0.85)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
                ♥ 72 BPM
              </motion.div>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }} className="absolute bottom-6 left-0 sm:-left-2 font-mono text-[9px] px-2 py-1" style={{ background: "rgba(5,7,10,0.85)", border: "0.5px solid rgba(34,211,238,0.4)", color: "#22d3ee" }}>
                O₂ 98%
              </motion.div>
            </div>
          </motion.div>

          {/* Steps + CTA */}
          <div className="order-2 lg:order-none">
            <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>// HOW TO USE THE TELEMEDICAL PORTAL</p>
            <div className="space-y-3">
              {STEPS.map((s, i) => (
                <motion.div key={s.num} initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }} className="flex items-start gap-3 p-4" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[10px] font-bold" style={{ color: "rgba(209,255,38,0.5)" }}>{s.num}</span>
                    <div className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <s.icon size={16} style={{ color: "#D1FF26" }} />
                    </div>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm mb-1" style={{ color: "#F5F5F7" }}>{s.title}</p>
                    <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link to="/medical" className="group inline-flex items-center gap-2 px-8 py-4 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.35)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                Open Dial Medical <ChevronRight size={14} />
              </Link>
              <p className="font-mono text-[9px] leading-relaxed max-w-xs" style={{ color: "rgba(239,68,68,0.7)" }}>
                General wellness info — not a diagnosis. In an emergency, call your local emergency number immediately.
              </p>
            </div>

            <div className="mt-6">
              <TelemedicalDisclaimer compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}