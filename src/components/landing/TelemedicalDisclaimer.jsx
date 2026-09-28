import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

/**
 * Medical & legal disclaimer for the Dial Medical telehealth experience.
 * Shown on both the homepage section and the dedicated /medical page.
 */
export default function TelemedicalDisclaimer({ compact = false }) {
  return (
    <div
      className={`${compact ? "p-4" : "p-5"} w-full`}
      style={{
        background: "rgba(239,68,68,0.05)",
        border: "0.5px solid rgba(239,68,68,0.3)",
        borderRadius: "2px",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert size={14} style={{ color: "#ef4444" }} />
        <p className="font-mono text-[10px] tracking-widest font-bold" style={{ color: "#ef4444" }}>
          // MEDICAL & LEGAL DISCLAIMER
        </p>
      </div>

      <div className={`space-y-2 ${compact ? "text-[11px]" : "text-xs"}`} style={{ color: "#F5F5F7", lineHeight: 1.6 }}>
        <p className="flex items-start gap-2">
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <span>
            <span style={{ color: "#F5F5F7", fontWeight: 600 }}>Not a medical diagnosis.</span> Dial Medical provides
            general wellness information only. It is not a diagnosis, medical advice, or a treatment plan, and must not
            replace the judgment of a licensed healthcare professional.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <span>
            <span style={{ color: "#F5F5F7", fontWeight: 600 }}>No provider-patient relationship.</span> Using this
            portal does not create a doctor-patient or clinical relationship with Dial Browser or any provider.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <span>
            <span style={{ color: "#F5F5F7", fontWeight: 600 }}>Emergencies:</span> In a medical emergency, call your
            local emergency number (e.g. 911) or go to the nearest emergency room immediately. Do not rely on this
            portal in an emergency.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <span>
            <span style={{ color: "#F5F5F7", fontWeight: 600 }}>Consult a licensed provider.</span> Always consult a
            licensed physician or qualified healthcare provider for an actual diagnosis, treatment, and medical
            advice tailored to your condition.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <span>
            <span style={{ color: "#F5F5F7", fontWeight: 600 }}>No liability.</span> Dial Browser and its operators
            are not liable for any decisions, actions, or outcomes based on information provided by this portal. Use
            is at your own risk.
          </span>
        </p>
      </div>

      <p className={`mt-3 font-mono ${compact ? "text-[9px]" : "text-[10px]"} tracking-wider`} style={{ color: "rgba(239,68,68,0.7)" }}>
        BY USING DIAL MEDICAL, YOU ACKNOWLEDGE AND ACCEPT THESE TERMS.
      </p>
    </div>
  );
}