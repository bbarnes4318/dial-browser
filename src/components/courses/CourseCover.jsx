import React from "react";
import { Link } from "react-router-dom";
import { Award, Hash, User } from "lucide-react";

const CATEGORY_COLORS = {
  AI: "#D1FF26", Engineering: "#5AC8E0", Healthcare: "#5AE0C8", Hospitality: "#E085A8",
  Education: "#FBBF24", Trades: "#5A8FE0", Security: "#94A3B8", Finance: "#60A5FA",
  Automotive: "#A3E635", Science: "#5AE07A", Business: "#E0A85A", Marketing: "#E085A8",
  Technology: "#5AC8E0",
};

// A single, consistent cover template applied to every course across the app:
// professional photography (cover_art_url) under a unified scrim, with clear,
// consistent typography — category chip, certified badge, title, instructor,
// and dial code. Used by the catalog cards, course detail hero, and instructor
// profile course grid so all 16 covers share one branded layout.
export default function CourseCover({ course, size = "card", showInstructor = true, linkInstructor = true }) {
  const color = CATEGORY_COLORS[course.category] || "#D1FF26";
  const gradient = course.cover_gradient || `linear-gradient(135deg, ${color}, #0A0F0A)`;
  const aspect = size === "hero" ? "aspect-[16/6]" : "aspect-[16/10]";
  const titleSize = size === "hero" ? "text-3xl sm:text-4xl" : "text-lg";
  const pad = size === "hero" ? "p-6" : "p-4";
  const instructorPath = course.instructor_user_id ? `/instructor/${course.instructor_user_id}` : null;
  const useLink = !!(instructorPath && linkInstructor);
  const InstructorEl = useLink ? Link : "span";
  const instructorProps = useLink ? { to: instructorPath } : {};

  return (
    <div className={`relative ${aspect} overflow-hidden`} style={{ background: gradient }}>
      {course.cover_art_url && (
        <img
          src={course.cover_art_url}
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.6) contrast(1.05) saturate(1.05)" }}
        />
      )}
      {/* Consistent branded scrim for legibility across all photography */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,7,10,0.4) 0%, rgba(5,7,10,0.15) 35%, rgba(5,7,10,0.88) 100%)" }} />
      {/* Accent top bar — consistent brand signature */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent 70%)` }} />

      <div className={`absolute inset-0 flex flex-col justify-between ${pad}`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5" style={{ background: "rgba(5,7,10,0.7)", color, border: `0.5px solid ${color}55` }}>
            {course.category}
          </span>
          {course.certificate_eligible && (
            <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5" style={{ background: color, color: "#05070A" }}>
              <Award size={9} /> Certified
            </span>
          )}
        </div>

        <div>
          <h3 className={`font-heading font-black ${titleSize} leading-tight`} style={{ color: "#F5F5F7", textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}>
            {course.title}
          </h3>
          {course.subtitle && size === "hero" && (
            <p className="text-sm mt-1.5 font-medium" style={{ color: "rgba(245,245,247,0.9)" }}>{course.subtitle}</p>
          )}
          <div className="flex items-end justify-between gap-2 mt-2">
            {showInstructor && course.instructor_name ? (
              <InstructorEl {...instructorProps} className="inline-flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase hover:opacity-80" style={{ color }}>
                <User size={10} /> {course.instructor_name}
              </InstructorEl>
            ) : <span />}
            {course.dial_code && (
              <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5" style={{ background: "rgba(5,7,10,0.7)", border: `0.5px solid ${color}66`, color }}>
                <Hash size={9} /> {course.dial_code}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}