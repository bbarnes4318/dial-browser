import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Heart, Users, Loader2, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

// Curated wellness & community services — each is reached by calling the
// primary 1 Call Away voice number and speaking naturally (no dial codes).
const WELLNESS_SERVICES = [
  {
    icon: "🩺",
    name: "Dial Medical",
    desc: "AI telehealth Q&A — describe a symptom and get general wellness guidance and self-care notes.",
    say: "Talk to medical",
    route: "/medical",
  },
  {
    icon: "🩺",
    name: "Find Nearby Doctors",
    desc: "Locate nearby doctors and clinics by voice and get their contact info to book directly.",
    say: "Find a doctor near me",
  },
  {
    icon: "💊",
    name: "Pharmacy Locator",
    desc: "Find nearby pharmacies with their location and hours.",
    say: "Find a pharmacy nearby",
  },
  {
    icon: "🚑",
    name: "Emergency Contacts Broadcast",
    desc: "Instantly alert your saved emergency contacts with your location. For a real emergency, call 911 directly.",
    say: "Alert my emergency contacts",
  },
];

const COMMUNITY_SERVICES = [
  {
    icon: "🌐",
    name: "Community Hub",
    desc: "Connection, support, and shared resources across the 1 Call Away community.",
    say: "Open community",
    route: "/community",
  },
  {
    icon: "🖼️",
    name: "Community Gallery",
    desc: "Browse member profiles, voice posts, and community highlights.",
    say: "Open community gallery",
    route: "/community-gallery",
  },
  {
    icon: "💬",
    name: "Dial Social",
    desc: "A voice-first social network — post, follow, and message by speaking.",
    say: "Open Dial Social",
    route: "/social",
  },
  {
    icon: "📍",
    name: "Local Directory",
    desc: "Find any local business or service — plumbers, electricians, salons, and more.",
    say: "Find a plumber",
  },
  {
    icon: "🔔",
    name: "Category Alerts",
    desc: "Subscribe to SMS alerts when new providers join a service category you care about.",
    say: "Set up category alerts",
    route: "/category-alerts",
  },
];

export default function ServicesIndex() {
  const [voiceNumber, setVoiceNumber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    base44.functions
      .invoke("get-dial-in-info", {})
      .then((res) => {
        const num = res?.data?.voiceNumber || res?.voiceNumber || "";
        if (active) setVoiceNumber(num);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const formatted = voiceNumber
    ? voiceNumber.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, "$1 $2-$3-$4")
    : "";

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      {/* Top signal line */}
      <div className="h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <p className="font-mono text-xs tracking-[0.4em] mb-3" style={{ color: "#D1FF26" }}>// SERVICES INDEX</p>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Wellness & Community Services
          </h1>
          <p className="text-sm font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Every service below is reached the same way — by calling our primary voice number and speaking naturally. No apps, no menus, no dial codes. Just call and ask for what you need.
          </p>
        </motion.div>

        {/* Phone number callout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left"
          style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 40px rgba(209,255,38,0.06)" }}
        >
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
            <Phone size={22} style={{ color: "#D1FF26" }} />
          </div>
          <div className="flex-1">
            <p className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "#8A8F98" }}>Call our primary number</p>
            {loading ? (
              <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
            ) : formatted ? (
              <a href={`tel:${voiceNumber}`} className="font-mono text-2xl sm:text-3xl font-bold tracking-wide hover:underline" style={{ color: "#D1FF26" }}>
                {formatted}
              </a>
            ) : (
              <p className="font-mono text-lg" style={{ color: "#8A8F98" }}>Number unavailable</p>
            )}
          </div>
        </motion.div>

        {/* Wellness services */}
        <ServiceGroup title="Wellness" icon={Heart} services={WELLNESS_SERVICES} voiceNumber={voiceNumber} />

        {/* Community services */}
        <ServiceGroup title="Community" icon={Users} services={COMMUNITY_SERVICES} voiceNumber={voiceNumber} />

        {/* Footer note */}
        <p className="mt-12 text-center font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
          FOR A REAL EMERGENCY, CALL 911 DIRECTLY · 1 CALL AWAY IS NOT A SUBSTITUTE FOR EMERGENCY SERVICES
        </p>
      </div>
    </div>
  );
}

function ServiceGroup({ title, icon: Icon, services, voiceNumber }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: "#D1FF26" }}>{title}</p>
        <div className="flex-1 h-px" style={{ background: "rgba(209,255,38,0.12)" }} />
      </div>
      <div className="grid gap-3">
        {services.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="p-4 flex items-start gap-4"
            style={{ background: "rgba(10,13,20,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}
          >
            <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-semibold text-base" style={{ color: "#F5F5F7" }}>{s.name}</h3>
                {s.route && (
                  <Link to={s.route} className="inline-flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase hover:underline" style={{ color: "#D1FF26" }}>
                    Open <ArrowRight size={10} />
                  </Link>
                )}
              </div>
              <p className="text-sm mb-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{s.desc}</p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <Phone size={11} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>
                  Call{voiceNumber ? ` ${voiceNumber}` : ""} and say{" "}
                  <span style={{ color: "#D1FF26" }}>"{s.say}"</span>
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}