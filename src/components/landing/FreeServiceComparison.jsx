import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radio, Users, Film, Check, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    id: "radio",
    name: "Radio Phone Network",
    icon: Radio,
    dial: "*535#",
    free: {
      label: "Free Basic",
      features: [
        { label: "3 demo stations", included: true },
        { label: "Standard audio quality", included: true },
        { label: "Browse all genres", included: true },
        { label: "Artist track submission", included: false },
        { label: "HD audio quality", included: false },
        { label: "All 50+ stations", included: false },
      ],
    },
    plus: {
      label: "Plus",
      price: "$7.99/mo",
      features: [
        { label: "All 50+ stations", included: true },
        { label: "HD audio quality", included: true },
        { label: "Artist track submission", included: true },
        { label: "Unlimited listening", included: true },
        { label: "No ads", included: true },
        { label: "Priority requests", included: true },
      ],
    },
  },
  {
    id: "collab",
    name: "Let's Collab",
    icon: Users,
    dial: "*545#",
    free: {
      label: "Free Basic",
      features: [
        { label: "Browse all projects", included: true },
        { label: "View talent profiles", included: true },
        { label: "Search by role/skill", included: true },
        { label: "Post projects", included: false },
        { label: "Direct messaging", included: false },
        { label: "Verified badge", included: false },
      ],
    },
    plus: {
      label: "Plus",
      price: "$14.99/mo",
      features: [
        { label: "Post unlimited projects", included: true },
        { label: "Direct messaging & connections", included: true },
        { label: "Verified badge", included: true },
        { label: "Portfolio showcase", included: true },
        { label: "Priority placement", included: true },
        { label: "Cross-platform promotion", included: true },
      ],
    },
  },
  {
    id: "media",
    name: "1 Call Media",
    icon: Film,
    dial: "*525#",
    free: {
      label: "Free Basic",
      features: [
        { label: "Browse movie & TV library", included: true },
        { label: "View descriptions", included: true },
        { label: "Content search", included: true },
        { label: "Stream instantly in-browser", included: false },
        { label: "Audio description mode", included: false },
        { label: "Ad-free experience", included: false },
      ],
    },
    plus: {
      label: "Plus",
      price: "$12.99/mo",
      features: [
        { label: "Stream instantly in your browser", included: true },
        { label: "Audio description / listen mode", included: true },
        { label: "Unlimited browsing & playback", included: true },
        { label: "Ad-free experience", included: true },
      ],
    },
  },
];

function FeatureRow({ value }) {
  if (value === true) return <Check size={13} style={{ color: "#D1FF26" }} />;
  if (value === false) return <X size={13} style={{ color: "rgba(138,143,152,0.3)" }} />;
  return <span className="font-mono text-[9px]" style={{ color: "#F5F5F7" }}>{value}</span>;
}

export default function FreeServiceComparison() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="compare-tiers" className="snap-section relative py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
              <Sparkles size={12} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>FREE BASIC SERVICES</span>
            </div>
          </div>
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// COMPARE ALL TIERS</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Every Feature, <span style={{ color: "#D1FF26" }}>Side by Side.</span>
          </h2>
          <p className="text-lg font-light max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Three flagship services — free basic access for everyone, with optional Plus upgrades for the full experience. No credit card required to start.
          </p>
        </motion.div>

        {/* Comparison cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                className="flex flex-col"
                style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}
              >
                {/* Service header */}
                <div className="p-5 text-center" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}>
                  <div className="flex items-center justify-center mb-3">
                    <div className="flex items-center justify-center" style={{ width: 40, height: 40, background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                      <Icon size={18} style={{ color: "#D1FF26" }} />
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{svc.name}</h3>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>DIAL {svc.dial}</p>
                </div>

                {/* Free tier */}
                <div className="p-4 flex-1" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{svc.free.label}</span>
                    <span className="font-heading font-black text-lg" style={{ color: "#D1FF26" }}>$0</span>
                  </div>
                  <ul className="space-y-2">
                    {svc.free.features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5"><FeatureRow value={feat.included} /></span>
                        <span className="text-[11px]" style={{ color: feat.included ? "#F5F5F7" : "rgba(138,143,152,0.4)", lineHeight: 1.4 }}>{feat.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plus tier */}
                <div className="p-4" style={{ background: "rgba(209,255,38,0.03)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>{svc.plus.label}</span>
                    <span className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>{svc.plus.price}</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {svc.plus.features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                        <span className="text-[11px]" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{feat.label}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="w-full py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.2)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    Get Free Access
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 p-5 text-center"
          style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
            // FREE BASIC ACCESS — NO CREDIT CARD REQUIRED
          </p>
          <p className="text-sm mt-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            Dial any service code above to start with free basic access. Upgrade to Plus anytime for the full experience.
          </p>
          <Link to="/compare-services" className="inline-flex items-center gap-1.5 mt-4 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#D1FF26" }}>
            Compare Voice Services →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}