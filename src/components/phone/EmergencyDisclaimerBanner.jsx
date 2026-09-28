import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * EmergencyDisclaimerBanner — prominent inline banner shown at the top of
 * the softphone interface. Explicitly states the dialer is NOT for 911 or
 * emergency services. Always visible (the modal handles first-time consent).
 */
export default function EmergencyDisclaimerBanner() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 mb-4"
      style={{
        background: "linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.05) 100%)",
        border: "0.5px solid rgba(239,68,68,0.45)",
      }}
    >
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.5)", borderRadius: 4 }}>
        <AlertTriangle size={16} style={{ color: "#ef4444" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: "#ef4444" }}>// NOT FOR EMERGENCIES</p>
        <p className="text-[11px] mt-0.5" style={{ color: "#F5F5F7", lineHeight: 1.45 }}>
          This dialer <span className="font-bold" style={{ color: "#ef4444" }}>cannot call 911 or emergency services</span>. For emergencies, use your real mobile phone and dial 911 directly.
        </p>
      </div>
    </div>
  );
}