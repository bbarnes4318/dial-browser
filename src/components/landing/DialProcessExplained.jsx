import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Phone, Mic, Brain, Route, Handshake, MessageSquare,
  ChevronRight, ArrowDown, Zap, Cpu, Database, Bell,
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: Phone,
    label: "Dial In",
    title: "Member Calls In",
    desc: "The member calls the 1 Call Away™ number from any phone. The call connects to the voice gateway instantly — no app, no internet required.",
    detail: "Works on any phone with a voice plan",
    color: "#D1FF26",
  },
  {
    num: "02",
    icon: Mic,
    label: "Voice Capture",
    title: "Speech Is Recorded",
    desc: "The member speaks naturally — \"I need a plumber tomorrow\" or \"What's the weather in Miami?\" The gateway captures the audio in real time and cleans background noise.",
    detail: "Supports 40+ languages automatically",
    color: "#22d3ee",
  },
  {
    num: "03",
    icon: Brain,
    label: "AI Transcription",
    title: "Voice Becomes Text",
    desc: "Our speech-to-text engine converts the spoken words into a structured text query. The transcript is analyzed for keywords, entities, and service intent.",
    detail: "Sub-second processing latency",
    color: "#a855f7",
  },
  {
    num: "04",
    icon: Cpu,
    label: "Intent Detection",
    title: "AI Understands the Goal",
    desc: "The AI classifies the request — is this a booking, a search, a purchase, or an emergency? It extracts the service category, location, and urgency level from the transcript.",
    detail: "Trained on millions of voice commands",
    color: "#f59e0b",
  },
  {
    num: "05",
    icon: Route,
    label: "Service Routing",
    title: "Request Is Matched",
    desc: "The system searches the provider network for the best match — filtering by category, region, availability, and rating. The top match is selected and a service request record is created.",
    detail: "Typically matches in under 2 seconds",
    color: "#3b82f6",
  },
  {
    num: "06",
    icon: Handshake,
    label: "Provider Notified",
    title: "Provider Responds",
    desc: "The matched provider receives the request details and reaches out to the member directly — by call, text, or in-app message — to confirm the booking or answer the question.",
    detail: "Average response time: 15 minutes",
    color: "#D1FF26",
  },
  {
    num: "07",
    icon: MessageSquare,
    label: "SMS Confirmation",
    title: "Confirmation Sent",
    desc: "The member receives an SMS with the provider's name, contact info, and a summary of the request. A follow-up message checks in after the service is completed.",
    detail: "Full trail saved in the member's dashboard",
    color: "#22d3ee",
  },
];

export default function DialProcessExplained() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="dial-process"
      className="snap-section relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      {/* Background signal lines */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.4), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
        <div className="absolute top-2/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 6s ease-in-out infinite 1s" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12 lg:mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Zap size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// HOW IT WORKS</span>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            From Voice to <span style={{ color: "#D1FF26" }}>Service</span>.
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Here's exactly what happens in the seconds after a member dials in. Seven steps turn a spoken request into a connected service — no smartphone required.
          </p>
        </motion.div>

        {/* Flow diagram — desktop */}
        <div className="hidden lg:block mb-12">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.num}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                    className="flex flex-col items-center text-center flex-shrink-0"
                    style={{ width: "110px" }}
                  >
                    <div
                      className="relative w-14 h-14 flex items-center justify-center mb-3 transition-all"
                      style={{
                        background: `${step.color}12`,
                        border: `0.5px solid ${step.color}50`,
                        boxShadow: `0 0 20px ${step.color}15`,
                      }}
                    >
                      <Icon size={20} style={{ color: step.color }} />
                      <span
                        className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center font-mono text-[8px] font-bold"
                        style={{ background: "#05070A", border: `0.5px solid ${step.color}`, color: step.color }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <p className="font-mono text-[8px] tracking-widest uppercase" style={{ color: step.color }}>{step.label}</p>
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={inView ? { scaleX: 1 } : {}}
                      transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }}
                      className="flex-1 h-px origin-left"
                      style={{ background: `linear-gradient(90deg, ${step.color}40, ${STEPS[i + 1].color}40)` }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Detailed steps */}
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isEven = i % 2 === 0;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.06 }}
                className="relative flex flex-col lg:flex-row gap-4 lg:gap-6 p-5 lg:p-6 transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.08)]"
                style={{
                  background: "rgba(16,20,29,0.6)",
                  border: `0.5px solid rgba(209,255,38,0.1)`,
                }}
              >
                {/* Step number + icon */}
                <div className="flex lg:flex-col items-center gap-3 lg:gap-2 lg:w-32 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-black text-3xl lg:text-4xl tabular-nums" style={{ color: `${step.color}30` }}>
                      {step.num}
                    </span>
                    <div
                      className="w-11 h-11 flex items-center justify-center"
                      style={{
                        background: `${step.color}12`,
                        border: `0.5px solid ${step.color}50`,
                      }}
                    >
                      <Icon size={18} style={{ color: step.color }} />
                    </div>
                  </div>
                  <p className="font-mono text-[9px] tracking-widest uppercase lg:text-center" style={{ color: step.color }}>
                    {step.label}
                  </p>
                </div>

                {/* Vertical divider on desktop */}
                <div className="hidden lg:block w-px self-stretch" style={{ background: "rgba(138,143,152,0.12)" }} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-lg lg:text-xl mb-2" style={{ color: "#F5F5F7" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#8A8F98" }}>
                    {step.desc}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <ChevronRight size={11} style={{ color: step.color }} />
                    <p className="font-mono text-[9px] tracking-wide" style={{ color: step.color }}>{step.detail}</p>
                  </div>
                </div>

                {/* Connecting arrow between steps — mobile only */}
                {i < STEPS.length - 1 && (
                  <div className="lg:hidden flex justify-center absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-6 h-6 flex items-center justify-center" style={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <ArrowDown size={11} style={{ color: "#D1FF26" }} />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <Database size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
              TOTAL TIME: ~7 SECONDS FROM DIAL TO DISPATCH
            </p>
            <Bell size={14} style={{ color: "#D1FF26" }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}