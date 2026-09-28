import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Zap, Loader2, Star, TrendingUp, Stethoscope, ShoppingCart, Briefcase, Sparkles, Calendar, CreditCard, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Get started",
    icon: Star,
    color: "#8A8F98",
    features: ["Basic voice calls", "Limited marketplace listings", "Standard event promotions", "Community support"],
  },
  {
    id: "plus",
    name: "Plus",
    price: 14.99,
    tagline: "Ad-free & HD audio",
    icon: Zap,
    color: "#22D3EE",
    features: ["Everything in Free", "Radio Phone Network access", "Ad-free experience", "HD audio quality", "50GB cloud storage"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 29.99,
    tagline: "Full platform access",
    icon: Crown,
    color: "#D1FF26",
    highlight: true,
    premiumFeatures: [
      { icon: Briefcase, label: "Early-bird job alerts", desc: "Get notified 24h before public postings" },
      { icon: Stethoscope, label: "Priority medical consults", desc: "Skip the queue for AI triage & doctor connection" },
      { icon: ShoppingCart, label: "Unlimited grocery processing", desc: "Process unlimited voice grocery lists, no caps" },
    ],
    features: ["Everything in Plus", "Unlimited voice calls", "Premium dating features", "24/7 priority support"],
  },
  {
    id: "elite",
    name: "Elite",
    price: 49.99,
    tagline: "Media & studio unlocked",
    icon: Sparkles,
    color: "#A78BFA",
    features: ["Everything in Premium", "Free TV live channels", "AI music production studio", "Show share marketplace", "Advanced analytics dashboard"],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 99,
    tagline: "Creator studio unlocked",
    icon: Crown,
    color: "#FBBF24",
    features: ["Everything in Elite", "Creator onboarding & revenue share", "Custom voice prompts", "Creator analytics & monetization", "Advanced AI beat production", "Verified badge"],
  },
];

