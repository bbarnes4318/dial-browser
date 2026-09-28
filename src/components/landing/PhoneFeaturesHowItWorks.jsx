import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Smartphone, PhoneForwarded, History, Users, Send, Headphones,
  ArrowRight, Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    num: "01",
    icon: Smartphone,
    label: "Dial Phone",
    title: "Your own phone line, in the browser",
    desc: "Paid members get a personal Dial number. Place and receive calls from the in-app softphone — or any phone — with a live keypad, mute, and call controls.",
    how: "Open Dial Phone, go online, and dial.",
    route: "/phone",
    color: "#D1FF26",
  },
  {
    num: "02",
    icon: PhoneForwarded,
    label: "Call Forwarding",
    title: "Route incoming calls where you want",
    desc: "Toggle call forwarding to send inbound calls to a secondary number. Your routing status — on or off, and where calls are going — is visible right on the dashboard.",
    how: "Switch on Call Forwarding, enter a number.",
    route: "/dashboard",
    color: "#42E1F6",
  },
  {
    num: "03",
    icon: History,
    label: "Call History & Playback",
    title: "Replay recorded calls instantly",
    desc: "Every call is logged with direction, duration, and status. Recorded calls show a play button so you can listen back right from the call history list.",
    how: "Open Call History, tap the play button.",
    route: "/call-history",
    color: "#a855f7",
  },
  {
    num: "04",
    icon: Users,
    label: "Group Calls",
    title: "Ring a whole group at once",
    desc: "Bundle contacts into a group and dial everyone into a live conference bridge. Real-time signal-quality bars and an “all participants joined” confirmation tell you exactly when the room is ready.",
    how: "Open Groups, then start a Group Call.",
    route: "/groups",
    color: "#34D399",
  },
  {
    num: "05",
    icon: Send,
    label: "Broadcast SMS",
    title: "One message, many recipients",
    desc: "Send a single text to an entire group or contact selection at once, with per-recipient delivery tracking so you see who got it and who didn't.",
    how: "Open Groups or Address Book, choose Broadcast.",
    route: "/groups",
    color: "#fb923c",
  },
  {
    num: "06",
    icon: Headphones,
    label: "Audiobooks",
    title: "Listen, resume, and share",
    desc: "Browse a growing library across every genre, stream human narration, resume where you left off, and share any title by link — X, Facebook, WhatsApp, SMS, or copy.",
    how: "Open Audiobooks, pick a title, press play.",
    route: "/audiobooks",
    color: "#f472b6",
  },
];

export default function PhoneFeaturesHowItWorks() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(66,225,246,0.4), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
        <div className="absolute top-2/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 6s ease-in-out infinite 1s" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-12 lg:mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Sparkles size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// NEW FEATURES</span>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Dial Phone & <span style={{ color: "#D1FF26" }}>Media</span>.
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Beyond dialing in for services — members now have a full phone line, group calling, broadcasts, and an audiobook library. Here's how each new feature works.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.num}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.06 }}
                className="group relative flex flex-col p-5 lg:p-6 transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.08)]"
                style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${f.color}22` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}12`, border: `0.5px solid ${f.color}50` }}>
                    <Icon size={18} style={{ color: f.color }} />
                  </div>
                  <div>
                    <p className="font-mono text-[8px] tracking-widest" style={{ color: f.color }}>{f.num} · {f.label.toUpperCase()}</p>
                  </div>
                </div>
                <h3 className="font-heading font-bold text-base mb-2" style={{ color: "#F5F5F7" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "#8A8F98" }}>{f.desc}</p>
                <div className="pt-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.12)" }}>
                  <p className="font-mono text-[9px] tracking-wide mb-2" style={{ color: f.color }}>▸ {f.how}</p>
                  <Link to={f.route} className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                    Try it <ArrowRight size={11} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6 }} className="mt-10 text-center">
          <Link to="/phone" className="inline-flex items-center gap-2 px-8 py-4 font-mono text-xs tracking-[0.3em] uppercase transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            Open Dial Phone <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}