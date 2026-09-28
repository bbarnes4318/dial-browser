import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Phone } from "lucide-react";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

const rows = [
  { feature: "Requires internet / Wi-Fi", dial: false, apps: true },
  { feature: "Requires app download", dial: false, apps: true },
  { feature: "Works on basic & flip phones", dial: true, apps: false },
  { feature: "Works on landlines", dial: true, apps: false },
  { feature: "No storage space needed", dial: true, apps: false },
  { feature: "No operating system updates", dial: true, apps: false },
  { feature: "Accessible in rural / low-connectivity areas", dial: true, apps: false },
  { feature: "Voice & SMS interface", dial: true, apps: "Limited" },
  { feature: "Single number for all services", dial: true, apps: false },
  { feature: "No account creation per service", dial: true, apps: false },
  { feature: "Instant access — no loading screens", dial: true, apps: "Varies" },
  { feature: "Works while traveling internationally", dial: true, apps: "Wi-Fi only" },
  { feature: "Battery efficient", dial: true, apps: false },
  { feature: "Inclusive for low-literacy users", dial: true, apps: "Varies" },
  { feature: "Rich visual interface", dial: "Voice/SMS", apps: true },
];

function Cell({ value }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <span className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'rgba(209,255,38,0.12)' }}>
          <Check size={16} style={{ color: '#D1FF26' }} />
        </span>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <span className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'rgba(138,143,152,0.08)' }}>
          <X size={16} style={{ color: '#8A8F98' }} />
        </span>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <span className="font-mono text-[10px] tracking-wider px-2 py-1" style={{ background: 'rgba(138,143,152,0.08)', color: '#8A8F98' }}>
        {value}
      </span>
    </div>
  );
}

export default function ComparisonTable() {
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
      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 lg:mb-14"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // HEAD TO HEAD
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Dial Browser vs Apps
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Why make people download, update, and connect when one call does it all?
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="overflow-x-auto"
        >
          <div className="min-w-[640px]">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-6 p-4">
                <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                  FEATURE
                </p>
              </div>
              <div className="col-span-3 p-4 text-center" style={{ background: 'rgba(209,255,38,0.06)', border: '0.5px solid rgba(209,255,38,0.2)' }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Phone size={14} style={{ color: '#D1FF26' }} />
                  <span className="font-heading font-bold text-sm" style={{ color: '#D1FF26' }}>
                    Dial Browser™
                  </span>
                </div>
                <p className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
                  1 CALL AWAY
                </p>
              </div>
              <div className="col-span-3 p-4 text-center" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <span className="font-heading font-bold text-sm" style={{ color: '#8A8F98' }}>
                  Mobile Apps
                </span>
                <p className="font-mono text-[9px] tracking-widest mt-1" style={{ color: '#8A8F98' }}>
                  STANDARD
                </p>
              </div>
            </div>

            {/* Data rows */}
            {rows.map((row, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.04 }}
                className="grid grid-cols-12 gap-2 mb-px"
                style={{ background: idx % 2 === 0 ? 'rgba(16,20,29,0.3)' : 'transparent' }}
              >
                <div className="col-span-6 p-4 flex items-center gap-3">
                  <span className="font-mono text-[10px]" style={{ color: '#D1FF26' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm" style={{ color: '#F5F5F7' }}>
                    {row.feature}
                  </span>
                </div>
                <div className="col-span-3 p-4 flex items-center justify-center" style={{ background: 'rgba(209,255,38,0.03)' }}>
                  <Cell value={row.dial} />
                </div>
                <div className="col-span-3 p-4 flex items-center justify-center">
                  <Cell value={row.apps} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5"
          style={{ background: 'rgba(209,255,38,0.04)', border: '0.5px solid rgba(209,255,38,0.15)' }}
        >
          <p className="text-sm" style={{ color: '#F5F5F7' }}>
            <span className="font-bold" style={{ color: '#D1FF26' }}>1 number.</span>{" "}
            <span style={{ color: '#8A8F98' }}>Zero downloads. Universal access.</span>
          </p>
          <button
            onClick={() => openRegistrationModal()}
            className="font-mono text-xs tracking-widest uppercase px-5 py-2.5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(209,255,38,0.2)]"
            style={{ background: '#D1FF26', color: '#05070A' }}
          >
            Registration
          </button>
        </motion.div>
      </div>
    </section>
  );
}