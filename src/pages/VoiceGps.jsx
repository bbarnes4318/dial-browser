import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Satellite, ShieldAlert, Smartphone } from "lucide-react";
import VoiceGpsPanel from "@/components/voice/VoiceGpsPanel";

export default function VoiceGps() {
  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Satellite size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE CALL GPS</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Pin your <span style={{ color: "#D1FF26" }}>location</span> to every call.
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Using the HTML5 Geolocation API, Dial Browser captures your device's GPS coordinates on demand and plots them on the map below. The same fix powers the Dial Simulator and your Emergency SOS signal.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <VoiceGpsPanel autoCapture title="LIVE GPS FIX" />
        </motion.div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <Link to="/simulator" className="flex items-center gap-3 p-4 transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.1)]" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <Smartphone size={16} style={{ color: "#D1FF26" }} />
            <div>
              <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>Try it in the Dial Simulator</p>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>GPS captured when the call connects</p>
            </div>
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 p-4 transition-all hover:shadow-[0_0_16px_rgba(239,68,68,0.12)]" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
            <ShieldAlert size={16} style={{ color: "#ef4444" }} />
            <div>
              <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>Emergency SOS</p>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>Location sent with your distress signal</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}