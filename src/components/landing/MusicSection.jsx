import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileBarChart, Headphones, Users } from "lucide-react";
import ArtistOnboarding from "@/components/landing/ArtistOnboarding";
import { proxyMediaUrl } from "@/lib/mediaProxy";

const GLOBAL_STREAM_IMG = proxyMediaUrl(
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/0e38c3180_Gemini_Generated_Image_s2nba9s2nba9s2nb1.jpg"
);

const STUDIO_IMG = proxyMediaUrl(
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/49878cdb3_c88c656f-0599-4e15-a511-11f8b8213493.png"
);

export default function MusicSection() {
  return (
    <section className="snap-section relative flex items-center overflow-hidden" style={{ background: '#05070A' }}>
      {/* Large dial motif background */}
      <div className="absolute -right-64 top-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
           style={{ border: '0.5px solid rgba(209,255,38,0.05)' }}>
        <div className="absolute inset-12 rounded-full" style={{ border: '0.5px solid rgba(209,255,38,0.03)' }} />
        <div className="absolute inset-24 rounded-full" style={{ border: '0.5px solid rgba(209,255,38,0.02)' }} />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-16 py-20 lg:py-0 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // 1 CALL ARTIST™
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-8" style={{ color: '#F5F5F7' }}>
            Music &<br />
            <span style={{ color: '#D1FF26' }}>Creator Economy</span>
          </h2>
          <p className="text-lg mb-8 max-w-2xl" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            1 CALL ARTIST™ allows musicians to distribute music, build memberships,
            and engage audiences through voice and SMS — reaching fans who have never downloaded a streaming app.
          </p>

          {/* Studio visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <img
              src={STUDIO_IMG}
              alt="1 Call Artist studio — synthwave production room"
              style={{ width: "100%", maxWidth: 520, height: "auto", display: "block", borderRadius: "2px", border: "0.5px solid rgba(209,255,38,0.2)" }}
            />
          </motion.div>

          {/* Verified distribution promise */}
          <div className="grid sm:grid-cols-2 gap-3 mb-10 max-w-2xl">
            {[
              { icon: Users, title: "Millions of Real Listeners", desc: "Distribute your music to a verified audience of millions across the network." },
              { icon: ShieldCheck, title: "Zero Bots, Zero Fake Plays", desc: "Every listener is verified and confirmed — no inflated numbers, ever." },
              { icon: FileBarChart, title: "Weekly Listener Reports", desc: "Complete, transparent reports delivered to you every week." },
              { icon: Headphones, title: "24/7 Customer Support", desc: "Round-the-clock human support whenever you need it." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                  viewport={{ once: true }}
                  className="flex gap-3 p-4"
                  style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(209,255,38,0.1)' }}
                >
                  <div
                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(209,255,38,0.1)', border: '0.5px solid rgba(209,255,38,0.2)' }}
                  >
                    <Icon size={16} style={{ color: '#D1FF26' }} />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm mb-1" style={{ color: '#F5F5F7' }}>{item.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#8A8F98' }}>{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Frequency tuner aesthetic */}
          <div className="p-6 lg:p-8" style={{ background: 'rgba(16,20,29,0.8)', border: '0.5px solid rgba(209,255,38,0.1)' }}>
            <p className="font-mono text-[10px] tracking-[0.3em] mb-6" style={{ color: '#D1FF26' }}>
              FREQUENCY TUNER — ARTIST MONETIZATION
            </p>
            <div className="space-y-4">
              {[
                { label: "Music Streams (Voice)", percent: 85 },
                { label: "Membership SMS", percent: 72 },
                { label: "Sponsorship Revenue", percent: 64 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-xs" style={{ color: '#F5F5F7' }}>{item.label}</span>
                    <span className="font-mono text-xs" style={{ color: '#D1FF26' }}>{item.percent}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(209,255,38,0.1)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.percent}%` }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      viewport={{ once: true }}
                      className="h-full rounded-full"
                      style={{ background: '#D1FF26' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Global Stream promotional image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-10 flex justify-center"
        >
          <img
            src={GLOBAL_STREAM_IMG}
            alt="Dial Browser Global Stream — live biometric broadcast"
            style={{ width: "min(100%, 420px)", height: "auto", display: "block", borderRadius: "2px" }}
          />
        </motion.div>

        {/* Artist onboarding form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <ArtistOnboarding />
        </motion.div>
      </div>
    </section>
  );
}