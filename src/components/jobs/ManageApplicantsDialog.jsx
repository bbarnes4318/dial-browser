import React, { useState, useMemo } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Lock, Mail, Phone, ChevronRight, Loader2, BadgeCheck, Check,
  Eye, UserCheck, UserX, Trophy, FileText, Briefcase, MapPin, Clock, Target,
  CheckSquare, Square, Archive,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { STATUS_STYLES, FIELD_ICONS } from "./shared";
import { getExperienceLabel, computeApplicantMatchScore, getScoreStyle } from "./matchScore";
import BulkActionBar from "./BulkActionBar";

export default function ManageApplicantsDialog({ job, applicants, hasAccess, onClose, onRefresh }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = scoredApplicants.map(({ app }) => app.id);
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkReviewed = async () => {
    setBulkBusy(true);
    try {
      const ids = [...selectedIds];
      await base44.entities.JobApplication.bulkUpdate(ids.map((id) => ({ id, status: "viewed" })));
      clearSelection();
      onRefresh();
    } catch { /* ignore */ } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkArchive = async () => {
    setBulkBusy(true);
    try {
      const ids = [...selectedIds];
      await base44.entities.JobApplication.bulkUpdate(ids.map((id) => ({ id, status: "archived" })));
      clearSelection();
      onRefresh();
    } catch { /* ignore */ } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkSendUpdates = async (status) => {
    setBulkBusy(true);
    try {
      const ids = [...selectedIds];
      await base44.functions.invoke("sendBulkStatusUpdates", {
        applicant_ids: ids,
        status,
        job_title: job.title,
        company: job.company,
      });
      clearSelection();
      onRefresh();
    } catch { /* ignore */ } finally {
      setBulkBusy(false);
    }
  };

  // Compute match scores and sort applicants by score (highest first)
  const scoredApplicants = useMemo(() => {
    if (!applicants || applicants.length === 0) return [];
    return applicants
      .map((app) => {
        const score = computeApplicantMatchScore(app, job);
        return { app, score };
      })
      .sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
  }, [applicants, job]);

  const updateStatus = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      await base44.entities.JobApplication.update(appId, { status: newStatus });
      onRefresh();
    } catch { /* ignore */ } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setCheckingOut(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("create-checkout", {
        plan: "employer_access",
        employer_name: form.name.trim(),
        employer_email: form.email.trim(),
        job_listing_id: job.id,
        job_title: job.title,
        company: job.company,
      });
      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        setError("Could not start checkout. Please try again.");
      }
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80]" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.25 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-lg p-6 max-h-[88vh] overflow-y-auto" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// MANAGE APPLICANTS</p>
            <h3 className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{job.title}</h3>
            <p className="text-xs" style={{ color: "#8A8F98" }}>{job.company}</p>
          </div>
          <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]"><X size={16} style={{ color: "#8A8F98" }} /></button>
        </div>

        {!hasAccess ? (
          <div>
            <div className="p-4 mb-4" style={{ background: "rgba(209,255,38,0.03)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>APPLICANT DETAILS LOCKED</p>
              </div>
              <p className="text-[11px]" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                <span style={{ color: "#F5F5F7", fontWeight: 700 }}>{applicants.length}</span> applicant{applicants.length === 1 ? "" : "s"} waiting. Pay a one-time fee of <span style={{ color: "#D1FF26", fontWeight: 700 }}>$9.99</span> to unlock full contact details, resumes, and applicant status management.
              </p>
            </div>
            {/* Summarized preview (no contact info) — sorted by match score */}
            {scoredApplicants.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>PREVIEW · RANKED BY MATCH · CONTACT HIDDEN</p>
                {scoredApplicants.slice(0, 4).map(({ app, score }) => {
                  const st = getScoreStyle(score?.total);
                  return (
                    <div key={app.id} className="p-3 flex items-center gap-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                      <div className="flex items-center justify-center w-9 h-9 flex-shrink-0 font-heading font-bold text-xs" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", borderRadius: "50%" }}>{(app.applicant_name || "?").charAt(0).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{app.applicant_name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {app.experience_years != null && <span className="font-mono text-[7px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{getExperienceLabel(app.experience_years)} · {app.experience_years}y</span>}
                          {(app.skills || []).slice(0, 2).map((s, i) => <span key={i} className="font-mono text-[7px] px-1.5 py-0.5" style={{ background: "rgba(16,20,29,0.6)", color: "#8A8F98" }}>{s}</span>)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="font-mono text-sm font-bold tabular-nums" style={{ color: st.color }}>{score?.total ?? "—"}<span className="text-[8px]" style={{ color: "#8A8F98" }}>/100</span></span>
                        <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: st.bg, color: st.color }}>{st.label.toUpperCase()}</span>
                      </div>
                      <Lock size={12} style={{ color: "rgba(138,143,152,0.4)" }} />
                    </div>
                  );
                })}
                {scoredApplicants.length > 4 && <p className="font-mono text-[8px] text-center" style={{ color: "rgba(138,143,152,0.5)" }}>+{scoredApplicants.length - 4} more</p>}
              </div>
            )}
            <form onSubmit={handleCheckout}>
              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR NAME *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
              <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Mail size={10} /> EMAIL *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
              {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}
              <button type="submit" disabled={checkingOut || !form.name.trim() || !form.email.trim()} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                {checkingOut ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />} Unlock for $9.99
              </button>
              <p className="font-mono text-[8px] text-center mt-3" style={{ color: "rgba(138,143,152,0.5)" }}>Secure payment via Dial Pay</p>
            </form>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO APPLICANTS YET</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Applicants who apply will appear here with full contact details</p>
          </div>
        ) : (
          <>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 mb-3 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>ACCESS UNLOCKED · {scoredApplicants.length} APPLICANT{scoredApplicants.length === 1 ? "" : "S"} · RANKED BY MATCH</p>
              </div>
              <button onClick={() => selectedIds.size === scoredApplicants.length && scoredApplicants.length > 0 ? clearSelection() : selectAll()} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase transition-colors hover:text-[#D1FF26] flex-shrink-0" style={{ color: selectedIds.size > 0 ? "#D1FF26" : "#8A8F98" }}>
                {selectedIds.size === scoredApplicants.length && scoredApplicants.length > 0 ? <CheckSquare size={12} /> : <Square size={12} />}
                {selectedIds.size === scoredApplicants.length && scoredApplicants.length > 0 ? "Deselect All" : "Select All"}
              </button>
            </div>
            {scoredApplicants.map(({ app, score }) => {
              const st = STATUS_STYLES[app.status] || STATUS_STYLES.submitted;
              const skills = app.skills || [];
              const scoreStyle = getScoreStyle(score?.total);
              const matchedSet = new Set((score?.matchedSkills || []).map((s) => s.toLowerCase()));
              return (
                <div key={app.id} className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${scoreStyle.color === "#D1FF26" ? "rgba(209,255,38,0.25)" : "rgba(209,255,38,0.1)"}` }}>
                  <div className="flex items-start gap-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelected(app.id); }} className="flex-shrink-0 mt-1 transition-transform hover:scale-110">
                      {selectedIds.has(app.id) ? <CheckSquare size={16} style={{ color: "#D1FF26" }} /> : <Square size={16} style={{ color: "rgba(138,143,152,0.4)" }} />}
                    </button>
                    <div className="flex items-center justify-center w-9 h-9 flex-shrink-0 font-heading font-bold text-xs" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", borderRadius: "50%" }}>{(app.applicant_name || "?").charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{app.applicant_name}</p>
                        {app.experience_years != null && (
                          <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{getExperienceLabel(app.experience_years)} · {app.experience_years}y</span>
                        )}
                        <span className="inline-block font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: st.bg, color: st.color }}>{app.status.toUpperCase()}</span>
                      </div>
                      {/* Match score badge */}
                      {score && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1.5 px-2 py-0.5" style={{ background: scoreStyle.bg, border: `0.5px solid ${scoreStyle.color}33` }}>
                            <Target size={9} style={{ color: scoreStyle.color }} />
                            <span className="font-mono text-[9px] font-bold tabular-nums" style={{ color: scoreStyle.color }}>{score.total}/100</span>
                            <span className="font-mono text-[7px] tracking-widest" style={{ color: scoreStyle.color }}>{scoreStyle.label.toUpperCase()}</span>
                          </div>
                          {score.matchedSkills.length > 0 && (
                            <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>{score.matchedSkills.length} skill match{score.matchedSkills.length === 1 ? "" : "es"}</span>
                          )}
                        </div>
                      )}
                      {/* Contact */}
                      <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-1.5 text-[11px] mt-1 transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}><Phone size={10} /> {app.applicant_phone}</a>
                      {app.applicant_email && <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1.5 text-[11px] mt-0.5 transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}><Mail size={10} /> {app.applicant_email}</a>}

                      {/* Skills — matched skills highlighted */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {skills.slice(0, 8).map((s, i) => {
                            const isMatched = matchedSet.has(s.toLowerCase()) || [...matchedSet].some((m) => s.toLowerCase().includes(m) || m.includes(s.toLowerCase()));
                            return <span key={i} className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: isMatched ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)", color: isMatched ? "#D1FF26" : "#8A8F98", border: isMatched ? "0.5px solid rgba(209,255,38,0.3)" : "none" }}>{isMatched && <Check size={7} className="inline mr-0.5" />}{s}</span>;
                          })}
                        </div>
                      )}

                      {/* Desired location */}
                      {app.desired_location && (
                        <p className="flex items-center gap-1 text-[10px] mt-1.5" style={{ color: "rgba(138,143,152,0.7)" }}><MapPin size={9} /> {app.desired_location}</p>
                      )}

                      {/* Work history */}
                      {app.work_history && (
                        <p className="text-[11px] mt-2 p-2" style={{ background: "rgba(16,20,29,0.4)", color: "#8A8F98", lineHeight: 1.4 }}>{app.work_history}</p>
                      )}

                      {/* Resume */}
                      {app.resume_url && (
                        <a href={proxyMediaUrl(app.resume_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                          <FileText size={10} /> View Resume
                        </a>
                      )}

                      {/* Notes */}
                      {app.notes && <p className="text-[11px] mt-2 p-2" style={{ background: "rgba(16,20,29,0.4)", color: "rgba(138,143,152,0.7)", lineHeight: 1.4 }}>"{app.notes}"</p>}
                    </div>
                  </div>
                  {/* Status actions */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                    {[
                      { id: "viewed", label: "Viewed", icon: Eye },
                      { id: "shortlisted", label: "Shortlist", icon: UserCheck },
                      { id: "interview_requested", label: "Interview", icon: UserCheck },
                      { id: "rejected", label: "Reject", icon: UserX },
                      { id: "hired", label: "Hire", icon: Trophy },
                      { id: "archived", label: "Archive", icon: Archive },
                    ].map((act) => {
                      const active = app.status === act.id;
                      const Icon = act.icon;
                      return (
                        <button key={act.id} onClick={() => updateStatus(app.id, act.id)} disabled={updatingId === app.id || active} className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-30" style={{ background: active ? st.bg : "rgba(16,20,29,0.4)", border: `0.5px solid ${active ? st.color : "rgba(138,143,152,0.15)"}`, color: active ? st.color : "#8A8F98" }}>
                          <Icon size={10} /> {act.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <BulkActionBar
            selectedCount={selectedIds.size}
            onClear={clearSelection}
            onMarkReviewed={handleBulkReviewed}
            onArchive={handleBulkArchive}
            onSendUpdates={handleBulkSendUpdates}
          />
          </>
        )}
      </motion.div>
    </>
  );
}