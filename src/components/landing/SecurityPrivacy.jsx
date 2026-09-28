import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, EyeOff, KeyRound, ServerCog, FileCheck, Phone, MessageSquare, ShieldCheck } from "lucide-react";

const protections = [
  { icon: Lock, title: "End-to-End Encryption", desc: "Every voice call and SMS message is encrypted in transit. Only you and your intended recipient can read the content." },
  { icon: EyeOff, title: "Zero Data Selling", desc: "We never sell, share, or rent your conversation data, contacts, or call history to third parties or advertisers." },
  { icon: KeyRound, title: "Anonymized Routing", desc: "Calls and messages are routed through anonymized nodes. Your phone number is never exposed to the services you dial." },
  { icon: ServerCog, title: "Minimal Data Retention", desc: "We store only what's needed to deliver the service. Conversation logs are purged on a rolling schedule — nothing kept forever." },
  { icon: FileCheck, title: "Compliance First", desc: "Built to align with GDPR, CCPA, and regional telecom privacy frameworks. Audited regularly for data handling practices." },
  { icon: ShieldCheck, title: "No Listening, No Training", desc: "Your conversations are never transcribed for ad targeting or used to train AI models. Your voice stays yours." },
];

const layers = [
  { icon: Phone, label: "Voice Call", measures: ["Encrypted audio stream", "Number masked from service", "No call recording"] },
  { icon: MessageSquare, label: "SMS Message", measures: ["Encrypted in transit", "Auto-purge after delivery", "No content logging"] },
];

export default function SecurityPrivacy() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="security"
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(209,255,38,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(209,255,38,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 lg:mb-14"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} style={{ color: '#D1FF26' }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: '#D1FF26' }}>
              // SECURITY & PRIVACY
            </p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Your Conversations,<br />
            <span style={{ color: '#D1FF26' }}>Protected by Design</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Every phone call and SMS message routed through 1 CALL AWAY™ is shielded by layered encryption and a strict no-data-selling policy. Privacy isn't a feature — it's the foundation.
          </p>
        </motion.div>

        {/* Protection layers — phone & SMS */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {layers.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + idx * 0.1 }}
                className="p-5"
                style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.15)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(209,255,38,0.1)', border: '0.5px solid rgba(209,255,38,0.25)' }}>
                    <Icon size={18} style={{ color: '#D1FF26' }} />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>PROTECTION LAYER</p>
                    <h3 className="font-heading font-bold text-lg" style={{ color: '#F5F5F7' }}>{layer.label}</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  {layer.measures.map((m) => (
                    <div key={m} className="flex items-center gap-2">
                      <ShieldCheck size={13} style={{ color: '#D1FF26' }} />
                      <span className="text-sm" style={{ color: '#F5F5F7' }}>{m}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Protection feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {protections.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                className="p-5 group transition-all duration-300 hover:border-[rgba(209,255,38,0.3)]"
                style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}
              >
                <div className="w-10 h-10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]" style={{ background: 'rgba(209,255,38,0.08)', border: '0.5px solid rgba(209,255,38,0.2)' }}>
                  <Icon size={18} style={{ color: '#D1FF26' }} />
                </div>
                <h3 className="font-heading font-bold text-base mb-2" style={{ color: '#F5F5F7' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8A8F98' }}>{p.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-6 p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'rgba(209,255,38,0.04)', border: '0.5px solid rgba(209,255,38,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: '#D1FF26', boxShadow: '0 0 8px #D1FF26', animation: 'dotPulse 1.5s ease-in-out infinite' }} />
            <p className="font-mono text-xs tracking-widest" style={{ color: '#F5F5F7' }}>
              PRIVACY STATUS: <span style={{ color: '#D1FF26' }}>ENCRYPTED · NO DATA SOLD · COMPLIANT</span>
            </p>
          </div>
          <p className="font-mono text-[10px] tracking-wider" style={{ color: 'rgba(138,143,152,0.6)' }}>
            ▸ GDPR · CCPA · TELECOM PRIVACY ALIGNED
          </p>
        </motion.div>
      </div>
    </section>
  );
}