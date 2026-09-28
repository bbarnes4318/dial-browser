import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, BarChart3, ShoppingCart, Radio, Target, MessageSquare, Mail, ArrowRight, Globe } from "lucide-react";

const HERO_IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/1b69277e0_ChatGPTImageSep23202601_15_42AM.png";

const FEATURES = [
  { icon: Phone, title: "Direct Phone", desc: "Call → Hear → Discover → Rate → Share" },
  { icon: BarChart3, title: "Analytics", desc: "Full campaign performance reports" },
  { icon: ShoppingCart, title: "Direct Sales", desc: "Tickets & merchandise links" },
  { icon: Radio, title: "Live & Virtual", desc: "Stream performances to fans" },
  { icon: Target, title: "Target Audience", desc: "Reach the right listeners" },
  { icon: MessageSquare, title: "SMS & YouTube", desc: "Multi-channel promotion" },
  { icon: Mail, title: "Email Campaign", desc: "Up to 50M email contacts" },
];

const STEPS = [
  { n: "01", t: "Apply", d: "Submit your distribution application" },
  { n: "02", t: "Build Profile", d: "Create your artist profile & upload music" },
  { n: "03", t: "Target", d: "Select regions, audience & budget" },
  { n: "04", t: "Launch", d: "Distribute across every channel" },
];

export default function DialWorldDistribution() {
  return (
    <section id="dial-world-distribution" className="px-4 py-14" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DIAL WORLD DISTRIBUTION</p>
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-4xl leading-tight" style={{ color: "#F5F5F7" }}>
              Your Music. Your Audience. <span style={{ color: "#D1FF26" }}>Your World.</span>
            </h2>
            <p className="text-sm mt-3 max-w-md" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              Dial World Distribution uses Dial Browser technology to deliver music directly to listeners through phone calls, SMS, email, video, social media, and digital engagement.
            </p>
            <Link
              to="/distribution"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.25)]"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              Artist & Labels Apply Now <ArrowRight size={14} />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="relative">
            <img src={HERO_IMG} alt="Dial World Distribution — global music distribution" style={{ width: "100%", height: "auto", borderRadius: "2px", filter: "brightness(0.92)" }} />
          </motion.div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-4 text-center" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
              <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(209,255,38,0.18), rgba(0,242,255,0.12))", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <f.icon size={16} style={{ color: "#D1FF26" }} />
              </div>
              <p className="font-heading font-bold text-[11px]" style={{ color: "#F5F5F7" }}>{f.title}</p>
              <p className="text-[10px] mt-1" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="text-center mb-8">
          <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// HOW IT WORKS</p>
          <h3 className="font-heading font-black text-2xl mt-1" style={{ color: "#F5F5F7" }}>One Release. Multiple Channels. Global Audience.</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {STEPS.map((s) => (
            <div key={s.n} className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[10px] font-bold mb-2" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
                {s.n}
              </div>
              <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{s.t}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8A8F98" }}>{s.d}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center p-8" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 70%)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#8A8F98" }}>DIAL WORLD DISTRIBUTION • POWERED BY DIAL BROWSER • 50 MILLION LISTENERS</p>
          <Link to="/distribution" className="inline-flex items-center gap-2 mt-4 px-6 py-3 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            <Globe size={14} /> Apply at www.DialBrowser.com <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}