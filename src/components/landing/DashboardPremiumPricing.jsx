import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, X, Film, Radio, Star, Zap, Crown, ChevronRight, Sparkles } from "lucide-react";

const tiers = [
  {
    id: "free",
    name: "Free",
    price: 0,
    icon: Radio,
    tagline: "Basic access",
    highlight: false,
    accent: "#8A8F98",
    features: [
      { label: "Basic voice calls", included: true },
      { label: "Limited marketplace listings", included: true },
      { label: "Standard event access", included: true },
      { label: "1 Call Media streaming", included: false },
      { label: "HD audio quality", included: false },
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 14.99,
    icon: Zap,
    tagline: "Ad-free & HD",
    highlight: false,
    accent: "#8A8F98",
    features: [
      { label: "Everything in Free", included: true },
      { label: "Unlimited marketplace listings", included: true },
      { label: "Radio Phone Network access", included: true },
      { label: "HD audio quality", included: true },
      { label: "1 Call Media streaming", included: false },
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 49.99,
    icon: Crown,
    tagline: "Media & studio unlocked",
    highlight: true,
    accent: "#D1FF26",
    features: [
      { label: "Everything in Plus", included: true },
      { label: "1 Call Media (movies & TV)", included: "Full Access", featured: true },
      { label: "Stream public-domain films in-browser", included: true, featured: true },
      { label: "Audio description / listen mode", included: true, featured: true },
      { label: "AI music production studio", included: true, featured: true },
      { label: "Advanced analytics dashboard", included: true, featured: true },
    ],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 99,
    icon: Crown,
    tagline: "Creator tools unlocked",
    highlight: false,
    accent: "#D1FF26",
    features: [
      { label: "Everything in Elite", included: true },
      { label: "Let's Collab access", included: true },
      { label: "Creator onboarding & revenue share", included: true },
      { label: "Custom voice prompts", included: true },
      { label: "Creator analytics & monetization", included: true },
      { label: "Advanced AI beat production", included: true },
    ],
  },
];

function FeatureCell({ value }) {
  if (value === true) return <Check size={13} style={{ color: "#D1FF26" }} />;
  if (value === false) return <X size={13} style={{ color: "rgba(138,143,152,0.3)" }} />;
  return <span className="font-mono text-[9px] font-semibold" style={{ color: value === "Full Access" || value === "Full" ? "#D1FF26" : "#F5F5F7" }}>{value}</span>;
}

export default function DashboardPremiumPricing() {
  const [inView, setInView] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { threshold: 0.08 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="mb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// 1 CALL PREMIUM™</p>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
          Unlock <span style={{ color: "#D1FF26" }}>Media & Creator Tools.</span>
        </h2>
        <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Upgrade to Elite for full access to 1 Call Media and the AI music production studio — on-demand public-domain movies & TV streamed in your browser, plus advanced creator analytics.
        </p>
      </motion.div>

      {/* Billing toggle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-3 mb-6">
        <button onClick={() => setBillingCycle("monthly")} className={`px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all ${billingCycle === "monthly" ? "text-[#05070A]" : ""}`} style={{ background: billingCycle === "monthly" ? "#D1FF26" : "transparent", border: `0.5px solid ${billingCycle === "monthly" ? "#D1FF26" : "rgba(138,143,152,0.2)"}`, color: billingCycle === "monthly" ? "#05070A" : "#8A8F98" }}>
          Monthly
        </button>
        <button onClick={() => setBillingCycle("annual")} className={`px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all relative`} style={{ background: billingCycle === "annual" ? "#D1FF26" : "transparent", border: `0.5px solid ${billingCycle === "annual" ? "#D1FF26" : "rgba(138,143,152,0.2)"}`, color: billingCycle === "annual" ? "#05070A" : "#8A8F98" }}>
          Annual
          {billingCycle === "annual" && <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 text-[7px] font-bold rounded-full" style={{ background: "#D1FF26", color: "#05070A" }}>17% OFF</span>}
        </button>
      </motion.div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {tiers.map((tier, i) => {
          const Icon = tier.icon;
          const price = billingCycle === "monthly" ? tier.price : Math.round(tier.price * 10);
          return (
            <motion.div key={tier.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }} className={`p-5 flex flex-col relative ${tier.highlight ? "lg:-mt-2 lg:mb-2" : ""}`} style={{ background: tier.highlight ? "rgba(209,255,38,0.04)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${tier.highlight ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.15)"}`, boxShadow: tier.highlight ? "0 0 30px rgba(209,255,38,0.08)" : "none" }}>
              {tier.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 font-mono text-[7px] tracking-widest" style={{ background: "#D1FF26", color: "#05070A" }}>BEST VALUE</div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: tier.highlight ? "rgba(209,255,38,0.1)" : "rgba(138,143,152,0.08)", border: `0.5px solid ${tier.highlight ? "rgba(209,255,38,0.25)" : "rgba(138,143,152,0.12)"}` }}>
                  <Icon size={15} style={{ color: tier.highlight ? "#D1FF26" : "#8A8F98" }} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm" style={{ color: tier.highlight ? "#D1FF26" : "#F5F5F7" }}>{tier.name}</h3>
                  <p className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>{tier.tagline}</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="font-heading font-black text-3xl" style={{ color: tier.highlight ? "#D1FF26" : "#F5F5F7" }}>${price % 1 === 0 ? price : price.toFixed(2)}</span>
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}> /{billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>
              <button className={`w-full py-2.5 font-mono text-[8px] tracking-widest uppercase mb-4 transition-all flex items-center justify-center gap-1.5 ${tier.highlight ? "hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" : ""}`} style={{ background: tier.highlight ? "#D1FF26" : tier.id === "free" ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.06)", color: tier.highlight ? "#05070A" : "#D1FF26", border: tier.highlight ? "none" : "0.5px solid rgba(209,255,38,0.25)" }}>
                {tier.id === "free" ? "Current Plan" : `Get ${tier.name}`}
                {tier.highlight && <ChevronRight size={11} />}
              </button>
              <ul className="space-y-2 flex-1">
                {tier.features.map((feat, fi) => (
                  <li key={fi} className={`flex items-start gap-2 ${feat.featured ? "p-1.5 -m-1.5" : ""}`} style={feat.featured ? { background: "rgba(209,255,38,0.04)", borderRadius: 2 } : {}}>
                    {feat.included === true ? <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: feat.featured ? "#D1FF26" : "#D1FF26" }} /> : feat.included === false ? <X size={11} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(138,143,152,0.3)" }} /> : <span className="font-mono text-[8px] flex-shrink-0 mt-0.5 font-bold" style={{ color: "#D1FF26" }}>●</span>}
                    <span className={`text-[11px] ${feat.featured ? "font-semibold" : ""}`} style={{ color: feat.featured ? "#D1FF26" : "#F5F5F7", lineHeight: 1.4 }}>{feat.label}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* 1 Call Media highlight card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.4 }} className="p-5 relative overflow-hidden" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(209,255,38,0.08), transparent 70%)" }} />
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center" style={{ width: 28, height: 28, background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
            <Film size={14} style={{ color: "#D1FF26" }} />
          </div>
          <div>
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>INCLUDED IN ELITE+</p>
            <h4 className="font-heading font-bold text-sm" style={{ color: "#D1FF26" }}>1 Call Media</h4>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            "Browse a public-domain library of movies & TV",
            "Stream instantly, right in your browser",
            "Audio description / listen mode for any title",
            "No app or data plan required to watch",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check size={10} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
              <span className="text-[11px]" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }} className="mt-6 p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div>
          <p className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>Ready to upgrade?</p>
          <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>7-day free trial · Cancel anytime · Dial *500#</p>
        </div>
        <button className="w-full sm:w-auto px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)] flex items-center justify-center gap-2" style={{ background: "#D1FF26", color: "#05070A" }}>
          <Star size={12} /> Start Free Trial
        </button>
      </motion.div>
    </section>
  );
}