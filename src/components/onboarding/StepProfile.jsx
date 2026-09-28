import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const inputStyle = {
  background: "rgba(16,20,29,0.8)",
  border: "0.5px solid rgba(138,143,152,0.2)",
  color: "#F5F5F7",
};

export default function StepProfile({ profile, setProfile, onNext, onBack }) {
  const valid = profile.full_name.trim() && profile.phone.trim();
  const update = (field, value) => setProfile({ ...profile, [field]: value });

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.3em] mb-2" style={{ color: "#D1FF26" }}>// STEP 1 — YOUR PROFILE</p>
      <h2 className="font-heading font-black text-2xl sm:text-3xl mb-4" style={{ color: "#F5F5F7" }}>Set Up Your Profile</h2>
      <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Enter your details. This creates your voice-verified identity on the 1 CALL AWAY network.
      </p>
      <div className="space-y-3 mb-6">
        <div>
          <label className="font-mono text-[9px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>FULL NAME *</label>
          <input
            value={profile.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="e.g. Amara Okafor"
            className="w-full px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="font-mono text-[9px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>PHONE NUMBER *</label>
          <input
            value={profile.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="e.g. +1 555 0100"
            type="tel"
            className="w-full px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="font-mono text-[9px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>LOCATION</label>
          <input
            value={profile.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Lagos, Nigeria"
            className="w-full px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-4 py-4 font-mono text-[10px] tracking-widest uppercase"
          style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
        >
          <ArrowLeft size={12} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          Continue <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}