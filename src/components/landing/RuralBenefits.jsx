import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Signal, BookOpen, HeartPulse, ShoppingCart, Banknote, GraduationCap, Wheat, Phone } from "lucide-react";

const benefits = [
  {
    icon: Signal,
    title: "No Internet Required",
    description: "Works on basic 2G/3G feature phones and landlines. Where there's a phone signal, there's full internet access.",
    stat: "Zero data plan needed",
  },
  {
    icon: HeartPulse,
    title: "Healthcare Access",
    description: "Call to find nearby clinics, request medical advice, schedule appointments, or get emergency information without traveling hours.",
    stat: "1 call = 1 clinic",
  },
  {
    icon: GraduationCap,
    title: "Education for All",
    description: "Students access lessons, homework help, and educational resources through voice — no tablet, laptop, or Wi-Fi required.",
    stat: "Learning without screens",
  },
  {
    icon: Banknote,
    title: "Financial Inclusion",
    description: "Check balances, transfer money, and access banking services via SMS and voice — bringing the unbanked into the economy.",
    stat: "Banking without a bank",
  },
  {
    icon: ShoppingCart,
    title: "Marketplace Access",
    description: "Farmers and rural sellers compare prices, list goods, and reach buyers in distant cities without middlemen or travel.",
    stat: "Direct to market",
  },
  {
    icon: Wheat,
    title: "Agricultural Info",
    description: "Get weather forecasts, crop prices, and farming guidance delivered by voice in local languages and dialects.",
    stat: "Real-time harvest data",
  },
  {
    icon: BookOpen,
    title: "Government Services",
    description: "Access IDs, subsidies, voting info, and public services that were previously only available at distant government offices.",
    stat: "Bureaucracy by phone",
  },
  {
    icon: Phone,
    title: "Universal Affordability",
    description: "A single call costs less than a cup of tea. No smartphone, no monthly data contract, no device to charge or maintain.",
    stat: "Pennies per session",
  },
];

const stats = [
  { value: "2.6B", label: "People offline globally" },
  { value: "0", label: "Smartphones required" },
  { value: "1", label: "Phone call to connect" },
  { value: "100%", label: "Voice & SMS powered" },
];

export default function RuralBenefits() {
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
            // BRIDGING THE DIVIDE
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Built for the<br />
            <span style={{ color: '#D1FF26' }}>Unconnected</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Billions of people live without reliable internet. 1 CALL AWAY™ turns any phone — even a basic feature phone on a weak 2G signal — into a gateway to the digital world.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12"
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="p-5 text-center"
              style={{
                background: 'rgba(16,20,29,0.5)',
                border: '0.5px solid rgba(209,255,38,0.12)',
              }}
            >
              <p className="font-heading font-black text-3xl lg:text-4xl mb-1" style={{ color: '#D1FF26' }}>
                {stat.value}
              </p>
              <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                {stat.label.toUpperCase()}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="group p-5 transition-all duration-300 hover:bg-[rgba(209,255,38,0.04)]"
                style={{
                  background: 'rgba(16,20,29,0.3)',
                  border: '0.5px solid rgba(138,143,152,0.08)',
                }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
                  style={{
                    background: 'rgba(209,255,38,0.08)',
                    border: '0.5px solid rgba(209,255,38,0.2)',
                  }}
                >
                  <Icon size={18} style={{ color: '#D1FF26' }} />
                </div>
                <h3 className="font-heading font-bold text-sm mb-2" style={{ color: '#F5F5F7' }}>
                  {benefit.title}
                </h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: '#8A8F98' }}>
                  {benefit.description}
                </p>
                <p className="font-mono text-[9px] tracking-widest" style={{ color: '#D1FF26' }}>
                  → {benefit.stat.toUpperCase()}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 p-6 lg:p-8 text-center"
          style={{
            background: 'rgba(16,20,29,0.4)',
            border: '0.5px solid rgba(209,255,38,0.15)',
          }}
        >
          <p className="font-heading font-bold text-lg lg:text-xl mb-2" style={{ color: '#F5F5F7' }}>
            A phone line is all it takes.
          </p>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            From remote villages in sub-Saharan Africa to rural communities across Asia and Latin America, 1 CALL AWAY™ delivers the power of the internet through the most universal technology on Earth: the telephone.
          </p>
        </motion.div>
      </div>
    </section>
  );
}