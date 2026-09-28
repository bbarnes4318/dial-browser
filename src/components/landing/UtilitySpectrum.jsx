import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FeatureTooltip from "@/components/landing/FeatureTooltip";

const services = [
  { id: "01", label: "Local Services", icon: "📍", desc: "Find restaurants and local services near you. Just say what you need — no app downloads required.", dial: "Dial *101# or say 'Find a restaurant near me'", value: "Reach nearby businesses with zero data or app — perfect for low-connectivity areas." },
  { id: "05", label: "Music", icon: "🎵", desc: "Discover music, podcasts, and audio content streamed to your call.", dial: "Dial *105# or say 'Play trending music'", value: "Stream audio entertainment directly through your call — no streaming app needed." },
  { id: "07", label: "Creators", icon: "🎤", desc: "Access exclusive creator content, fan clubs, and live experiences.", dial: "Dial *107# or say 'Connect me to creators'", value: "Support and connect with creators through voice — fan access without social media." },
  { id: "08", label: "AI Assistants", icon: "🤖", desc: "Talk to AI-powered assistants for research, writing, and problem-solving.", dial: "Dial *108# or say 'Talk to AI'", value: "Get AI-powered help for any task — research, writing, answers — by just calling." },
];

export default function UtilitySpectrum() {
  const [expanded, setExpanded] = useState(null);

  return (
    <section className="snap-section relative flex flex-col justify-center py-20 lg:py-0 overflow-hidden" style={{ background: '#05070A' }}>
      <div className="relative z-10 px-6 lg:px-16">
        <div className="mb-12 lg:mb-16">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // UTILITY SPECTRUM
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight" style={{ color: '#F5F5F7' }}>
            What You Can Dial
          </h2>
        </div>

        {/* Service blocks grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
          {services.map((service) => (
            <FeatureTooltip key={service.id} value={service.value}>
            <motion.div
              layout
              onClick={() => setExpanded(expanded === service.id ? null : service.id)}
              className="cursor-pointer group"
            >
              <div
                className="relative p-5 lg:p-6 transition-all duration-500"
                style={{
                  background: expanded === service.id ? '#10141D' : 'rgba(16, 20, 29, 0.5)',
                  border: `0.5px solid ${expanded === service.id ? '#D1FF26' : 'rgba(209,255,38,0.08)'}`,
                }}
              >
                <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: '#D1FF26' }}>
                  {service.id}
                </p>
                <p className="text-2xl mb-2">{service.icon}</p>
                <p className="font-heading font-bold text-sm tracking-wide" style={{ color: '#F5F5F7' }}>
                  {service.label}
                </p>

                <AnimatePresence>
                  {expanded === service.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4" style={{ borderTop: '0.5px solid rgba(209,255,38,0.15)' }}>
                        <p className="text-sm leading-relaxed mb-3" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
                          {service.desc}
                        </p>
                        <div className="font-mono text-[10px] tracking-wider px-3 py-2" style={{ background: 'rgba(209,255,38,0.06)', color: '#D1FF26' }}>
                          {service.dial}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            </FeatureTooltip>
          ))}
        </div>
      </div>
    </section>
  );
}