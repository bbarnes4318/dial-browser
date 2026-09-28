import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2, Play, Pause, Cloud, Search, Stethoscope,
  ShoppingCart, CreditCard, Siren, ChevronRight, Mic,
} from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const COMMANDS = [
  {
    id: "weather",
    icon: Cloud,
    label: "Check Weather",
    say: '"What\'s the weather today?"',
    example: "Or: \"Weather in Miami\"",
    desc: "Get instant forecasts for your location or any city.",
    dial: "*200#",
  },
  {
    id: "search",
    icon: Search,
    label: "Search the Web",
    say: '"Search for nearest gas station"',
    example: "Or: \"Who won the game last night?\"",
    desc: "Ask anything and hear the answer read aloud.",
    dial: "*110#",
  },
  {
    id: "medical",
    icon: Stethoscope,
    label: "Get Medical Help",
    say: '"I need a doctor"',
    example: "Or: \"Connect me to medical\"",
    desc: "AI triage assesses symptoms and connects you to a provider.",
    dial: "*300#",
  },
  {
    id: "grocery",
    icon: ShoppingCart,
    label: "Order Groceries",
    say: '"Add milk, bread, and eggs to my list"',
    example: "Or: \"I need bananas and coffee\"",
    desc: "Build your cart by voice and arrange delivery.",
    dial: "*400#",
  },
  {
    id: "bills",
    icon: CreditCard,
    label: "Pay a Bill",
    say: '"Pay my electric bill"',
    example: "Or: \"How much is my water bill?\"",
    desc: "Check balances and make payments securely by voice.",
    dial: "*600#",
  },
  {
    id: "sos",
    icon: Siren,
    label: "Emergency SOS",
    say: '"I need help" or "SOS"',
    example: "We alert your emergency contacts immediately.",
    desc: "Immediate assistance when you need it most.",
    dial: "*911#",
  },
];

export default function VoiceCommandGuide() {
  const [activeId, setActiveId] = useState(COMMANDS[0].id);
  const [playing, setPlaying] = useState(false);

  const active = COMMANDS.find((c) => c.id === activeId);
  const ActiveIcon = active.icon;

  const stopAudio = useCallback(() => {
    stopSpeaking();
  }, []);

  const playCommand = useCallback((cmdId) => {
    stopSpeaking();
    const cmd = COMMANDS.find((c) => c.id === cmdId);
    if (!cmd) return;
    const phrase = cmd.say.replace(/^["\u201c\u201d]|["\u201c\u201d]$/g, "");
    speak(phrase, { onEnd: () => setPlaying(false), onError: () => setPlaying(false) });
    setPlaying(true);
  }, []);

  const togglePlay = () => {
    if (playing) {
      stopAudio();
      setPlaying(false);
    } else {
      playCommand(activeId);
    }
  };

  const selectCommand = (cmdId) => {
    stopAudio();
    setPlaying(false);
    setActiveId(cmdId);
  };

  return (
    <section className="relative py-16 lg:py-20 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <Mic size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>
              // VOICE COMMAND GUIDE
            </p>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Just <span style={{ color: "#D1FF26" }}>Speak.</span> We Listen.
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Learn the basic voice commands that unlock every service. Tap any command below and
            hear it spoken in our natural human voice.
          </p>
        </div>

        {/* Interactive Guide */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-4">
          {/* Command List */}
          <div className="space-y-1.5">
            {COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              const isActive = cmd.id === activeId;
              return (
                <button
                  key={cmd.id}
                  onClick={() => selectCommand(cmd.id)}
                  className="w-full flex items-center gap-3 p-3 transition-all"
                  style={{
                    background: isActive ? "rgba(209,255,38,0.10)" : "rgba(16,20,29,0.4)",
                    border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                  }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 flex-shrink-0"
                    style={{
                      background: isActive ? "rgba(209,255,38,0.15)" : "rgba(5,7,10,0.4)",
                    }}
                  >
                    <Icon size={16} style={{ color: isActive ? "#D1FF26" : "#8A8F98" }} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p
                      className="font-mono text-[9px] tracking-widest"
                      style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}
                    >
                      {cmd.label.toUpperCase()}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: "#8A8F98" }}>
                      {cmd.dial}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{ color: isActive ? "#D1FF26" : "rgba(138,143,152,0.3)" }}
                  />
                </button>
              );
            })}
          </div>

          {/* Active Command Detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6 lg:p-8 flex flex-col justify-between min-h-[300px]"
              style={{
                background: "rgba(16,20,29,0.6)",
                border: "0.5px solid rgba(209,255,38,0.2)",
              }}
            >
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="flex items-center justify-center w-12 h-12"
                    style={{ background: "rgba(209,255,38,0.1)" }}
                  >
                    <ActiveIcon size={22} style={{ color: "#D1FF26" }} />
                  </div>
                  <div>
                    <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                      DIAL {active.dial}
                    </p>
                    <h3 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>
                      {active.label}
                    </h3>
                  </div>
                </div>

                {/* The command to say */}
                <div
                  className="p-4 mb-3"
                  style={{
                    background: "rgba(209,255,38,0.06)",
                    border: "0.5px solid rgba(209,255,38,0.2)",
                  }}
                >
                  <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#D1FF26" }}>
                    SAY THIS
                  </p>
                  <p className="text-base font-semibold" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>
                    {active.say}
                  </p>
                </div>

                {/* Example */}
                <div
                  className="p-3 mb-3"
                  style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}
                >
                  <p className="text-xs" style={{ color: "#8A8F98" }}>
                    {active.example}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                  {active.desc}
                </p>
              </div>

              {/* Play button */}
              <button
                onClick={togglePlay}
                className="w-full flex items-center justify-center gap-2 py-3 mt-6 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{
                  background: playing ? "rgba(209,255,38,0.08)" : "#D1FF26",
                  color: playing ? "#D1FF26" : "#05070A",
                  border: playing ? "0.5px solid rgba(209,255,38,0.4)" : "none",
                }}
              >
                {playing ? (
                  <>
                    <Pause size={14} /> Pause Voice
                  </>
                ) : (
                  <>
                    <Volume2 size={14} /> Hear It Spoken
                  </>
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <div className="text-center mt-6">
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
            TIP: YOU CAN ALSO DIAL ANY CODE DIRECTLY ON YOUR PHONE KEYPAD
          </p>
        </div>
      </div>
    </section>
  );
}