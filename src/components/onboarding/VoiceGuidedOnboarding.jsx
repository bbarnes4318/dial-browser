import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, X, Play, Pause, SkipForward, SkipBack, Volume2, Check, ChevronRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const STEPS = [
  {
    id: "welcome",
    icon: Phone,
    title: "Welcome to 1 Call Away",
    audio: "Welcome to 1 Call Away. The platform where your voice connects you to essential services. Let's walk through how to use voice commands to access everything you need.",
    dial: "*100#",
    tip: "You can access any service by dialing a code or speaking naturally.",
  },
  {
    id: "weather",
    icon: Volume2,
    title: "Get Weather by Voice",
    audio: "To check the weather, simply say: what's the weather today. Our system will fetch the forecast for your location and read it back to you over the call.",
    dial: "*200#",
    tip: "Try saying: 'weather in Miami' or 'will it rain tomorrow'",
  },
  {
    id: "medical",
    icon: Volume2,
    title: "Medical Assistance",
    audio: "For medical help, say: I need a doctor or medical help. Our AI triage will assess your symptoms and connect you with the right provider.",
    dial: "*300#",
    tip: "Describe your symptoms clearly: 'I have a headache and fever'",
  },
  {
    id: "grocery",
    icon: Volume2,
    title: "Grocery Ordering",
    audio: "To order groceries, say: add milk, bread, and eggs to my grocery list. We'll build your cart and arrange delivery.",
    dial: "*400#",
    tip: "List your items naturally: 'I need milk, eggs, and bananas'",
  },
  {
    id: "bills",
    icon: Volume2,
    title: "Pay Bills Instantly",
    audio: "To pay a bill, say: pay my electric bill. Tell us the amount and we'll process the payment securely.",
    dial: "*500#",
    tip: "Say: 'pay my water bill' or 'how much is my phone bill'",
  },
  {
    id: "construction",
    icon: Volume2,
    title: "Find Contractors",
    audio: "Need construction help? Say: find a roofer or I need a plumber. We'll match you with licensed professionals in your area.",
    dial: "*700#",
    tip: "Describe your project: 'I need a roof repair in Atlanta'",
  },
  {
    id: "search",
    icon: Volume2,
    title: "The Dial Browser Search",
    audio: "The Dial Browser is your voice-first search engine. Ask any question and hear the answer read aloud. Say: search for nearest pharmacy or who won the game today.",
    dial: "*110#",
    tip: "Ask anything: 'translate hello to Spanish' or 'nearest gas station'",
  },
  {
    id: "complete",
    icon: Check,
    title: "You're All Set!",
    audio: "That's it! You now know how to access all our services by voice. Pick up your phone, dial any code, and just speak naturally. Welcome to 1 Call Away.",
    dial: "*100#",
    tip: "Bookmark this page to revisit the guide anytime.",
  },
];

export default function VoiceGuidedOnboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const current = STEPS[step];
  const Icon = current.icon;

  const stopAudio = () => {
    stopSpeaking();
  };

  useEffect(() => () => stopAudio(), []);

  const playAudio = () => {
    stopSpeaking();
    speak(current.audio, { onEnd: () => setPlaying(false), onError: () => setPlaying(false) });
    setPlaying(true);
  };

  const togglePlay = () => {
    if (playing) {
      stopAudio();
      setPlaying(false);
    } else {
      playAudio();
    }
  };

  const goToStep = (idx) => {
    stopAudio();
    setPlaying(false);
    setStep(Math.max(0, Math.min(STEPS.length - 1, idx)));
  };

  const close = () => {
    stopAudio();
    setPlaying(false);
    setOpen(false);
  };

  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => { setOpen(true); setStep(0); }}
        className="fixed bottom-44 lg:bottom-52 left-4 z-40 flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.4)]"
        style={{ background: "#D1FF26", color: "#05070A", boxShadow: "0 4px 20px rgba(209,255,38,0.2)" }}
      >
        <Headphones size={14} /> Voice Tour
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(5,7,10,0.9)", backdropFilter: "blur(8px)" }}
              onClick={close}
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-lg pointer-events-auto"
                style={{ background: "#0A0D14", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Signal accent */}
                <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                  <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-5" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}>
                  <div className="flex items-center gap-2">
                    <Headphones size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE GUIDED TOUR</p>
                  </div>
                  <button onClick={close} className="p-1.5 transition-colors hover:bg-[rgba(239,68,68,0.1)]">
                    <X size={16} style={{ color: "#8A8F98" }} />
                  </button>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 px-5 pt-4">
                  {STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goToStep(i)}
                      className="h-1 flex-1 transition-all"
                      style={{
                        background: i === step ? "#D1FF26" : i < step ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)",
                      }}
                    />
                  ))}
                </div>

                {/* Step content */}
                <div className="p-5 lg:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <Icon size={22} style={{ color: "#D1FF26" }} />
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>STEP {step + 1} OF {STEPS.length}</p>
                      <h3 className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{current.title}</h3>
                    </div>
                  </div>

                  {/* Audio player */}
                  <div className="p-4 mb-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "#F5F5F7", lineHeight: 1.6 }}>{current.audio}</p>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={togglePlay}
                        className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
                        style={{ background: playing ? "rgba(239,68,68,0.15)" : "#D1FF26", color: playing ? "#ef4444" : "#05070A", border: playing ? "0.5px solid rgba(239,68,68,0.4)" : "none" }}
                      >
                        {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? "Stop" : "Play Audio"}
                      </button>
                      {playing && (
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span key={i} className="w-1" style={{ background: "#D1FF26", animation: `eqBar ${0.5 + i * 0.1}s ease-in-out ${i * 0.08}s infinite`, height: "16px" }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dial code + tip */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <Phone size={11} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>{current.dial}</span>
                    </div>
                    <p className="text-xs flex-1" style={{ color: "#8A8F98", lineHeight: 1.4 }}>💡 {current.tip}</p>
                  </div>

                  {/* Nav buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => goToStep(step - 1)}
                      disabled={step === 0}
                      className="flex items-center gap-1.5 px-4 py-3 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}
                    >
                      <SkipBack size={12} /> Back
                    </button>
                    {isLast ? (
                      <Link
                        to="/voice-guide"
                        onClick={close}
                        className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                        style={{ background: "#D1FF26", color: "#05070A" }}
                      >
                        <ChevronRight size={13} /> Explore Full Guide
                      </Link>
                    ) : (
                      <button
                        onClick={() => goToStep(step + 1)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                        style={{ background: "#D1FF26", color: "#05070A" }}
                      >
                        Next <SkipForward size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}