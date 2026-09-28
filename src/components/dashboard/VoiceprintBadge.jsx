import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, Lock, Loader2, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function VoiceprintBadge() {
  const [enrolled, setEnrolled] = useState(null); // null = loading, false = not enrolled, object = enrolled
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await base44.entities.VoiceVerification.filter({}, "-created_date", 1);
        if (mounted) {
          setEnrolled(list && list.length > 0 && list[0].enrolled ? list[0] : false);
        }
      } catch {
        if (mounted) setEnrolled(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
        <Loader2 size={11} className="animate-spin" style={{ color: "#8A8F98" }} />
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>CHECKING VOICEPRINT...</span>
      </div>
    );
  }

  // Not enrolled — show prompt to set up
  if (!enrolled) {
    return (
      <Link
        to="/dashboard"
        onClick={() => { /* navigate to security tab handled by hash */ }}
        className="inline-flex items-center gap-2 px-3 py-1.5 transition-all hover:bg-[rgba(138,143,152,0.08)]"
        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}
      >
        <Lock size={11} style={{ color: "#8A8F98" }} />
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>VOICEPRINT NOT SET</span>
      </Link>
    );
  }

  // Enrolled — show active badge
  const lastVerified = enrolled.last_verified_at
    ? new Date(enrolled.last_verified_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5"
      style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}
    >
      <motion.div
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Fingerprint size={12} style={{ color: "#D1FF26" }} />
      </motion.div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>
          VOICEPRINT ACTIVE
        </span>
        {lastVerified && (
          <span className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.6)" }}>
            · VERIFIED {lastVerified}
          </span>
        )}
      </div>
      <ShieldCheck size={11} style={{ color: "#D1FF26" }} />
    </motion.div>
  );
}