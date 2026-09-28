import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Globe, Zap, Check, Minus } from "lucide-react";

const zones = [
  {
    id: "local",
    name: "Local Zone",
    icon: Phone,
    tagline: "Same country / region",
    ratePerMin: "$0.02",
    ratePerSMS: "$0.005",
    color: '#D1FF26',
    accent: 'rgba(209,255,38,0.15)',
    border: 'rgba(209,255,38,0.3)',
    featured: true,
    features: [
      { label: "Voice per minute", value: "$0.02" },
      { label: "SMS per message", value: "$0.005" },
      { label: "Connection fee", value: "Free" },
      { label: "Avg. latency", value: "< 200ms" },
      { label: "Concurrent calls", value: "Unlimited" },
    ],
  },
  {
    id: "regional",
    name: "Regional Zone",
    icon: Zap,
    tagline: "Neighboring countries",
    ratePerMin: "$0.05",
    ratePerSMS: "$0.012",
    color: '#8A8F98',
    accent: 'rgba(138,143,152,0.08)',
    border: 'rgba(138,143,152,0.2)',
    featured: false,
    features: [
      { label: "Voice per minute", value: "$0.05" },
      { label: "SMS per message", value: "$0.012" },
      { label: "Connection fee", value: "Free" },
      { label: "Avg. latency", value: "< 400ms" },
      { label: "Concurrent calls", value: "Unlimited" },
    ],
  },
  {
    id: "international",
    name: "International Zone",
    icon: Globe,
    tagline: "Global long-distance",
    ratePerMin: "$0.09",
    ratePerSMS: "$0.020",
    color: '#5A8FE0',
    accent: 'rgba(90,143,224,0.1)',
    border: 'rgba(90,143,224,0.3)',
    featured: false,
    features: [
      { label: "Voice per minute", value: "$0.09" },
      { label: "SMS per message", value: "$0.020" },
      { label: "Connection fee", value: "Free" },
      { label: "Avg. latency", value: "< 800ms" },
      { label: "Concurrent calls", value: "Unlimited" },
    ],
  },
];

const comparisonRows = [
  { label: "Voice — per minute", local: "$0.02", regional: "$0.05", international: "$0.09", highlight: true },
  { label: "SMS — per message", local: "$0.005", regional: "$0.012", international: "$0.020" },
  { label: "Connection fee", local: "Free", regional: "Free", international: "Free" },
  { label: "Avg. latency", local: "< 200ms", regional: "< 400ms", international: "< 800ms" },
  { label: "Concurrent calls", local: "Unlimited", regional: "Unlimited", international: "Unlimited" },
  { label: "Data routing", local: "Direct", regional: "Direct", international: "Optimized relay" },
  { label: "Offline fallback", local: true, regional: true, international: true },
  { label: "Voice AI processing", local: true, regional: true, international: true },
  { label: "Priority routing", local: true, regional: false, international: false },
  { label: "Bulk discount", local: true, regional: true, international: false },
];

function CellValue({ value, highlight }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check size={16} style={{ color: '#D1FF26' }} />
      : <Minus size={16} style={{ color: 'rgba(138,143,152,0.4)' }} />;
  }
  return (
    <span
      className={highlight ? "font-heading font-black text-lg" : "font-mono text-sm"}
      style={{ color: highlight ? '#D1FF26' : '#F5F5F7' }}
    >
      {value}
    </span>
  );
}

export default function RateComparison() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // CONNECTION RATE CARD
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Local vs International Rates
          </h2>
          <p className="text-base font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Transparent, pay-as-you-go pricing across three connectivity zones. No contracts, no hidden fees — just signal.
          </p>
        </motion.div>

        {/* Zone cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {zones.map((zone, i) => {
            const Icon = zone.icon;
            return (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className="relative p-6"
                style={{
                  background: zone.accent,
                  border: `0.5px solid ${zone.border}`,
                  boxShadow: zone.featured ? '0 0 30px rgba(209,255,38,0.08)' : 'none',
                }}
              >
                {zone.featured && (
                  <div
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 font-mono text-[8px] tracking-widest"
                    style={{ background: '#D1FF26', color: '#05070A' }}
                  >
                    BEST VALUE
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ background: zone.featured ? 'rgba(209,255,38,0.15)' : 'rgba(138,143,152,0.05)', border: `0.5px solid ${zone.border}` }}
                  >
                    <Icon size={18} style={{ color: zone.color }} />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-base" style={{ color: zone.color }}>{zone.name}</p>
                    <p className="font-mono text-[9px] tracking-wider" style={{ color: '#8A8F98' }}>{zone.tagline.toUpperCase()}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="font-heading font-black text-3xl" style={{ color: '#F5F5F7' }}>
                    {zone.ratePerMin}
                    <span className="font-mono text-xs font-normal ml-1" style={{ color: '#8A8F98' }}>/min</span>
                  </p>
                  <p className="font-mono text-xs mt-1" style={{ color: '#8A8F98' }}>
                    {zone.ratePerSMS} per SMS
                  </p>
                </div>
                <div className="space-y-2 pt-3" style={{ borderTop: `0.5px solid ${zone.border}` }}>
                  {zone.features.map((f) => (
                    <div key={f.label} className="flex justify-between items-center">
                      <span className="font-mono text-[10px] tracking-wider" style={{ color: '#8A8F98' }}>{f.label.toUpperCase()}</span>
                      <span className="font-mono text-xs" style={{ color: '#F5F5F7' }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detailed comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="overflow-x-auto"
        >
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid rgba(209,255,38,0.2)' }}>
                <th className="text-left py-4 px-4 font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                  FEATURE
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Phone size={14} style={{ color: '#D1FF26' }} />
                    <span className="font-heading font-bold text-sm" style={{ color: '#D1FF26' }}>Local</span>
                  </div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Zap size={14} style={{ color: '#8A8F98' }} />
                    <span className="font-heading font-bold text-sm" style={{ color: '#8A8F98' }}>Regional</span>
                  </div>
                </th>
                <th className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Globe size={14} style={{ color: '#5A8FE0' }} />
                    <span className="font-heading font-bold text-sm" style={{ color: '#5A8FE0' }}>International</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr
                  key={row.label}
                  style={{
                    borderBottom: '0.5px solid rgba(138,143,152,0.08)',
                    background: row.highlight ? 'rgba(209,255,38,0.03)' : 'transparent',
                  }}
                >
                  <td className="py-4 px-4 font-mono text-xs tracking-wider" style={{ color: '#8A8F98' }}>
                    {row.label.toUpperCase()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CellValue value={row.local} highlight={row.highlight} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CellValue value={row.regional} highlight={row.highlight} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CellValue value={row.international} highlight={row.highlight} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center"
        >
          <p className="font-mono text-[10px] tracking-wider" style={{ color: '#8A8F98' }}>
            ▸ RATES IN USD · PAY-AS-YOU-GO · NO CONTRACTS · BULK DISCOUNTS AVAILABLE
          </p>
        </motion.div>
      </div>
    </section>
  );
}