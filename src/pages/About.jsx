import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Shield, WifiOff, Download, EyeOff, Heart, Target, Accessibility, PhoneCall, Users, MessageSquare, HandHeart, Volume2 } from "lucide-react";

// Public brand infographic asset uploaded by the builder.
const INFOGRAPHIC_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/165a22d07_Gemini_Generated_Image_4qvb644qvb644qvb.jpg";

const BENEFITS = [
  { icon: Globe, label: "GLOBAL ACCESS", desc: "Reach services from anywhere — no smartphone data plan required." },
  { icon: Shield, label: "SECURE DIAL-UP", desc: "Every connection is encrypted and routed through the 1 Call network." },
  { icon: WifiOff, label: "NO WIFI NEEDED", desc: "Works on any phone, dial-up or SMS — even with zero connectivity apps." },
  { icon: Download, label: "OFFLINE BROWSE", desc: "Browse the directory and saved services without an active internet session." },
  { icon: EyeOff, label: "ANONYMITY", desc: "Your phone number stays private. Connect without exposing your identity." },
];

const MISSION_PILLARS = [
  { icon: PhoneCall, label: "UNIVERSAL ACCESS", desc: "One dial code reaches any service — no app store, no smartphone, no learning curve." },
  { icon: HandHeart, label: "DIGNITY FIRST", desc: "Real human voices and plain-language guidance, never a maze of menus or jargon." },
  { icon: Shield, label: "TRUST BY DESIGN", desc: "Private by default, verified providers, and transparent delivery on every call." },
];

const ACCESSIBILITY_POINTS = [
  { icon: WifiOff, label: "WORKS WITHOUT INTERNET", desc: "Voice calls and SMS reach services even where broadband, Wi-Fi, or mobile data are unavailable." },
  { icon: PhoneCall, label: "ANY PHONE, ANYWHERE", desc: "From a basic landline to a feature phone — no smartphone, contract, or app required." },
  { icon: Volume2, label: "VOICE-FIRST BY DEFAULT", desc: "Members speak and listen; no screens, typing, or visual literacy needed to get help." },
  { icon: Users, label: "BUILT FOR THE EXCLUDED", desc: "Seniors, rural communities, low-income families, and the digitally underserved come first." },
  { icon: MessageSquare, label: "SMS FALLBACK", desc: "Booking receipts, match alerts, and emergency notices arrive by text — no app needed." },
  { icon: Heart, label: "FREE 24/7 RADIO", desc: "A royalty-paid music and talk network keeps isolated members connected and informed, at no cost." },
];

export default function About() {
  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-16 py-12 lg:py-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// ABOUT DIAL BROWSER</p>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Call. Connect. <span style={{ color: "#D1FF26" }}>Browse.</span>
          </h1>
          <p className="font-mono text-sm tracking-[0.3em] mb-3" style={{ color: "#D1FF26" }}>● NO WIFI REQUIRED ●</p>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            1 Call Away™ is a universal interface for digital services — find, book, and engage through simple voice calls and text. We bridge the digital divide so anyone, on any phone, can reach the services they need without apps, data, or Wi-Fi.
          </p>
        </motion.div>

        {/* Infographic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 p-2"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 0 40px rgba(209,255,38,0.06)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
          </div>
          <img
            src={INFOGRAPHIC_URL}
            alt="Dial Browser — Call. Connect. Browse. No Wi-Fi Required."
            className="w-full h-auto block"
            style={{ filter: "drop-shadow(0 0 24px rgba(209,255,38,0.08))" }}
          />
        </motion.div>

        {/* Benefits grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CORE BENEFITS</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                  className="p-5"
                  style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.12)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{b.label}</p>
                  </div>
                  <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{b.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Our Mission — expanded */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// OUR MISSION</p>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Reinventing how the world reaches digital services.
          </h2>
          <p className="text-base mb-4" style={{ color: "#8A8F98", lineHeight: 1.8 }}>
            Dial Browser is built on a simple conviction: the internet's most essential services — healthcare, employment, banking, groceries, government assistance, and community — should be reachable by anyone, on any phone, without an app, a data plan, or a smartphone. Today, billions of people are locked out of the digital economy by the very technologies designed to include them: downloads they can't afford, interfaces they can't see, and connections they don't have.
          </p>
          <p className="text-base mb-4" style={{ color: "#8A8F98", lineHeight: 1.8 }}>
            Our Dial Browser changes that by replacing screens and taps with the most universal interface ever built — a voice call. A member dials a single code, speaks a request in plain language, and a real human voice guides them to the service they need. No menus to navigate, no forms to fill, no software to install. Behind every call is a network of verified providers, live radio, marketplace trading, and AI-assisted support — all reachable the moment a connection is made.
          </p>
          <p className="text-base" style={{ color: "#8A8F98", lineHeight: 1.8 }}>
            We exist to make digital access a right, not a privilege. Whether a member is in a rural town with no broadband, a senior who has never used a touchscreen, or a family choosing between a data plan and groceries, Dial Browser meets them where they are — with dignity, privacy, and reliability. That is the promise we keep with every call answered.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {MISSION_PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }} className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{p.label}</p>
                  </div>
                  <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Digital Accessibility */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }} className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Accessibility size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DIGITAL ACCESSIBILITY FOR EVERYONE</p>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Bridging the digital divide, one call at a time.
          </h2>
          <p className="text-base mb-4" style={{ color: "#8A8F98", lineHeight: 1.8 }}>
            Nearly one-third of the global population remains unconnected to the internet. For them, the shift to app-based everything — telehealth, online banking, digital IDs, gig work, even booking a doctor's appointment — hasn't been progress. It's been a wall. Dial Browser is our commitment to tearing that wall down, using the one piece of technology nearly everyone already owns: a telephone.
          </p>
          <p className="text-base mb-4" style={{ color: "#8A8F98", lineHeight: 1.8 }}>
            Our phone-based platform reaches people where broadband never will. A senior with a flip phone can hear their test results explained in plain language. A rural worker without a data plan can apply for jobs by voice. A low-income family can compare grocery prices and pay a bill without ever opening a browser. Every interaction is designed around what the member can do — speak and listen — not around what they're expected to buy, install, or learn.
          </p>
          <p className="text-base mb-6" style={{ color: "#8A8F98", lineHeight: 1.8 }}>
            Accessibility isn't a feature we added. It's the foundation we built on. From voice-first navigation and real-human narration to SMS-only fallbacks and a 24/7 free radio network, every layer of Dial Browser is engineered so that being offline never means being left behind.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ACCESSIBILITY_POINTS.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div key={a.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }} className="flex items-start gap-3 p-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <Icon size={16} style={{ color: "#D1FF26" }} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>{a.label}</p>
                    <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{a.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }} className="text-center py-8" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
          <p className="font-heading font-black text-2xl sm:text-3xl tracking-tight" style={{ color: "#D1FF26" }}>
            Get Connected — Stay Connected
          </p>
          <p className="font-mono text-[9px] tracking-[0.3em] mt-2" style={{ color: "#8A8F98" }}>3D INTERACTIVE PROJECTED CONTENT</p>
        </motion.div>
      </div>
    </div>
  );
}