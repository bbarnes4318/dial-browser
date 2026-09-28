import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Square, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useVoiceGuided } from "@/lib/VoiceGuidedContext";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

// One service voice demo. Plays a narration in the user's selected language
// using a real, human-recorded voice. In voice-only guided mode the narration
// also reads the category for fuller context.
export default function VoiceDemoCard({ service, index = 0 }) {
  const { lang } = useLanguage();
  const { enabled: guided } = useVoiceGuided();
  const [playing, setPlaying] = useState(false);

  const script = `${service.name}. ${service.desc} To use this service, dial ${service.dial}.`;
  const guidedScript = `${service.category}. ${service.name}. ${service.desc} Dial ${service.dial} to use this service.`;

  const play = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    stopSpeaking();
    setPlaying(true);
    speak(guided ? guidedScript : script, {
      lang,
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      className="relative flex flex-col p-4 group"
      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{service.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm leading-tight truncate" style={{ color: "#F5F5F7" }}>{service.name}</p>
          <p className="font-mono text-[8px] tracking-widest uppercase mt-0.5" style={{ color: "#8A8F98" }}>{service.category} · {service.dial}</p>
        </div>
      </div>
      <p className="text-xs mb-3 flex-1" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{service.desc}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={play}
          className="flex items-center gap-2 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
          style={{
            background: playing ? "rgba(209,255,38,0.15)" : "#D1FF26",
            color: playing ? "#D1FF26" : "#05070A",
            border: playing ? "0.5px solid rgba(209,255,38,0.4)" : "none",
          }}
        >
          {playing ? <Square size={11} /> : <Play size={11} />} {playing ? "STOP" : "PLAY DEMO"}
        </button>
        <span className="flex items-center gap-1 font-mono text-[7px] tracking-widest" style={{ color: "rgba(209,255,38,0.7)" }} title="Real human-recorded voice">
          <BadgeCheck size={9} style={{ color: "#D1FF26" }} /> HUMAN VOICE
        </span>
      </div>
    </motion.div>
  );
}