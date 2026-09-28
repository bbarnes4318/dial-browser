import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Zap, Crown, ArrowUpDown, AlertCircle, Star, Trophy, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TIERS = [
  { id: "free", name: "Free", icon: Globe, monthly: 0, annual: 0, credits: 25, color: "#8A8F98" },
  { id: "plus", name: "Plus", icon: Zap, monthly: 19, annual: 190, credits: 300, color: "#43C6AC" },
  { id: "premium", name: "Premium", icon: Star, monthly: 39, annual: 390, credits: 800, color: "#D1FF26" },
  { id: "elite", name: "Elite", icon: Crown, monthly: 79, annual: 790, credits: 2000, color: "#FF6B35" },
  { id: "ultimate", name: "Ultimate", icon: Trophy, monthly: 149, annual: 1490, credits: 5000, color: "#A855F7" },
];

export default function PlanSwitcher({ user, subscriptions, loadingSubs, onReload }) {
  const [cycle, setCycle] = useState("monthly");
  const [switching, setSwitching] = useState(null); // tierId in flight
  const [confirm, setConfirm] = useState(null); // { tierId } pending confirmation
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeSub = (subscriptions || [])
    .filter((s) => s.subscription_active)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  const currentTier = activeSub?.tier || "free";

  const handleSwitch = async (tierId) => {
    setConfirm(null);
    setError("");
    setSuccess("");
    setSwitching(tierId);

    try {
      // Cancel any currently active paid subscription first to avoid double billing
      const activePaid = (subscriptions || []).filter((s) => s.subscription_active && s.subscription_id);
      for (const s of activePaid) {
        try {
          await base44.functions.invoke("cancel-subscription", { subscription_id: s.subscription_id });
        } catch (e) { /* log but continue — old sub may already be canceled */ }
      }

      if (tierId === "free") {
        // Downgrade to free — cancellation above is enough
        setSuccess("Your plan has been downgraded to Free. Your credit allowance is now 25/mo.");
        setSwitching(null);
        if (onReload) onReload();
        return;
      }

      // Start a new checkout for the chosen tier
      const res = await base44.functions.invoke("create-checkout", {
        plan: `premium_${tierId}_${cycle}`,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
      });
      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        setError("Could not start checkout. Please try again.");
        setSwitching(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Switch failed. Please try again.");
      setSwitching(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// PLAN & CREDITS</p>
      </div>

      <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        {/* Current tier summary */}
        {loadingSubs ? (
          <div className="flex items-center gap-3 mb-5">
            <Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING YOUR PLAN…</span>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3" style={{ paddingBottom: 16, borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
            <div>
              <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>CURRENT PLAN</p>
              <p className="font-heading font-black text-2xl capitalize" style={{ color: TIERS.find((t) => t.id === currentTier)?.color || "#F5F5F7" }}>
                {currentTier}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>CREDIT ALLOWANCE</p>
              <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>
                {TIERS.find((t) => t.id === currentTier)?.credits.toLocaleString() || 25}<span className="text-sm" style={{ color: "#8A8F98" }}>/mo</span>
              </p>
            </div>
          </div>
        )}

        {/* Billing cycle toggle */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setCycle("monthly")} className={`px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all ${cycle === "monthly" ? "" : ""}`} style={{ background: cycle === "monthly" ? "#D1FF26" : "transparent", color: cycle === "monthly" ? "#05070A" : "#8A8F98", border: cycle === "monthly" ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.2)" }}>
            Monthly
          </button>
          <button onClick={() => setCycle("annual")} className="px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all relative" style={{ background: cycle === "annual" ? "#D1FF26" : "transparent", color: cycle === "annual" ? "#05070A" : "#8A8F98", border: cycle === "annual" ? "0.5px solid #D1FF26" : "0.5px solid rgba(138,143,152,0.2)" }}>
            Annual
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[7px] font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>2 MO FREE</span>
          </button>
        </div>

        {/* Tier grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = tier.id === currentTier;
            const price = cycle === "monthly" ? tier.monthly : tier.annual;
            return (
              <div key={tier.id} className="p-4 flex flex-col" style={{ background: isCurrent ? `${tier.color}0A` : "rgba(5,7,10,0.6)", border: isCurrent ? `0.5px solid ${tier.color}` : "0.5px solid rgba(138,143,152,0.15)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} style={{ color: tier.color }} />
                  <span className="font-heading font-bold text-sm" style={{ color: isCurrent ? tier.color : "#F5F5F7" }}>{tier.name}</span>
                  {isCurrent && <span className="font-mono text-[7px] tracking-widest ml-auto px-1.5 py-0.5" style={{ background: `${tier.color}20`, color: tier.color }}>CURRENT</span>}
                </div>
                <p className="font-heading font-black text-xl mb-1" style={{ color: "#F5F5F7" }}>
                  ${price % 1 === 0 ? price : price.toFixed(2)}<span className="font-mono text-[10px] font-normal" style={{ color: "#8A8F98" }}> /{cycle === "monthly" ? "mo" : "yr"}</span>
                </p>
                <p className="font-mono text-[9px] mb-3" style={{ color: "#D1FF26" }}>{tier.credits.toLocaleString()} AI credits/mo</p>
                <button
                  onClick={() => (isCurrent ? null : setConfirm({ tierId: tier.id }))}
                  disabled={isCurrent || switching !== null}
                  className="w-full py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all mt-auto disabled:opacity-40"
                  style={{
                    background: isCurrent ? "rgba(138,143,152,0.12)" : tier.color,
                    color: isCurrent ? "#8A8F98" : "#05070A",
                    border: isCurrent ? "0.5px solid rgba(138,143,152,0.2)" : "none",
                  }}
                >
                  {isCurrent ? "Active" : switching === tier.id ? <Loader2 size={11} className="animate-spin mx-auto" /> : tier.id === "free" ? "Downgrade to Free" : currentTier === "free" ? `Upgrade to ${tier.name}` : tier.id === "ultimate" ? `Get ${tier.name}` : currentTier === "free" ? `Get ${tier.name}` : `Switch to ${tier.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 p-3 flex items-center gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 flex items-center gap-2 text-xs" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <Check size={12} /> {success}
          </div>
        )}
        <p className="mt-4 font-mono text-[9px] leading-relaxed" style={{ color: "rgba(138,143,152,0.6)" }}>
          Switching cancels your current subscription at its next renewal and starts a new one at the selected tier. Your monthly AI credit allowance updates when the new plan activates. Downgrading to Free keeps your account but caps credits at 25/mo.
        </p>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100]" style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }} onClick={() => !switching && setConfirm(null)} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm p-6 pointer-events-auto" style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)" }} onClick={(e) => e.stopPropagation()}>
                <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// CONFIRM PLAN CHANGE</p>
                <h3 className="font-heading font-bold text-lg mb-2 capitalize" style={{ color: "#F5F5F7" }}>
                  {confirm.tierId === "free" ? "Downgrade to Free?" : `Switch to ${confirm.tierId}?`}
                </h3>
                <p className="text-xs mb-5 leading-relaxed" style={{ color: "#8A8F98" }}>
                  {confirm.tierId === "free"
                    ? "Your paid subscription will be canceled. Your AI credit allowance drops to 25/mo."
                    : `Your current plan will be canceled and you'll be taken to secure checkout for the ${confirm.tierId} tier (${cycle}). Your new credit allowance activates when payment completes.`}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirm(null)} disabled={switching !== null} className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(138,143,152,0.12)", color: "#F5F5F7", border: "0.5px solid rgba(138,143,152,0.2)" }}>
                    Cancel
                  </button>
                  <button onClick={() => handleSwitch(confirm.tierId)} disabled={switching !== null} className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase flex items-center justify-center gap-2" style={{ background: "#D1FF26", color: "#05070A" }}>
                    {switching ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirm
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}