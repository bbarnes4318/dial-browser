import React from "react";
import { Phone, MessageSquare, Sparkles, PlusCircle, Loader2 } from "lucide-react";

export default function PhoneCapBar({ entitlement, tier, onProvision, provisioning, hasNumber }) {
  const remMin = entitlement?.remainingMinutes ?? 0;
  const remSms = entitlement?.remainingSms ?? 0;
  const minPct = entitlement && entitlement.cap_minutes_monthly
    ? Math.min(100, Math.round(((entitlement.cap_minutes_monthly - remMin) / entitlement.cap_minutes_monthly) * 100))
    : 0;
  const smsPct = entitlement && entitlement.cap_sms_monthly
    ? Math.min(100, Math.round(((entitlement.cap_sms_monthly - remSms) / entitlement.cap_sms_monthly) * 100))
    : 0;
  const isPaid = tier && tier !== "free";

  return (
    <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Phone size={13} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// MY DIAL NUMBER</p>
        </div>
        <span className="font-mono text-xs" style={{ color: hasNumber ? "#D1FF26" : "#8A8F98" }}>
          {hasNumber || "shared line"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Phone size={11} style={{ color: "#42E1F6" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CALL MINUTES</span>
          </div>
          <p className="font-heading font-black text-lg" style={{ color: remMin > 5 ? "#F5F5F7" : "#ef4444" }}>{remMin}<span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}> left</span></p>
          <div className="h-1.5 w-full mt-1" style={{ background: "rgba(138,143,152,0.12)" }}>
            <div className="h-full" style={{ width: `${minPct}%`, background: remMin > 5 ? "#42E1F6" : "#ef4444" }} />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare size={11} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SMS</span>
          </div>
          <p className="font-heading font-black text-lg" style={{ color: remSms > 5 ? "#F5F5F7" : "#ef4444" }}>{remSms}<span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}> left</span></p>
          <div className="h-1.5 w-full mt-1" style={{ background: "rgba(138,143,152,0.12)" }}>
            <div className="h-full" style={{ width: `${smsPct}%`, background: remSms > 5 ? "#D1FF26" : "#ef4444" }} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {isPaid && !hasNumber && (
          <button
            onClick={onProvision}
            disabled={provisioning}
            className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
            style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}
          >
            {provisioning ? <Loader2 size={11} className="animate-spin" /> : <PlusCircle size={11} />} Get my number
          </button>
        )}
        {!isPaid && (
          <a
            href="/#pricing"
            className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            <Sparkles size={11} /> Upgrade for a personal number
          </a>
        )}
      </div>
    </div>
  );
}