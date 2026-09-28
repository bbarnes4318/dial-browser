import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bookmark, Award, Loader2, Play, CheckCircle2, Lock, Phone, Hash, Clock,
  Volume2, VolumeX, Headphones,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import CourseBadges from "@/components/courses/CourseBadges";
import AssessmentBadges from "@/components/courses/AssessmentBadges";
import CourseReferralSection from "@/components/courses/CourseReferralSection";
import StudyStreakPanel from "@/components/courses/StudyStreakPanel";
import CourseCover from "@/components/courses/CourseCover";
import VoiceLessonUnlock from "@/components/courses/VoiceLessonUnlock";

const CATEGORY_COLORS = {
  AI: "#D1FF26", Engineering: "#5AC8E0", Healthcare: "#5AE0C8", Hospitality: "#E085A8",
  Education: "#FBBF24", Trades: "#5A8FE0", Security: "#94A3B8", Finance: "#60A5FA",
  Automotive: "#A3E635", Science: "#5AE07A", Business: "#E0A85A", Marketing: "#E085A8",
  Technology: "#5AC8E0",
};

const STATUS_META = {
  paid: { label: "In Progress", color: "#D1FF26", Icon: Play },
  completed: { label: "Completed", color: "#D1FF26", Icon: CheckCircle2 },
  pending: { label: "Payment Pending", color: "#8A8F98", Icon: Lock },
  expired: { label: "Expired", color: "#ef4444", Icon: Lock },
};

