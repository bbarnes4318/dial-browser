import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useVoiceGuide } from "@/hooks/useVoiceGuide";
import StepWelcome from "@/components/onboarding/StepWelcome";
import StepProfile from "@/components/onboarding/StepProfile";
import StepVoice from "@/components/onboarding/StepVoice";
import StepVoiceConfirmed from "@/components/onboarding/StepVoiceConfirmed";
import StepService from "@/components/onboarding/StepService";
import StepComplete from "@/components/onboarding/StepComplete";

const stepLabels = ["Welcome", "Profile", "Voice", "Confirmed", "Service"];

export default function OnboardingFlow() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    full_name: "", phone: "", location: "", voice_verified: false,
    connected_service: "", service_dial_code: "", member_dial_code: "",
  });

  const stepInstructions = [
    "Welcome to 1 Call Away. This voice-guided tour will walk you through setting up your account. Click next to begin.",
    "Step 1: Profile. Enter your full name, phone number, and location. Your phone number is how you'll receive calls and SMS alerts from the Dial Browser.",
    "Step 2: Voice Verification. Verify your voice to enable hands-free voice commands. You'll be able to search and navigate services just by speaking.",
    "Voice verification complete. You can now speak naturally to search the Dial Browser for any service or information.",
    "Step 3: Choose Your Service. Pick your first service to connect. Browse categories like Travel, Food, Finance, or Entertainment.",
    "Setup complete. Your personal dial number has been assigned. Share it so others can call you directly, and dial your services anytime.",
  ];
  const { enabled: voiceEnabled, toggle: toggleVoice } = useVoiceGuide(stepInstructions[step]);

  const open = () => { setIsOpen(true); setStep(0); setError(null); };
  const close = () => { setIsOpen(false); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };

  const next = async () => {
    if (step === 4) {
      setSaving(true);
      setError(null);
      try {
        const dial = `*1${Math.floor(100 + Math.random() * 900)}#`;
        const updated = { ...profile, member_dial_code: dial, onboarding_completed: true };
        await base44.entities.Member.create(updated);
        setProfile(updated);
        setStep(5);
      } catch (err) {
        setError("Could not save your profile. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setStep((s) => Math.min(s + 1, stepLabels.length));
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <>
      <button
        onClick={open}
        className="group relative inline-flex items-center gap-3 px-8 py-4 font-semibold text-sm tracking-widest uppercase transition-all duration-500 hover:shadow-[0_0_60px_rgba(209,255,38,0.2)]"
        style={{ background: "transparent", color: "#D1FF26", borderRadius: "2px", border: "1px solid rgba(209,255,38,0.5)" }}
      >
        <span className="w-2 h-2 rounded-full bg-[#D1FF26] group-hover:animate-pulse" />
        Start Onboarding
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
            style={{ background: "rgba(5,7,10,0.9)", backdropFilter: "blur(8px)" }}
            onClick={close}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
              </div>

              <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
                <button
                  onClick={toggleVoice}
                  className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                  style={{ color: voiceEnabled ? "#D1FF26" : "#8A8F98" }}
                  title={voiceEnabled ? "Disable voice guide" : "Enable voice guide"}
                >
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button onClick={close} className="flex items-center justify-center w-8 h-8 hover:text-[#D1FF26] transition-colors" style={{ color: "#8A8F98" }}>
                  <X size={18} />
                </button>
              </div>

              {step < 5 && (
                <div className="flex items-center gap-1 mb-6">
                  {stepLabels.map((label, i) => (
                    <div key={label} className="flex-1">
                      <div className="h-0.5 transition-all duration-300" style={{ background: i <= step ? "#D1FF26" : "rgba(138,143,152,0.2)" }} />
                      <span className="font-mono text-[7px] tracking-widest mt-1 block" style={{ color: i <= step ? "#D1FF26" : "#8A8F98" }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-xs mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  {step === 0 && <StepWelcome onNext={next} />}
                  {step === 1 && <StepProfile profile={profile} setProfile={setProfile} onNext={next} onBack={back} />}
                  {step === 2 && <StepVoice profile={profile} setProfile={setProfile} onNext={next} onBack={back} />}
                  {step === 3 && <StepVoiceConfirmed profile={profile} onNext={next} />}
                  {step === 4 && <StepService profile={profile} setProfile={setProfile} onNext={next} onBack={back} saving={saving} />}
                  {step === 5 && <StepComplete profile={profile} onClose={close} />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}