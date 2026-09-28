import React from "react";
import { motion } from "framer-motion";

const streams = [
  { id: "01", label: "Subscriptions", desc: "Premium tier access to enhanced services and priority support" },
  { id: "02", label: "Advertising", desc: "Intent-based voice and SMS ads delivered at the moment of search" },
  { id: "03", label: "Commerce", desc: "Transaction commissions on bookings, orders, and purchases" },
  { id: "04", label: "Travel", desc: "Partnership revenue from flight, hotel, and transportation bookings" },
  { id: "05", label: "Creator Monetization", desc: "Revenue share from subscriptions, tips, and fan engagement" },
  { id: "06", label: "Music Distribution", desc: "Distribution fees and streaming revenue from 1 CALL ARTIST™" },
  { id: "07", label: "AI Companions", desc: "Premium AI assistant tiers with specialized capabilities" },
  { id: "08", label: "Enterprise", desc: "White-label licensing for telecom operators and enterprises" },
];

export default function RevenueModel() {
  return (
    <section className="snap-section relative flex items-center overflow-hidden" style={{ background: '#05070A' }}>
      <div className="relative z-10 w-full px-6 lg:px-16 py-20 lg:py-0">
        <div className="mb-12">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // REVENUE ARCHITECTURE
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight" style={{ color: '#F5F5F7' }}>
            Revenue Model
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'rgba(209,255,38,0.06)' }}>
          {streams.map((stream, i) => (
            <motion.div
              key={stream.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="p-6 lg:p-8 group hover:bg-[rgba(209,255,38,0.04)] transition-colors duration-500"
              style={{ background: '#05070A' }}
            >
              <p className="font-mono text-3xl font-black mb-4 transition-colors duration-500 group-hover:text-[#D1FF26]" style={{ color: 'rgba(209,255,38,0.2)' }}>
                {stream.id}
              </p>
              <p className="font-heading font-bold text-sm tracking-wide mb-2" style={{ color: '#F5F5F7' }}>
                {stream.label}
              </p>
              <p className="font-mono text-[11px] leading-relaxed" style={{ color: '#8A8F98' }}>
                {stream.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}