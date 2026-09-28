import React from "react";
import { motion } from "framer-motion";
import { Phone, Mic, Link2, Check } from "lucide-react";

const features = [
  { icon: Mic, label: "Verify your voice" },
  { icon: Link2, label: "Connect a service" },
  { icon: Check, label: "Get your dial code" },
];

export default function StepWelcome({ onNext }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Phone size={16} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// NEW MEMBER ONBOARDING</p>
      </div>
      <h2 className="font-heading font-black text-3xl sm:text-4xl mb-4" style={{ color: "#F5F5F7" }}>
        Welcome to <span style={{ color: "#D1FF26" }}>1 CALL AWAY™</span>
      </h2>
      <p className="text-sm mb-8" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Set up your voice-verified profile and connect your first service in under 2 minutes. No app download required — just your voice.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-2 p-3"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}
          >
            <f.icon size={18} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-wider text-center" style={{ color: "#8A8F98" }}>{f.label}</span>
          </motion.div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full py-4 font-mono text-[11px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
        style={{ background: "#D1FF26", color: "#05070A" }}
      >
        Begin Setup
      </button>
    </div>
  );
}