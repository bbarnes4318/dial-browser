import React from "react";
import { Phone, MessageSquare, Sparkles, PlusCircle, Loader2, Clock, ChevronRight, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * PhoneUsageWidget — clear, easy-to-read widget showing remaining monthly
 * call minutes and SMS, with a buy-more CTA when running low.
 */
export default function PhoneUsageWidget({ entitlement, tier, onProvision, provisioning, hasNumber, onBuyMore, onUpdated }) {
  const capMin = entitlement?.cap_minutes_monthly ?? 0;
  const capSms = entitlement?.cap_sms_monthly ?? 0;
  const remMin = entitlement?.remainingMinutes ?? capMin;
  const remSms = entitlement?.remainingSms ?? capSms;
  const usedMin = Math.max(0, capMin - remMin);
  const usedSms = Math.max(0, capSms - remSms);
  const minPct = capMin ? Math.min(100, Math.round((usedMin / capMin) * 100)) : 0;
  const smsPct = capSms ? Math.min(100, Math.round((usedSms / capSms) * 100)) : 0;
  const minLow = remMin <= 5;
  const smsLow = remSms <= 5;
  const isPaid = tier && tier !== "free";
  const cycleEnd = entitlement?.cycle_end ? new Date(entitlement.cycle_end) : null;

  const changeThreshold = async (e) => {
    const v = Number(e.target.value);
    try {
      await base44.entities.PhoneEntitlement.update(entitlement.id, { low_credit_threshold_pct: v });
      if (onUpdated) onUpdated();
    } catch { /* ignore */ }
  };

  return (
    <div className="p-4" style={{ background: "linear-gradient(180deg, rgba(22,25,30,0.9) 0%, rgba(12,14,17,0.9) 100%)", border: "0.5px solid rgba(209,255,38,0.22)", borderRadius: 10 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.12)", borderRadius: 4 }}>
            <Clock size={12} style={{ color: "#D1FF26" }} />
          </div>
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// THIS MONTH</span>
        </div>
        <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26", borderRadius: 3 }}>
          {tier ? tier.toUpperCase() : "FREE"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Meter
          icon={Phone}
          color="#42E1F6"
          label="CALL MINUTES"
          remaining={remMin}
          total={capMin}
          pct={minPct}
          low={minLow}
        />
        <Meter
          icon={MessageSquare}
          color="#D1FF26"
          label="TEXT MESSAGES"
          remaining={remSms}
          total={capSms}
          pct={smsPct}
          low={smsLow}
        />
      </div>

      {cycleEnd && (
        <p className="font-mono text-[9px] mt-3" style={{ color: "#8A8F98" }}>
          Resets {cycleEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <Bell size={11} style={{ color: "#8A8F98" }} className="flex-shrink-0" />
        <span className="font-mono text-[8px] tracking-widest flex-shrink-0" style={{ color: "#8A8F98" }}>ALERT AT</span>
        <select value={entitlement?.low_credit_threshold_pct ?? 10} onChange={changeThreshold} className="flex-1 text-xs outline-none px-2 py-1.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}>
          {[5, 10, 15, 20, 25, 30].map((v) => <option key={v} value={v} style={{ color: "#05070A" }}>{v}% remaining</option>)}
        </select>
      </div>

      <div className="flex gap-2 mt-3">
        {isPaid && !hasNumber && (
          <button
            onClick={onProvision}
            disabled={provisioning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
            style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26", borderRadius: 6 }}
          >
            {provisioning ? <Loader2 size={11} className="animate-spin" /> : <PlusCircle size={11} />} Get my number
          </button>
        )}
        {(minLow || smsLow || !isPaid) && (
          <button
            onClick={onBuyMore}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.35)]"
            style={{ background: "#D1FF26", color: "#05070A", borderRadius: 6 }}
          >
            <Sparkles size={11} /> {isPaid ? "Buy more credits" : "Upgrade plan"} <ChevronRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

function Meter({ icon: Icon, color, label, remaining, total, pct, low }) {
  return (
    <div className="p-3" style={{ background: "rgba(5,7,10,0.5)", border: `0.5px solid ${low ? "rgba(239,68,68,0.4)" : "rgba(138,143,152,0.2)"}`, borderRadius: 6 }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} style={{ color }} />
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</span>
      </div>
      <p className="font-heading font-black text-2xl leading-none" style={{ color: low ? "#ef4444" : "#F5F5F7" }}>
        {remaining}
        <span className="font-mono text-[10px] ml-1" style={{ color: "#8A8F98" }}>/ {total}</span>
      </p>
      <div className="h-1.5 w-full mt-2" style={{ background: "rgba(138,143,152,0.12)", borderRadius: 2 }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: low ? "#ef4444" : color, borderRadius: 2 }} />
      </div>
      <p className="font-mono text-[8px] mt-1" style={{ color: low ? "#ef4444" : "#8A8F98" }}>
        {low ? "LOW — buy more" : `${pct}% used`}
      </p>
    </div>
  );
}