import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PhoneCall, RefreshCw, X } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const TIME_LABELS = {
  asap: "as soon as possible",
  morning: "in the morning",
  afternoon: "in the afternoon",
  evening: "in the evening",
  flexible: "at a convenient time",
};

/**
 * BookingVoiceConfirmation — an automated "phone call" that reads back the
 * service summary to the user immediately after a booking is submitted.
 * Uses the platform's shared voice synthesis (natural, language-aware TTS)
 * so it speaks through the in-app phone the moment a booking is confirmed.
 */
export default function BookingVoiceConfirmation({ providerName, callerPhone, serviceNeeded, preferredTime, onClose }) {
  const [speaking, setSpeaking] = useState(false);

  const timeLabel = TIME_LABELS[preferredTime] || "at a convenient time";
  const script = `Your service booking with ${providerName} is confirmed. Service requested: ${serviceNeeded || "general service"}. ${providerName} will call you back ${timeLabel}. Thank you for using 1 Call Away.`;

  const play = () => {
    setSpeaking(true);
    speak(script, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  useEffect(() => {
    // Brief delay so the modal transition settles before the "call" connects.
    const t = setTimeout(play, 450);
    return () => { clearTimeout(t); stopSpeaking(); };
  }, []);

  return (
    <div className="p-8 text-center">
      {/* Phone "call" indicator */}
      <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(209,255,38,0.3)" }}
          animate={speaking ? { scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] } : { scale: 1, opacity: 0.25 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <div className="w-16 h-16 flex items-center justify-center rounded-full" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
          <PhoneCall size={26} style={{ color: "#D1FF26" }} />
        </div>
      </div>

      <p className="font-mono text-[9px] tracking-[0.3em] mb-2" style={{ color: "#D1FF26" }}>// AUTOMATED VOICE CONFIRMATION</p>
      <p className="font-heading font-bold text-lg mb-4" style={{ color: "#F5F5F7" }}>Booking Confirmed</p>

      {/* Equalizer */}
      <div className="flex items-end justify-center gap-1 mb-4" style={{ height: 28 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.span
            key={i}
            style={{ width: 3, background: "#D1FF26", height: 4 }}
            animate={speaking ? { height: [4, 26, 10, 20, 6] } : { height: 4 }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Transcript */}
      <p className="text-[11px] leading-relaxed mb-5 px-2" style={{ color: "#8A8F98" }}>{script}</p>

      {/* Controls */}
      <div className="flex gap-2">
        <button onClick={play} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
          <RefreshCw size={12} /> Replay
        </button>
        <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}>
          <X size={12} /> Close
        </button>
      </div>
    </div>
  );
}