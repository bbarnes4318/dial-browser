import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, GraduationCap, Search, Loader2, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CourseCard from "@/components/courses/CourseCard";
import VoiceSearchButton from "@/components/shared/VoiceSearchButton";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Course.filter({ status: "published" }, "-created_date", 200);
      setCourses(Array.isArray(list) ? list : []);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Capture a referral code from the ?ref= query param so it auto-applies at
  // course checkout. Stored in localStorage and surfaced via a banner.
  const [refBanner, setRefBanner] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        localStorage.setItem("course_ref_code", ref.toUpperCase());
        setRefBanner(true);
      }
    } catch { /* ignore */ }
  }, []);

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [courses]);

  const q = search.toLowerCase();
  const filtered = courses.filter((c) => {
    const matchCat = category === "all" || c.category === category;
    const matchQuery = !q ||
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      (c.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (c.dial_code || "").toLowerCase().includes(q) ||
      (c.instructor_name || "").toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DIAL CERTIFIED COURSES</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Learn by Phone. <span style={{ color: "#D1FF26" }}>Get Certified.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Professional courses narrated to you by voice call — listen to lessons, take quizzes and exams by phone, and earn a verifiable completion certificate.
          </p>
          <Link to="/my-courses" className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_14px_rgba(209,255,38,0.25)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <BookOpen size={12} /> My Courses
          </Link>
        </div>

        {refBanner && (
          <div className="mb-4 p-3 flex items-center justify-between" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>▸ REFERRAL APPLIED — 20% OFF ANY COURSE ENROLLMENT</p>
            <button onClick={() => setRefBanner(false)} className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>DISMISS</button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject, dial code, or keyword — or tap the mic…"
            className="w-full pl-9 pr-14 py-3 text-sm outline-none"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
          />
          <VoiceSearchButton onResult={setSearch} title="Speak a course name or category" />
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto overscroll-contain pb-2 mb-6" style={{ WebkitOverflowScrolling: "touch" }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap"
              style={{ background: category === c ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${category === c ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: category === c ? "#D1FF26" : "#8A8F98" }}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <GraduationCap size={36} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO COURSES FOUND</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}