import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Radio, Users, ArrowRight } from "lucide-react";
import CommentSection from "@/components/community/CommentSection";
import LiveChat from "@/components/community/LiveChat";

export default function CommunityWall() {
  return (
    <section
      id="community"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden min-h-[600px]"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 6s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mb-8 lg:mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// COMMUNITY WALL — ENGAGE LIVE</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Talk Back. <span style={{ color: "#D1FF26" }}>Join In.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Comment on posts, react to podcast episodes, and chat live during streams — all in real time, right from your phone.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Comment Section Demo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// POST COMMENTS</p>
            </div>
            <div
              className="flex flex-col overflow-hidden"
              style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
            >
              <CommentSection
                contentType="user_post"
                contentId="demo-post-001"
                contentTitle="Welcome to 1 Call Away"
                authorName="Member"
              />
            </div>
          </div>

          {/* Live Chat Demo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radio size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE STREAM CHAT</p>
            </div>
            <div
              className="flex flex-col overflow-hidden"
              style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
            >
              <LiveChat
                streamId="demo-stream-001"
                streamTitle="DJ Signal — Live Broadcast"
                authorName="Member"
                isLive={true}
              />
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid sm:grid-cols-3 gap-3 mt-6"
        >
          {[
            { icon: MessageSquare, title: "Threaded Comments", desc: "Reply to any comment — host messages are highlighted with a verified badge" },
            { icon: Radio, title: "Real-Time Live Chat", desc: "Messages stream instantly during live shows — works on any phone via SMS or call" },
            { icon: Users, title: "Community Driven", desc: "Pin top comments, see who's online, and engage with hosts directly" },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="p-4" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <Icon size={16} style={{ color: "#D1FF26" }} />
                <p className="font-heading font-semibold text-sm mt-2 mb-1" style={{ color: "#F5F5F7" }}>{feat.title}</p>
                <p className="text-[10px]" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{feat.desc}</p>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex items-center justify-center gap-2"
        >
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
            COMMENTS AND LIVE CHAT SYNC ACROSS ALL DEVICES IN REAL TIME
          </span>
          <ArrowRight size={11} style={{ color: "#D1FF26" }} />
        </motion.div>
      </div>
    </section>
  );
}