import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, X, Send, Loader2, Check, UploadCloud, FileText, Briefcase, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { FIELDS, JOB_TYPES } from "./shared";

export default function ApplyDialog({ job, onClose, onApplied }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", notes: "",
    skills: "", experienceYears: "", workHistory: "", desiredLocation: "",
  });
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Resume file too large (max 10MB).");
      return;
    }
    setUploadingResume(true);
    setError(null);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setResumeUrl(result.file_url);
      setResumeName(file.name);
    } catch {
      setError("Could not upload resume. Please try again.");
    } finally {
      setUploadingResume(false);
    }
  };

  const removeResume = () => {
    setResumeUrl("");
    setResumeName("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await base44.entities.JobApplication.create({
        applicant_name: form.name.trim(),
        applicant_phone: form.phone.trim(),
        applicant_email: form.email.trim() || undefined,
        job_listing_id: job.id,
        job_title: job.title,
        company: job.company,
        field: job.field || "General",
        notes: form.notes.trim() || undefined,
        status: "submitted",
        resume_url: resumeUrl || undefined,
        skills: skills.length > 0 ? skills : undefined,
        experience_years: form.experienceYears ? parseFloat(form.experienceYears) : undefined,
        work_history: form.workHistory.trim() || undefined,
        desired_location: form.desiredLocation.trim() || undefined,
      });
      setDone(true);
      setTimeout(() => { onClose(); onApplied(); }, 2000);
    } catch {
      setError("Could not submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 text-[16px] sm:text-sm";
  const inputStyle = { background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" };
  const labelCls = "block font-mono text-[9px] tracking-widest mb-2";

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80]" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.25 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-lg p-6 max-h-[88vh] overflow-y-auto" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}>
        {done ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", borderRadius: "50%" }}><Check size={26} style={{ color: "#D1FF26" }} /></div>
            <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>Application Sent!</p>
            <p className="text-xs" style={{ color: "#8A8F98" }}>We'll text you at {form.phone} with next steps.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// APPLY FOR JOB</p>
                <h3 className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{job.title}</h3>
                <p className="text-xs" style={{ color: "#8A8F98" }}>{job.company}</p>
              </div>
              <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]"><X size={16} style={{ color: "#8A8F98" }} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {/* Contact */}
              <div>
                <label className={labelCls} style={{ color: "#8A8F98" }}>FULL NAME *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus className={inputCls} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Phone size={10} /> PHONE *</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Mail size={10} /> EMAIL</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} style={inputStyle} />
                </div>
              </div>

              {/* Profile enrichment */}
              <div>
                <label className={labelCls} style={{ color: "#8A8F98" }}>SKILLS (comma-separated)</label>
                <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="JavaScript, SEO, Forklift, UI Design…" className={inputCls} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Briefcase size={10} /> EXPERIENCE (YEARS)</label>
                  <input type="number" min="0" max="50" step="1" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} placeholder="5" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><MapPin size={10} /> DESIRED LOCATION</label>
                  <input value={form.desiredLocation} onChange={(e) => setForm({ ...form, desiredLocation: e.target.value })} placeholder="Austin, TX or Remote" className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: "#8A8F98" }}>WORK HISTORY SUMMARY</label>
                <textarea value={form.workHistory} onChange={(e) => setForm({ ...form, workHistory: e.target.value })} rows={3} maxLength={2000} placeholder="Briefly describe your previous roles and achievements…" className={`${inputCls} resize-none`} style={inputStyle} />
              </div>

              {/* Resume upload */}
              <div>
                <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><FileText size={10} /> RESUME / CV</label>
                {resumeUrl ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <span className="flex items-center gap-2 text-xs truncate" style={{ color: "#D1FF26" }}><FileText size={12} /> {resumeName}</span>
                    <button type="button" onClick={removeResume} className="p-1 hover:bg-[rgba(239,68,68,0.1)]"><X size={12} style={{ color: "#8A8F98" }} /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-3 py-3 cursor-pointer transition-colors hover:bg-[rgba(209,255,38,0.04)]" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px dashed rgba(209,255,38,0.3)" }}>
                    {uploadingResume ? <Loader2 size={14} className="animate-spin" style={{ color: "#D1FF26" }} /> : <UploadCloud size={14} style={{ color: "#D1FF26" }} />}
                    <span className="font-mono text-[10px] tracking-widest" style={{ color: uploadingResume ? "#8A8F98" : "#D1FF26" }}>{uploadingResume ? "UPLOADING…" : "UPLOAD RESUME (PDF, DOC, TXT — MAX 10MB)"}</span>
                    <input type="file" accept=".pdf,.doc,.docx,.txt,.rtf" onChange={handleFileSelect} className="hidden" disabled={uploadingResume} />
                  </label>
                )}
              </div>

              <div>
                <label className={labelCls} style={{ color: "#8A8F98" }}>MESSAGE TO EMPLOYER (OPTIONAL)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} maxLength={1000} className={`${inputCls} resize-none`} style={inputStyle} />
              </div>

              {error && <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>}
              <button type="submit" disabled={submitting || uploadingResume || !form.name.trim() || !form.phone.trim()} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit Application
              </button>
            </form>
          </>
        )}
      </motion.div>
    </>
  );
}