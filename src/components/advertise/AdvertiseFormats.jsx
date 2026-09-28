import React from "react";
import { motion } from "framer-motion";
import { Mic, MessageSquare, Radio, Heart, Share2, Headphones } from "lucide-react";

const LIME = "#A4FF00";
const PURPLE = "#BC00FF";

const FORMATS_IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/4f831b3ef_generated_image.png";
const ANALYTICS_IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/e9e4e5458_generated_image.png";

const FORMATS = [
  { id: "voice_ads", Icon: Mic, label: "Voice Ads", desc: "Spoken ad spots read by AI or your brand voice inside voice sessions — reach callers on any phone, no app needed.", color: LIME },
  { id: "sms_broadcast", Icon: MessageSquare, label: "SMS Broadcast", desc: "Opt-in text blasts to targeted contact groups with click-through tracking and compliance built in.", color: PURPLE },
  { id: "radio_spot", Icon: Radio, label: "Radio Spots", desc: "Sponsored inserts across 23+ live radio stations, voiced by our AI DJs between tracks.", color: LIME },
  { id: "dating_sponsor", Icon: Heart, label: "Dating Sponsor", desc: "Sponsored match intros and profile badges across the 1 Call Dating portal.", color: PURPLE },
  { id: "social_feed", Icon: Share2, label: "Social Feed", desc: "Promoted posts and voice-note ads in the Dial Social feed with engagement metrics.", color: LIME },
  { id: "audiobook_pre_roll", Icon: Headphones, label: "Audiobook Pre-Roll", desc: "30-second audio pre-rolls before featured audiobooks in the Dial library.", color: PURPLE },
];

export default function AdvertiseFormats() {
  return (
    <section className="relative py-14 lg:py-20" style={{ background: "#05070A" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(164,255,0,0.06) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(188,0,255,0.06) 0%, transparent 55%)" }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-10">
          <p className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: LIME }}>// AD INVENTORY</p>
          <h2 className="font-heading font-black text-2xl sm:text-4xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Six channels. <span style={{ color: PURPLE }}>One call away.</span>
          </h2>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Reach audiences across voice, text, radio, social, and audio — including the billions with no smartphone, no data plan, and no app store.
          </p>
        </div>

        {/* Showcase images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="relative overflow-hidden" style={{ border: `0.5px solid ${LIME}40` }}>
            <img src={FORMATS_IMG} alt="Dial Browser voice ad interface" className="w-full h-auto block" style={{ maxHeight: "300px", objectFit: "cover" }} />
            <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(0deg, rgba(5,7,10,0.92), transparent)" }}>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: LIME }}>VOICE-FIRST AD INTERFACE</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="relative overflow-hidden" style={{ border: `0.5px solid ${PURPLE}40` }}>
            <img src={ANALYTICS_IMG} alt="Dial Browser campaign analytics dashboard" className="w-full h-auto block" style={{ maxHeight: "300px", objectFit: "cover" }} />
            <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(0deg, rgba(5,7,10,0.92), transparent)" }}>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: PURPLE }}>REAL-TIME CAMPAIGN ANALYTICS</p>
            </div>
          </motion.div>
        </div>

        {/* Format cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FORMATS.map((f, i) => {
            const Icon = f.Icon;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="p-4 transition-all duration-200 hover:translate-y-[-2px]"
                style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${f.color}30` }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-9 h-9 flex items-center justify-center" style={{ background: `${f.color}18`, border: `0.5px solid ${f.color}40` }}>
                    <Icon size={16} style={{ color: f.color }} />
                  </div>
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{f.label}</p>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "#8A8F98" }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}