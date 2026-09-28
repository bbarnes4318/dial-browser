import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Volume2, Check, RotateCcw, ArrowRight, Signal, PhoneCall } from "lucide-react";
import { dialServices } from "@/data/dialServices";

const OPEN_EVENT = "openVoiceFlowSimulator";

// Open the simulator modal. Pass a service to jump straight into its flow,
// or pass nothing to start at the service picker.
export function openVoiceFlowSimulator(service) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: service || null }));
}

// Derive 3 spoken-command options for a service from its example + tags.
function getCommands(svc) {
  const cmds = [];
  const m = svc.example.match(/say ['"\u2018\u2019](.+?)['"\u2018\u2019]/i);
  if (m) cmds.push(m[1]);
  if (svc.tags[0]) cmds.push(`Help me with ${svc.tags[0]}`);
  cmds.push(`What are my options for ${svc.name.toLowerCase()}?`);
  return Array.from(new Set(cmds)).slice(0, 3);
}

// Category-flavored result messages for realism.
const RESULT_BY_CATEGORY = {
  Travel: "I found several options that match your request. I'll read back the top results and you can confirm your booking by voice.",
  Food: "Your request is ready. Nearby options are queued — confirm your order and delivery address by voice.",
  Finance: "I've pulled up your account summary. You can confirm the transaction by voice.",
  Health: "I've located nearby providers with availability. Confirm your appointment by voice.",
  Housing: "I've matched several listings to your criteria. Hear the details and schedule a viewing.",
  Productivity: "I've drafted your request. Review and confirm the details by voice.",
  Entertainment: "I've queued up the best matches. Press play or confirm by voice.",
  Local: "I've found local options near you. Hear directions and contact details.",
  Transport: "I've checked schedules and availability nearby. Confirm your ride or route.",
  Shopping: "I've browsed current listings that match. Hear prices and make an offer.",
};
function getResultMessage(svc) {
  return RESULT_BY_CATEGORY[svc.category] || "I've processed your request. Confirm the details by voice.";
}

export default function VoiceFlowSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [service, setService] = useState(null);
  const [step, setStep] = useState("select"); // select | connecting | greeting | speak | processing | confirm | result
  const [spoken, setSpoken] = useState("");
  const [playing, setPlaying] = useState(false);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    const handler = (e) => {
      clearTimers();
      const svc = e.detail;
      if (svc) {
        setService(svc);
        setStep("connecting");
      } else {
        setService(null);
        setStep("select");
      }
      setSpoken("");
      setIsOpen(true);
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => {
      window.removeEventListener(OPEN_EVENT, handler);
      clearTimers();
    };
  }, []);

  const close = () => {
    clearTimers();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
    setIsOpen(false);
  };

  const reset = () => {
    clearTimers();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
    setStep(service ? "connecting" : "select");
    setSpoken("");
  };

  const connect = () => {
    setStep("connecting");
    const t = setTimeout(() => setStep("greeting"), 2000);
    timersRef.current.push(t);
  };

  const greetingText = service
    ? `Welcome to ${service.name}. ${service.desc} How can I help you today?`
    : "";

  const playGreeting = () => {
    if (!("speechSynthesis" in window)) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(greetingText);
    u.rate = 0.95;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
  };

  const chooseCommand = (cmd) => {
    setSpoken(cmd);
    setStep("processing");
    const t = setTimeout(() => setStep("confirm"), 1600);
    timersRef.current.push(t);
  };

  const steps = ["connecting", "greeting", "speak", "processing", "confirm", "result"];
  const stepIndex = service && steps.includes(step) ? steps.indexOf(step) : -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(8px)" }}
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto"
            style={{ background: "#0A0E15", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 48px rgba(209,255,38,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ background: "#0A0E15", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
              <div className="flex items-center gap-2">
                <PhoneCall size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE FLOW SIMULATOR</p>
              </div>
              <button onClick={close} style={{ color: "#8A8F98" }} className="transition-colors hover:text-[#F5F5F7]">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Step progress (when a service is selected) */}
              {service && step !== "select" && (
                <div className="flex gap-1 mb-5">
                  {steps.map((s, i) => (
                    <div key={s} className="h-0.5 flex-1" style={{ background: i <= stepIndex ? "#D1FF26" : "rgba(138,143,152,0.15)", boxShadow: i === stepIndex ? "0 0 6px #D1FF26" : "none" }} />
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* SERVICE PICKER */}
                {step === "select" && (
                  <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>Pick a service to simulate</p>
                    <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>Click through a mock voice-guided call before you call in for real.</p>
                    <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                      {dialServices.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setService(s); setStep("connecting"); }}
                          className="flex items-center gap-2 p-3 text-left transition-all"
                          style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.12)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(209,255,38,0.4)")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(209,255,38,0.12)")}
                        >
                          <span className="text-xl">{s.icon}</span>
                          <div className="min-w-0">
                            <p className="font-heading font-medium text-xs truncate" style={{ color: "#F5F5F7" }}>{s.name}</p>
                            <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{s.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* CONNECTING */}
                {step === "connecting" && service && (
                  <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                    <div className="relative flex items-center justify-center mb-6">
                      <span className="absolute rounded-full" style={{ width: 72, height: 72, background: "rgba(209,255,38,0.08)", animation: "emergencyPulse 1.8s ease-out infinite" }} />
                      <span className="absolute rounded-full" style={{ width: 56, height: 56, background: "rgba(209,255,38,0.12)", animation: "emergencyPulse 1.8s ease-out infinite 0.4s" }} />
                      <PhoneCall size={28} style={{ color: "#D1FF26" }} />
                    </div>
                    <p className="font-mono text-xs tracking-widest mb-1" style={{ color: "#D1FF26" }}>CONNECTING…</p>
                    <p className="text-sm" style={{ color: "#F5F5F7" }}>{service.name}</p>
                    <p className="font-mono text-[9px] mt-2" style={{ color: "#8A8F98" }}>Calling the 1 Call Away number</p>
                    <button onClick={connect} className="mt-4 w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                      <PhoneCall size={14} /> Connect
                    </button>
                  </motion.div>
                )}

                {/* GREETING */}
                {step === "greeting" && service && (
                  <motion.div key="greeting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Signal size={12} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>● CALL CONNECTED</span>
                    </div>
                    <div className="flex gap-3 mb-5">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                        <span className="text-sm">{service.icon}</span>
                      </div>
                      <div className="flex-1 p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                        <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>SYSTEM VOICE</p>
                        <p className="text-sm leading-relaxed" style={{ color: "#F5F5F7" }}>{greetingText}</p>
                        <button onClick={playGreeting} className="flex items-center gap-1.5 mt-2 font-mono text-[8px] tracking-widest uppercase" style={{ color: playing ? "#D1FF26" : "#8A8F98" }}>
                          <Volume2 size={10} /> {playing ? "Stop" : "Play voice"}
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setStep("speak")} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                      Respond <ArrowRight size={14} />
                    </button>
                  </motion.div>
                )}

                {/* SPEAK */}
                {step === "speak" && service && (
                  <motion.div key="speak" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Mic size={12} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>● SPEAK NOW</span>
                    </div>
                    <p className="text-sm mb-4" style={{ color: "#8A8F98" }}>Choose what you'd say:</p>
                    <div className="space-y-2 mb-4">
                      {getCommands(service).map((cmd) => (
                        <button
                          key={cmd}
                          onClick={() => chooseCommand(cmd)}
                          className="w-full flex items-center gap-3 p-3 text-left transition-all"
                          style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(209,255,38,0.5)"; e.currentTarget.style.background = "rgba(209,255,38,0.06)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(209,255,38,0.15)"; e.currentTarget.style.background = "rgba(5,7,10,0.6)"; }}
                        >
                          <Mic size={12} style={{ color: "#D1FF26" }} className="flex-shrink-0" />
                          <span className="font-mono text-xs" style={{ color: "#F5F5F7" }}>"{cmd}"</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={reset} className="w-full font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
                      ↺ Restart flow
                    </button>
                  </motion.div>
                )}

                {/* PROCESSING */}
                {step === "processing" && service && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                    <div className="relative flex items-center justify-center mb-5">
                      <span className="rounded-full" style={{ width: 12, height: 12, background: "#D1FF26", boxShadow: "0 0 16px #D1FF26", animation: "dotPulse 1s ease-in-out infinite" }} />
                    </div>
                    <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "#D1FF26" }}>UNDERSTANDING…</p>
                    <p className="font-mono text-sm text-center max-w-xs" style={{ color: "#F5F5F7" }}>"{spoken}"</p>
                  </motion.div>
                )}

                {/* CONFIRM */}
                {step === "confirm" && service && (
                  <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="flex gap-3 mb-5">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                        <span className="text-sm">{service.icon}</span>
                      </div>
                      <div className="flex-1 p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                        <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>SYSTEM VOICE</p>
                        <p className="text-sm leading-relaxed" style={{ color: "#F5F5F7" }}>I heard: <span style={{ color: "#D1FF26" }}>"{spoken}"</span>. Is that correct?</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setStep("speak")} className="flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                        <X size={12} /> No, retry
                      </button>
                      <button onClick={() => setStep("result")} className="flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                        <Check size={12} /> Yes, confirm
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* RESULT */}
                {step === "result" && service && (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="w-16 h-16 mx-auto flex items-center justify-center mb-4 rounded-full" style={{ background: "rgba(209,255,38,0.1)", border: "2px solid #D1FF26", boxShadow: "0 0 24px rgba(209,255,38,0.3)" }}>
                      <Check size={28} style={{ color: "#D1FF26" }} />
                    </motion.div>
                    <p className="font-heading font-bold text-lg mb-2" style={{ color: "#F5F5F7" }}>Request received</p>
                    <div className="p-3 mb-5 text-left" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                      <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>{service.name.toUpperCase()} · RESPONSE</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#F5F5F7" }}>{getResultMessage(service)}</p>
                    </div>
                    <p className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color: "#8A8F98" }}>
                      Ready? Call the <span style={{ color: "#D1FF26" }}>1 Call Away number</span> and speak naturally.
                    </p>
                    <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
                      <RotateCcw size={11} /> Try another service
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}