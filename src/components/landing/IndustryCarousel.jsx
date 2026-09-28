import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight, Phone } from "lucide-react";

const categoryColors = {
  "Media & Streaming": "#D1FF26",
  "E-commerce & Streaming": "#D1FF26",
  Social: "#5A8FE0",
  "Industry Vertical": "#F5A623",
  Entertainment: "#A855F7",
  Sports: "#D1FF26",
  Finance: "#F5A623",
  Technology: "#5A8FE0",
};

export default function IndustryCarousel({ industries, inView }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Reset index when the filtered list changes (search/category)
  useEffect(() => {
    setIndex(0);
    setDirection(0);
  }, [industries]);

  const total = industries.length;
  const current = industries[index];

  const paginate = (dir) => {
    if (total === 0) return;
    setDirection(dir);
    setIndex((prev) => (prev + dir + total) % total);
  };

  const goTo = (i) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  const color = current ? categoryColors[current.category] || "#D1FF26" : "#D1FF26";

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80, scale: 0.95 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80, scale: 0.95 }),
  };

  if (total === 0) return null;

  return (
    <div className="relative">
      {/* Card stage */}
      <div className="relative overflow-hidden" style={{ minHeight: 340 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.name}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) paginate(1);
              else if (info.offset.x > 60) paginate(-1);
            }}
            className="relative p-8 lg:p-10 cursor-grab active:cursor-grabbing"
            style={{
              background: "rgba(16,20,29,0.6)",
              border: `0.5px solid ${color}40`,
              boxShadow: `0 0 40px ${color}10`,
            }}
          >
            {/* HUD corner brackets */}
            <span className="absolute top-0 left-0 w-5 h-5" style={{ borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
            <span className="absolute top-0 right-0 w-5 h-5" style={{ borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
            <span className="absolute bottom-0 left-0 w-5 h-5" style={{ borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
            <span className="absolute bottom-0 right-0 w-5 h-5" style={{ borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />

            {/* Index readout */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
                  {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
              </div>
              <ArrowUpRight size={18} style={{ color }} />
            </div>

            {/* Category badge */}
            <span
              className="inline-block font-mono text-[9px] tracking-widest uppercase px-2.5 py-1 mb-5"
              style={{ background: `${color}12`, color, border: `0.5px solid ${color}40` }}
            >
              {current.category}
            </span>

            {/* Industry name */}
            <h3 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-5" style={{ color: "#F5F5F7" }}>
              {current.name}
            </h3>

            {/* Benefit description */}
            <p className="text-sm lg:text-base leading-relaxed max-w-3xl" style={{ color: "#A0A4AC" }}>
              {current.benefit}
            </p>

            {/* Swipe hint */}
            <div className="flex items-center gap-2 mt-6 pt-4" style={{ borderTop: `0.5px solid ${color}20` }}>
              <Phone size={11} style={{ color: "#8A8F98" }} />
              <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                ← SWIPE OR USE ARROWS TO BROWSE INDUSTRIES →
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => paginate(-1)}
          disabled={total <= 1}
          className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
        >
          <ChevronLeft size={14} /> Prev
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[60%]">
          {industries.map((ind, i) => {
            const dotColor = categoryColors[ind.category] || "#D1FF26";
            const isActive = i === index;
            return (
              <button
                key={ind.name}
                onClick={() => goTo(i)}
                className="transition-all duration-300"
                style={{
                  width: isActive ? 24 : 6,
                  height: 6,
                  background: isActive ? dotColor : "rgba(138,143,152,0.3)",
                  borderRadius: 3,
                }}
                aria-label={`Go to ${ind.name}`}
              />
            );
          })}
        </div>

        <button
          onClick={() => paginate(1)}
          disabled={total <= 1}
          className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}