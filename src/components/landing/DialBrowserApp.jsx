import React, { useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Apple, Play, Download, Phone, QrCode, Check } from "lucide-react";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

export default function DialBrowserApp() {
  const [phoneSent, setPhoneSent] = useState(false);
  const [phone, setPhone] = useState("");

  const handleSendLink = (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setPhoneSent(true);
    setTimeout(() => setPhoneSent(false), 3000);
  };

  return (
    <section id="download-app" className="snap-section relative py-20 lg:py-28 overflow-hidden" style={{ background: "#05070A" }}>
      {/* Background signal lines */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.4), transparent)", animation: "signalPulse 4s ease-in-out infinite" }} />
        <div className="absolute top-3/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 6s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <Smartphone size={12} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// DOWNLOAD THE DIAL BROWSER™</span>
            </div>
            <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-5" style={{ color: "#F5F5F7" }}>
              The Internet, <span style={{ color: "#D1FF26" }}>In Your Pocket.</span>
            </h2>
            <p className="text-lg font-light mb-8" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              Carry the entire 1 Call Away network wherever you go. Voice search, dial codes, live streams, reminders, and emergency access — all from one app. No internet? No problem. Every feature works through a simple phone call.
            </p>

            {/* Feature list */}
            <div className="space-y-3 mb-8">
              {[
                "Voice-to-action: speak a request, get connected",
                "Offline dial codes for every service",
                "SMS reminders & alerts without a data plan",
                "Emergency SOS button with one-tap broadcast",
              ].map((feat, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-5 h-5 flex-shrink-0" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    <Check size={11} style={{ color: "#D1FF26" }} />
                  </div>
                  <span className="text-sm" style={{ color: "#F5F5F7" }}>{feat}</span>
                </motion.div>
              ))}
            </div>

            {/* Download buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={openRegistrationModal} className="flex items-center gap-3 px-6 py-3.5 transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.25)]" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.2)" }}>
                <Apple size={22} style={{ color: "#F5F5F7" }} />
                <div className="text-left">
                  <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>DOWNLOAD ON THE</p>
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>App Store</p>
                </div>
              </button>
              <button onClick={openRegistrationModal} className="flex items-center gap-3 px-6 py-3.5 transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.25)]" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.2)" }}>
                <Play size={18} style={{ color: "#F5F5F7" }} />
                <div className="text-left">
                  <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>GET IT ON</p>
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>Google Play</p>
                </div>
              </button>
            </div>

            {/* Text me a link */}
            <form onSubmit={handleSendLink} className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Text me a download link"
                  type="tel"
                  className="w-full pl-9 pr-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>
              <button type="submit" disabled={!phone.trim() || phoneSent} className="px-4 py-2.5 font-mono text-[9px] tracking-widest font-bold transition-all disabled:opacity-50" style={{ background: phoneSent ? "rgba(209,255,38,0.15)" : "#D1FF26", color: phoneSent ? "#D1FF26" : "#05070A", border: "0.5px solid rgba(209,255,38,0.4)" }}>
                {phoneSent ? <Check size={13} /> : <Download size={13} />}
              </button>
            </form>
            {phoneSent && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[9px] tracking-widest mt-2" style={{ color: "#D1FF26" }}>
                ✓ LINK SENT TO {phone}
              </motion.p>
            )}
          </motion.div>

          {/* Right: Phone mockup */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="flex justify-center">
            <div className="relative" style={{ width: "280px" }}>
              {/* Phone frame */}
              <div className="relative rounded-[2.5rem] p-3" style={{ background: "linear-gradient(145deg, #1a1f2e, #0a0d14)", border: "1px solid rgba(209,255,38,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(209,255,38,0.08)" }}>
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-2xl z-10" style={{ background: "#05070A" }} />

                {/* Screen */}
                <div className="rounded-[2rem] overflow-hidden" style={{ background: "#05070A", height: "520px" }}>
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>1CALL</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-2.5 rounded-sm" style={{ background: "#D1FF26" }} />
                      <div className="w-1 h-3 rounded-sm" style={{ background: "#D1FF26" }} />
                      <div className="w-1 h-3.5 rounded-sm" style={{ background: "#D1FF26" }} />
                      <div className="w-1 h-4 rounded-sm" style={{ background: "rgba(209,255,38,0.3)" }} />
                    </div>
                  </div>

                  {/* App content */}
                  <div className="px-4 pt-2">
                    {/* Dial pad preview */}
                    <div className="text-center mb-4">
                      <p className="font-mono text-[7px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>DIAL BROWSER™</p>
                      <div className="font-heading font-black text-3xl tracking-tight" style={{ color: "#D1FF26" }}>#1CALL</div>
                      <div className="flex justify-center gap-0.5 mt-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-0.5 rounded-full" style={{ background: "#D1FF26", height: "10px", animation: `eqBar 0.8s ease-in-out ${i * 0.12}s infinite` }} />
                        ))}
                      </div>
                    </div>

                    {/* Quick access grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {["🏥", "💊", "🦷", "🏠", "🛒", "🌦️"].map((emoji, i) => (
                        <div key={i} className="aspect-square flex items-center justify-center rounded-lg" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                          <span className="text-lg">{emoji}</span>
                        </div>
                      ))}
                    </div>

                    {/* SOS button */}
                    <div className="flex justify-center mt-3">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(239,68,68,0.3)" }} />
                        <button className="relative w-14 h-14 rounded-full flex items-center justify-center font-heading font-black text-xs" style={{ background: "#ef4444", color: "#fff", boxShadow: "0 0 20px rgba(239,68,68,0.4)" }}>
                          SOS
                        </button>
                      </div>
                    </div>

                    {/* Bottom nav preview */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-around items-center py-2 rounded-lg" style={{ background: "rgba(16,20,29,0.9)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: "#D1FF26" }} />
                      <div className="w-2 h-2 rounded-full" style={{ background: "rgba(138,143,152,0.3)" }} />
                      <div className="w-2 h-2 rounded-full" style={{ background: "rgba(138,143,152,0.3)" }} />
                      <div className="w-2 h-2 rounded-full" style={{ background: "rgba(138,143,152,0.3)" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating QR code badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="absolute -bottom-4 -left-4 flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "rgba(16,20,29,0.95)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              >
                <QrCode size={28} style={{ color: "#D1FF26" }} />
                <div>
                  <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>SCAN TO</p>
                  <p className="font-heading font-bold text-xs" style={{ color: "#F5F5F7" }}>Download</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}