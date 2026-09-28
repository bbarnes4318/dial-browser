import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Globe, Zap, Star, Crown, Trophy, ArrowRight } from "lucide-react";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

/**
 * SubscriptionPlans — a clean, member-facing explainer of what each
 * subscription tier unlocks on the 1 Call Away platform. Derived from the
 * reviewed service descriptions so members can clearly see what they get.
 */
const TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceAnnual: 0,
    tagline: "Get started",
    icon: Globe,
    accent: "#8A8F98",
    summary:
      "Browse, learn, and earn referral rewards — no card required. Voice calls and SMS start at Plus.",
    features: [
      "Voice-guided onboarding",
      "Free TV channel directory",
      "Service marketplace browsing",
      "Loyalty rewards on referrals",
      "Branded referral share cards",
      "Community support",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: 19,
    priceAnnual: 190,
    tagline: "Calls, social & radio unlocked",
    icon: Zap,
    accent: "#42E1F6",
    summary:
      "Unlocks voice calls & SMS, emergency alerts, the social layer, radio, and dating — with a monthly AI credit allowance.",
    features: [
      "Everything in Free",
      "Voice calls & SMS",
      "Emergency SOS alerts",
      "300 AI credits / mo (calls, SMS, AI)",
      "Radio Phone Network access",
      "Dial Social — profile & feed",
      "1 Call Dating — browse & match",
      "Job alert subscriptions",
      "Voice broadcast stations",
      "Restaurant & travel search",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 39,
    priceAnnual: 390,
    tagline: "Full platform access",
    icon: Star,
    accent: "#D1FF26",
    highlight: true,
    summary:
      "The complete 1 Call Away experience — unlimited calls, priority services, voice biometrics, and private messaging.",
    features: [
      "Everything in Plus",
      "800 AI credits / mo (calls, SMS, AI)",
      "Unlimited voice calls",
      "Early-bird job alerts",
      "Priority medical & dental consults",
      "Unlimited grocery list processing",
      "Audiobook library access",
      "Voiceprint biometric login",
      "Private voice messaging",
      "24/7 priority support",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 79,
    priceAnnual: 790,
    tagline: "Media & studio unlocked",
    icon: Crown,
    accent: "#fb923c",
    summary:
      "Adds the AI music studio, show sharing, and advanced analytics for power users.",
    features: [
      "Everything in Premium",
      "2,000 AI credits / mo (calls, SMS, AI)",
      "Free TV live channels",
      "AI music production studio",
      "Show share marketplace",
      "Voice broadcast scheduling",
      "Advanced analytics dashboard",
    ],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 149,
    priceAnnual: 1490,
    tagline: "Creator studio unlocked",
    icon: Trophy,
    accent: "#a78bfa",
    summary:
      "The all-access pass for creators — onboarding, monetization, collaboration tools, and dedicated support.",
    features: [
      "Everything in Elite",
      "5,000 AI credits / mo (calls, SMS, AI)",
      "Creator onboarding & revenue share",
      "Custom voice prompts",
      "Creator analytics & monetization",
      "Advanced AI beat production",
      "Dedicated creator support",
    ],
  },
];

export default function SubscriptionPlans() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="subscription-plans"
      className="snap-section relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      {/* Signal line accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden pointer-events-none">
        <div
          className="h-full w-1/4"
          style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 6s linear infinite" }}
        />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12 lg:mb-16 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>
              // SUBSCRIPTION PLANS
            </p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            What Each <span style={{ color: "#D1FF26" }}>Tier</span> Offers
          </h2>
          <p className="text-lg font-light max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            From a free starter account to the ultimate creator pass — every tier layers on more services,
            more AI credits, and more ways to call, connect, and browse. Pick the tier that fits how you
            use 1 Call Away™.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all ${billingCycle === "monthly" ? "bg-[#D1FF26] text-[#05070A]" : "bg-transparent text-[#8A8F98]"}`}
            style={{ border: billingCycle === "monthly" ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.2)" }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all relative ${billingCycle === "annual" ? "bg-[#D1FF26] text-[#05070A]" : "bg-transparent text-[#8A8F98]"}`}
            style={{ border: billingCycle === "annual" ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.2)" }}
          >
            Annual
            {billingCycle === "annual" && (
              <span className="absolute -top-3 -right-3 px-2 py-0.5 text-[8px] font-bold rounded-full" style={{ background: "#D1FF26", color: "#05070A" }}>
                SAVE 17%
              </span>
            )}
          </button>
        </motion.div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            const price = billingCycle === "monthly" ? tier.price : tier.priceAnnual;
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }}
                className={`relative p-6 flex flex-col ${tier.highlight ? "lg:-mt-4 lg:mb-4" : ""}`}
                style={{
                  background: tier.highlight ? "rgba(209,255,38,0.04)" : "#10141D",
                  border: tier.highlight ? "0.5px solid rgba(209,255,38,0.3)" : "0.5px solid rgba(138,143,152,0.2)",
                  boxShadow: tier.highlight ? "0 0 40px rgba(209,255,38,0.1)" : "none",
                }}
              >
                {tier.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 font-mono text-[8px] tracking-widest" style={{ background: "#D1FF26", color: "#05070A" }}>
                    POPULAR
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                    style={{ background: `${tier.accent}14`, border: `0.5px solid ${tier.accent}55` }}
                  >
                    <Icon size={16} style={{ color: tier.accent }} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg" style={{ color: tier.highlight ? "#D1FF26" : "#F5F5F7" }}>
                      {tier.name}
                    </h3>
                    <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{tier.tagline}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="font-heading font-black text-4xl" style={{ color: tier.highlight ? "#D1FF26" : "#F5F5F7" }}>
                    ${price % 1 === 0 ? price : price.toFixed(2)}
                  </span>
                  <span className="font-mono text-xs" style={{ color: "#8A8F98" }}>
                    {" "}/ {billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                </div>

                {/* Member-facing summary */}
                <p className="text-xs mb-5" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                  {tier.summary}
                </p>

                {/* Feature list */}
                <ul className="space-y-2.5 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={12} className="flex-shrink-0 mt-0.5" style={{ color: tier.accent }} />
                      <span className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => openRegistrationModal()}
                  className="mt-6 w-full py-3 font-mono text-[9px] tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                  style={{
                    background: tier.highlight ? "#D1FF26" : "rgba(209,255,38,0.08)",
                    color: tier.highlight ? "#05070A" : "#D1FF26",
                    border: tier.highlight ? "none" : "0.5px solid rgba(209,255,38,0.3)",
                  }}
                >
                  {tier.id === "free" ? "Join Free" : `Get ${tier.name}`} <ArrowRight size={11} />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center font-mono text-[10px] mt-10"
          style={{ color: "#8A8F98" }}
        >
          Every paid tier includes a monthly AI credit allowance for calls, SMS, and AI actions —
          cancel anytime from your dashboard.
        </motion.p>
      </div>
    </section>
  );
}