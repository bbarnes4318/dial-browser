import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Fingerprint, Mic, ShieldCheck, KeyRound, CheckCircle2,
  ChevronDown, UserCircle, Volume2,
} from "lucide-react";

const STEPS = [
  {
    icon: UserCircle,
    title: "Open Your Profile",
    description: "After logging in, go to your Profile page from the dashboard. This is where you manage all security settings for your account.",
  },
  {
    icon: Fingerprint,
    title: "Find Voice Verification",
    description: "Scroll to the “Voice Verification & Security” section. Click “Set Up Voiceprint” to begin the enrollment process.",
  },
  {
    icon: Mic,
    title: "Allow Microphone Access",
    description: "Your browser will ask for microphone permission. Click “Allow” — your voice data is processed locally and never leaves your device.",
  },
  {
    icon: Volume2,
    title: "Speak Your Passphrase",
    description: "A unique passphrase will appear on screen. Speak it clearly into your microphone in a quiet room. The system captures your voice’s spectral fingerprint.",
  },
  {
    icon: KeyRound,
    title: "Set Your Login Secret",
    description: "Create a secret word or PIN. This is used behind the scenes after your voice is verified to securely log you in without typing a password.",
  },
  {
    icon: ShieldCheck,
    title: "Repeat to Confirm",
    description: "Speak your passphrase a second time. The system compares both samples — once they match, your voiceprint is enrolled and active.",
  },
  {
    icon: CheckCircle2,
    title: "Login With Your Voice",
    description: "Next time you visit the login page, click “Login with Voice.” Speak your passphrase — if it matches your voiceprint, you’re instantly logged in. No password needed.",
  },
];

export default function VoiceprintSetupGuide() {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-8"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 transition-all hover:bg-[rgba(209,255,38,0.04)]"
        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}
      >
        <div className="flex items-center gap-2.5">
          <Fingerprint size={16} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px] tracking-widest font-bold" style={{ color: "#D1FF26" }}>
            SECURE YOUR ACCOUNT · VOICEPRINT SETUP GUIDE
          </span>
        </div>
        <ChevronDown
          size={16}
          style={{ color: "#8A8F98", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}
        />
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
        >
          <div className="p-5" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.1)", borderTop: "none" }}>
            <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              Your voice is your key. Set up a voiceprint after registration to log in securely by speaking —
              no password required. Follow these steps once you’ve created your account.
            </p>

            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div
                        className="w-8 h-8 flex items-center justify-center"
                        style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)" }}
                      >
                        <Icon size={14} style={{ color: "#D1FF26" }} />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ background: "rgba(209,255,38,0.15)" }} />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                          STEP {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm mb-0.5" style={{ color: "#F5F5F7" }}>
                        {step.title}
                      </h4>
                      <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="flex items-center gap-2 mt-5 px-4 py-3"
              style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}
            >
              <ShieldCheck size={14} style={{ color: "#D1FF26" }} />
              <p className="text-xs" style={{ color: "#D1FF26" }}>
                Your voiceprint is stored as a mathematical spectral signature — never as a recording.
                It cannot be reverse-engineered or replayed.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}