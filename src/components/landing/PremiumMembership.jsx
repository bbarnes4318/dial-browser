import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Tag, X, Star, Zap, Shield, Headphones, Globe, TrendingUp, DollarSign, Clock, Users, Award, Heart, Trophy, Radio, Crown, Loader2, Lock, ShieldCheck, CreditCard, BadgeCheck, Server, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";
import PromoCodeInput from "@/components/checkout/PromoCodeInput";
import { useToast } from "@/components/ui/use-toast";

const tiers = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceAnnual: 0,
    tagline: "Get started",
    icon: Globe,
    highlight: false,
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
    highlight: false,
    credits: "300 AI credits / mo",
    features: [
      "Everything in Free",
      "Voice calls & SMS (activating soon)",
      "Emergency contacts broadcast",
      "300 AI credits / mo (calls, SMS, AI)",
      "Radio Phone Network access",
      "Dial Social — profile & feed",
      "1 Call Dating — browse & match",
      "Job alert subscriptions",
      "Voice broadcast stations",
      "Restaurant & dining search",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 39,
    priceAnnual: 390,
    tagline: "Full platform access",
    icon: Star,
    highlight: true,
    credits: "800 AI credits / mo",
    features: [
      "Everything in Plus",
      "800 AI credits / mo (calls, SMS, AI)",
      "Early-bird job alerts",
      "Priority AI symptom info (not a doctor consult)",
      "Audiobook library access",
      "Voiceprint biometric login",
      "Private voice messaging",
      "Priority email support",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 79,
    priceAnnual: 790,
    tagline: "Media & studio unlocked",
    icon: Crown,
    highlight: false,
    credits: "2,000 AI credits / mo",
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
    highlight: false,
    credits: "5,000 AI credits / mo",
    features: [
      "Everything in Elite",
      "5,000 AI credits / mo (calls, SMS, AI)",
      "Creator onboarding & revenue share",
      "Custom voice prompts",
      "Creator analytics & monetization",
      "Advanced AI beat production",
      "Creator support channel",
    ],
  },
];

