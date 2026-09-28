import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, GraduationCap, BookOpen, Award, ListChecks, FileText,
  Calendar, Clock, Hash, BarChart3, PieChart, LineChart, Network, Activity,
  Image as ImageIcon, Workflow, CheckCircle2, Circle, Lock, TrendingUp,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import CourseCover from "@/components/courses/CourseCover";

const COLOR = "#D1FF26";

// 7-week themes + curated visual placeholders (the charts/illustrations that
// belong in each section — labeled spots where the visuals will render).
const WEEKS_META = [
  { theme: "Foundations — Niche, Audience & Brand", visuals: [
    { Icon: BarChart3, label: "CHART", desc: "Niche profitability matrix — interest × demand × spending" },
    { Icon: Network, label: "DIAGRAM", desc: "Platform landscape map — where to show up" },
  ]},
  { theme: "Content Creation — Ideation to Edit", visuals: [
    { Icon: ImageIcon, label: "ILLUSTRATION", desc: "The 3-second hook anatomy" },
    { Icon: LineChart, label: "GRAPH", desc: "Watch-time retention curve" },
  ]},
  { theme: "Growth & Distribution", visuals: [
    { Icon: TrendingUp, label: "CHART", desc: "Audience growth funnel" },
    { Icon: Workflow, label: "DIAGRAM", desc: "Algorithm feedback loop" },
  ]},
  { theme: "Monetization Foundations", visuals: [
    { Icon: BarChart3, label: "CHART", desc: "Revenue stream comparison (ad/sponsor/affiliate/product)" },
    { Icon: PieChart, label: "PIE", desc: "Example creator income mix" },
  ]},
  { theme: "Business & Scaling", visuals: [
    { Icon: Workflow, label: "DIAGRAM", desc: "Simple sales funnel — free → magnet → low-price → core" },
    { Icon: BarChart3, label: "CHART", desc: "Pricing & value tiers" },
  ]},
  { theme: "Advanced Revenue Streams", visuals: [
    { Icon: Activity, label: "GRAPH", desc: "Passive income stack layers" },
    { Icon: BarChart3, label: "CHART", desc: "B2B vs consumer rate comparison" },
  ]},
  { theme: "Launch & Sustainability", visuals: [
    { Icon: Calendar, label: "TIMELINE", desc: "90-day launch plan" },
    { Icon: LineChart, label: "CHART", desc: "Sustainable pacing vs burnout curve" },
  ]},
];

const TYPE_ICON = { quiz: FileText, test: ListChecks, exam: Award };

function stripTitle(title, courseTitle) {
  return (title || "").replace(`${courseTitle} — `, "");
}

function qTypeBreakdown(qs) {
  const counts = {};
  qs.forEach((q) => { counts[q.type] = (counts[q.type] || 0) + 1; });
  return counts;
}

function QuizStructureCard({ assessment, questions, color, courseTitle }) {
  const Icon = TYPE_ICON[assessment.type] || FileText;
  const qs = questions[assessment.id] || [];
  const breakdown = qTypeBreakdown(qs);
  const totalMarks = qs.reduce((s, q) => s + (q.marks || 1), 0);
  return (
    <div className="p-4" style={{ background: "rgba(5,7,10,0.4)", border: `0.5px solid ${color}33` }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color }} />
        <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color }}>{stripTitle(assessment.title, courseTitle)}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
        <div><span style={{ color: "#F5F5F7" }}>{qs.length}</span> Qs</div>
        <div><span style={{ color: "#F5F5F7" }}>{totalMarks}</span> marks</div>
        <div>Pass <span style={{ color }}>{assessment.passing_score_pct}%</span></div>
        <div><span style={{ color: "#F5F5F7" }}>{assessment.retake_cap}</span> retakes</div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {Object.entries(breakdown).map(([t, n]) => (
          <span key={t} className="font-mono text-[7px] tracking-wider uppercase px-1.5 py-0.5" style={{ background: `${color}1a`, color }}>{t.replace("_", " ")} · {n}</span>
        ))}
      </div>
    </div>
  );
}

