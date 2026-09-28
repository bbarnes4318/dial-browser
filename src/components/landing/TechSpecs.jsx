import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";
import { Signal, Phone, Mic, Battery, Volume2, Hash, Check, X, Cpu } from "lucide-react";

const networkSpecs = [
  {
    label: "2G / GSM",
    speed: "9.6 – 14.4 kbps",
    status: "Supported",
    note: "Minimum viable connection. Voice calls and SMS function normally.",
    level: 1,
  },
  {
    label: "2.5G / GPRS",
    speed: "56 – 114 kbps",
    status: "Supported",
    note: "Enhanced SMS routing and faster voice gateway response.",
    level: 2,
  },
  {
    label: "3G / UMTS",
    speed: "384 kbps – 2 Mbps",
    status: "Optimal",
    note: "Recommended for lowest latency and best voice clarity.",
    level: 3,
  },
  {
    label: "4G / LTE VoLTE",
    speed: "5 – 100 Mbps",
    status: "Optimal",
    note: "Full-speed access with HD voice and instant routing.",
    level: 4,
  },
  {
    label: "Landline / PSTN",
    speed: "Analog voice",
    status: "Supported",
    note: "Traditional copper-line telephones fully supported.",
    level: 2,
  },
  {
    label: "Satellite Phone",
    speed: "2.4 – 9.6 kbps",
    status: "Supported",
    note: "Works with Iridium, Inmarsat, and Thuraya networks.",
    level: 1,
  },
];

const hardwareCompat = [
  { category: "Feature Phones", icon: Phone, examples: "Nokia 105, 3310, Samsung Guru, Tecno T328", supported: true, note: "Full access via keypad + voice" },
  { category: "Flip Phones", icon: Phone, examples: "Motorola Razr, Samsung Z Flip, Alcatel Go Flip", supported: true, note: "Keypad + voice + SMS" },
  { category: "Smartphones", icon: Phone, examples: "iPhone, Samsung Galaxy, Google Pixel, Xiaomi", supported: true, note: "Dial in or use companion app" },
  { category: "Landline Phones", icon: Phone, examples: "Corded/cordless home phones, office desk phones", supported: true, note: "Voice-only access" },
  { category: "Satellite Phones", icon: Phone, examples: "Iridium 9555, Inmarsat IsatPhone, Thuraya XT", supported: true, note: "Voice + SMS in remote zones" },
  { category: "Tablets / No-SIM", icon: X, examples: "Wi-Fi-only tablets, laptops without cellular", supported: false, note: "Use VoIP dialer companion app" },
];

const requirements = [
  { icon: Signal, label: "Minimum Signal", value: "1 bar", detail: "Any carrier voice signal suffices" },
  { icon: Mic, label: "Microphone", value: "Built-in", detail: "Any phone mic or headset works" },
  { icon: Volume2, label: "Speaker", value: "Built-in", detail: "Earpiece, speakerphone, or headphones" },
  { icon: Battery, label: "Power", value: "Any charge", detail: "One call uses < 1% battery" },
  { icon: Hash, label: "Keypad", value: "0–9, *, #", detail: "Standard 12-key DTMF layout" },
  { icon: Cpu, label: "Processor", value: "None required", detail: "No OS, no apps, no updates" },
];

