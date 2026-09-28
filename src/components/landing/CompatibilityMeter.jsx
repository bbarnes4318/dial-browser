import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Heart, MapPin, Check, Zap } from "lucide-react";

// Shared-interest breakdown per demo match — drives the meter's sub-scores.
const matchDetails = {
  match1: {
    interests: [
      { name: "Afrobeats Music", shared: true },
      { name: "Cooking", shared: true },
      { name: "Live Events", shared: true },
      { name: "Hiking", shared: false },
      { name: "Reading", shared: true },
    ],
    sameCity: true,
    distanceMi: 3,
  },
  match2: {
    interests: [
      { name: "Reading", shared: true },
      { name: "Cooking", shared: true },
      { name: "Afrobeats Music", shared: false },
      { name: "Travel", shared: true },
      { name: "Fitness", shared: false },
    ],
    sameCity: false,
    distanceMi: 712,
  },
  match3: {
    interests: [
      { name: "Fitness", shared: true },
      { name: "Cooking", shared: true },
      { name: "Music", shared: true },
      { name: "Travel", shared: false },
      { name: "Gaming", shared: false },
    ],
    sameCity: false,
    distanceMi: 640,
  },
};

const getScoreColor = (score) => {
  if (score >= 90) return "#D1FF26";
  if (score >= 75) return "#A8E620";
  return "#8A8F98";
};

export default function CompatibilityMeter({ match }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  const details = matchDetails[match?.id] || matchDetails.match1;
  const score = match?.compatibility || 0;
  const sharedCount = details.interests.filter((i) => i.shared).length;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(score * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, score]);

  const scoreColor = getScoreColor(score);
  const label = score >= 90 ? "EXCELLENT MATCH" : score >= 75 ? "STRONG MATCH" : "MODERATE MATCH";

  return (
    <div ref={ref} className="mb-5 p-5 relative overflow-hidden" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Signal line */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Zap size={12} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// COMPATIBILITY METER</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular meter */}
        <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
          <svg width="140" height="140" className="-rotate-90">
            {/* Track */}
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(138,143,152,0.12)" strokeWidth="6" />
            {/* Progress arc */}
            <motion.circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ filter: `drop-shadow(0 0 8px ${scoreColor}80)` }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              key={Math.round(animatedScore)}
              className="font-heading font-black text-4xl"
              style={{ color: scoreColor, textShadow: `0 0 20px ${scoreColor}40` }}
            >
              {Math.round(animatedScore)}
            </motion.p>
            <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>% MATCH</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={12} style={{ color: scoreColor }} />
            <span className="font-mono text-[9px] tracking-widest font-bold" style={{ color: scoreColor }}>{label}</span>
          </div>

          {/* Shared interests */}
          <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
            SHARED INTERESTS · {sharedCount}/{details.interests.length}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {details.interests.map((interest) => (
              <span
                key={interest.name}
                className="flex items-center gap-1 px-2 py-1 font-mono text-[8px]"
                style={{
                  background: interest.shared ? "rgba(209,255,38,0.12)" : "rgba(138,143,152,0.06)",
                  border: `0.5px solid ${interest.shared ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.15)"}`,
                  color: interest.shared ? "#D1FF26" : "#8A8F98",
                }}
              >
                {interest.shared && <Check size={8} />}
                {interest.name}
              </span>
            ))}
          </div>

          {/* Location proximity */}
          <div className="flex items-center gap-2 p-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
            <MapPin size={12} style={{ color: details.sameCity ? "#D1FF26" : "#8A8F98" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
              {details.sameCity ? (
                <><span style={{ color: "#D1FF26" }}>Same city</span> · {details.distanceMi} mi away</>
              ) : (
                <>{details.distanceMi} mi away · different city</>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}