function VisualPlaceholder({ Icon, label, desc, color }) {
  return (
    <div className="flex items-start gap-2 p-3" style={{ background: "rgba(5,7,10,0.5)", border: `0.5px dashed ${color}55` }}>
      <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color }} />
      <div className="min-w-0">
        <p className="font-mono text-[8px] tracking-widest" style={{ color }}>▸ {label} PLACEHOLDER</p>
        <p className="text-[11px] mt-0.5" style={{ color: "#F5F5F7" }}>{desc}</p>
        <p className="font-mono text-[7px] mt-1" style={{ color: "#4A4F58" }}>VISUAL — RENDERED IN COURSE MATERIALS</p>
      </div>
    </div>
  );
}

export default function CourseCurriculum() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const c = await base44.entities.Course.get(id).catch(() => null);
      setCourse(c);
      if (!c) { setLoading(false); return; }
      const [ls, as, qs] = await Promise.all([
        base44.entities.Lesson.filter({ course_id: id }, "order_index", 200).catch(() => []),
        base44.entities.Assessment.filter({ course_id: id }, "order_index", 50).catch(() => []),
        base44.entities.Question.filter({ course_id: id }, "order_index", 500).catch(() => []),
      ]);
      setLessons(Array.isArray(ls) ? ls : []);
      setAssessments(Array.isArray(as) ? as : []);
      const byAssessment = {};
      (qs || []).forEach((q) => { (byAssessment[q.assessment_id] = byAssessment[q.assessment_id] || []).push(q); });
      setQuestions(byAssessment);
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}><Loader2 size={28} className="animate-spin" style={{ color: COLOR }} /></div>;
  }
  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#05070A" }}>
        <GraduationCap size={36} className="mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
        <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>COURSE NOT FOUND</p>
        <Link to="/courses" className="font-mono text-[9px] tracking-widest uppercase" style={{ color: COLOR }}>▸ Back to Courses</Link>
      </div>
    );
  }

  const ct = course.title;
  // Group lessons into 7 weeks (Days 1-7, 8-14, ...)
  const weekRanges = [[0,7],[7,14],[14,21],[21,28],[28,35],[35,42],[42,45]];
  const weeks = weekRanges.map(([start, end], i) => ({
    num: i + 1,
    theme: WEEKS_META[i].theme,
    visuals: WEEKS_META[i].visuals,
    lessons: lessons.slice(start, end),
    sectionQuiz: assessments.find((a) => stripTitle(a.title, ct) === `Week ${i + 1} Section Quiz`),
  }));
  const courseQuiz = assessments.find((a) => a.type === "quiz" && !/^Week \d Section Quiz$/.test(stripTitle(a.title, ct)));
  const courseTest = assessments.find((a) => a.type === "test");
  const courseExam = assessments.find((a) => a.type === "exam");
  const totalAssessments = assessments.length;

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link to={`/courses/${id}`} className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
            <ArrowLeft size={14} /> Back to Course
          </Link>
          <Link to={`/courses/${id}/summary`} className="font-mono text-[9px] tracking-widest uppercase px-3 py-1.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: COLOR }}>Course Summary</Link>
        </div>

        {/* Cover + overview */}
        <div className="mb-6 overflow-hidden" style={{ border: `0.5px solid ${COLOR}22` }}>
          <CourseCover course={course} size="hero" />
        </div>
        <div className="mb-8">
          <p className="font-mono text-xs tracking-[0.4em] mb-2" style={{ color: COLOR }}>// DETAILED CURRICULUM</p>
          <h1 className="font-heading font-black text-2xl sm:text-3xl mb-2" style={{ color: "#F5F5F7" }}>{course.title}</h1>
          <p className="text-sm max-w-2xl mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{course.subtitle}. A 45-day, step-by-step certified program — daily milestones, weekly section quizzes, and a final certification exam.</p>
          <div className="flex items-center gap-4 flex-wrap font-mono text-[9px]" style={{ color: "#8A8F98" }}>
            <span className="flex items-center gap-1"><Calendar size={11} style={{ color: COLOR }} />45 days · 7 weeks</span>
            <span className="flex items-center gap-1"><BookOpen size={11} style={{ color: COLOR }} />{lessons.length} lessons</span>
            <span className="flex items-center gap-1"><Award size={11} style={{ color: COLOR }} />{totalAssessments} assessments</span>
            <span className="flex items-center gap-1"><Clock size={11} style={{ color: COLOR }} />{course.duration_hours}h</span>
            <span className="flex items-center gap-1"><Hash size={11} style={{ color: COLOR }} />Dial {course.dial_code}</span>
          </div>
        </div>

        {/* Visual placeholder legend */}
        <div className="mb-8 p-4 flex items-start gap-3" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${COLOR}22` }}>
          <ImageIcon size={16} className="flex-shrink-0 mt-0.5" style={{ color: COLOR }} />
          <div>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: COLOR }}>▸ VISUAL PLACEHOLDERS</p>
            <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>Dashed boxes below mark where charts, graphs, illustrations, and diagrams render in the course materials — revenue curves, funnels, timelines, and more.</p>
          </div>
        </div>

        {/* Course-level assessments */}
        <div className="mb-8">
          <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: COLOR }}>▸ COURSE ASSESSMENT STRUCTURE</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {courseQuiz && <QuizStructureCard assessment={courseQuiz} questions={questions} color={COLOR} courseTitle={ct} />}
            {courseTest && <QuizStructureCard assessment={courseTest} questions={questions} color={COLOR} courseTitle={ct} />}
            {courseExam && <QuizStructureCard assessment={courseExam} questions={questions} color={COLOR} courseTitle={ct} />}
          </div>
        </div>

        {/* 45-day schedule by week */}
        <div className="space-y-6">
          {weeks.map((w) => (
            <motion.div key={w.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${COLOR}22` }}>
              {/* Week header */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 flex items-center justify-center font-mono text-sm font-bold" style={{ background: `${COLOR}1a`, color: COLOR }}>W{w.num}</div>
                  <div>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: COLOR }}>WEEK {w.num} · DAYS {(w.num - 1) * 7 + 1}–{(w.num - 1) * 7 + w.lessons.length}</p>
                    <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{w.theme}</p>
                  </div>
                </div>
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{w.lessons.length} DAILY MILESTONES</span>
              </div>

              {/* Visual placeholders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {w.visuals.map((v, i) => (
                  <VisualPlaceholder key={i} Icon={v.Icon} label={v.label} desc={v.desc} color={COLOR} />
                ))}
              </div>

              {/* Section quiz structure */}
              {w.sectionQuiz && (
              <div className="mb-4">
                <QuizStructureCard assessment={w.sectionQuiz} questions={questions} color={COLOR} courseTitle={ct} />
              </div>
              )}

              {/* Daily milestones */}
              <div className="relative pl-5" style={{ borderLeft: `0.5px solid ${COLOR}33` }}>
                {w.lessons.map((l, i) => {
                  const dayNum = (w.num - 1) * 7 + i + 1;
                  return (
                    <div key={l.id} className="relative mb-3 last:mb-0">
                      <div className="absolute -left-[1.4rem] top-1 w-3 h-3 flex items-center justify-center" style={{ background: COLOR, borderRadius: "50%" }}>
                        <Circle size={7} style={{ color: "#05070A" }} />
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 font-mono text-[9px] font-bold mt-0.5 px-2 py-1" style={{ background: `${COLOR}1a`, color: COLOR }}>DAY {dayNum}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{l.title.replace(/^Day \d+ — /, "")}</p>
                          {l.summary && <p className="text-[11px] mt-0.5" style={{ color: "#8A8F98" }}>{l.summary}</p>}
                        </div>
                        <span className="font-mono text-[8px] flex-shrink-0 mt-1" style={{ color: "#8A8F98" }}>{l.duration_minutes}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Final exam + certification */}
        <div className="mt-8 p-5" style={{ background: `${COLOR}10`, border: `0.5px solid ${COLOR}55` }}>
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} style={{ color: COLOR }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: COLOR }}>▸ FINAL CERTIFICATION</p>
          </div>
          <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            Pass the {courseExam ? `${courseExam.passing_score_pct}% ` : ""}final exam to earn a verifiable completion certificate. Daily milestones build week by week; each weekly section quiz locks in the prior week before you advance.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link to={`/courses/${id}`} className="font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ background: COLOR, color: "#05070A" }}>Enroll & Start</Link>
            <Link to={`/courses/${id}/summary`} className="font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>View Summary</Link>
          </div>
        </div>
      </div>
    </div>
  );
}