export default function TechSpecs() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

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
            // TECHNICAL SPECIFICATIONS
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            System Requirements
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            If your phone can make a call, you're ready. Here's exactly what you need to get started.
          </p>
        </motion.div>

        {/* Landline callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-12 p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: 'rgba(209,255,38,0.05)',
            border: '0.5px solid rgba(209,255,38,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(209,255,38,0.1)' }}
            >
              <Phone size={20} style={{ color: '#D1FF26' }} />
            </div>
            <div>
              <p className="font-heading font-bold text-sm" style={{ color: '#F5F5F7' }}>
                No cell phone? No problem.
              </p>
              <p className="text-xs" style={{ color: '#8A8F98' }}>
                All basic services work from any landline — corded, cordless, or office desk phone. No mobile required.
              </p>
            </div>
          </div>
          <span
            className="flex-shrink-0 px-4 py-2 font-mono text-[10px] tracking-widest"
            style={{
              background: 'rgba(209,255,38,0.1)',
              border: '0.5px solid rgba(209,255,38,0.3)',
              color: '#D1FF26',
            }}
          >
            LANDLINE READY
          </span>
        </motion.div>

        {/* Minimum requirements grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5" style={{ background: '#D1FF26' }} />
            <h3 className="font-heading font-bold text-lg" style={{ color: '#F5F5F7' }}>
              Minimum Requirements
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {requirements.map((req, i) => {
              const Icon = req.icon;
              return (
                <div
                  key={i}
                  className="p-4 flex items-start gap-3"
                  style={{
                    background: 'rgba(16,20,29,0.4)',
                    border: '0.5px solid rgba(138,143,152,0.08)',
                  }}
                >
                  <div
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center"
                    style={{ background: 'rgba(209,255,38,0.08)', border: '0.5px solid rgba(209,255,38,0.2)' }}
                  >
                    <Icon size={16} style={{ color: '#D1FF26' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] tracking-widest mb-0.5" style={{ color: '#8A8F98' }}>
                      {req.label.toUpperCase()}
                    </p>
                    <p className="font-heading font-bold text-sm mb-1" style={{ color: '#D1FF26' }}>
                      {req.value}
                    </p>
                    <p className="text-[11px] leading-snug" style={{ color: 'rgba(138,143,152,0.7)' }}>
                      {req.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Network compatibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5" style={{ background: '#D1FF26' }} />
            <h3 className="font-heading font-bold text-lg" style={{ color: '#F5F5F7' }}>
              Network Compatibility
            </h3>
          </div>
          <div className="space-y-2">
            {networkSpecs.map((spec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                className="flex items-center gap-4 p-4"
                style={{
                  background: 'rgba(16,20,29,0.3)',
                  border: '0.5px solid rgba(138,143,152,0.08)',
                }}
              >
                {/* Signal bars */}
                <div className="flex items-end gap-0.5 flex-shrink-0 w-12 h-8">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className="flex-1 rounded-sm transition-all"
                      style={{
                        height: `${bar * 25}%`,
                        background: bar <= spec.level ? '#D1FF26' : 'rgba(138,143,152,0.15)',
                        boxShadow: bar <= spec.level ? '0 0 4px rgba(209,255,38,0.3)' : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Network name */}
                <div className="flex-shrink-0 w-32 lg:w-40">
                  <p className="font-heading font-bold text-sm" style={{ color: '#F5F5F7' }}>
                    {spec.label}
                  </p>
                  <p className="font-mono text-[10px]" style={{ color: '#8A8F98' }}>
                    {spec.speed}
                  </p>
                </div>

                {/* Note */}
                <p className="flex-1 text-xs hidden sm:block" style={{ color: 'rgba(138,143,152,0.7)' }}>
                  {spec.note}
                </p>

                {/* Status badge */}
                <div
                  className="flex-shrink-0 px-3 py-1.5 font-mono text-[9px] tracking-widest"
                  style={{
                    background: spec.status === 'Optimal' ? 'rgba(209,255,38,0.12)' : 'rgba(16,20,29,0.6)',
                    border: `0.5px solid ${spec.status === 'Optimal' ? 'rgba(209,255,38,0.3)' : 'rgba(138,143,152,0.15)'}`,
                    color: spec.status === 'Optimal' ? '#D1FF26' : '#8A8F98',
                  }}
                >
                  {spec.status.toUpperCase()}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Hardware compatibility table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5" style={{ background: '#D1FF26' }} />
            <h3 className="font-heading font-bold text-lg" style={{ color: '#F5F5F7' }}>
              Hardware Compatibility
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hardwareCompat.map((hw, i) => {
              const Icon = hw.icon;
              return (
                <div
                  key={i}
                  className="p-4"
                  style={{
                    background: 'rgba(16,20,29,0.3)',
                    border: `0.5px solid ${hw.supported ? 'rgba(209,255,38,0.12)' : 'rgba(138,143,152,0.08)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon size={16} style={{ color: hw.supported ? '#D1FF26' : '#8A8F98' }} />
                      <p className="font-heading font-bold text-sm" style={{ color: '#F5F5F7' }}>
                        {hw.category}
                      </p>
                    </div>
                    <div
                      className="w-5 h-5 flex items-center justify-center"
                      style={{
                        background: hw.supported ? 'rgba(209,255,38,0.12)' : 'rgba(138,143,152,0.08)',
                        border: `0.5px solid ${hw.supported ? 'rgba(209,255,38,0.3)' : 'rgba(138,143,152,0.15)'}`,
                      }}
                    >
                      {hw.supported ? (
                        <Check size={12} style={{ color: '#D1FF26' }} />
                      ) : (
                        <X size={12} style={{ color: '#8A8F98' }} />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] mb-2" style={{ color: 'rgba(138,143,152,0.7)' }}>
                    {hw.examples}
                  </p>
                  <p className="font-mono text-[9px] tracking-wider" style={{ color: hw.supported ? '#D1FF26' : 'rgba(138,143,152,0.5)' }}>
                    {hw.note.toUpperCase()}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: 'rgba(209,255,38,0.04)',
            border: '0.5px solid rgba(209,255,38,0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(209,255,38,0.1)' }}
            >
              <Check size={20} style={{ color: '#D1FF26' }} />
            </div>
            <div>
              <p className="font-heading font-bold text-sm" style={{ color: '#F5F5F7' }}>
                Bottom line: if it rings, it works.
              </p>
              <p className="text-xs" style={{ color: '#8A8F98' }}>
                No downloads, no updates, no data plans. Just dial and go.
              </p>
            </div>
          </div>
          <button
            onClick={() => openRegistrationModal()}
            className="flex-shrink-0 px-6 py-3 font-mono text-xs tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_30px_rgba(209,255,38,0.2)]"
            style={{ background: '#D1FF26', color: '#05070A' }}
          >
            Get Started
          </button>
        </motion.div>
      </div>
    </section>
  );
}