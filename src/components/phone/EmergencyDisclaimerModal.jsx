import React from "react";
import { AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";

export default function EmergencyDisclaimerModal({ onAck, acknowledging }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="max-w-md w-full p-6" style={{ background: "rgba(16,20,29,0.95)", border: "0.5px solid rgba(239,68,68,0.5)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.5)" }}>
          <ShieldAlert size={24} style={{ color: "#ef4444" }} />
        </div>
        <p className="font-mono text-[10px] tracking-[0.4em] mb-2" style={{ color: "#ef4444" }}>// IMPORTANT — NOT FOR EMERGENCIES</p>
        <h2 className="font-heading font-black text-xl mb-3" style={{ color: "#F5F5F7" }}>This is not a real cellphone.</h2>
        <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Your Dial number cannot place or receive <span style={{ color: "#ef4444" }}>911 or emergency calls</span>. Do not rely on it for emergencies — use your real mobile phone and dial 911 directly. This service is a second line for everyday calls and texts.
        </p>
        <div className="flex items-start gap-2 p-3 mb-4" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.25)" }}>
          <AlertTriangle size={14} style={{ color: "#ef4444" }} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: "#8A8F98" }}>By continuing you acknowledge this phone is not for emergency use.</p>
        </div>
        <button
          onClick={onAck}
          disabled={acknowledging}
          className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-50"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          {acknowledging ? <Loader2 size={14} className="animate-spin" /> : null} I understand — continue
        </button>
      </div>
    </div>
  );
}