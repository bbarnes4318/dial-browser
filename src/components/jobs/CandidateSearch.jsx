import React, { useState, useMemo, useEffect, useCallback } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Filter, Users, X, Phone, Mail, Briefcase,
  Loader2, ChevronDown, ChevronUp, Sparkles, FileText, RotateCcw,
  Lock, Target, Award, BadgeCheck,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { FIELDS, STATUS_STYLES, FIELD_ICONS } from "./shared";
import { computeMatchScore, getScoreStyle, getExperienceLabel } from "./matchScore";
import SkillFilterSidebar from "./SkillFilterSidebar";
import EndorsementBadges from "./EndorsementBadges";
import EndorsementDialog from "./EndorsementDialog";

const EXP_RANGES = {
  entry: { min: 0, max: 2 },
  mid: { min: 3, max: 5 },
  senior: { min: 6, max: Infinity },
};

/**
 * CandidateSearch — visual gallery of candidate profiles with match scoring.
 * Includes a skill-based filter sidebar with checkboxes for technologies and
 * experience levels.
 */
export default function CandidateSearch({ applications, listings, accessByJob = {}, onManageApplicants }) {
  const [query, setQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedExp, setSelectedExp] = useState(new Set());
  const [selectedSkills, setSelectedSkills] = useState(new Set());
  const [jobFilter, setJobFilter] = useState("all");
  const [matchJobId, setMatchJobId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [endorsements, setEndorsements] = useState([]);
  const [endorsingCandidate, setEndorsingCandidate] = useState(null);

  // Load all endorsements once, then filter by candidate phone in render
  const loadEndorsements = useCallback(async () => {
    try {
      const data = await base44.entities.SkillEndorsement.list("-created_date", 200);
      setEndorsements(data || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => { loadEndorsements(); }, [loadEndorsements]);

  const getEndorsementsFor = (phone) => {
    const normalized = (phone || "").trim().toLowerCase();
    return endorsements.filter((e) => (e.candidate_phone || "").trim().toLowerCase() === normalized);
  };

  const jobMap = useMemo(() => {
    const m = {};
    for (const j of listings) m[j.id] = j;
    return m;
  }, [listings]);

  // Deduplicate applicants by phone — aggregate profile data across applications
  const candidates = useMemo(() => {
    const byPhone = {};
    for (const app of applications) {
      const key = (app.applicant_phone || "").trim().toLowerCase();
      if (!key) continue;
      if (!byPhone[key]) {
        byPhone[key] = {
          name: app.applicant_name,
          phone: app.applicant_phone,
          email: app.applicant_email,
          applications: [],
          fields: new Set(),
          companies: new Set(),
          jobTitles: new Set(),
          locations: new Set(),
          notes: [],
          statuses: [],
          skills: new Set(),
          experienceYears: 0,
          workHistory: "",
          desiredLocation: "",
          resumeUrl: "",
        };
      }
      const c = byPhone[key];
      c.applications.push(app);
      if (app.field) c.fields.add(app.field);
      if (app.company) c.companies.add(app.company);
      if (app.job_title) c.jobTitles.add(app.job_title);
      const job = jobMap[app.job_listing_id];
      if (job?.location) c.locations.add(job.location);
      if (app.notes) c.notes.push(app.notes);
      if (app.status) c.statuses.push(app.status);
      if (app.skills) app.skills.forEach((s) => c.skills.add(s));
      c.experienceYears = Math.max(c.experienceYears, app.experience_years || 0);
      if (app.work_history) c.workHistory = app.work_history;
      if (app.desired_location) c.desiredLocation = app.desired_location;
      if (app.resume_url) c.resumeUrl = app.resume_url;
    }
    return Object.values(byPhone);
  }, [applications, jobMap]);

  // Collect all unique skills from candidates to show in the sidebar
  const allCandidateSkills = useMemo(() => {
    const set = new Set();
    for (const c of candidates) c.skills.forEach((s) => set.add(s));
    return [...set];
  }, [candidates]);

  const matchJob = matchJobId !== "all" ? jobMap[matchJobId] : null;

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  const toggleExp = (levelId) => {
    setSelectedExp((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  };

  const clearSkillFilters = () => {
    setSelectedSkills(new Set());
    setSelectedExp(new Set());
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    let result = candidates.filter((c) => {
      const haystack = [c.name, c.email, c.phone, ...c.notes, ...c.jobTitles, ...c.companies, ...c.locations, ...c.skills].join(" ").toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesField = fieldFilter === "all" || c.fields.has(fieldFilter);
      const matchesStatus = statusFilter === "all" || c.statuses.includes(statusFilter);
      const matchesJob = jobFilter === "all" || c.applications.some((a) => a.job_listing_id === jobFilter);

      // Experience level checkboxes — empty = all levels
      const matchesExp = selectedExp.size === 0 || [...selectedExp].some((id) => {
        const range = EXP_RANGES[id];
        if (!range) return false;
        return c.experienceYears >= range.min && c.experienceYears <= range.max;
      });

      // Skill checkboxes — empty = all skills; candidate must have at least one checked skill
      const matchesSkills = selectedSkills.size === 0 || [...selectedSkills].some((skill) => {
        const skillLower = skill.toLowerCase();
        return [...c.skills].some((s) => s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase()));
      });

      return matchesQuery && matchesField && matchesStatus && matchesExp && matchesJob && matchesSkills;
    });

    // Sort by match score if a job is selected
    if (matchJob) {
      result = result
        .map((c) => ({ c, score: computeMatchScore(c, matchJob)?.total || 0 }))
        .sort((a, b) => b.score - a.score)
        .map((x) => x.c);
    }

    return result;
  }, [candidates, query, fieldFilter, statusFilter, selectedExp, selectedSkills, jobFilter, matchJob]);

  const activeFilterCount =
    (fieldFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (jobFilter !== "all" ? 1 : 0) +
    selectedExp.size +
    selectedSkills.size;

  const resetFilters = () => {
    setQuery("");
    setFieldFilter("all");
    setStatusFilter("all");
    setJobFilter("all");
    clearSkillFilters();
  };

  const selectCls = "w-full px-3 py-2.5 text-sm";
  const selectStyle = { background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Skill filter sidebar */}
      <aside className="lg:w-56 lg:flex-shrink-0">
        <SkillFilterSidebar
          selectedSkills={selectedSkills}
          toggleSkill={toggleSkill}
          selectedExp={selectedExp}
          toggleExp={toggleExp}
          onClear={clearSkillFilters}
          availableSkills={allCandidateSkills}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Search + match selector */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <Search size={14} style={{ color: "#8A8F98" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, skills, notes, company…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
            {query && <button onClick={() => setQuery("")} className="p-1 hover:bg-[rgba(138,143,152,0.1)]"><X size={12} style={{ color: "#8A8F98" }} /></button>}
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <Target size={14} style={{ color: "#D1FF26" }} />
            <select value={matchJobId} onChange={(e) => setMatchJobId(e.target.value)} className="bg-transparent text-sm outline-none cursor-pointer" style={{ color: matchJob ? "#D1FF26" : "#8A8F98" }}>
              <option value="all" style={{ background: "#10141D" }}>No match scoring</option>
              {listings.map((j) => <option key={j.id} value={j.id} style={{ background: "#10141D" }}>{j.title}</option>)}
            </select>
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all whitespace-nowrap" style={{ background: showFilters || activeFilterCount > 0 ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${showFilters || activeFilterCount > 0 ? "rgba(209,255,38,0.3)" : "rgba(209,255,38,0.1)"}`, color: showFilters || activeFilterCount > 0 ? "#D1FF26" : "#8A8F98" }}>
            <Filter size={12} /> Filters
            {activeFilterCount > 0 && <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>{activeFilterCount}</span>}
          </button>
        </div>

        {/* Expandable filter panel — field, status, job (skills & experience are in the sidebar) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden mb-4">
              <div className="p-4 grid sm:grid-cols-3 gap-4" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>FIELD / SKILL AREA</label>
                  <select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)} className={selectCls} style={selectStyle}>
                    <option value="all" style={{ background: "#10141D" }}>All Fields</option>
                    {FIELDS.map((f) => <option key={f} value={f} style={{ background: "#10141D" }}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>APPLICATION STATUS</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls} style={selectStyle}>
                    <option value="all" style={{ background: "#10141D" }}>All Statuses</option>
                    <option value="submitted" style={{ background: "#10141D" }}>Submitted</option>
                    <option value="viewed" style={{ background: "#10141D" }}>Viewed</option>
                    <option value="shortlisted" style={{ background: "#10141D" }}>Shortlisted</option>
                    <option value="rejected" style={{ background: "#10141D" }}>Rejected</option>
                    <option value="hired" style={{ background: "#10141D" }}>Hired</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>APPLIED TO JOB</label>
                  <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className={selectCls} style={selectStyle}>
                    <option value="all" style={{ background: "#10141D" }}>All Jobs</option>
                    {listings.map((j) => <option key={j.id} value={j.id} style={{ background: "#10141D" }}>{j.title} — {j.company}</option>)}
                  </select>
                </div>
                {activeFilterCount > 0 && (
                  <div className="sm:col-span-3 flex justify-end">
                    <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                      <RotateCcw size={10} /> Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        {filtered.length > 0 && (
          <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>
            {filtered.length} CANDIDATE{filtered.length === 1 ? "" : "S"}
            {matchJob && <span style={{ color: "#D1FF26" }}> · RANKED BY MATCH FOR {matchJob.title.toUpperCase()}</span>}
            {candidates.length !== filtered.length && ` · ${candidates.length} TOTAL`}
          </p>
        )}

        {/* Gallery grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
            <Users size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>{candidates.length === 0 ? "NO CANDIDATES YET" : "NO MATCHES FOUND"}</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>{candidates.length === 0 ? "Candidates will appear here once applications come in" : "Try adjusting your search terms or filters"}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((c, idx) => {
                const key = c.phone;
                const isExpanded = expanded === key;
                const latestStatus = c.statuses[c.statuses.length - 1] || "submitted";
                const st = STATUS_STYLES[latestStatus] || STATUS_STYLES.submitted;
                const fieldsArr = [...c.fields];
                const locArr = [...c.locations];
                const skillsArr = [...c.skills];
                const score = matchJob ? computeMatchScore(c, matchJob) : null;
                const scoreStyle = score ? getScoreStyle(score.total) : null;
                const expLabel = getExperienceLabel(c.experienceYears);
                const hasAccess = c.applications.some((a) => accessByJob[a.job_listing_id]);
                const candidateEndorsements = getEndorsementsFor(c.phone);

                return (
                  <motion.div
                    key={key} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.1) }}
                    className="relative flex flex-col overflow-hidden" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${scoreStyle && score.total >= 75 ? "rgba(209,255,38,0.3)" : "rgba(209,255,38,0.1)"}` }}
                  >
                    {/* Match score badge */}
                    {score && (
                      <div className="absolute top-2 right-2 z-10 flex flex-col items-center justify-center w-12 h-12" style={{ background: scoreStyle.bg, border: `0.5px solid ${scoreStyle.color}`, borderRadius: "50%" }}>
                        <span className="font-heading font-black text-sm leading-none" style={{ color: scoreStyle.color }}>{score.total}</span>
                        <span className="font-mono text-[6px] tracking-widest leading-none mt-0.5" style={{ color: scoreStyle.color }}>MATCH</span>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="p-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-[rgba(209,255,38,0.02)]" onClick={() => setExpanded(isExpanded ? null : key)}>
                      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0 font-heading font-bold text-sm" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", borderRadius: "50%" }}>{(c.name || "?").charAt(0).toUpperCase()}</div>
                      <div className="flex-1 min-w-0" style={{ marginRight: score ? "48px" : "0" }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{c.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {c.experienceYears > 0 && <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{expLabel} · {c.experienceYears}y</span>}
                          <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: st.bg, color: st.color }}>{latestStatus.toUpperCase()}</span>
                          {c.applications.length > 1 && <span className="font-mono text-[7px] px-1.5 py-0.5" style={{ background: "rgba(16,20,29,0.6)", color: "#8A8F98" }}>{c.applications.length} APPS</span>}
                        </div>
                        {/* Skill tags */}
                        {skillsArr.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {skillsArr.slice(0, 3).map((s, i) => <span key={i} className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{s}</span>)}
                            {skillsArr.length > 3 && <span className="font-mono text-[8px] py-0.5" style={{ color: "rgba(138,143,152,0.5)" }}>+{skillsArr.length - 3}</span>}
                          </div>
                        )}
                        {/* Locations */}
                        {locArr.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {locArr.slice(0, 2).map((l, i) => <span key={i} className="flex items-center gap-0.5 font-mono text-[8px] px-2 py-0.5" style={{ background: "rgba(16,20,29,0.6)", color: "#8A8F98" }}><MapPin size={8} /> {l}</span>)}
                          </div>
                        )}
                        {/* Endorsement badges */}
                        <EndorsementBadges endorsements={candidateEndorsements} />
                      </div>
                      <div className="flex-shrink-0 pt-1">{isExpanded ? <ChevronUp size={16} style={{ color: "#8A8F98" }} /> : <ChevronDown size={16} style={{ color: "#8A8F98" }} />}</div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                            {/* Score breakdown */}
                            {score && (
                              <div className="mb-3 mt-3 p-2" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                                <p className="font-mono text-[8px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}><Award size={9} className="inline mr-1" />MATCH BREAKDOWN</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {[
                                    { label: "Field", pts: score.field, max: 30 },
                                    { label: "Location", pts: score.location, max: 25 },
                                    { label: "Skills", pts: score.skills, max: 25 },
                                    { label: "Experience", pts: Math.round(score.experience), max: 20 },
                                  ].map((b) => (
                                    <div key={b.label} className="flex items-center justify-between">
                                      <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{b.label}</span>
                                      <span className="font-mono text-[8px]" style={{ color: b.pts >= b.max * 0.6 ? "#D1FF26" : "#8A8F98" }}>{Math.round(b.pts)}/{b.max}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Contact — gated by access */}
                            {hasAccess ? (
                              <div className="flex flex-wrap gap-4 mb-3 mt-3">
                                <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-[11px] transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}><Phone size={11} /> {c.phone}</a>
                                {c.email && <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-[11px] transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}><Mail size={11} /> {c.email}</a>}
                                {c.resumeUrl && (
                                  <a href={proxyMediaUrl(c.resumeUrl)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-[11px] transition-colors hover:text-[#D1FF26]" style={{ color: "#D1FF26" }}><FileText size={11} /> View Resume</a>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mb-3 mt-3 p-2.5" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                                <Lock size={12} style={{ color: "rgba(138,143,152,0.5)" }} />
                                <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.6)" }}>Contact details locked — unlock a job listing to view</p>
                              </div>
                            )}

                            {/* Desired location */}
                            {c.desiredLocation && (
                              <p className="flex items-center gap-1 text-[10px] mb-2" style={{ color: "rgba(138,143,152,0.7)" }}><MapPin size={9} /> Prefers: {c.desiredLocation}</p>
                            )}

                            {/* All skills */}
                            {skillsArr.length > 0 && (
                              <div className="mb-3">
                                <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>SKILLS ({skillsArr.length})</p>
                                <div className="flex flex-wrap gap-1">
                                  {skillsArr.map((s, i) => <span key={i} className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{s}</span>)}
                                </div>
                              </div>
                            )}

                            {/* Endorse skills button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setEndorsingCandidate({ name: c.name, phone: c.phone }); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 mb-3 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
                              style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
                            >
                              <BadgeCheck size={10} /> Endorse Skills
                              {candidateEndorsements.length > 0 && <span className="font-mono text-[7px] px-1 py-0.5" style={{ background: "rgba(209,255,38,0.15)" }}>{candidateEndorsements.length}</span>}
                            </button>

                            {/* Work history */}
                            {c.workHistory && (
                              <div className="mb-3">
                                <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>WORK HISTORY</p>
                                <p className="text-[11px] p-2" style={{ background: "rgba(16,20,29,0.4)", color: "#8A8F98", lineHeight: 1.4 }}>{c.workHistory}</p>
                              </div>
                            )}

                            {/* Application history */}
                            <div>
                              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Briefcase size={9} className="inline mr-1" />APPLICATION HISTORY ({c.applications.length})</p>
                              <div className="space-y-1.5">
                                {c.applications.map((app) => {
                                  const job = jobMap[app.job_listing_id];
                                  const ast = STATUS_STYLES[app.status] || STATUS_STYLES.submitted;
                                  return (
                                    <div key={app.id} className="flex items-center justify-between gap-2 p-2" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-semibold truncate" style={{ color: "#F5F5F7" }}>{app.job_title}</p>
                                        <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{app.company}{job?.location ? ` · ${job.location}` : ""}</p>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: ast.bg, color: ast.color }}>{app.status.toUpperCase()}</span>
                                        {job && (
                                          <button onClick={(e) => { e.stopPropagation(); onManageApplicants(job); }} className="font-mono text-[8px] tracking-widest uppercase transition-colors hover:text-[#D1FF26] flex items-center gap-0.5" style={{ color: "#8A8F98" }}>
                                            <Sparkles size={9} /> Manage
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {endorsingCandidate && (
          <EndorsementDialog
            candidate={endorsingCandidate}
            onClose={() => setEndorsingCandidate(null)}
            onSaved={loadEndorsements}
          />
        )}
      </AnimatePresence>
    </div>
  );
}