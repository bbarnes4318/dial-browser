import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Check, Loader2, Crown, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TIERS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Heart,
    color: "#8A8F98",
    tagline: "Start matching — no card needed",
    features: [
      "5 matches per day",
      "Browse all verified singles",
      "Voice greetings on every profile",
      "Interest & music-taste filters",
      "Private SMS on every mutual match",
      "Your phone number stays private",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    price: "$9.99",
    period: "/month",
    icon: Sparkles,
    color: "#D1FF26",
    tagline: "Unlimited matching for serious daters",
    features: [
      "Unlimited daily matches — no cap",
      "See who liked you before you decide",
      "Play 30-second voice intros on every profile",
      "Advanced interest & music-taste filters",
      "Priority SMS match notifications",
      "Rewind your last swipe",
      "Ad-free dating experience",
    ],
    cta: "Upgrade to Plus",
    plan: "dating_plus_monthly",
  },
  {
    key: "elite",
    name: "Elite",
    price: "$19.99",
    period: "/month",
    icon: Crown,
    color: "#C8A0FF",
    tagline: "Top-tier matching with every advantage",
    features: [
      "Everything in Plus, plus:",
      "Priority placement — your profile is seen first",
      "Advanced filters: height, education, zodiac & more",
      "Read receipts on your messages",
      "One free profile boost per month",
      "Verified Elite badge on your profile",
      "Early access to new dating features",
    ],
    cta: "Go Elite",
    plan: "dating_elite_monthly",
  },
];

// 3-tier dating membership section. Free is the default (5 likes/day enforced
// in create-dating-like). Plus/Elite upgrade buttons start a Base44 Payments
// checkout via create-checkout.
export default function DatingPricing() {
  const [currentTier, setCurrentTier] = useState("free");
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const subs = await base44.entities.DatingSubscription.filter(
          { created_by_id: me.id, status: "active" },
          "-created_date",
          5
        );
        if (subs && subs[0]) setCurrentTier(subs[0].tier);
      } catch {
        /* not logged in → free */
      }
    })();
  }, []);

  const upgrade = async (plan) => {
    setError("");
    setLoading(plan);
    try {
      const res = await base44.functions.invoke("create-checkout", {
        plan,
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.full_name,
      });
      if (res?.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        setError("Could not start checkout. Please try again.");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Could not start checkout.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-2">
        <Heart size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// 1 CALL DATING MEMBERSHIP</p>
      </div>
      <h2 className="font-heading font-black text-2xl mb-1" style={{ color: "#F5F5F7" }}>Choose your dating plan</h2>
      <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Start free with 5 matches a day, or go unlimited with Plus and Elite. Cancel anytime.
      </p>

      {error && (
        <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {TIERS.map((t) => {
          const isCurrent = currentTier === t.key;
          return (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 flex flex-col"
              style={{
                background: "rgba(16,20,29,0.7)",
                border: `0.5px solid ${isCurrent ? t.color : "rgba(138,143,152,0.15)"}`,
                boxShadow: t.key === "plus" ? "0 0 30px rgba(209,255,38,0.06)" : "none",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <t.icon size={18} style={{ color: t.color }} />
                {isCurrent && (
                  <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: `${t.color}1a`, color: t.color, border: `0.5px solid ${t.color}55` }}>
                    CURRENT
                  </span>
                )}
              </div>
              <p className="font-heading font-black text-xl mb-1" style={{ color: "#F5F5F7" }}>{t.name}</p>
              <p className="text-[11px] mb-4" style={{ color: "#8A8F98" }}>{t.tagline}</p>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="font-heading font-black text-3xl" style={{ color: t.color }}>{t.price}</span>
                <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{t.period}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                    <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: t.color }} /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => t.plan && !isCurrent && upgrade(t.plan)}
                disabled={isCurrent || !t.plan || loading === t.plan}
                className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase disabled:opacity-60"
                style={{
                  background: isCurrent ? "rgba(138,143,152,0.1)" : t.key === "free" ? "rgba(138,143,152,0.08)" : t.color,
                  border: `0.5px solid ${isCurrent ? "rgba(138,143,152,0.2)" : t.color}`,
                  color: isCurrent || t.key === "free" ? "#8A8F98" : "#05070A",
                }}
              >
                {loading === t.plan ? <Loader2 size={12} className="animate-spin" /> : null}
                {isCurrent ? "Current Plan" : t.key === "free" ? "Included" : t.cta}
              </button>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-4 font-mono text-[8px] tracking-widest text-center" style={{ color: "rgba(138,143,152,0.6)" }}>
        SECURED BY BASE44 PAYMENTS · CANCEL ANYTIME · ALL TIERS REQUIRE EMAIL VERIFICATION
      </p>
    </div>
  );
}