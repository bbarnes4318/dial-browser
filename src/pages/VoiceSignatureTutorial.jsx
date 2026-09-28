import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic, Volume2, Repeat, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, ArrowRight, Quote } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const PASSPHRASE = "My voice is my passport. Verify me.";

const STEPS = [
  {
    n: 1,
    icon: Volume2,
    title: "Find a quiet spot",
    body: "Pick a room with little background noise. Turn off music, TV, and fans — your voiceprint is matched against your unique vocal pattern, so a clean recording matters.",
  },
  {
    n: 2,
    icon: Mic,
    title: "Allow microphone access",
    body: "When prompted, tap Allow so the browser can use your mic. You only need to grant this once. A small mic icon confirms it's listening.",
  },
  {
    n: 3,
    icon: Quote,
    title: "Speak the passphrase clearly",
    body: "Say the exact passphrase in your normal voice — not too fast, not too slow. Don't whisper or shout. Speak as you would on a real phone call.",
  },
  {
    n: 4,
    icon: Repeat,
    title: "Record three samples",
    body: "You'll repeat the passphrase three times. Averaging three samples makes your voiceprint accurate enough to recognize you later — even if your voice shifts slightly.",
  },
  {
    n: 5,
    icon: CheckCircle2,
    title: "Voice login is ready",
    body: "Once enrolled, your voice signature is saved. You can verify your identity with your voice instead of typing a password each time you sign in.",
  },
];

const DO = [
  "Speak at your natural pitch and pace",
  "Hold the phone 6–12 inches from your mouth",
  "Use the same quiet environment each time",
  "Re-record if there's a sudden noise",
];

const DONT = [
  "Don't whisper, shout, or exaggerate",
  "Don't record in a crowded or windy place",
  "Don't change devices between samples",
  "Don't skip a sample if prompted",
];

export default function VoiceSignatureTutorial() {
  const [playing, setPlaying] = useState(false);

  const hearPassphrase = () => {
    setPlaying(true);
    speak(PASSPHRASE, {
      skipTranslate: true,
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  useEffect(() => () => stopSpeaking(), []);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE SIGNATURE SETUP</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Record your voice <span style={{ color: "#D1FF26" }}>correctly.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Your voice signature lets you sign in with your unique voice. Follow these five steps once and you're set for every future call.
          </p>
        </div>

        {/* Passphrase demo */}
        <div className="mb-10 p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// YOUR PASSPHRASE</p>
          <p className="font-heading font-bold text-xl sm:text-2xl mb-4" style={{ color: "#F5F5F7" }}>"{PASSPHRASE}"</p>
          <button onClick={hearPassphrase} className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: playing ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <Volume2 size={12} /> {playing ? "Playing…" : "Hear it spoken"}
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-10">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative flex gap-4 p-5"
                style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.12)" }}
              >
                <div className="flex items-center justify-center w-11 h-11 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  <Icon size={20} style={{ color: "#D1FF26" }} />
                </div>
                <div className="flex-1">
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>STEP {step.n}</span>
                  <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>{step.title}</h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: "#8A8F98" }}>{step.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Do / Don't */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="p-5" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>✓ DO</p>
            <ul className="space-y-2">
              {DO.map((d) => (
                <li key={d} className="flex items-start gap-2 text-[11px]" style={{ color: "#F5F5F7" }}>
                  <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#D1FF26" }} /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ background: "rgba(239,68,68,0.04)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#ef4444" }}>✕ DON'T</p>
            <ul className="space-y-2">
              {DONT.map((d) => (
                <li key={d} className="flex items-start gap-2 text-[11px]" style={{ color: "#F5F5F7" }}>
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} /> {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="p-6 text-center" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Sparkles size={20} className="mx-auto mb-3" style={{ color: "#D1FF26" }} />
          <p className="font-heading font-bold text-lg mb-2" style={{ color: "#F5F5F7" }}>Ready to record?</p>
          <p className="text-[12px] mb-5 max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            Log in to your account, open the voice login setup, and follow the prompts. It takes about a minute.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            Go to Login <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}