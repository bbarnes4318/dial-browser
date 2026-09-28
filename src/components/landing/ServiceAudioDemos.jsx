import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, Stethoscope, CloudSun, ShoppingBasket, Briefcase, Radio, Receipt, Phone, Headphones } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

// Service voice demos — spoken via on-device natural voice synthesis (no external audio).
const DEMOS = [
  { id: "medical", icon: Stethoscope, label: "1 Call Medical", dial: "*300#", blurb: "Describe your symptoms in plain words — get general wellness info and guidance on next steps.", voice: "honey" },
  { id: "weather", icon: CloudSun, label: "1 Call Weather", dial: "*200#", blurb: "Your daily forecast, spoken to you the moment you dial in.", voice: "river" },
  { id: "jobs", icon: Briefcase, label: "1 Call Jobs", dial: "*700#", blurb: "Tell us the work you want — the top matches get texted to you.", voice: "honey" },
  { id: "radio", icon: Radio, label: "1 Call Radio", dial: "*500#", blurb: "100% free, royalty-paid music. Just say what mood you're in.", voice: "sunny" },
];

export default function ServiceAudioDemos() {
  const [activeId, setActiveId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Stop playback when the section leaves the viewport
  useEffect(() => {
    if (!inView) {
      stopSpeaking();
      setIsPlaying(false);
    }
  }, [inView]);

  const activeDemo = DEMOS.find((d) => d.id === activeId);

  const toggleDemo = (demo) => {
    if (activeId === demo.id && isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setActiveId(demo.id);
      speak(demo.blurb, { onEnd: () => setIsPlaying(false), onError: () => setIsPlaying(false) });
      setIsPlaying(true);
    }
  };

  return (
    <section ref={sectionRef} className="relative py-16 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      {/* Phosphor pulse background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: `${360 + i * 160}px`, height: `${360 + i * 160}px`, border: "0.5px solid rgba(209,255,38,0.06)" }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.14, 0.04, 0.14] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4" style={{ border: "0.5px solid rgba(209,255,38,0.3)", background: "rgba(209,255,38,0.05)" }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }} />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>DIAL BROWSER · SOUND DEMOS</span>
          </div>
          <h2 className="font-heading font-black text-3xl lg:text-5xl mb-3" style={{ color: "#F5F5F7" }}>
            Hear How It <span style={{ color: "#D1FF26" }}>Sounds.</span>
          </h2>
          <p className="text-sm lg:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Real human voices — never robotic. Tap a service to preview exactly what a caller hears when they dial in. No app, no internet required.
          </p>
        </div>

        {/* Demo grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {DEMOS.map((demo, i) => {
            const Icon = demo.icon;
            const isActive = activeId === demo.id && isPlaying;
            return (
              <motion.div
                key={demo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                onClick={() => toggleDemo(demo)}
                className="relative p-5 cursor-pointer group transition-all"
                style={{
                  background: isActive ? "rgba(209,255,38,0.05)" : "rgba(16,20,29,0.6)",
                  border: isActive ? "0.5px solid rgba(209,255,38,0.5)" : "0.5px solid rgba(138,143,152,0.15)",
                  boxShadow: isActive ? "0 0 24px rgba(209,255,38,0.12)" : "none",
                }}
              >
                {/* HUD corner brackets */}
                {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map((pos, k) => (
                  <div key={k} className={`absolute w-3 h-3 ${pos}`} style={{ borderColor: isActive ? "rgba(209,255,38,0.6)" : "rgba(138,143,152,0.2)" }} />
                ))}

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: isActive ? "rgba(209,255,38,0.15)" : "rgba(138,143,152,0.08)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.2)"}` }}>
                    <Icon size={18} style={{ color: isActive ? "#D1FF26" : "#8A8F98" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>{demo.label}</p>
                    <p className="font-mono text-[9px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>
                      <Phone size={8} className="inline mr-1" style={{ color: "#D1FF26" }} />{demo.dial} · {demo.voice.toUpperCase()} VOICE
                    </p>
                  </div>
                </div>

                <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{demo.blurb}</p>

                {/* Play control + equalizer */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 transition-all group-hover:scale-105" style={{ background: isActive ? "#D1FF26" : "rgba(209,255,38,0.1)", border: `0.5px solid ${isActive ? "#D1FF26" : "rgba(209,255,38,0.3)"}` }}>
                    {isActive ? <Pause size={14} style={{ color: "#05070A" }} /> : <Play size={14} style={{ color: "#D1FF26", marginLeft: 2 }} />}
                  </div>
                  <div className="flex items-end gap-0.5 h-5 flex-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((b) => (
                      <span
                        key={b}
                        className="w-1 rounded-full"
                        style={{
                          background: isActive ? "#D1FF26" : "rgba(138,143,152,0.2)",
                          height: isActive ? "100%" : "20%",
                          animation: isActive ? `eqBar ${0.6 + b * 0.08}s ease-in-out ${b * 0.07}s infinite` : "none",
                          transition: "height 0.3s, background 0.3s",
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: isActive ? "#D1FF26" : "rgba(138,143,152,0.4)" }}>
                    {isActive ? "● PLAYING" : "PREVIEW"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Now-playing bar */}
        <AnimatePresence>
          {activeDemo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mt-6 p-4 flex items-center gap-4" style={{ background: "rgba(10,13,20,0.9)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 30px rgba(209,255,38,0.08)" }}>
              <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "rgba(209,255,38,0.15)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
                <Headphones size={16} style={{ color: "#D1FF26" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NOW PLAYING</p>
                <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{activeDemo.label} <span style={{ color: "#8A8F98", fontWeight: 400 }}>· {activeDemo.voice} voice</span></p>
              </div>
              <button onClick={() => toggleDemo(activeDemo)} className="flex items-center justify-center w-9 h-9" style={{ background: "#D1FF26" }}>
                {isPlaying ? <Pause size={14} style={{ color: "#05070A" }} /> : <Play size={14} style={{ color: "#05070A", marginLeft: 2 }} />}
              </button>
              <Volume2 size={14} style={{ color: "rgba(138,143,152,0.5)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }} className="text-center mt-8">
          <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "#D1FF26" }}>Real human voices. Dial in. Get connected.</p>
        </motion.div>
      </div>

    </section>
  );
}