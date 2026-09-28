import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Dial In",
    description: "Call the 1 CALL AWAY access number from any phone — smartphone or basic feature phone. No app, no internet required.",
    keys: ["1", "C", "A", "L", "L"],
    action: "Press CALL",
    detail: "Connect to the Dial Browser™ gateway",
  },
  {
    id: 2,
    title: "Hear the Menu",
    description: "An automated voice reads the service directory. Listen for the category you need — each is mapped to a number on your keypad.",
    keys: ["1", "2", "3", "4", "5", "6"],
    action: "Listen",
    detail: "Transport · Shopping · Health · Finance · Music · Info",
  },
  {
    id: 3,
    title: "Press a Number",
    description: "Tap the number that matches your desired service. The system instantly routes you to that category's sub-menu.",
    keys: ["3"],
    action: "Press 3",
    detail: "Selected: Health Services",
  },
  {
    id: 4,
    title: "Speak or Type",
    description: "Use voice commands or SMS-style text input to specify your request. Say a name, type a query, or follow the audio prompts.",
    keys: ["0", "9"],
    action: "Speak or Text",
    detail: "Natural language or keypad input",
  },
  {
    id: 5,
    title: "Get Results",
    description: "Receive your answer as a voice readout, SMS text message, or both. No screen, no data plan — just your voice and keypad.",
    keys: ["#", "0"],
    action: "Receive",
    detail: "Audio response + SMS confirmation",
  },
];

function KeypadKey({ label, sublabel, active, pressed, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="relative aspect-square flex flex-col items-center justify-center"
      style={{
        background: active ? 'rgba(209,255,38,0.12)' : 'rgba(16,20,29,0.6)',
        border: `0.5px solid ${active ? 'rgba(209,255,38,0.4)' : 'rgba(138,143,152,0.12)'}`,
        boxShadow: active ? '0 0 20px rgba(209,255,38,0.15)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <span className="font-heading font-bold text-lg" style={{ color: active ? '#D1FF26' : '#F5F5F7' }}>
        {label}
      </span>
      {sublabel && (
        <span className="font-mono text-[7px] tracking-wider mt-0.5" style={{ color: '#8A8F98' }}>
          {sublabel}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="key-glow"
          className="absolute inset-0"
          style={{ boxShadow: '0 0 30px rgba(209,255,38,0.2)', pointerEvents: 'none' }}
        />
      )}
    </motion.div>
  );
}

export default function HowToGuide() {
  const [activeStep, setActiveStep] = useState(0);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !autoPlay) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [inView, autoPlay]);

  const step = steps[activeStep];

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 lg:mb-16 text-center"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // USER MANUAL
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            How It Works
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Five steps. One keypad. Zero apps. Here's how anyone can access the internet with a standard phone.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Steps list */}
          <div className="space-y-3">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setActiveStep(i); setAutoPlay(false); }}
                className="w-full text-left p-4 transition-all duration-300"
                style={{
                  background: activeStep === i ? 'rgba(209,255,38,0.06)' : 'rgba(16,20,29,0.3)',
                  border: `0.5px solid ${activeStep === i ? 'rgba(209,255,38,0.25)' : 'rgba(138,143,152,0.08)'}`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-mono text-sm font-bold"
                    style={{
                      background: activeStep === i ? '#D1FF26' : 'transparent',
                      border: `0.5px solid ${activeStep === i ? '#D1FF26' : 'rgba(138,143,152,0.2)'}`,
                      color: activeStep === i ? '#05070A' : '#8A8F98',
                    }}
                  >
                    {s.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-heading font-bold text-base" style={{ color: activeStep === i ? '#F5F5F7' : '#8A8F98' }}>
                        {s.title}
                      </h3>
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: activeStep === i ? '#D1FF26' : 'rgba(138,143,152,0.4)' }}>
                        {s.action.toUpperCase()}
                      </span>
                    </div>
                    <AnimatePresence mode="wait">
                      {activeStep === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm leading-relaxed mt-2 overflow-hidden"
                          style={{ color: '#8A8F98' }}
                        >
                          {s.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Phone keypad visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Phone frame */}
            <div
              className="relative mx-auto p-6 lg:p-8"
              style={{
                background: 'rgba(16,20,29,0.6)',
                border: '0.5px solid rgba(138,143,152,0.12)',
                maxWidth: '320px',
              }}
            >
              {/* Screen readout */}
              <div
                className="mb-5 p-3 text-center"
                style={{
                  background: 'rgba(5,7,10,0.6)',
                  border: '0.5px solid rgba(209,255,38,0.15)',
                }}
              >
                <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: '#8A8F98' }}>
                  STEP {step.id} / {steps.length}
                </p>
                <p className="font-mono text-xs" style={{ color: '#D1FF26' }}>
                  {step.detail}
                </p>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "1", sub: "" },
                  { label: "2", sub: "ABC" },
                  { label: "3", sub: "DEF" },
                  { label: "4", sub: "GHI" },
                  { label: "5", sub: "JKL" },
                  { label: "6", sub: "MNO" },
                  { label: "7", sub: "PQRS" },
                  { label: "8", sub: "TUV" },
                  { label: "9", sub: "WXYZ" },
                  { label: "*", sub: "" },
                  { label: "0", sub: "+" },
                  { label: "#", sub: "" },
                ].map((key, i) => {
                  const isActive = step.keys.includes(key.label);
                  return (
                    <KeypadKey
                      key={i}
                      label={key.label}
                      sublabel={key.sub}
                      active={isActive}
                      delay={i * 0.03}
                    />
                  );
                })}
              </div>

              {/* Action button */}
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 py-3 text-center"
                style={{
                  background: '#D1FF26',
                  color: '#05070A',
                }}
              >
                <span className="font-mono text-xs font-bold tracking-widest">
                  {step.action.toUpperCase()}
                </span>
              </motion.div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveStep(i); setAutoPlay(false); }}
                    className="transition-all duration-300"
                    style={{
                      width: activeStep === i ? '24px' : '6px',
                      height: '6px',
                      background: activeStep === i ? '#D1FF26' : 'rgba(138,143,152,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Decorative signal lines */}
            <div className="absolute -top-4 -right-4 font-mono text-[8px] tracking-widest" style={{ color: 'rgba(138,143,152,0.3)' }}>
              KEYPAD v1.0
            </div>
            <div className="absolute -bottom-4 -left-4 font-mono text-[8px] tracking-widest" style={{ color: 'rgba(138,143,152,0.3)' }}>
              DTMF TONES
            </div>
          </motion.div>
        </div>

        {/* CTA + bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link
            to="/directory"
            className="inline-flex items-center gap-2 px-8 py-4 mb-6 font-mono text-xs tracking-[0.3em] uppercase transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
            style={{ background: '#D1FF26', color: '#05070A' }}
          >
            View the Service Catalog <ArrowRight size={14} />
          </Link>
          <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
            WORKS ON ANY PHONE — SMARTPHONE, FLIP PHONE, OR LANDLINE · NO INTERNET REQUIRED
          </p>
        </motion.div>
      </div>
    </section>
  );
}