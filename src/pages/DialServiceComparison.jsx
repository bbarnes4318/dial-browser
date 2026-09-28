import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Radio, Trophy, Film, Users, Home, Check, X, ChevronRight, ArrowLeft, Zap, Crown, Sparkles } from "lucide-react";

const NETWORKS = [
  {
    id: "radio",
    name: "Radio Phone Network",
    icon: Radio,
    desc: "50+ live radio stations across every genre, streaming 24/7 to any phone.",
    free: {
      features: ["1 preview station (rotating)", "30-second listen limit per call", "Standard audio quality"],
      limitations: ["No station selection", "No presets", "No song requests", "No artist submissions"],
    },
    premium: {
      features: [
        "All 50+ live radio stations",
        "Unlimited listening — no time caps",
        "HD audio quality",
        "Genre channels — Hip-Hop, Jazz, Afrobeats, Rock, Country, Electronic",
        "Live DJ sets & talk shows",
        "Song request via voice command",
        "Station favorites & quick-tune presets",
        "Artist submission portal for indie creators",
      ],
    },
    standalonePrice: "$4.99/mo",
    minTier: "Plus",
  },
  {
    id: "media",
    name: "1 Call Media",
    icon: Film,
    desc: "Movies and TV streamed to any device via SMS link — no app download required.",
    free: {
      features: ["Browse catalog titles", "Trailer previews (30 sec)"],
      limitations: ["No full streaming", "No downloads", "No recommendations", "No watchlist"],
    },
    premium: {
      features: [
        "Browse movies, TV shows, and exclusive content",
        "Stream on any device — link delivered via SMS",
        "Audio-only mode for low-data listening",
        "Watch offline with download-to-device support",
        "Family-safe content filters included",
        "Personalized recommendations by voice",
        "Watchlist with SMS delivery notifications",
      ],
    },
    standalonePrice: "$12.99/mo",
    minTier: "Elite",
  },
  {
    id: "collab",
    name: "Let's Collab",
    icon: Users,
    desc: "Connect with creators, post projects, and find talent across creative industries.",
    free: {
      features: ["Browse project board (read-only)", "View talent profiles"],
      limitations: ["No posting", "No messaging", "No portfolio sharing", "No verified badge"],
    },
    premium: {
      features: [
        "Post project opportunities — film, music, tech, design",
        "Browse talent profiles across creative industries",
        "Direct messaging with collaborators",
        "Category-filtered talent search",
        "Portfolio sharing via voice or SMS",
        "Community project board with upvotes",
        "Verified creator badges",
      ],
    },
    standalonePrice: "$7.99/mo",
    minTier: "Ultimate",
  },
];

export default function DialServiceComparison() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { threshold: 0.05 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between" style={{ background: "rgba(5,7,10,0.9)", borderBottom: "0.5px solid rgba(209,255,38,0.15)", backdropFilter: "blur(12px)" }}>
        <Link to="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
          <ArrowLeft size={12} /> Home
        </Link>
        <p className="font-heading font-black text-lg hidden sm:block" style={{ color: "#F5F5F7" }}>
          1 CALL <span style={{ color: "#D1FF26" }}>COMPARE</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>FREE vs PREMIUM</span>
        </div>
      </header>

      <div ref={sectionRef} className="px-4 lg:px-8 py-8 max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={12} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DIAL BROWSER SERVICE COMPARISON</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Free vs <span style={{ color: "#D1FF26" }}>Premium.</span>
          </h1>
          <p className="text-sm lg:text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            See exactly what you get for free versus what premium unlocks across Radio, Media, and Collaboration networks. Every network is available standalone or bundled in a subscription tier.
          </p>
        </motion.div>

        {/* Quick tier legend */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { name: "Free", price: "$0", icon: Radio, color: "#8A8F98" },
            { name: "Plus", price: "$14.99", icon: Zap, color: "#D1FF26" },
            { name: "Elite", price: "$49.99", icon: Trophy, color: "#D1FF26" },
            { name: "Ultimate", price: "$99", icon: Crown, color: "#D1FF26" },
          ].map((tier, i) => {
            const Icon = tier.icon;
            return (
              <div key={tier.name} className="p-4 flex items-center gap-3" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${i > 0 ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.12)"}` }}>
                <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: i > 0 ? "rgba(209,255,38,0.1)" : "rgba(138,143,152,0.08)", border: `0.5px solid ${i > 0 ? "rgba(209,255,38,0.25)" : "rgba(138,143,152,0.12)"}` }}>
                  <Icon size={14} style={{ color: tier.color }} />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{tier.name}</p>
                  <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{tier.price}/mo</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Network comparison cards */}
        <div className="space-y-6">
          {NETWORKS.map((net, idx) => {
            const Icon = net.icon;
            return (
              <motion.div
                key={net.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + idx * 0.08 }}
              >
                {/* Network header */}
                <div className="flex items-center gap-3 mb-3 p-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    <Icon size={20} style={{ color: "#D1FF26" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-heading font-black text-lg sm:text-xl" style={{ color: "#D1FF26" }}>{net.name}</h2>
                    <p className="text-xs" style={{ color: "#8A8F98" }}>{net.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>STANDALONE</p>
                    <p className="font-heading font-black text-sm" style={{ color: "#F5F5F7" }}>{net.standalonePrice}</p>
                  </div>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Free column */}
                  <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 font-mono text-[8px] tracking-widest" style={{ background: "rgba(138,143,152,0.1)", color: "#8A8F98" }}>FREE</span>
                      <p className="font-heading font-bold text-sm" style={{ color: "#8A8F98" }}>Included for everyone</p>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {net.free.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#8A8F98" }} />
                          <span className="text-[11px]" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {net.free.limitations.length > 0 && (
                      <div className="pt-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                        <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "rgba(138,143,152,0.6)" }}>NOT INCLUDED</p>
                        <ul className="space-y-1.5">
                          {net.free.limitations.map((l, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <X size={11} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(138,143,152,0.3)" }} />
                              <span className="text-[11px]" style={{ color: "rgba(138,143,152,0.5)", lineHeight: 1.4 }}>{l}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Premium column */}
                  <div className="p-5 relative" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 20px rgba(209,255,38,0.06)" }}>
                    <div className="absolute top-0 right-0 px-2 py-1 font-mono text-[7px] tracking-widest" style={{ background: "#D1FF26", color: "#05070A" }}>PREMIUM</div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 font-mono text-[8px] tracking-widest" style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26" }}>{net.minTier.toUpperCase()}+</span>
                      <p className="font-heading font-bold text-sm" style={{ color: "#D1FF26" }}>Unlocked with premium</p>
                    </div>
                    <ul className="space-y-2">
                      {net.premium.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                          <span className="text-[11px] font-semibold" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }} className="mt-8 p-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div>
            <p className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>Ready to unlock everything?</p>
            <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>7-day free trial · Cancel anytime · Bundle all 3 networks and save 40%</p>
          </div>
          <Link to="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            <ChevronRight size={12} /> View Plans
          </Link>
        </motion.div>
      </div>
    </div>
  );
}