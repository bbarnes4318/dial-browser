import React, { useState, useEffect } from "react";
import { DollarSign, Loader2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TIER_PRICE = { free: 0, plus: 9.99, elite: 19.99 };
const TIER_LABEL = { free: "Free", plus: "Plus", elite: "Elite" };
const TIER_COLOR = { free: "#8A8F98", plus: "#D1FF26", elite: "#C8A0FF" };

// Admin-only: surfaces the economics of the 3 dating tiers — active
// subscribers per tier, monthly revenue, credit cost ($0 — dating uses no AI
// credits), and net profit. Confirms the builder pays nothing for free-tier
// members and that every paid tier is pure profit.
export default function DatingEconomics() {
  const [subs, setSubs] = useState([]);
  const [freeCount, setFreeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [allSubs, profiles] = await Promise.all([
          base44.entities.DatingSubscription.list("-created_date", 500),
          base44.entities.DatingProfile.list("-created_date", 500),
        ]);
        setSubs(allSubs || []);
        const paidUserIds = new Set(
          (allSubs || []).filter((s) => s.status === "active").map((s) => s.created_by_id)
        );
        setFreeCount((profiles || []).filter((p) => !paidUserIds.has(p.created_by_id)).length);
      } catch {
        /* non-admins can't reach this route */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = subs.filter((s) => s.status === "active");
  const byTier = { free: freeCount, plus: 0, elite: 0 };
  active.forEach((s) => {
    if (byTier[s.tier] !== undefined) byTier[s.tier] += 1;
  });
  const revenue = {
    free: 0,
    plus: byTier.plus * TIER_PRICE.plus,
    elite: byTier.elite * TIER_PRICE.elite,
  };
  const totalMrr = revenue.plus + revenue.elite;
  // Dating activity (likes, matches, SMS records) uses no AI credits → $0 cost.
  const creditCost = 0;
  const netProfit = totalMrr - creditCost;

  return (
    <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <DollarSign size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DATING TIER ECONOMICS</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 size={14} className="animate-spin" style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Metric label="DATING MRR" value={`$${totalMrr.toFixed(2)}`} sub="monthly" accent="#D1FF26" />
            <Metric label="CREDIT COST" value={`$${creditCost.toFixed(2)}`} sub="dating is credit-free" accent="#5AE0C8" />
            <Metric label="NET PROFIT" value={`$${netProfit.toFixed(2)}`} sub="per month" accent="#E0A85A" />
            <Metric label="PAID MEMBERS" value={active.length} sub={`${byTier.free} on free`} accent="#C8A0FF" />
          </div>

          <div className="space-y-2">
            {["free", "plus", "elite"].map((t) => (
              <div key={t} className="flex items-center gap-3 p-3 flex-wrap" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${TIER_COLOR[t]}40` }}>
                <span className="font-mono text-[10px] tracking-widest w-14" style={{ color: TIER_COLOR[t] }}>{TIER_LABEL[t].toUpperCase()}</span>
                <span className="text-xs flex-1 min-w-0" style={{ color: "#8A8F98" }}>{byTier[t]} member(s) · ${TIER_PRICE[t].toFixed(2)}/mo</span>
                <span className="font-mono text-[10px]" style={{ color: TIER_COLOR[t] }}>rev ${revenue[t].toFixed(2)}</span>
                <span className="font-mono text-[9px]" style={{ color: "#5AE0C8" }}>cost $0.00</span>
                <span className="font-mono text-[10px]" style={{ color: "#E0A85A" }}>net ${revenue[t].toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 p-3" style={{ background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.2)" }}>
            <ShieldCheck size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />
            <p className="font-mono text-[8px] tracking-widest leading-relaxed" style={{ color: "#8A8F98" }}>
              DATING ACTIVITY (LIKES, MATCHES, SMS RECORDS) USES NO AI CREDITS — THE BUILDER PAYS $0 PER FREE MEMBER. EVERY PAID TIER IS PURE PROFIT SINCE THERE IS NO PER-MEMBER CREDIT COST TO RECOVER.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub, accent }) {
  return (
    <div className="p-4" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${accent}40` }}>
      <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>{label}</p>
      <p className="font-heading font-black text-xl truncate" style={{ color: accent }}>{value}</p>
      <p className="font-mono text-[8px] mt-0.5" style={{ color: "rgba(138,143,152,0.7)" }}>{sub}</p>
    </div>
  );
}