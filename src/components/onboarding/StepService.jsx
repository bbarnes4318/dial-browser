import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const services = [
  { id: "marketplace", name: "1 Call Marketplace", dial: "*300#", icon: "🛒", desc: "Buy, sell, and trade by voice" },
  { id: "network", name: "1 Call Network", dial: "*400#", icon: "📺", desc: "Stream movies, TV, and shorts" },
  { id: "gps", name: "1 Call GPS", dial: "*450#", icon: "🧭", desc: "Voice-guided directions" },
  { id: "dating", name: "1 Call Dating", dial: "*520#", icon: "💬", desc: "Find matches through voice" },
  { id: "events", name: "1 Call Events", dial: "*600#", icon: "🎉", desc: "Discover and promote events" },
  { id: "radio", name: "1 Call Radio", dial: "*700#", icon: "📻", desc: "Live radio and audio" },
];

export default function StepService({ profile, setProfile, onNext, onBack, saving }) {
  const [selected, setSelected] = useState(profile.connected_service || null);

  const handleSelect = (svc) => {
    setSelected(svc.id);
    setProfile({ ...profile, connected_service: svc.name, service_dial_code: svc.dial });
  };

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.3em] mb-2" style={{ color: "#D1FF26" }}>// STEP 3 — CONNECT A SERVICE</p>
      <h2 className="font-heading font-black text-2xl sm:text-3xl mb-4" style={{ color: "#F5F5F7" }}>Connect Your First Service</h2>
      <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Choose a service to link to your profile. You can add more later by dialing *100#.
      </p>

      <div className="grid sm:grid-cols-2 gap-2 mb-6">
        {services.map((svc) => {
          const isActive = selected === svc.id;
          return (
            <motion.button
              key={svc.id}
              onClick={() => handleSelect(svc)}
              whileTap={{ scale: 0.98 }}
              className="relative flex items-start gap-3 p-4 text-left transition-all"
              style={{
                background: isActive ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
              }}
            >
              <span className="text-2xl">{svc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-heading font-bold text-sm" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>{svc.name}</h3>
                  <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 shrink-0" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>{svc.dial}</span>
                </div>
                <p className="text-[11px]" style={{ color: "#8A8F98" }}>{svc.desc}</p>
              </div>
              {isActive && <Check size={14} className="absolute top-2 right-2" style={{ color: "#D1FF26" }} />}
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-4 font-mono text-[10px] tracking-widest uppercase disabled:opacity-40"
          style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
        >
          <ArrowLeft size={12} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!selected || saving}
          className="flex-1 flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          {saving ? "Saving…" : "Connect & Continue"} {!saving && <ArrowRight size={12} />}
        </button>
      </div>
    </div>
  );
}