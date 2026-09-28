import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Tv, BookOpen, AudioLines, ArrowRight } from "lucide-react";

const MEDIA_HUBS = [
  {
    icon: Tv,
    title: "Free TV",
    desc: "Stream free live TV channels — news, sports, movies, and local broadcasts. No subscription, no login.",
    path: "/tv",
  },
  {
    icon: BookOpen,
    title: "Audiobooks",
    desc: "Thousands of free audiobooks across every genre, streamable by voice or tap.",
    path: "/audiobooks",
  },
  {
    icon: AudioLines,
    title: "Voice Library",
    desc: "A living archive of voice notes, greetings, and community recordings.",
    path: "/voice-library",
  },
];

export default function MediaSection() {
  return (
    <section className="relative py-16 lg:py-24 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Tv size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// MEDIA HUB</p>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Free TV. Books. <span style={{ color: "#D1FF26" }}>All by voice.</span>
          </h2>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Entertainment media that bridges the digital divide — stream free television, audiobooks, and community voice recordings straight from your phone.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MEDIA_HUBS.map((hub, i) => {
            const Icon = hub.icon;
            return (
              <motion.div
                key={hub.path}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  to={hub.path}
                  className="group relative block h-full p-6 overflow-hidden transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.12)]"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}
                >
                  <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                    <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 mb-4" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    <Icon size={22} style={{ color: "#D1FF26" }} />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2" style={{ color: "#F5F5F7" }}>{hub.title}</h3>
                  <p className="text-[11px] leading-relaxed mb-4" style={{ color: "#8A8F98" }}>{hub.desc}</p>
                  <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
                    Explore <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}