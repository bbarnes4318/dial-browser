import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Phone, Loader2, Volume2, Shield, Lock, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import TeleMedicalVoiceFlow from "@/components/landing/TeleMedicalVoiceFlow";
import { playVoiceLocalized } from "@/lib/voiceSynthesis";

const TELEMEDICAL_BANNER_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/e4e9e2967_Gemini_Generated_Image_p84nkgp84nkgp84n1.jpg";

// Pre-generated natural human-voice audio — generated once, reused on every click (no per-click charge).
const DISCLAIMER_AUDIO_URL =
  "https://media.base44.com/files/public/6a422320311efd575ae6536c/84a8a29c3_speech.mp3";

const DISCLAIMER_TEXT =
  "This TeleMedical Health Station provides general health information only. It is not a medical device, it does not diagnose conditions, and it does not prescribe treatment. It is not a substitute for professional medical advice, diagnosis, or treatment from a licensed clinician. In a medical emergency, call your local emergency number immediately. By continuing, you acknowledge that this tool is informational only.";

export default function OneCallMedicalCenter() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const playDisclaimer = () => {
    setSpeaking(true);
    playVoiceLocalized(DISCLAIMER_AUDIO_URL, DISCLAIMER_TEXT, {
      onEnd: () => { setSpeaking(false); setAudioPlayed(true); },
      onError: () => { setSpeaking(false); setAudioPlayed(true); },
    });
  };

  return (
    <section id="medical" className="snap-section relative overflow-hidden py-20 px-6 lg:px-16" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06), transparent 70%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Activity size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// TELEMEDICAL HEALTH STATION™</span>
          </div>
          <h2 className="font-heading font-black text-4xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            TeleMedical Health Station<br /><span style={{ color: "#D1FF26" }}>General health information, 1 call away</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#8A8F98" }}>
            An informational symptom-awareness tool that suggests topics to raise with a licensed clinician. It does not diagnose, treat, or replace professional medical care.
          </p>
        </motion.div>

        {/* Banner image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="w-full overflow-hidden mb-10"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <img
            src={TELEMEDICAL_BANNER_URL}
            alt="TeleMedical Health Station — Global Medical Intelligence & Telemedicine Hub"
            className="block w-full h-auto"
            draggable={false}
            style={{ userSelect: "none" }}
          />
        </motion.div>

        {/* Emergency banner — honest */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 mb-10 mx-auto w-fit"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)" }}
        >
          <Phone size={14} style={{ color: "#EF4444" }} />
          <span className="font-mono text-xs" style={{ color: "#EF4444" }}>IN A MEDICAL EMERGENCY: CALL YOUR LOCAL EMERGENCY NUMBER</span>
        </motion.div>

        {/* Audio-confirmed disclaimer gate */}
        {!acknowledged ? (
          <div className="max-w-3xl mx-auto p-6 mb-12" style={{ background: "rgba(16,20,29,0.9)", border: "0.5px solid rgba(239,68,68,0.4)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={14} style={{ color: "#EF4444" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#EF4444" }}>// DISCLAIMER — REVIEW BEFORE ACCESS</p>
            </div>
            <p className="text-sm mb-5" style={{ color: "#F5F5F7", lineHeight: 1.6 }}>{DISCLAIMER_TEXT}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={playDisclaimer}
                className="flex items-center justify-center gap-2 px-4 py-3 font-mono text-[11px] tracking-widest transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              >
                {speaking ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                {speaking ? "PLAYING..." : "PLAY DISCLAIMER AUDIO"}
              </button>
              <button
                onClick={() => setAcknowledged(true)}
                disabled={!audioPlayed}
                className="flex items-center justify-center gap-2 px-4 py-3 font-mono text-[11px] tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                <Shield size={14} /> I UNDERSTAND & ACCEPT
              </button>
            </div>
            <p className="font-mono text-[9px] mt-3" style={{ color: "rgba(138,143,152,0.6)" }}>
              {audioPlayed ? "// CONFIRM ABOVE TO CONTINUE" : "// LISTEN TO THE DISCLAIMER TO ENABLE ACCESS"}
            </p>
          </div>
        ) : (
          <TeleMedicalVoiceFlow />
        )}

        <div className="text-center mt-8">
          <Link to="/status" className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <ClipboardList size={13} /> CHECK REQUEST STATUS
          </Link>
        </div>
      </div>
    </section>
  );
}