const comparisonFeatures = [
  { label: "Voice calls & SMS (activating soon)", free: false, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Emergency contacts broadcast", free: false, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Voice-guided onboarding", free: true, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Free TV channel directory", free: true, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Service marketplace browsing", free: true, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Loyalty rewards on referrals", free: true, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Branded referral share cards", free: true, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Marketplace listings", free: "Limited", plus: "Unlimited", premium: "Priority", elite: "Priority", ultimate: "Priority" },
  { label: "Radio Phone Network", free: false, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Dial Social — profile & feed", free: false, plus: true, premium: true, elite: true, ultimate: true },
  { label: "1 Call Dating — browse & match", free: false, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Job alert subscriptions", free: false, plus: true, premium: true, elite: true, ultimate: true },
  { label: "Voice broadcast stations", free: false, plus: true, premium: true, elite: true, ultimate: true },

  { label: "Early-bird job alerts", free: false, plus: false, premium: true, elite: true, ultimate: true },
  { label: "Priority AI symptom info", free: false, plus: false, premium: true, elite: true, ultimate: true },
  { label: "Audiobook library access", free: false, plus: false, premium: true, elite: true, ultimate: true },
  { label: "Voiceprint biometric login", free: false, plus: false, premium: true, elite: true, ultimate: true },
  { label: "Private voice messaging", free: false, plus: false, premium: true, elite: true, ultimate: true },
  { label: "Free TV live channels", free: false, plus: false, premium: false, elite: true, ultimate: true },
  { label: "AI music production studio", free: false, plus: false, premium: false, elite: true, ultimate: true },
  { label: "Show share marketplace", free: false, plus: false, premium: false, elite: true, ultimate: true },
  { label: "Voice broadcast scheduling", free: false, plus: false, premium: false, elite: true, ultimate: true },
  { label: "Advanced analytics dashboard", free: false, plus: false, premium: false, elite: true, ultimate: true },
  { label: "Creator onboarding & revenue share", free: false, plus: false, premium: false, elite: false, ultimate: true },
  { label: "Custom voice prompts", free: false, plus: false, premium: false, elite: false, ultimate: true },
  { label: "Creator analytics & monetization", free: false, plus: false, premium: false, elite: false, ultimate: true },
  { label: "AI credits / mo", free: "0", plus: "300", premium: "800", elite: "2,000", ultimate: "5,000" },
  { label: "Support level", free: "Community", plus: "Email", premium: "Priority Email", elite: "Priority Email", ultimate: "Creator Channel" },
];

function Cell({ value }) {
  if (value === true) return <Check size={14} style={{ color: "#D1FF26" }} />;
  if (value === false) return <X size={14} style={{ color: "rgba(138,143,152,0.3)" }} />;
  return <span className="font-mono text-[10px]" style={{ color: "#F5F5F7" }}>{value}</span>;
}

function PaymentStep({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <Icon size={14} style={{ color: "#D1FF26" }} />
      </div>
      <div>
        <p className="font-mono text-[10px] tracking-widest font-bold mb-0.5" style={{ color: "#F5F5F7" }}>{title}</p>
        <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

export default function PremiumMembership() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(null);

  const handleSubscribe = async (tierId) => {
    if (tierId === "free") return;
    if (!user) {
      openRegistrationModal();
      return;
    }
    setSubscribing(tierId);
    try {
      const cycleSuffix = billingCycle === "annual" ? "annual" : "monthly";
      const payload = {
        plan: `premium_${tierId}_${cycleSuffix}`,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
      };
      if (promoDiscount) {
        payload.promo_code = promoDiscount.code;
        payload.promo_discount = promoDiscount.amount;
      }
      const response = await base44.functions.invoke("create-checkout", payload);
      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        toast({ title: "Checkout unavailable", description: "We couldn't start checkout. Please try again.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Checkout failed", description: err?.message || "Something went wrong. Please try again.", variant: "destructive" });
    }
    setSubscribing(null);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold: 0.08 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-10 lg:mb-14 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// 1 CALL PREMIUM™</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Choose Your <span style={{ color: "#D1FF26" }}>Tier.</span>
          </h2>
          <p className="text-lg font-light max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            From free basics to the ultimate all-access pass. Every paid tier includes a monthly AI credit allowance for calls, SMS, and AI actions — so you always have credits to get things done. Unlock radio, social, dating, and creator tools — up to $149/mo for everything.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="flex items-center justify-center gap-4 mb-12">
          <button onClick={() => setBillingCycle("monthly")} className={`px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all ${billingCycle === "monthly" ? "bg-[#D1FF26] text-[#05070A]" : "bg-transparent text-[#8A8F98]"}`} style={{ border: billingCycle === "monthly" ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.2)" }}>
            Monthly
          </button>
          <button onClick={() => setBillingCycle("annual")} className={`px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all relative ${billingCycle === "annual" ? "bg-[#D1FF26] text-[#05070A]" : "bg-transparent text-[#8A8F98]"}`} style={{ border: billingCycle === "annual" ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.2)" }}>
            Annual
            {billingCycle === "annual" && <span className="absolute -top-3 -right-3 px-2 py-0.5 text-[8px] font-bold rounded-full" style={{ background: "#D1FF26", color: "#05070A" }}>SAVE 17%</span>}
          </button>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-14">
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            const price = billingCycle === "monthly" ? tier.price : tier.priceAnnual;
            return (
              <motion.div key={tier.id} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }} className={`p-6 flex flex-col relative ${tier.highlight ? "lg:-mt-4 lg:mb-4" : ""}`} style={{ background: tier.highlight ? "rgba(209,255,38,0.04)" : "#10141D", border: tier.highlight ? "0.5px solid rgba(209,255,38,0.3)" : "0.5px solid rgba(138,143,152,0.2)", boxShadow: tier.highlight ? "0 0 40px rgba(209,255,38,0.1)" : "none" }}>
                {tier.highlight && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 font-mono text-[8px] tracking-widest" style={{ background: "#D1FF26", color: "#05070A" }}>POPULAR</div>}
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={18} style={{ color: tier.highlight ? "#D1FF26" : "#8A8F98" }} />
                  <div>
                    <h3 className="font-heading font-bold text-lg" style={{ color: tier.highlight ? "#D1FF26" : "#F5F5F7" }}>{tier.name}</h3>
                    <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{tier.tagline}</p>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="font-heading font-black text-4xl" style={{ color: tier.highlight ? "#D1FF26" : "#F5F5F7" }}>${price % 1 === 0 ? price : price.toFixed(2)}</span>
                  <span className="font-mono text-xs" style={{ color: "#8A8F98" }}> / {billingCycle === "monthly" ? "mo" : "yr"}</span>
                </div>
                <button onClick={() => handleSubscribe(tier.id)} disabled={subscribing === tier.id} className={`w-full py-3 font-mono text-[9px] tracking-widest uppercase mb-6 transition-all flex items-center justify-center gap-2 ${tier.highlight ? "hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]" : ""}`} style={{ background: tier.highlight ? "#D1FF26" : tier.id === "free" ? "rgba(138,143,152,0.15)" : "rgba(209,255,38,0.08)", color: tier.highlight ? "#05070A" : "#D1FF26", border: tier.highlight ? "none" : "0.5px solid rgba(209,255,38,0.3)" }}>
                  {subscribing === tier.id ? <Loader2 size={12} className="animate-spin" /> : tier.id === "free" ? "Current Plan" : `Get ${tier.name}`}
                </button>
                <ul className="space-y-2.5 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                      <span className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Dedicated promo code field — checkout level */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.45 }} className="max-w-md mx-auto mb-10">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Tag size={12} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// HAVE A PROMO CODE? APPLY IT HERE</p>
          </div>
          <PromoCodeInput originalPrice={billingCycle === "monthly" ? 39 : 390} plan="premium_subscription" onApplied={setPromoDiscount} />
        </motion.div>

        {/* Comparison table */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.5 }}>
          <div className="mb-8 text-center">
            <h3 className="font-heading font-bold text-3xl mb-2" style={{ color: "#F5F5F7" }}>Compare All Tiers</h3>
            <p className="font-mono text-sm" style={{ color: "#8A8F98" }}>Every feature, side by side</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]" style={{ border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <thead>
                <tr style={{ background: "rgba(16,20,29,0.8)" }}>
                  <th className="text-left p-4 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>FEATURE</th>
                  <th className="text-center p-4 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>FREE</th>
                  <th className="text-center p-4 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>PLUS</th>
                  <th className="text-center p-4 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26", borderBottom: "0.5px solid rgba(209,255,38,0.3)" }}>PREMIUM</th>
                  <th className="text-center p-4 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>ELITE</th>
                  <th className="text-center p-4 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26", borderBottom: "0.5px solid rgba(209,255,38,0.3)" }}>ULTIMATE</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, idx) => (
                  <tr key={feature.label} className="transition-colors hover:bg-[rgba(209,255,38,0.03)]" style={{ background: idx % 2 === 0 ? "rgba(5,7,10,0.4)" : "rgba(16,20,29,0.4)", borderBottom: "0.5px solid rgba(138,143,152,0.05)" }}>
                    <td className="p-4">
                      <span className="text-sm" style={{ color: "#F5F5F7" }}>{feature.label}</span>
                    </td>
                    <td className="text-center p-4"><Cell value={feature.free} /></td>
                    <td className="text-center p-4"><Cell value={feature.plus} /></td>
                    <td className="text-center p-4" style={{ background: "rgba(209,255,38,0.03)" }}><Cell value={feature.premium} /></td>
                    <td className="text-center p-4"><Cell value={feature.elite} /></td>
                    <td className="text-center p-4" style={{ background: "rgba(209,255,38,0.04)" }}><Cell value={feature.ultimate} /></td>
                  </tr>
                ))}
                <tr style={{ background: "rgba(16,20,29,0.6)", borderTop: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <td className="p-4 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>PRICE</td>
                  <td className="text-center p-4 font-heading font-black text-sm" style={{ color: "#F5F5F7" }}>$0</td>
                  <td className="text-center p-4 font-heading font-black text-sm" style={{ color: "#F5F5F7" }}>$19</td>
                  <td className="text-center p-4 font-heading font-black text-sm" style={{ color: "#D1FF26" }}>$39</td>
                  <td className="text-center p-4 font-heading font-black text-sm" style={{ color: "#F5F5F7" }}>$79</td>
                  <td className="text-center p-4 font-heading font-black text-sm" style={{ color: "#D1FF26" }}>$149</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Service layer badges */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.6 }} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Radio, label: "Radio Phone Network", tier: "Plus+" },
            { icon: Heart, label: "1 Call Dating", tier: "Premium+" },
          ].map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.label} className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <Icon size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px]" style={{ color: "#F5F5F7" }}>{service.label}</span>
                <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>{service.tier}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Verified trust badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.65 }} className="mt-10">
          <p className="font-mono text-[10px] tracking-widest text-center mb-5" style={{ color: "#8A8F98" }}>// VERIFIED & SECURE</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Lock, label: "TLS Encrypted", desc: "In transit" },
              { icon: ShieldCheck, label: "Secured by Wix Payments", desc: "PCI-compliant processor" },
              { icon: BadgeCheck, label: "Base44 Platform", desc: "Hosted & monitored" },
              { icon: Server, label: "Cloud-Hosted", desc: "Managed infra" },
              { icon: CreditCard, label: "Tokenized Billing", desc: "Card data via Wix" },
              { icon: ShieldCheck, label: "Secure Checkout", desc: "No card data stored" },
            ].map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
                  <div className="w-10 h-10 flex items-center justify-center mb-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <Icon size={18} style={{ color: "#D1FF26" }} />
                  </div>
                  <p className="font-mono text-[9px] tracking-widest font-bold" style={{ color: "#F5F5F7" }}>{badge.label}</p>
                  <p className="font-mono text-[8px] mt-0.5" style={{ color: "#8A8F98" }}>{badge.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Secure payment overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.68 }} className="mt-6 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SECURE PAYMENT OVERVIEW</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <PaymentStep icon={Lock} title="1. Encrypted Checkout" desc="Your payment is processed on a secure, PCI DSS Level 1 compliant server. We never store your card details." />
              <PaymentStep icon={ShieldCheck} title="2. Fraud Protection" desc="Real-time fraud monitoring on every transaction. Verified by Dial Pay infrastructure." />
              <PaymentStep icon={CreditCard} title="3. Instant Activation" desc="Your premium features unlock immediately after payment confirmation — no waiting required." />
            </div>
            <div className="space-y-3">
              <PaymentStep icon={BadgeCheck} title="4. Free Trial" desc="7-day free trial on eligible plans. Cancel before the trial ends at no cost." />
              <PaymentStep icon={Clock} title="5. Cancel Anytime" desc="No long-term commitments. Manage or cancel your subscription from the dashboard at any time." />
              <PaymentStep icon={Eye} title="6. Transparent Billing" desc="You'll see the exact amount before confirming. No hidden fees, no surprise charges." />
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.7 }} className="mt-12 p-8" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <h3 className="font-heading font-bold text-2xl mb-3 text-center" style={{ color: "#F5F5F7" }}>Ready to Upgrade?</h3>
          <p className="font-mono text-sm mb-6 text-center" style={{ color: "#8A8F98" }}>Join thousands of members getting more out of 1 CALL AWAY™</p>

          <div className="flex justify-center">
            <button onClick={() => handleSubscribe("premium")} disabled={subscribing === "premium"} className="px-8 py-4 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)] flex items-center justify-center gap-2" style={{ background: "#D1FF26", color: "#05070A" }}>
              {subscribing === "premium" ? <Loader2 size={14} className="animate-spin" /> : "Start Free Trial · 7 Days"}
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
            <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
              <Lock size={9} style={{ color: "#D1FF26" }} /> SECURE CHECKOUT
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
              <Check size={9} style={{ color: "#D1FF26" }} /> CANCEL ANYTIME
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
              <BadgeCheck size={9} style={{ color: "#D1FF26" }} /> NO HIDDEN FEES
            </span>
          </div>
          <p className="font-mono text-[8px] mt-4" style={{ color: "#8A8F98" }}>Payments secured by Base44 Payments (Wix)</p>
        </motion.div>
      </div>
    </section>
  );
}