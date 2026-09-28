import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Clock, BarChart3, Hash } from "lucide-react";
import CourseCover from "@/components/courses/CourseCover";

const CATEGORY_COLORS = {
  AI: "#D1FF26", Engineering: "#5AC8E0", Healthcare: "#5AE0C8", Hospitality: "#E085A8",
  Education: "#FBBF24", Trades: "#5A8FE0", Security: "#94A3B8", Finance: "#60A5FA",
  Automotive: "#A3E635", Science: "#5AE07A", Business: "#E0A85A", Marketing: "#E085A8",
  Technology: "#5AC8E0",
};

const DIFFICULTY_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export default function CourseCard({ course, index = 0 }) {
  const color = CATEGORY_COLORS[course.category] || "#D1FF26";
  const gradient = course.cover_gradient || `linear-gradient(135deg, ${color}, #0A0F0A)`;
  const price = parseFloat(course.price) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        to={`/courses/${course.id}`}
        className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_0_24px_rgba(209,255,38,0.12)]"
        style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}
      >
        {/* Cover */}
        <CourseCover course={course} linkInstructor={false} />

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col">
          <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: "rgba(138,143,152,0.85)" }}>
            {course.description}
          </p>
          <div className="flex items-center gap-3 mb-3 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
            <span className="flex items-center gap-1"><BarChart3 size={9} style={{ color }} /> {DIFFICULTY_LABEL[course.difficulty]}</span>
            <span className="flex items-center gap-1"><Clock size={9} style={{ color }} /> {course.duration_hours}h</span>
            <span className="flex items-center gap-1"><Hash size={9} style={{ color }} /> {course.dial_code}</span>
          </div>
          <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
            <span className="font-mono text-[10px] tracking-wider font-bold" style={{ color: price > 0 ? color : "#8A8F98" }}>
              {price > 0 ? `$${price.toFixed(2)}` : "FREE"}
            </span>
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color }}>View Course ▸</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}