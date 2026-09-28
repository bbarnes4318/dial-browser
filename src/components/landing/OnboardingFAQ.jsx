import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Mic, Phone, Check, Shield, Signal } from "lucide-react";

const faqs = [
  {
    icon: Mic,
    q: "What is voice verification and why do I need it?",
    a: "Voice verification is a one-time security step during onboarding where you speak a short phrase into your phone. We create a private voice signature that confirms your identity on future calls — so no one else can access your account or services using your phone number. It replaces passwords entirely.",
  },
  {
    icon: Phone,
    q: "How do I complete voice verification?",
    a: "During onboarding, you'll be prompted to say a short phrase like \"My name is [your name] and I'm ready to connect.\" The system records it, analyzes your unique vocal pattern, and marks your account as verified. The whole process takes under 30 seconds and works on any phone — smartphone or basic feature phone.",
  },
  {
    icon: Signal,
    q: "What happens after I'm verified?",
    a: "Once verified, you receive a personal member dial code. From any phone, you dial this code and our system recognizes your voice instantly — no PINs, no logins. You're then routed to any service in the catalog: local search, ride hailing, music, marketplace, dating, events, and more.",
  },
  {
    icon: Phone,
    q: "How do service connections work?",
    a: "Each service has a short dial code (e.g. *101# for local search, *301# for marketplace). Dial the code, speak your request in plain language, and we connect you instantly. You can also call the main number and simply say what you need — our AI routes you to the right service automatically.",
  },
  {
    icon: Check,
    q: "Do I need to re-verify on a new phone?",
    a: "No. Your voice signature is tied to your account, not your device. When you call from any phone, the system verifies you by your voice — not the device. If you get a new phone, just call the main number and speak; you're recognized immediately.",
  },
  {
    icon: Shield,
    q: "Is my voice data safe?",
    a: "Absolutely. Your voice signature is encrypted and stored securely — it's never shared, sold, or used for advertising. We only use it to authenticate your calls. You can request full deletion of your voice data and account at any time by dialing the support code.",
  },
  {
    icon: Signal,
    q: "What if voice verification fails?",
    a: "If the system can't match your voice (e.g. heavy background noise or a poor connection), you'll be offered a fallback SMS code to your registered phone number. Enter the code and you're in. You can re-record your voice signature anytime through the settings menu.",
  },
  {
    icon: Mic,
    q: "Can someone impersonate my voice to access my account?",
    a: "Our voice verification analyzes over 100 unique vocal characteristics — pitch, cadence, resonance, and more — making it extremely difficult to spoof. Combined with phone-number binding, this is far more secure than a password. If suspicious activity is detected, we require SMS code confirmation as an extra layer.",
  },
];

export default function OnboardingFAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-10 lg:mb-14"
        >
          <div className="flex items-center gap-2 mb-4">
            <Mic size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>
              // NEW MEMBER GUIDE
            </p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Voice Verification & <span style={{ color: "#D1FF26" }}>Service Connections</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Everything new members need to know about getting verified and connecting to services — no app, no internet, just your voice.
          </p>
        </motion.div>

        {/* Two-column: visual explainer + FAQ accordion */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Process visual */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="p-6 h-fit" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <p className="font-mono text-[10px] tracking-widest mb-5" style={{ color: "#D1FF26" }}>
                // HOW IT WORKS
              </p>
              <div className="space-y-4">
                {[
                  { step: "01", title: "Speak a Phrase", desc: "Say a short verification phrase during onboarding.", icon: Mic },
                  { step: "02", title: "Get Verified", desc: "We create your private voice signature in seconds.", icon: Check },
                  { step: "03", title: "Dial Any Service", desc: "Call any service code — your voice is your key.", icon: Phone },
                  { step: "04", title: "Stay Secure", desc: "No passwords. Your voice, your phone, your access.", icon: Shield },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="relative flex items-start gap-3">
                      {i < 3 && (
                        <div className="absolute left-[15px] top-10 bottom-0 w-px" style={{ background: "rgba(209,255,38,0.15)" }} />
                      )}
                      <div
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full relative z-10"
                        style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}
                      >
                        <Icon size={14} style={{ color: "#D1FF26" }} />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(209,255,38,0.6)" }}>{s.step}</span>
                          <h4 className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{s.title}</h4>
                        </div>
                        <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status badge */}
              <div className="mt-6 pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }} />
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>VOICE AUTH ACTIVE</p>
                </div>
                <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>
                  Dial *520# to start onboarding
                </p>
              </div>
            </div>
          </motion.div>

          {/* FAQ accordion */}
          <div className="lg:col-span-3 space-y-2">
            {faqs.map((faq, idx) => {
              const Icon = faq.icon;
              const isOpen = openIndex === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="overflow-hidden"
                  style={{
                    background: isOpen ? "#10141D" : "rgba(16,20,29,0.5)",
                    border: `0.5px solid ${isOpen ? "rgba(209,255,38,0.3)" : "rgba(209,255,38,0.08)"}`,
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
                        style={{
                          background: isOpen ? "rgba(209,255,38,0.12)" : "rgba(209,255,38,0.06)",
                          border: "0.5px solid rgba(209,255,38,0.2)",
                        }}
                      >
                        <Icon size={14} style={{ color: "#D1FF26" }} />
                      </span>
                      <span className="font-heading font-bold text-sm sm:text-base" style={{ color: "#F5F5F7" }}>
                        {faq.q}
                      </span>
                    </span>
                    <span className="flex-shrink-0">
                      {isOpen ? (
                        <Minus size={16} style={{ color: "#D1FF26" }} />
                      ) : (
                        <Plus size={16} style={{ color: "#8A8F98" }} />
                      )}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 sm:px-5 pb-5 pl-16 text-sm" style={{ color: "#8A8F98", lineHeight: 1.7 }}>
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}