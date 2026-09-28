import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, PhoneCall, Mic, Volume2, VolumeX, RotateCcw, Send, Signal, Check, Smartphone } from "lucide-react";
import { dialServices } from "@/data/dialServices";
import VoiceGpsPanel from "@/components/voice/VoiceGpsPanel";

const KEYPAD = [
  { k: "1", sub: "" }, { k: "2", sub: "ABC" }, { k: "3", sub: "DEF" },
  { k: "4", sub: "GHI" }, { k: "5", sub: "JKL" }, { k: "6", sub: "MNO" },
  { k: "7", sub: "PQRS" }, { k: "8", sub: "TUV" }, { k: "9", sub: "WXYZ" },
  { k: "*", sub: "" }, { k: "0", sub: "+" }, { k: "#", sub: "" },
];

// Build 3 sample voice commands for a service from its example + tags.
function getCommands(svc) {
  const cmds = [];
  const m = svc.example.match(/say ['"\u2018\u2019](.+?)['"\u2018\u2019]/i);
  if (m) cmds.push(m[1]);
  if (svc.tags[0]) cmds.push(`Help me with ${svc.tags[0]}`);
  cmds.push(`What are my options for ${svc.name.toLowerCase()}?`);
  return Array.from(new Set(cmds)).slice(0, 3);
}

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
  return RESULT_BY_CATEGORY[svc.category] || "I've processed your request. Confirm the details by voice when you dial in.";
}

export default function DialSimulator() {
  const [service, setService] = useState(null);
  const [dialed, setDialed] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | connecting | connected
  const [customCmd, setCustomCmd] = useState("");
  const [lastCmd, setLastCmd] = useState("");
  const [response, setResponse] = useState(null);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const timersRef = useRef([]);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  useEffect(() => () => { clearTimers(); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const speak = (text) => {
    if (muted || !text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const stopSpeak = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // DTMF-style tone per key press
  const toneFor = (k) => {
    const freqs = { "1":[697,1209],"2":[697,1336],"3":[697,1477],"4":[770,1209],"5":[770,1336],"6":[770,1477],"7":[852,1209],"8":[852,1336],"9":[852,1477],"*":[941,1209],"0":[941,1336],"#":[941,1477] };
    return freqs[k] || [697, 1209];
  };
  const playTone = (k) => {
    if (muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const [f1, f2] = toneFor(k);
      const t = ctx.currentTime;
      [f1, f2].forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = f;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
      setTimeout(() => ctx.close(), 300);
    } catch (e) {}
  };

  const pressKey = (k) => {
    if (phase !== "idle" || !service) return;
    playTone(k);
    setDialed((d) => (d.length < 8 ? d + k : d));
  };

  const selectService = (svc) => {
    clearTimers();
    stopSpeak();
    setService(svc);
    setDialed("");
    setPhase("idle");
    setResponse(null);
    setCustomCmd("");
    setLastCmd("");
  };

  const autoDial = () => {
    if (!service) return;
    clearTimers();
    stopSpeak();
    setDialed("");
    setPhase("idle");
    setResponse(null);
    const chars = (service.dial || service.id).split("");
    chars.forEach((ch, i) => {
      const t = setTimeout(() => {
        playTone(ch);
        setDialed((d) => d + ch);
      }, 260 * (i + 1));
      timersRef.current.push(t);
    });
  };

  const connect = () => {
    setPhase("connecting");
    const t1 = setTimeout(() => {
      setPhase("connected");
      const greeting = `Welcome to ${service.name}. ${service.desc} How can I help you today?`;
      speak(greeting);
    }, 1800);
    timersRef.current.push(t1);
  };

  const sendCommand = (cmd) => {
    if (!cmd.trim()) return;
    setLastCmd(cmd);
    speak(cmd);
    setResponse(null);
    // Simulate processing then speak the system response
    const t = setTimeout(() => {
      const msg = getResultMessage(service);
      setResponse(msg);
      setTimeout(() => speak(msg), 300);
    }, 1400);
    timersRef.current.push(t);
  };

  const reset = () => {
    clearTimers();
    stopSpeak();
    setDialed("");
    setPhase("idle");
    setResponse(null);
    setCustomCmd("");
    setLastCmd("");
  };

  const greetingText = service ? `Welcome to ${service.name}. ${service.desc} How can I help you today?` : "";
  const commands = service ? getCommands(service) : [];

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DIAL &amp; VOICE SIMULATOR</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Hear it <span style={{ color: "#D1FF26" }}>before you dial.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Pick a service, tap out its dial code, and speak a command — exactly how it will sound and flow when you call from a real phone. No call placed, no credits used.
          </p>
        </motion.div>

        {/* Mute toggle */}
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={() => { setMuted((m) => !m); stopSpeak(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
            style={{ background: muted ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.08)", border: `0.5px solid ${muted ? "rgba(138,143,152,0.3)" : "rgba(209,255,38,0.3)"}`, color: muted ? "#8A8F98" : "#D1FF26" }}
          >
            {muted ? <VolumeX size={11} /> : <Volume2 size={11} />} {muted ? "MUTED" : "SOUND ON"}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: phone */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            {/* Service picker */}
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>1. CHOOSE A SERVICE</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto mb-5 pr-1">
              {dialServices.map((s) => {
                const active = service?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => selectService(s)}
                    className="flex items-center gap-2 p-2.5 text-left transition-all"
                    style={{ background: active ? "rgba(209,255,38,0.1)" : "rgba(5,7,10,0.6)", border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}` }}
                  >
                    <span className="text-base">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="font-heading font-medium text-[11px] truncate" style={{ color: active ? "#D1FF26" : "#F5F5F7" }}>{s.name}</p>
                      <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{s.dial}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dial display */}
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>2. DIAL THE CODE</p>
            <div className="text-center py-4 mb-3" style={{ background: "rgba(5,7,10,0.7)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <p className="font-mono text-3xl tracking-[0.2em] min-h-[2.4rem]" style={{ color: dialed ? "#D1FF26" : "rgba(138,143,152,0.3)", textShadow: dialed ? "0 0 12px rgba(209,255,38,0.4)" : "none" }}>
                {dialed || "······"}
              </p>
              {service && phase === "idle" && (
                <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>
                  TARGET: {(service.dial || service.id)}
                </p>
              )}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {KEYPAD.map(({ k, sub }) => {
                const active = service && phase === "idle" && dialed.includes(k);
                const canPress = !!service && phase === "idle";
                return (
                  <button
                    key={k}
                    disabled={!canPress}
                    onClick={() => pressKey(k)}
                    className="flex flex-col items-center justify-center py-3 font-mono transition-all disabled:opacity-40"
                    style={{ background: active ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${active ? "rgba(209,255,38,0.35)" : "rgba(138,143,152,0.12)"}`, color: active ? "#D1FF26" : "#8A8F98" }}
                  >
                    <span className="text-lg leading-none">{k}</span>
                    {sub && <span className="text-[7px] tracking-widest mt-0.5">{sub}</span>}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {service && phase === "idle" && dialed.length < (service.dial || service.id).length && (
                <button onClick={autoDial} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  <Phone size={14} /> Auto-Dial {(service.dial || service.id)}
                </button>
              )}
              {service && phase === "idle" && dialed.length >= (service.dial || service.id).length && (
                <button onClick={connect} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                  <PhoneCall size={14} /> Connect Call
                </button>
              )}
              {phase !== "idle" && (
                <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.25)", color: "#8A8F98" }}>
                  <RotateCcw size={13} /> Hang Up
                </button>
              )}
              {!service && (
                <p className="flex-1 text-center py-3 font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>↑ PICK A SERVICE TO BEGIN</p>
              )}
            </div>
          </motion.div>

          {/* RIGHT: call transcript / voice */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="p-5 flex flex-col" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            {/* Status line */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Signal size={12} style={{ color: phase === "connected" ? "#D1FF26" : "#8A8F98" }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: phase === "connected" ? "#D1FF26" : "#8A8F98" }}>
                  {phase === "idle" ? "● READY" : phase === "connecting" ? "● CONNECTING…" : "● CALL CONNECTED"}
                </span>
              </div>
              {speaking && <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>🔊 SPEAKING…</span>}
            </div>

            {/* Transcript */}
            <div className="flex-1 space-y-3 min-h-[200px] mb-4">
              <AnimatePresence>
                {phase === "connecting" && (
                  <motion.div key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-16">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute rounded-full" style={{ width: 56, height: 56, background: "rgba(209,255,38,0.1)", animation: "emergencyPulse 1.8s ease-out infinite" }} />
                      <PhoneCall size={24} style={{ color: "#D1FF26" }} />
                    </div>
                  </motion.div>
                )}
                {phase === "connected" && service && (
                  <>
                    <motion.div key="greet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                        <span className="text-sm">{service.icon}</span>
                      </div>
                      <div className="flex-1 p-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                        <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>SYSTEM VOICE</p>
                        <p className="text-sm leading-relaxed" style={{ color: "#F5F5F7" }}>{greetingText}</p>
                        <button onClick={() => speak(greetingText)} className="flex items-center gap-1.5 mt-2 font-mono text-[8px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
                          <Volume2 size={10} /> Replay
                        </button>
                      </div>
                    </motion.div>

                    {lastCmd && (
                      <motion.div key="cmd" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 flex-row-reverse">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(138,143,152,0.12)", border: "0.5px solid rgba(138,143,152,0.25)" }}>
                          <Mic size={13} style={{ color: "#8A8F98" }} />
                        </div>
                        <div className="flex-1 p-3" style={{ background: "rgba(138,143,152,0.06)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
                          <p className="font-mono text-[8px] tracking-widest mb-1.5 text-right" style={{ color: "#8A8F98" }}>YOU SAID</p>
                          <p className="text-sm leading-relaxed" style={{ color: "#F5F5F7" }}>"{lastCmd}"</p>
                        </div>
                      </motion.div>
                    )}

                    {response && (
                      <motion.div key="resp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                          <Check size={13} style={{ color: "#D1FF26" }} />
                        </div>
                        <div className="flex-1 p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                          <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>{service.name.toUpperCase()} · RESPONSE</p>
                          <p className="text-sm leading-relaxed" style={{ color: "#F5F5F7" }}>{response}</p>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>
              {phase === "idle" && (
                <div className="text-center py-16">
                  <Phone size={28} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.25)" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>DIAL A CODE TO START THE SIMULATION</p>
                </div>
              )}
            </div>

            {/* Voice command input — only once connected */}
            {phase === "connected" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>3. SPEAK A COMMAND</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {commands.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => sendCommand(cmd)}
                      className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] transition-all hover:bg-[rgba(209,255,38,0.08)]"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    >
                      <Mic size={10} style={{ color: "#D1FF26" }} /> "{cmd}"
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCmd}
                    onChange={(e) => setCustomCmd(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendCommand(customCmd); }}
                    placeholder="…or type your own command"
                    className="flex-1 px-3 py-2.5 text-sm outline-none"
                    style={{ background: "rgba(5,7,10,0.7)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                  <button
                    onClick={() => sendCommand(customCmd)}
                    disabled={!customCmd.trim()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)] disabled:opacity-40"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    <Send size={12} /> Say
                  </button>
                </div>
              </motion.div>
            )}

            {/* Voice-call GPS fix — captured automatically when the call connects */}
            {phase === "connected" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <VoiceGpsPanel autoCapture compact title="CALL GPS FIX" />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}