import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Briefcase, Award, BookOpen, Hash, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const CATEGORY_COLORS = {
  AI: "#D1FF26", Engineering: "#5AC8E0", Healthcare: "#5AE0C8", Hospitality: "#E085A8",
  Education: "#FBBF24", Trades: "#5A8FE0", Security: "#94A3B8", Finance: "#60A5FA",
  Automotive: "#A3E635", Science: "#5AE07A", Business: "#E0A85A", Marketing: "#E085A8",
  Technology: "#5AC8E0",
};

// At-a-glance instructor header for the InstructorDashboard: highlights the
// teacher's professional background, industry experience timeline, and every
// course they are currently leading. Loads its own InstructorProfile.
export default function InstructorProfileHeader({ courses = [] }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      try {
        const list = await base44.entities.InstructorProfile.filter({ owner_user_id: user.id }, "-created_date", 1).catch(() => []);
        if (!cancelled) setProfile((list || [])[0] || null);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const name = profile?.display_name || user?.full_name || "Instructor";
  const headline = profile?.headline || "Add a headline from the My Profile tab";
  const photo = profile?.photo_url;
  const specializations = profile?.specializations || [];
  const credentials = profile?.credentials || [];
  const experience = profile?.experience || [];
  const totalStudents = courses.reduce((s, c) => s + (c.enrollments?.length || 0), 0);

  return (
    <div className="mb-6">
      <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        {/* Identity */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : <User size={26} style={{ color: "#D1FF26" }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// INSTRUCTOR PROFILE</p>
            <h2 className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{name}</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8A8F98" }}>{headline}</p>
            <div className="flex items-center gap-4 mt-2 font-mono text-[9px] flex-wrap" style={{ color: "#8A8F98" }}>
              <span className="flex items-center gap-1"><BookOpen size={11} style={{ color: "#D1FF26" }} />{courses.length} leading</span>
              <span className="flex items-center gap-1"><Users size={11} style={{ color: "#D1FF26" }} />{totalStudents} students</span>
              <span className="flex items-center gap-1"><Award size={11} style={{ color: "#D1FF26" }} />{credentials.length} credentials</span>
            </div>
          </div>
        </div>

        {/* Professional background */}
        {profile?.bio && (
          <div className="mt-4">
            <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#D1FF26" }}>▸ PROFESSIONAL BACKGROUND</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(138,143,152,0.95)" }}>{profile.bio}</p>
          </div>
        )}

        {/* Specializations + credentials */}
        {(specializations.length > 0 || credentials.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {specializations.map((s, i) => (
              <span key={`s${i}`} className="font-mono text-[8px] tracking-wider uppercase px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>{s}</span>
            ))}
            {credentials.map((c, i) => (
              <span key={`c${i}`} className="font-mono text-[8px] tracking-wider uppercase px-2 py-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>{c}</span>
            ))}
          </div>
        )}

        {/* Industry experience timeline */}
        {experience.length > 0 && (
          <div className="mt-4">
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>▸ INDUSTRY EXPERIENCE</p>
            <div className="space-y-2">
              {experience.map((e, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <Briefcase size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: "#F5F5F7" }}>{e.role}{e.organization ? ` · ${e.organization}` : ""}</p>
                    {e.period && <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{e.period}</p>}
                    {e.description && <p className="text-[11px] mt-0.5" style={{ color: "#8A8F98" }}>{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses currently leading */}
        <div className="mt-4">
          <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>▸ COURSES CURRENTLY LEADING</p>
          {courses.length === 0 ? (
            <p className="font-mono text-[9px] py-3 text-center" style={{ color: "#4A4F58" }}>NO COURSES ASSIGNED YET</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {courses.map((c) => {
                const cc = CATEGORY_COLORS[c.category] || "#D1FF26";
                return (
                  <Link key={c.id} to={`/courses/${c.id}`} className="block p-3 transition-all hover:border-[rgba(209,255,38,0.4)]" style={{ background: "rgba(5,7,10,0.4)", border: `0.5px solid ${cc}22` }}>
                    <p className="font-heading font-bold text-xs mb-1" style={{ color: "#F5F5F7" }}>{c.title}</p>
                    <div className="flex items-center gap-2 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                      <span className="flex items-center gap-1"><Hash size={9} style={{ color: cc }} />{c.dial_code}</span>
                      <span className="flex items-center gap-1"><Users size={9} />{c.enrollments?.length || 0}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}