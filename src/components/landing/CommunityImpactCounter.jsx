import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Phone, Server, Users, TrendingUp } from "lucide-react";

// Base figures — represent the platform's current cumulative totals
const baseStats = {
  servicesAccessed: 8472031,
  activeNodes: 8421,
  connectedUsers: 1284567,
};

// Per-tick increment ranges (simulated real-time growth)
const increments = {
  servicesAccessed: { min: 3, max: 11 },
  activeNodes: { min: 0, max: 2 },
  connectedUsers: { min: 5, max: 23 },
};

function useAnimatedCounter(target, isActive, duration = 2000) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); startRef.current = null; };
  }, [target, isActive, duration]);

  return value;
}

function StatCard({ icon: Icon, label, baseValue, increments: inc, delay, isActive, accent }) {
  const animatedValue = useAnimatedCounter(baseValue, isActive);
  const [liveValue, setLiveValue] = useState(baseValue);

  // After initial count-up completes, add real-time increments
  useEffect(() => {
    if (!isActive) return;
    const reached = animatedValue >= baseValue * 0.99;
    if (!reached) return;
    setLiveValue(baseValue);
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * (inc.max - inc.min + 1)) + inc.min;
      setLiveValue((prev) => prev + delta);
    }, 1200 + Math.random() * 800);
    return () => clearInterval(interval);
  }, [isActive, animatedValue, baseValue, inc.min, inc.max]);

  const displayValue = animatedValue < baseValue * 0.99 ? animatedValue : liveValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative p-6 lg:p-8 overflow-hidden group"
      style={{
        background: "linear-gradient(135deg, rgba(16,20,29,0.8) 0%, rgba(10,13,18,0.6) 100%)",
        border: `0.5px solid ${accent ? "rgba(209,255,38,0.25)" : "rgba(138,143,152,0.12)"}`,
      }}
    >
      {/* Glow accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100" style={{ background: "radial-gradient(circle, rgba(209,255,38,0.08) 0%, transparent 70%)" }} />

      {/* Icon */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Icon size={16} style={{ color: "#D1FF26" }} />
        </div>
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
      </div>

      {/* Counter */}
      <div className="flex items-baseline gap-2">
        <motion.p
          key={displayValue}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight tabular-nums"
          style={{ color: "#D1FF26" }}
        >
          {displayValue.toLocaleString()}
        </motion.p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 mt-3">
        <div className="relative">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26" }} />
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping" style={{ background: "rgba(209,255,38,0.6)" }} />
        </div>
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>LIVE</span>
      </div>

      {/* Bottom data line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)" }} />
    </motion.div>
  );
}

export default function CommunityImpactCounter() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, threshold: 0.3 });

  return (
    <section ref={sectionRef} className="snap-section relative flex flex-col justify-center py-16 lg:py-20 overflow-hidden" style={{ background: "#05070A" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(209,255,38,0.03) 0%, transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }}       animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// COMMUNITY IMPACT</p>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            One Network. <span style={{ color: "#D1FF26" }}>Infinite Reach.</span>
          </h2>
          <p className="text-sm font-light max-w-xl mx-auto" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            Real-time activity across the 1 CALL AWAY™ global dial network.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={Phone} label="SERVICES ACCESSED" baseValue={baseStats.servicesAccessed} increments={increments.servicesAccessed} delay={0.1} isActive={inView} accent />
          <StatCard icon={Server} label="ACTIVE NODES" baseValue={baseStats.activeNodes} increments={increments.activeNodes} delay={0.2} isActive={inView} />
          <StatCard icon={Users} label="CONNECTED USERS" baseValue={baseStats.connectedUsers} increments={increments.connectedUsers} delay={0.3} isActive={inView} />
        </div>
      </div>
    </section>
  );
}