import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, GraduationCap, Loader2, Briefcase, Award, BookOpen, User,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import CourseCard from "@/components/courses/CourseCard";

// Public instructor profile page: shows bio, experience timeline, credentials,
// and the list of courses the instructor currently leads. Reachable by anyone
// (no login required) so prospective students can review an instructor before
// enrolling.
export default function InstructorProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [pros, cs] = await Promise.all([
        base44.entities.InstructorProfile.filter({ owner_user_id: userId }, "-created_date", 1).catch(() => []),
        base44.entities.Course.filter({ instructor_user_id: userId, status: "published" }, "-created_date", 100).catch(() => []),
      ]);
      setProfile((pros || [])[0] || null);
      setCourses(Array.isArray(cs) ? cs : []);
    } catch { setProfile(null); setCourses([]); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/courses" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Courses
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : (
          <>
            {/* Hero */}
            <div className="p-6 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden flex items-center justify-center mx-auto sm:mx-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} style={{ color: "#D1FF26" }} />
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                    <GraduationCap size={16} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// INSTRUCTOR</p>
                  </div>
                  <h1 className="font-heading font-black text-2xl sm:text-3xl mb-1" style={{ color: "#F5F5F7" }}>
                    {profile?.display_name || "Instructor"}
                  </h1>
                  {profile?.headline && <p className="text-sm" style={{ color: "#D1FF26" }}>{profile.headline}</p>}
                  {profile?.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
                      {profile.specializations.map((s, i) => (
                        <span key={i} className="font-mono text-[8px] tracking-widest uppercase px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <div className="p-5 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ ABOUT</p>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "rgba(245,245,247,0.85)" }}>{profile.bio}</p>
              </div>
            )}

            {/* Experience */}
            {profile?.experience?.length > 0 && (
              <div className="p-5 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ EXPERIENCE</p>
                </div>
                <div className="space-y-4">
                  {profile.experience.map((e, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px rgba(209,255,38,0.5)" }} />
                        {i < profile.experience.length - 1 && <div className="w-px flex-1" style={{ background: "rgba(209,255,38,0.2)" }} />}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{e.role}</p>
                        <p className="font-mono text-[9px] tracking-wider uppercase mb-1" style={{ color: "#D1FF26" }}>
                          {e.organization}{e.period ? ` · ${e.period}` : ""}
                        </p>
                        {e.description && <p className="text-xs leading-relaxed" style={{ color: "rgba(138,143,152,0.9)" }}>{e.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credentials */}
            {profile?.credentials?.length > 0 && (
              <div className="p-5 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ CREDENTIALS</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.credentials.map((c, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}>
                      <Award size={11} style={{ color: "#D1FF26" }} /> {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Courses led */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ COURSES LED · {courses.length}</p>
              </div>
              {courses.length === 0 ? (
                <div className="text-center py-16" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <BookOpen size={28} className="mx-auto mb-2" style={{ color: "rgba(209,255,38,0.3)" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO COURSES ASSIGNED YET</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
                </div>
              )}
            </div>

            {!profile && (
              <p className="text-center text-xs mt-8" style={{ color: "#4A4F58" }}>This instructor hasn't published a full profile yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}