import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Mic, Share2, MessageSquare, ArrowRight } from "lucide-react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialGallery from "@/components/landing/SocialGallery";

const SOCIAL_SYNAPSE_IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/2b55f6bd0_Gemini_Generated_Image_y8r8zgy8r8zgy8r8.jpg";

const STEPS = [
  { icon: UserPlus, title: "Create Your Profile", desc: "Set your handle, avatar, and a voice greeting. Your holographic profile wall is live instantly." },
  { icon: Mic, title: "Post by Voice", desc: "Record a voice note or type a post. Every voice post is auto-transcribed so anyone can read or listen." },
  { icon: MessageSquare, title: "Follow & Comment", desc: "Follow members to build your feed. Reply with text or your own voice note on any post." },
  { icon: Share2, title: "Share & Connect", desc: "Share posts globally and discover new members through the voice-search feed." },
];

export default function SocialSynapseGateway() {
  return (
    <section id="social-synapse" className="relative px-4 py-16" style={{ background: "#05070A" }}>
      {/* Holographic top border */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #00FFFF, transparent)", animation: "tickerScroll 5s linear infinite" }} />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Badge */}
        <div className="text-center mb-8">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase mb-2" style={{ color: "#00FFFF" }}>
            // SOCIAL SYNAPSE — ACTIVE 12.5M USERS
          </p>
          <h2 className="font-heading font-black text-3xl sm:text-5xl mb-3" style={{ color: "#F5F5F7", textShadow: "0 0 30px rgba(0,255,255,0.25)" }}>
            DIAL <span style={{ color: "#CC00FF" }}>SOCIAL</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#8A8F98" }}>
            A holographic, voice-first social network built into the Dial Browser. Create your profile, post by voice, and connect globally — no WiFi required.
          </p>
        </div>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex justify-center mb-12"
        >
          <div className="relative" style={{ filter: "drop-shadow(0 0 50px rgba(204,0,255,0.25))" }}>
            <img
              src={proxyMediaUrl(SOCIAL_SYNAPSE_IMG)}
              alt="Dial Browser Social Synapse — holographic social network gateway"
              style={{ width: "100%", maxWidth: "1000px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </motion.div>

        <SocialGallery />

        {/* Step-by-step instructions */}
        <div className="mb-12">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-center mb-6" style={{ color: "#00FFFF" }}>
            // HOW TO USE DIAL SOCIAL
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-5"
                style={{
                  background: "rgba(10,13,20,0.6)",
                  border: "0.5px solid rgba(0,255,255,0.2)",
                  boxShadow: "0 0 24px rgba(0,255,255,0.05)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "rgba(0,255,255,0.08)", border: "0.5px solid rgba(0,255,255,0.3)" }}>
                    <step.icon size={18} style={{ color: "#00FFFF" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold" style={{ color: "#CC00FF" }}>STEP {i + 1}</span>
                      <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{step.title}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Social button link */}
        <div className="text-center">
          <Link to="/social">
            <button
              className="group inline-flex items-center gap-3 px-10 py-4 font-mono text-sm tracking-widest uppercase font-bold transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,255,255,0.4)]"
              style={{
                background: "linear-gradient(135deg, #00FFFF 0%, #CC00FF 100%)",
                color: "#05070A",
                borderRadius: "2px",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-[#05070A] group-hover:animate-pulse" />
              Enter Dial Social
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <p className="font-mono text-[10px] tracking-widest uppercase mt-4" style={{ color: "#8A8F98" }}>
            CALL. CONNECT. BROWSE — NOW SOCIAL.
          </p>
        </div>
      </div>
    </section>
  );
}