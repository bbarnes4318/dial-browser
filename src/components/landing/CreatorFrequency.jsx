import React from "react";
import { motion } from "framer-motion";
import LiveStreamSection from "@/components/landing/LiveStreamSection";
import ShowSharesSection from "@/components/landing/ShowSharesSection";

export default function CreatorFrequency({ creatorImage }) {
  return (
    <section className="snap-section relative flex items-center overflow-hidden" style={{ background: '#05070A' }}>
      <div className="relative z-10 w-full px-6 lg:px-16 py-20 lg:py-0">
        <div className="mb-12">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // CREATOR FREQUENCY
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight" style={{ color: '#F5F5F7' }}>
            Broadcast Your Signal
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Creators — Active Signal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative p-8 lg:p-12"
            style={{
              background: 'rgba(209, 255, 38, 0.04)',
              borderTop: '2px solid #D1FF26',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#D1FF26' }} />
              <p className="font-mono text-xs tracking-[0.3em]" style={{ color: '#D1FF26' }}>
                SIGNAL: ACTIVE
              </p>
            </div>
            <h3 className="font-heading font-black text-2xl lg:text-4xl mb-6" style={{ color: '#F5F5F7' }}>
              For Creators
            </h3>
            <p className="text-base mb-8" style={{ color: '#8A8F98', lineHeight: '1.6', fontSize: '18px' }}>
              Creators can monetize content through subscriptions, ads, SMS engagement, music distribution,
              sponsorships, merchandise, and AI-powered fan experiences.
            </p>
            <div className="space-y-3">
              {["Subscriptions & Membership", "SMS Engagement", "Music Distribution", "AI Fan Experiences", "Merchandise Sales", "Sponsorships"].map((item, i) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] w-6" style={{ color: '#D1FF26' }}>0{i + 1}</span>
                  <span className="text-sm font-medium" style={{ color: '#F5F5F7' }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded overflow-hidden opacity-50">
              <img
                src={creatorImage}
                alt="Futuristic signal hardware with glass prisms and fiber optics"
                className="w-full h-36 object-cover"
              />
            </div>
          </motion.div>

          {/* Businesses — System Architecture */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative p-8 lg:p-12"
            style={{
              background: 'rgba(16, 20, 29, 0.8)',
              borderTop: '2px solid rgba(138, 143, 152, 0.3)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full" style={{ background: '#8A8F98', border: '1px solid #F5F5F7' }} />
              <p className="font-mono text-xs tracking-[0.3em]" style={{ color: '#8A8F98' }}>
                SYSTEM: ENTERPRISE
              </p>
            </div>
            <h3 className="font-heading font-black text-2xl lg:text-4xl mb-6" style={{ color: '#F5F5F7' }}>
              For Businesses
            </h3>
            <p className="text-base mb-8" style={{ color: '#8A8F98', lineHeight: '1.6', fontSize: '18px' }}>
              Businesses can reach users through intent-based voice and SMS advertising when customers actively
              search for services like food, travel, housing, or transportation.
            </p>
            {/* System architecture wireframe aesthetic */}
            <div className="space-y-2">
              {[
                { label: "Intent-Based Ads", value: "VOICE + SMS" },
                { label: "Customer Reach", value: "5B+ DEVICES" },
                { label: "Data Cost", value: "ZERO" },
                { label: "App Required", value: "NONE" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.15)' }}>
                  <span className="font-mono text-xs" style={{ color: '#8A8F98' }}>{item.label}</span>
                  <span className="font-mono text-xs font-semibold" style={{ color: '#F5F5F7' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 1 Call Live Stream — paid feature demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-6"
        >
          <LiveStreamSection />
        </motion.div>

        {/* 1 Call Equity — sell show shares */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-6"
        >
          <ShowSharesSection />
        </motion.div>
      </div>
    </section>
  );
}