export default function SubscriptionManager() {
  const { user } = useAuth();
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const loadSubscription = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const subs = await base44.entities.Subscription.filter(
        { owner_user_id: user.id, subscription_active: true },
        "-created_date",
        1
      );
      if (subs && subs.length > 0) {
        setCurrentSub(subs[0]);
      }
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const handleSubscribe = async (tierId) => {
    if (tierId === "free") return;
    if (!user) {
      openRegistrationModal();
      return;
    }
    setSubscribing(tierId);
    try {
      const response = await base44.functions.invoke("create-checkout", {
        plan: `premium_${tierId}_${billingCycle}`,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
      });
      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      }
    } catch {}
    setSubscribing(null);
  };

  const handleCancel = async () => {
    if (!currentSub?.subscription_id) return;
    setCanceling(true);
    try {
      await base44.functions.invoke("cancel-subscription", {
        subscription_id: currentSub.subscription_id,
        user_id: user.id,
      });
      setCurrentSub(null);
      setShowCancelConfirm(false);
    } catch {}
    setCanceling(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  const currentTier = currentSub?.tier || "free";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-3">
          <Crown size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// SUBSCRIPTION MANAGEMENT</p>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
          Manage Your <span style={{ color: "#D1FF26" }}>Premium Access</span>
        </h2>
        <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Upgrade to unlock early-bird job alerts, priority medical consults, and unlimited grocery list processing.
        </p>
      </motion.div>

      {/* Current plan status */}
      {currentSub && currentTier !== "free" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6"
          style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
                <Crown size={24} style={{ color: "#D1FF26" }} />
              </div>
              <div>
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>// CURRENT PLAN</p>
                <h3 className="font-heading font-black text-xl uppercase" style={{ color: "#D1FF26" }}>{currentSub.tier}</h3>
                <p className="font-mono text-[10px] capitalize" style={{ color: "#8A8F98" }}>{currentSub.plan} billing · Active</p>
              </div>
            </div>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(239,68,68,0.1)]"
              style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
            >
              <X size={12} /> Cancel Subscription
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: "rgba(138,143,152,0.08)" }}>
              <Star size={24} style={{ color: "#8A8F98" }} />
            </div>
            <div>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>// CURRENT PLAN</p>
              <h3 className="font-heading font-black text-xl uppercase" style={{ color: "#F5F5F7" }}>Free</h3>
              <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>Upgrade below to unlock premium features</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Premium benefits highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid sm:grid-cols-3 gap-3"
      >
        {[
          { icon: Briefcase, title: "Early-Bird Job Alerts", desc: "Get job notifications 24 hours before public posting. Never miss an opportunity.", color: "#22D3EE" },
          { icon: Stethoscope, title: "Priority Medical Consults", desc: "Skip the queue for AI triage and doctor connections. Your health, prioritized.", color: "#EF4444" },
          { icon: ShoppingCart, title: "Unlimited Grocery Processing", desc: "Process unlimited voice-to-cart grocery orders with no monthly caps.", color: "#D1FF26" },
        ].map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <div
              key={i}
              className="p-5"
              style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${benefit.color}30` }}
            >
              <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ background: `${benefit.color}12` }}>
                <Icon size={20} style={{ color: benefit.color }} />
              </div>
              <h4 className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{benefit.title}</h4>
              <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{benefit.desc}</p>
              {currentTier !== "free" && (
                <p className="font-mono text-[9px] mt-2 flex items-center gap-1" style={{ color: "#D1FF26" }}>
                  <Check size={10} /> Unlocked
                </p>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingCycle("monthly")}
          className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
          style={{
            background: billingCycle === "monthly" ? "#D1FF26" : "transparent",
            color: billingCycle === "monthly" ? "#05070A" : "#8A8F98",
            border: billingCycle === "monthly" ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.2)",
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all relative"
          style={{
            background: billingCycle === "annual" ? "#D1FF26" : "transparent",
            color: billingCycle === "annual" ? "#05070A" : "#8A8F98",
            border: billingCycle === "annual" ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.2)",
          }}
        >
          Annual
          <span className="absolute -top-3 -right-3 px-2 py-0.5 text-[8px] font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>SAVE 17%</span>
        </button>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {TIERS.map((tier, i) => {
          const Icon = tier.icon;
          const price = billingCycle === "monthly" ? tier.price : tier.priceAnnual || tier.price * 10;
          const isCurrent = currentTier === tier.id;
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
              className={`p-6 flex flex-col relative ${tier.highlight ? "lg:-mt-2" : ""}`}
              style={{
                background: tier.highlight ? "rgba(209,255,38,0.04)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${tier.highlight ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.15)"}`,
                boxShadow: tier.highlight ? "0 0 40px rgba(209,255,38,0.08)" : "none",
              }}
            >
              {tier.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 font-mono text-[8px] tracking-widest" style={{ background: "#D1FF26", color: "#05070A" }}>
                  POPULAR
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Icon size={18} style={{ color: tier.highlight ? "#D1FF26" : tier.color }} />
                <div>
                  <h3 className="font-heading font-bold text-lg" style={{ color: tier.highlight ? "#D1FF26" : "#F5F5F7" }}>{tier.name}</h3>
                  <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{tier.tagline}</p>
                </div>
              </div>
              <div className="mb-5">
                <span className="font-heading font-black text-3xl" style={{ color: tier.highlight ? "#D1FF26" : "#F5F5F7" }}>
                  ${price % 1 === 0 ? price : price.toFixed(2)}
                </span>
                <span className="font-mono text-xs" style={{ color: "#8A8F98" }}> / {billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>
              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={subscribing === tier.id || isCurrent}
                className="w-full py-3 font-mono text-[9px] tracking-widest uppercase mb-5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: isCurrent ? "rgba(138,143,152,0.15)" : tier.highlight ? "#D1FF26" : "rgba(209,255,38,0.08)",
                  color: isCurrent ? "#8A8F98" : tier.highlight ? "#05070A" : "#D1FF26",
                  border: isCurrent || tier.highlight ? "none" : "0.5px solid rgba(209,255,38,0.3)",
                }}
              >
                {subscribing === tier.id ? <Loader2 size={12} className="animate-spin" /> : isCurrent ? <><Check size={12} /> Current Plan</> : `Get ${tier.name}`}
              </button>
              <ul className="space-y-2 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                    <span className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <>
          <div className="fixed inset-0 z-[100]" style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }} onClick={() => !canceling && setShowCancelConfirm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-sm p-6 pointer-events-auto"
              style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(239,68,68,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <X size={20} style={{ color: "#ef4444" }} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>Cancel Subscription?</h3>
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>// THIS CANNOT BE UNDONE</p>
                </div>
              </div>
              <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                You'll lose access to early-bird job alerts, priority medical consults, and unlimited grocery processing at the end of your billing cycle.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={canceling}
                  className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
                  style={{ background: "rgba(138,143,152,0.1)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
                >
                  Keep Plan
                </button>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                  style={{ background: "#ef4444", color: "#fff" }}
                >
                  {canceling ? <Loader2 size={12} className="animate-spin" /> : "Cancel Plan"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}