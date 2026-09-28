import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A reusable tabbed container that consolidates multiple landing sections
 * into a single compact area with tappable tab navigation.
 */
export default function TabbedSection({ id, badge, title, subtitle, tabs = [], defaultTab = 0 }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id={id} className="relative py-8 lg:py-10" style={{ background: '#05070A' }}>
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-6 text-center"
        >
          {badge && (
            <p className="font-mono text-xs tracking-[0.4em] mb-3" style={{ color: '#D1FF26' }}>
              {badge}
            </p>
          )}
          {title && (
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: '#F5F5F7' }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center px-4">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="px-3 py-2 font-mono text-[10px] sm:text-[11px] tracking-widest uppercase transition-all duration-300"
              style={{
                background: activeTab === i ? '#D1FF26' : 'transparent',
                border: `0.5px solid ${activeTab === i ? '#D1FF26' : 'rgba(209,255,38,0.15)'}`,
                color: activeTab === i ? '#05070A' : '#8A8F98',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {tabs[activeTab]?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}