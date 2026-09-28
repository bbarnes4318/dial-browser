import React from "react";
import TeleMedicalVoiceFlow from "@/components/landing/TeleMedicalVoiceFlow";
import TelemedicalDisclaimer from "@/components/landing/TelemedicalDisclaimer";

/**
 * Dial Medical — dedicated AI telehealth portal page.
 * Destination for the homepage "Open Dial Medical" button.
 */
export default function Medical() {
  return (
    <div className="min-h-screen pt-10 pb-20" style={{ background: "#05070A" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 pt-6">
          <p className="font-mono text-[10px] tracking-[0.35em] mb-3" style={{ color: "#D1FF26" }}>
            // DIAL MEDICAL — AI TELEHEALTH
          </p>
          <h1 className="font-heading font-black text-4xl sm:text-6xl mb-3" style={{ color: "#F5F5F7" }}>
            Dial <span style={{ color: "#D1FF26" }}>Medical</span>
          </h1>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Your AI-powered telehealth portal. Describe your symptom by voice or text and get general wellness information — not a diagnosis.
          </p>
        </div>
        <div className="max-w-3xl mx-auto mb-8">
          <TelemedicalDisclaimer />
        </div>
        <TeleMedicalVoiceFlow />
      </div>
    </div>
  );
}