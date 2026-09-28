import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const MILESTONES = [
  {
    label: "1st Date",
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/c93361f22_Gemini_Generated_Image_v1jbyzv1jbyzv1jb.jpg",
  },
  {
    label: "2nd Date",
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/45f34d07c_Gemini_Generated_Image_1eiuyl1eiuyl1eiu.jpg",
  },
  {
    label: "3rd Date",
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/0329e178c_Gemini_Generated_Image_a56foca56foca56f.jpg",
  },
  {
    label: "Game Day",
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/3ed031f69_Gemini_Generated_Image_bs9qa7bs9qa7bs9q.jpg",
  },
  {
    label: "Wedding",
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/f4ba7169e_Gemini_Generated_Image_gkvfq2gkvfq2gkvf.jpg",
  },
  {
    label: "Forever",
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/bb2779fa7_Gemini_Generated_Image_vun93qvun93qvun9.jpg",
  },
];

export default function DatingMilestoneGallery({ inView = true }) {
  const scrollRef = useRef(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart size={12} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
          // FROM FIRST CALL TO FOREVER
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {MILESTONES.map((m, i) => (
          <div
            key={m.label}
            className="flex-shrink-0 group relative"
            style={{ width: "min(78vw, 300px)" }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                border: "0.5px solid rgba(209,255,38,0.25)",
                boxShadow: "0 0 24px rgba(209,255,38,0.08)",
              }}
            >
              <img
                src={m.img}
                alt={m.label}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "auto",
                  aspectRatio: "16 / 9",
                  objectFit: "cover",
                  display: "block",
                  filter: "saturate(1.05) brightness(0.95)",
                }}
              />
              {/* Gradient scrim for label legibility */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(180deg, rgba(5,7,10,0.1) 0%, rgba(5,7,10,0.55) 100%)" }}
              />
              {/* Milestone label */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span
                  className="font-mono text-[9px] font-bold tracking-widest uppercase px-2 py-1"
                  style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.4)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-heading font-black text-sm tracking-tight" style={{ color: "#F5F5F7", textShadow: "0 0 12px rgba(209,255,38,0.4)" }}>
                  {m.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="font-mono text-[10px] mt-2" style={{ color: "#8A8F98" }}>
        Every great connection starts with one call — scroll to see the journey →
      </p>
    </motion.div>
  );
}