export default function MyCourses() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState({});
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [listeningId, setListeningId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(null);
  const [voiceUnlocked, setVoiceUnlocked] = useState(() => sessionStorage.getItem("voiceLessonUnlocked") === "1");
  const unlockRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const ens = await base44.entities.Enrollment.filter({ owner_user_id: user.id }, "-created_date", 100);
      const list = Array.isArray(ens) ? ens : [];
      setEnrollments(list);
      // Hydrate the course for each enrollment
      const uniqueIds = Array.from(new Set(list.map((e) => e.course_id).filter(Boolean)));
      if (uniqueIds.length > 0) {
        const fetched = await Promise.all(uniqueIds.map((id) => base44.entities.Course.get(id).catch(() => null)));
        setCourses(fetched.filter(Boolean));
      }
      // Load earned certificates so completed courses can link to their verify page
      const certs = await base44.entities.Certificate.filter({ owner_user_id: user.id, revoked: false }, "-created_date", 100).catch(() => []);
      const certMap = {};
      (certs || []).forEach((c) => { if (c.course_id) certMap[c.course_id] = c; });
      setCertificates(certMap);
      // Fetch lesson counts per enrolled course so the progress bar can show "Lesson X of Y".
      const counts = {};
      await Promise.all(uniqueIds.map(async (cid) => {
        try {
          const ls = await base44.entities.Lesson.filter({ course_id: cid }, "order_index", 200);
          counts[cid] = Array.isArray(ls) ? ls.length : 0;
        } catch { counts[cid] = 0; }
      }));
      setLessonsByCourse(counts);
      try {
        const st = await base44.entities.StudyStreak.filter({ owner_user_id: user.id }, "-created_date", 1);
        setStreak((st || [])[0] || null);
      } catch { setStreak(null); }
    } catch { setEnrollments([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const completedDialCodes = enrollments
    .filter((e) => e.status === "completed")
    .map((e) => courseMap.get(e.course_id)?.dial_code)
    .filter(Boolean);

  // Telephony engine (in-app preview): invoke course-voice-delivery to fetch
  // the next lesson in the queue and narrate it via the browser, exactly as
  // the Twilio path narrates over a phone call.
  const requestVoiceUnlock = () => {
    if (unlockRef.current) unlockRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const speakLesson = async (en, course) => {
    try {
      if (listeningId) {
        window.speechSynthesis.cancel();
        setListeningId(null);
        return;
      }
      if (!voiceUnlocked) { requestVoiceUnlock(); return; }
      const res = await base44.functions.invoke("course-voice-delivery", { course_id: course.id });
      const lesson = res?.data?.lesson;
      if (!lesson) return;
      const script = `Lesson ${res.data.lesson_index + 1} of ${res.data.lesson_total}: ${lesson.title}. ${lesson.text || lesson.summary || ""}`;
      const utter = new SpeechSynthesisUtterance(script);
      utter.rate = 1; utter.pitch = 1;
      utter.onend = () => setListeningId(null);
      utter.onerror = () => setListeningId(null);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      setListeningId(en.id);
      await load();
    } catch { setListeningId(null); }
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/courses" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Courses
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// MY COURSES</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Your <span style={{ color: "#D1FF26" }}>Learning.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Continue your enrolled courses by phone and track your progress toward certification.
          </p>
        </div>

        <CourseBadges earnedDialCodes={completedDialCodes} />
        <AssessmentBadges user={user} />
        <StudyStreakPanel streak={streak} />

        {!voiceUnlocked && (
          <div ref={unlockRef} className="mb-8 scroll-mt-8">
            <VoiceLessonUnlock user={user} onUnlocked={() => setVoiceUnlocked(true)} />
          </div>
        )}
        {voiceUnlocked && (
          <div className="mb-8 flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <CheckCircle2 size={13} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>VOICE VERIFIED · LESSONS UNLOCKED FOR THIS SESSION</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-24">
            <Award size={36} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>NO ENROLLMENTS YET</p>
            <Link to="/courses" className="font-mono text-[9px] tracking-widest uppercase px-4 py-2" style={{ background: "#D1FF26", color: "#05070A" }}>Browse Courses</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((en, i) => {
              const course = courseMap.get(en.course_id);
              if (!course) return null;
              const color = CATEGORY_COLORS[course.category] || "#D1FF26";
              const gradient = course.cover_gradient || `linear-gradient(135deg, ${color}, #0A0F0A)`;
              const meta = STATUS_META[en.status] || STATUS_META.pending;
              const StatusIcon = meta.Icon;
              return (
                <motion.div
                  key={en.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="flex flex-col overflow-hidden"
                  style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}22` }}
                >
                  <Link to={`/courses/${course.id}`} className="block overflow-hidden">
                    <CourseCover course={course} linkInstructor={false} />
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase px-2 py-1" style={{ background: `${meta.color}15`, color: meta.color }}>
                        <StatusIcon size={10} /> {meta.label}
                      </span>
                      <span className="font-mono text-[9px] font-bold" style={{ color: meta.color }}>{en.progress_pct || 0}%</span>
                    </div>
                    {/* Visual progress bar with lesson milestones */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1 font-mono text-[7px] tracking-wider uppercase" style={{ color: "#8A8F98" }}>
                        <span>Lesson {Math.min((en.current_lesson_index || 0) + 1, lessonsByCourse[course.id] || 1)} of {lessonsByCourse[course.id] || "?"}</span>
                        {lessonsByCourse[course.id] ? <span>{Math.min(en.current_lesson_index || 0, lessonsByCourse[course.id])}/{lessonsByCourse[course.id]} done</span> : null}
                      </div>
                      <div className="relative h-2.5 w-full" style={{ background: "rgba(138,143,152,0.12)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                        <div className="h-full transition-all duration-500" style={{ width: `${en.progress_pct || 0}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 10px ${color}66` }} />
                        {lessonsByCourse[course.id] > 1 && Array.from({ length: Math.min(lessonsByCourse[course.id] - 1, 7) }).map((_, m) => (
                          <div key={m} className="absolute top-0 bottom-0 w-px" style={{ left: `${((m + 1) / Math.min(lessonsByCourse[course.id], 8)) * 100}%`, background: "rgba(5,7,10,0.55)" }} />
                        ))}
                      </div>
                    </div>
                    {en.status === "completed" && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-2 mb-2" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                          <Award size={12} style={{ color: "#D1FF26" }} />
                          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>CERTIFICATE EARNED</span>
                        </div>
                        {certificates[course.id]?.verification_code && (
                          <Link to={`/verify/${certificates[course.id].verification_code}`} className="flex items-center justify-center gap-1.5 py-2 mb-2 font-mono text-[8px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.25)]" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                            <Award size={11} /> View Certificate
                          </Link>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                      <span className="flex items-center gap-1"><Clock size={9} /> {course.duration_hours}h</span>
                      <span className="flex items-center gap-1"><Hash size={9} style={{ color }} /> {course.dial_code}</span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Link to={`/courses/${course.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[8px] tracking-widest uppercase font-bold" style={{ background: color, color: "#05070A" }}>
                        <Play size={11} /> {en.status === "completed" ? "Review" : "Continue"}
                      </Link>
                      {(en.status === "paid" || en.status === "completed") && (
                        <button
                          onClick={() => speakLesson(en, course)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase font-bold transition-all"
                          style={{ background: listeningId === en.id ? "rgba(239,68,68,0.12)" : "rgba(209,255,38,0.08)", border: `0.5px solid ${listeningId === en.id ? "rgba(239,68,68,0.4)" : "rgba(209,255,38,0.3)"}`, color: listeningId === en.id ? "#ef4444" : "#D1FF26" }}
                          title={voiceUnlocked ? "Listen to the next lesson (telephony engine)" : "Verify your voice to unlock lessons"}
                        >
                          {listeningId === en.id ? <VolumeX size={11} /> : !voiceUnlocked ? <Lock size={11} /> : <Headphones size={11} />} {listeningId === en.id ? "Stop" : !voiceUnlocked ? "Unlock" : "Listen"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Phone tip */}
        <div className="mt-8 p-4 flex items-start gap-3" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Phone size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
          <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
            To continue a course by phone, dial the 1 Call number and press the course's dial code. Voice lessons and phone-based exams are coming soon — for now, manage your enrollment and progress here.
          </p>
        </div>

        <CourseReferralSection />
      </div>
    </div>
  );
}