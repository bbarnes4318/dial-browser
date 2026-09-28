import React from "react";
import { motion } from "framer-motion";
import { Check, Mic, Phone, Link2 } from "lucide-react";

export default function StepComplete({ profile, onClose }) {
  const summary = [
    { icon: Phone, label: "Phone", value: profile.phone },
    { icon: Mic, label: "Voice", value: "Verified" },
    { icon: Link2, label: "Service", value: profile.connected_service },
  ];

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full"
        style={{ background: "rgba(209,255,38,0.12)", border: "2px solid #D1FF26" }}
      >
        <Check size={28} style={{ color: "#D1FF26" }} />
      </motion.div>

      <h2 className="font-heading font-black text-3xl mb-2" style={{ color: "#F5F5F7" }}>
        You're All Set, <span style={{ color: "#D1FF26" }}>{profile.full_name.split(" ")[0]}!</span>
      </h2>
      <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Your voice-verified profile is live on the 1 CALL AWAY network.
      </p>

      <div className="p-5 mb-6" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR MEMBER DIAL CODE</p>
        <p className="font-heading font-black text-4xl tracking-wider" style={{ color: "#D1FF26" }}>{profile.member_dial_code}</p>
        <p className="font-mono text-[9px] mt-2" style={{ color: "#8A8F98" }}>Dial this code anytime to access your dashboard</p>
      </div>

      <div className="space-y-2 mb-6 text-left">
        {summary.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <s.icon size={14} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{s.label.toUpperCase()}</span>
            <span className="flex-1 text-right text-sm" style={{ color: "#F5F5F7" }}>{s.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="w-full py-4 font-mono text-[11px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
        style={{ background: "#D1FF26", color: "#05070A" }}
      >
        Enter 1 CALL AWAY
      </button>
    </div>
  );
}