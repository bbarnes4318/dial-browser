import React, { useMemo } from "react";
import { motion } from "framer-motion";

// Simplified world map data points (continents)
function generateWorldDots() {
  const dots = [];
  // Simplified continent shapes as dot clusters
  const regions = [
    // Africa (highlighted - low connectivity)
    { cx: 52, cy: 55, rx: 6, ry: 12, count: 60, pulse: true },
    // South Asia (highlighted)
    { cx: 72, cy: 45, rx: 5, ry: 6, count: 35, pulse: true },
    // Southeast Asia (highlighted)
    { cx: 80, cy: 52, rx: 4, ry: 5, count: 25, pulse: true },
    // South America (highlighted)
    { cx: 30, cy: 65, rx: 5, ry: 10, count: 35, pulse: true },
    // North America
    { cx: 22, cy: 35, rx: 10, ry: 8, count: 45, pulse: false },
    // Europe
    { cx: 52, cy: 32, rx: 6, ry: 5, count: 35, pulse: false },
    // East Asia
    { cx: 82, cy: 38, rx: 6, ry: 5, count: 30, pulse: false },
    // Oceania
    { cx: 85, cy: 70, rx: 5, ry: 3, count: 12, pulse: false },
  ];

  regions.forEach((region) => {
    for (let i = 0; i < region.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      const x = region.cx + Math.cos(angle) * r * region.rx;
      const y = region.cy + Math.sin(angle) * r * region.ry;
      dots.push({ x, y, pulse: region.pulse, delay: Math.random() * 3 });
    }
  });
  return dots;
}

export default function GlobalBridge({ globalImage }) {
  const dots = useMemo(() => generateWorldDots(), []);

  return (
    <section className="snap-section relative flex items-center overflow-hidden" style={{ background: '#05070A' }}>
      {/* Background image */}
      <div className="absolute inset-0 opacity-10">
        <img src={globalImage} alt="Abstract dial mechanism with signal lines" className="w-full h-full object-cover" />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-16 py-20 lg:py-0">
        <div className="mb-12">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // GLOBAL BRIDGE
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight" style={{ color: '#F5F5F7' }}>
            Why It Matters
          </h2>
        </div>

        {/* World map in dots */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          className="relative w-full aspect-[2/1] max-w-4xl mx-auto mb-12"
        >
          <svg viewBox="0 0 100 80" className="w-full h-full">
            {dots.map((dot, i) => (
              <circle
                key={i}
                cx={dot.x}
                cy={dot.y}
                r={dot.pulse ? 1.2 : 0.8}
                fill={dot.pulse ? '#D1FF26' : '#8A8F98'}
                opacity={dot.pulse ? 0.8 : 0.3}
                style={dot.pulse ? {
                  animation: `dotPulse 2.5s ease-in-out infinite`,
                  animationDelay: `${dot.delay}s`,
                } : {}}
              />
            ))}
          </svg>
          <div className="absolute bottom-0 right-0 font-mono text-[10px] tracking-wider" style={{ color: '#D1FF26' }}>
            ● ACTIVATING &nbsp;&nbsp; ○ CONNECTED
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            In regions with limited internet access or high data costs, voice and SMS remain the most reliable
            communication tools. 1 CALL AWAY™ expands access to digital services using infrastructure that already exists — 
            reaching the next five billion users.
          </p>
        </div>
      </div>
    </section>
  );
}