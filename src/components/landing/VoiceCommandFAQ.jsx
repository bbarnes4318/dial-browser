import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Mic, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "How do I search for a doctor by voice?",
    a: "Call the 1 Call Away number and say \"find a doctor near me\" or describe your symptoms — for example, \"I have a sore throat and need a physician.\" Our AI triages your request and connects you to a nearby provider.",
  },
  {
    q: "How do I check the weather?",
    a: "Call the 1 Call Away number and say \"weather in Miami\" or \"what's the forecast for today.\" You'll hear the current conditions and the week's outlook read aloud over the call.",
  },
  {
    q: "Can I book a contractor by speaking?",
    a: "Yes. Call the 1 Call Away number and say \"I need a plumber\" or \"roof repair.\" We match you with a verified contractor in your area and schedule a booking — all by voice.",
  },
  {
    q: "How do I search the web?",
    a: "Call the 1 Call Away number and ask your question — anything from \"who won the game\" to \"translate hello to Swahili\" — and hear the answer read back instantly.",
  },
  {
    q: "How do I set a reminder?",
    a: "Call the 1 Call Away number and say \"remind me to take my medication at 8 AM\" or \"remind me about my dentist appointment tomorrow.\" You'll receive an SMS at the scheduled time.",
  },
  {
    q: "What do I say to find a job?",
    a: "Call the 1 Call Away number and say \"looking for warehouse jobs in Atlanta\" or describe your skills. We match you with openings and text you job alerts as new positions come available.",
  },
];

export default function VoiceCommandFAQ() {
  const [open, setOpen] = useState(0);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="voice-command-faq" className="snap-section relative py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-1/3 w-px h-full" style={{ background: "linear-gradient(180deg, transparent, rgba(209,255,38,0.4), transparent)" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div style={{ animation: "phosphorPulse 2.5s ease-in-out infinite" }}>
              <Mic size={14} style={{ color: "#D1FF26" }} />
            </div>
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE COMMAND FAQ</p>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Just <span style={{ color: "#D1FF26" }}>Speak.</span> We'll Handle the Rest.
          </h2>
          <p className="text-base lg:text-lg max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            New to voice commands? Here's exactly what to say for the services you use most. No apps, no typing — just call and speak naturally.
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-2.5">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative overflow-hidden"
                style={{
                  background: isOpen ? "rgba(209,255,38,0.04)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${isOpen ? "rgba(209,255,38,0.35)" : "rgba(138,143,152,0.12)"}`,
                  boxShadow: isOpen ? "0 0 20px rgba(209,255,38,0.06)" : "none",
                }}
              >
                {isOpen && (
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)" }} />
                )}
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-3 p-4 lg:p-5 text-left"
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: isOpen ? "rgba(209,255,38,0.12)" : "rgba(138,143,152,0.06)", border: `0.5px solid ${isOpen ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}` }}>
                    {isOpen ? <Minus size={13} style={{ color: "#D1FF26" }} /> : <Plus size={13} style={{ color: "#8A8F98" }} />}
                  </div>
                  <span className="font-heading font-semibold text-sm lg:text-base flex-1" style={{ color: isOpen ? "#D1FF26" : "#F5F5F7" }}>
                    {faq.q}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 lg:px-5 pb-4 lg:pb-5 pl-14 lg:pl-16 text-sm leading-relaxed" style={{ color: "#8A8F98" }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom hint */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <HelpCircle size={13} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
              TIP: You can also just call the main number and say what you need — no code required.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}