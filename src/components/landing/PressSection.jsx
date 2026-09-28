import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const pressItems = [
  {
    outlet: "TECHCRUNCH",
    quote: "1 CALL AWAY is doing for the telephone what the browser did for the desktop — turning a universal device into a gateway to everything.",
    author: "Disrupt",
  },
  {
    outlet: "WIRED",
    quote: "A radical reimagining of digital access. By stripping away the need for smartphones and data plans, they're reaching the 2.6 billion people the internet left behind.",
    author: "Frontiers",
  },
  {
    outlet: "THE VERGE",
    quote: "The Dial Browser might be the most important interface since the touchscreen. It makes a $15 feature phone as useful as a $1,000 flagship.",
    author: "Decoder",
  },
  {
    outlet: "REUTERS",
    quote: "In rural Kenya, farmers are checking crop prices with a phone call. 1 CALL AWAY is quietly closing the global digital divide one ring at a time.",
    author: "Technology",
  },
  {
    outlet: "FAST COMPANY",
    quote: "Innovation of the Year material. They've built a voice-first internet that runs on infrastructure that's existed for a century.",
    author: "World Changing Ideas",
  },
  {
    outlet: "BLOOMBERG",
    quote: "The economics are staggering. A platform that monetizes pennies-per-call while serving billions of unconnected users — this is the next frontier of inclusive tech.",
    author: "Technology",
  },
  {
    outlet: "MIT TECH REVIEW",
    quote: "What's remarkable isn't the technology — it's the simplicity. They've made the internet accessible through the most democratic device ever invented: the telephone.",
    author: "Innovators Under 35",
  },
  {
    outlet: "FORBES",
    quote: "1 CALL AWAY isn't just a startup — it's infrastructure for the next billion users. The kind of company that reshapes what 'online' even means.",
    author: "30 Under 30",
  },
];

function PressCard({ item, index }) {
  return (
    <div
      className="flex-shrink-0 w-[340px] sm:w-[400px] p-6 mx-3"
      style={{
        background: 'rgba(16,20,29,0.5)',
        border: '0.5px solid rgba(138,143,152,0.1)',
      }}
    >
      {/* Outlet logo */}
      <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.1)' }}>
        <span
          className="font-heading font-black text-lg tracking-tight"
          style={{ color: '#F5F5F7' }}
        >
          {item.outlet}
        </span>
        <span
          className="font-mono text-[8px] tracking-widest px-2 py-1"
          style={{
            color: '#D1FF26',
            border: '0.5px solid rgba(209,255,38,0.2)',
          }}
        >
          {item.author.toUpperCase()}
        </span>
      </div>

      {/* Quote */}
      <p className="text-sm leading-relaxed mb-5" style={{ color: '#8A8F98', lineHeight: '1.7' }}>
        <span style={{ color: '#D1FF26', fontSize: '1.5em', lineHeight: '0' }}>"</span>
        {item.quote}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className="w-1 h-1 rounded-full"
              style={{ background: '#D1FF26', opacity: 1 - s * 0.15 }}
            />
          ))}
        </div>
        <span className="font-mono text-[9px] tracking-widest" style={{ color: 'rgba(138,143,152,0.5)' }}>
          VERIFIED COVERAGE
        </span>
      </div>
    </div>
  );
}

export default function PressSection() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!inView || !scrollRef.current) return;
    let animationFrame;
    let currentScroll = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      const container = scrollRef.current;
      if (container) {
        currentScroll += scrollSpeed;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (currentScroll >= maxScroll) {
          currentScroll = 0;
        }
        container.scrollLeft = currentScroll;
        setScrollProgress(maxScroll > 0 ? currentScroll / maxScroll : 0);
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 lg:mb-16 text-center px-6"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // PRESS &amp; COVERAGE
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Making Headlines
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            The world is watching. Here's what leading outlets are saying about 1 CALL AWAY™.
          </p>
        </motion.div>

        {/* Scrolling press cards */}
        <div className="relative">
          {/* Edge fades */}
          <div
            className="absolute left-0 top-0 bottom-0 w-16 lg:w-32 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, #05070A 0%, transparent 100%)' }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-16 lg:w-32 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(270deg, #05070A 0%, transparent 100%)' }}
          />

          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="overflow-x-hidden flex py-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* Duplicate items for seamless loop */}
            {[...pressItems, ...pressItems].map((item, i) => (
              <PressCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 lg:px-16 max-w-6xl mx-auto mt-8">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
              AUTO-SCROLL
            </span>
            <div className="flex-1 h-px relative" style={{ background: 'rgba(138,143,152,0.1)' }}>
              <div
                className="absolute top-0 left-0 h-full transition-all duration-100"
                style={{
                  width: '40%',
                  background: '#D1FF26',
                  boxShadow: '0 0 8px #D1FF26',
                  left: `${scrollProgress * 60}%`,
                }}
              />
            </div>
            <span className="font-mono text-[9px] tracking-widest" style={{ color: '#D1FF26' }}>
              ● LIVE FEED
            </span>
          </div>
        </div>

        {/* Outlet strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 px-6 lg:px-16 max-w-6xl mx-auto"
        >
          <p className="font-mono text-[10px] tracking-widest text-center mb-6" style={{ color: 'rgba(138,143,152,0.4)' }}>
            AS FEATURED IN
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {pressItems.map((item, i) => (
              <span
                key={i}
                className="font-heading font-black text-base lg:text-lg tracking-tight transition-all duration-300 hover:text-[#D1FF26]"
                style={{ color: 'rgba(245,245,247,0.25)' }}
              >
                {item.outlet}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}