import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Mic, Shield, ArrowRight, Activity, Fingerprint } from "lucide-react";

export default function StepVoiceConfirmed({ profile, onNext }) {
  const [revealedMetrics, setRevealedMetrics] = useState(0);

  const metrics = [
    { label: "FREQUENCY MATCH", value: "98.7%", icon: Activity },
    { label: "VOICE CLARITY", value: "OPTIMAL", icon: Mic },
    { label: "SIGNATURE STRENGTH", value: "STRONG", icon: Fingerprint },
    { label: "AUTH LAYER", value: "ACTIVE", icon: Shield },
  ];

  const signatureId = `VSP-${(profile.full_name || "MEMBER").slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Reveal metrics one by one for a simulation effect
  useEffect(() => {
    if (revealedMetrics >= metrics.length) return;
    const t = setTimeout(() => setRevealedMetrics((c) => c + 1), revealedMetrics === 0 ? 400 : 600);
    return () => clearTimeout(t);
  }, [revealedMetrics]);

  const allRevealed = revealedMetrics >= metrics.length;

  return (
    <div className="text-center">
      <p className="font-mono text-[10px] tracking-[0.3em] mb-2" style={{ color: "#D1FF26" }}>
        // STEP 3 — VERIFICATION CONFIRMED
      </p>

      {/* Success badge with expanding rings */}
      <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid #D1FF26" }}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid #D1FF26" }}
        />
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.7 }}
          className="w-16 h-16 flex items-center justify-center rounded-full relative z-10"
          style={{ background: "rgba(209,255,38,0.12)", border: "2px solid #D1FF26", boxShadow: "0 0 30px rgba(209,255,38,0.3)" }}
        >
          <Check size={28} style={{ color: "#D1FF26" }} />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-heading font-black text-2xl sm:text-3xl mb-2"
        style={{ color: "#F5F5F7" }}
      >
        Voice Verified <span style={{ color: "#D1FF26" }}>Successfully</span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm mb-6"
        style={{ color: "#8A8F98", lineHeight: 1.5 }}
      >
        {profile.full_name ? `${profile.full_name.split(" ")[0]}, your` : "Your"} voice signature is now live on the network.
        You'll never need a password again — just speak and you're authenticated.
      </motion.p>

      {/* Voiceprint analysis metrics */}
      <div className="space-y-2 mb-5 text-left">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          const isRevealed = i < revealedMetrics;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={isRevealed ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 p-3"
              style={{
                background: isRevealed ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.4)",
                border: `0.5px solid ${isRevealed ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.08)"}`,
              }}
            >
              <Icon size={14} style={{ color: isRevealed ? "#D1FF26" : "#3a3f48" }} />
              <span className="font-mono text-[9px] tracking-widest flex-1" style={{ color: isRevealed ? "#8A8F98" : "#3a3f48" }}>
                {m.label}
              </span>
              {isRevealed ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-xs font-bold"
                  style={{ color: "#D1FF26" }}
                >
                  {m.value}
                </motion.span>
              ) : (
                <span className="font-mono text-xs" style={{ color: "#3a3f48" }}>···</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Signature ID */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={allRevealed ? { opacity: 1 } : {}}
        className="p-4 mb-6"
        style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint size={14} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>VOICE SIGNATURE ID</span>
          </div>
          <span className="font-mono text-sm font-bold tracking-wider" style={{ color: "#D1FF26" }}>{signatureId}</span>
        </div>
      </motion.div>

      {/* Security note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={allRevealed ? { opacity: 1 } : {}}
        className="flex items-center justify-center gap-2 mb-6"
      >
        <Shield size={12} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
          ENCRYPTED · NON-SHAREABLE · PASSWORD-FREE
        </span>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={allRevealed ? { opacity: 1 } : {}}
        onClick={onNext}
        disabled={!allRevealed}
        className="w-full flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
        style={{ background: "#D1FF26", color: "#05070A" }}
      >
        Connect Your First Service <ArrowRight size={12} />
      </motion.button>
    </div>
  );
}