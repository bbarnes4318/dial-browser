import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, FileText, Bell, Check, ChevronRight, ChevronLeft, X,
  UploadCloud, Loader2, MapPin, Briefcase, Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { FIELDS, FIELD_ICONS, ALERT_TAGS } from "./shared";

const STEPS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "alerts", label: "Alerts", icon: Bell },
];

export default function JobSeekerOnboarding({ onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    full_name: "", phone: "", email: "", desired_location: "",
    experience_years: "", skills: "", work_history: "",
  });
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggleField = (field) => {
    const next = new Set(selectedFields);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    setSelectedFields(next);
  };

  const toggleTag = (tag) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setSelectedTags(next);
  };

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

  const canProceed = () => {
    if (step === 0) return profile.full_name.trim() && profile.phone.trim();
    if (step === 1) return true; // resume is optional
    if (step === 2) return selectedFields.size > 0;
    return false;
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      const skills = profile.skills.split(",").map((s) => s.trim()).filter(Boolean);

      // 1. Create the job seeker profile
      await base44.entities.JobSeekerProfile.create({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        email: profile.email.trim() || undefined,
        desired_location: profile.desired_location.trim() || undefined,
        experience_years: profile.experience_years ? parseFloat(profile.experience_years) : undefined,
        skills: skills.length > 0 ? skills : [],
        work_history: profile.work_history.trim() || undefined,
        resume_url: resumeUrl || undefined,
        onboarding_completed: true,
      });

      // 2. Create job alert subscriptions for each selected field
      if (selectedFields.size > 0) {
        const tagsArr = [...selectedTags];
        const subs = [...selectedFields].map((field) => ({
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim(),
          selected_field: field,
          tags: tagsArr,
          active: true,
        }));
        await base44.entities.JobAlertSubscription.bulkCreate(subs);
      }

      onComplete();
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const inputCls = "w-full px-3 py-2.5 text-[16px] sm:text-sm";
  const inputStyle = { background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" };
  const labelCls = "block font-mono text-[9px] tracking-widest mb-2";

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80]" style={{ background: "rgba(5,7,10,0.9)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.25 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[94%] max-w-lg p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SEEKER ONBOARDING</p>
          </div>
          <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]"><X size={16} style={{ color: "#8A8F98" }} /></button>
        </div>

        {/* Progress steps */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} className="contents">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className="flex items-center justify-center w-9 h-9 transition-all" style={{
                    background: done || active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                    border: `0.5px solid ${done || active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                    borderRadius: "50%",
                  }}>
                    {done ? <Check size={14} style={{ color: "#D1FF26" }} /> : <Icon size={14} style={{ color: active ? "#D1FF26" : "#8A8F98" }} />}
                  </div>
                  <span className="font-mono text-[7px] tracking-widest" style={{ color: active ? "#D1FF26" : "#8A8F98" }}>{s.label.toUpperCase()}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mb-4" style={{ background: i < step ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {/* Step 1: Profile */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>Create your profile</h3>
                  <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>Employers will see this when you apply. You can edit it anytime.</p>
                </div>
                <div>
                  <label className={labelCls} style={{ color: "#8A8F98" }}>FULL NAME *</label>
                  <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} autoFocus className={inputCls} style={inputStyle} placeholder="Jane Doe" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={{ color: "#8A8F98" }}>PHONE *</label>
                    <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className={inputCls} style={inputStyle} placeholder="+1 555 000 0000" />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: "#8A8F98" }}>EMAIL</label>
                    <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputCls} style={inputStyle} placeholder="jane@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><MapPin size={10} /> DESIRED LOCATION</label>
                    <input value={profile.desired_location} onChange={(e) => setProfile({ ...profile, desired_location: e.target.value })} className={inputCls} style={inputStyle} placeholder="Austin, TX or Remote" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Briefcase size={10} /> EXPERIENCE (YEARS)</label>
                    <input type="number" min="0" max="50" value={profile.experience_years} onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })} className={inputCls} style={inputStyle} placeholder="5" />
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={{ color: "#8A8F98" }}>SKILLS (comma-separated)</label>
                  <input value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} className={inputCls} style={inputStyle} placeholder="JavaScript, SEO, Forklift, UI Design…" />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "#8A8F98" }}>WORK HISTORY SUMMARY</label>
                  <textarea value={profile.work_history} onChange={(e) => setProfile({ ...profile, work_history: e.target.value })} rows={3} maxLength={2000} className={`${inputCls} resize-none`} style={inputStyle} placeholder="Briefly describe your previous roles and achievements…" />
                </div>
              </div>
            )}

            {/* Step 2: Resume */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>Upload your resume</h3>
                  <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>Attach your resume so employers can review it when you apply. You can skip this and add it later.</p>
                </div>
                {resumeUrl ? (
                  <div className="p-4 flex items-center justify-between gap-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", borderRadius: "50%" }}><FileText size={16} style={{ color: "#D1FF26" }} /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#D1FF26" }}>{resumeName}</p>
                        <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>✓ UPLOADED</p>
                      </div>
                    </div>
                    <button onClick={() => { setResumeUrl(""); setResumeName(""); }} className="p-2 transition-colors hover:bg-[rgba(239,68,68,0.1)]"><X size={14} style={{ color: "#8A8F98" }} /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors hover:bg-[rgba(209,255,38,0.04)]" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px dashed rgba(209,255,38,0.3)" }}>
                    {uploadingResume ? <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} /> : <UploadCloud size={24} style={{ color: "#D1FF26" }} />}
                    <div className="text-center">
                      <p className="font-mono text-[10px] tracking-widest" style={{ color: uploadingResume ? "#8A8F98" : "#D1FF26" }}>{uploadingResume ? "UPLOADING…" : "CLICK TO UPLOAD"}</p>
                      <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>PDF, DOC, TXT — MAX 10MB</p>
                    </div>
                    <input type="file" accept=".pdf,.doc,.docx,.txt,.rtf" onChange={handleFileSelect} className="hidden" disabled={uploadingResume} />
                  </label>
                )}
                <p className="font-mono text-[8px] text-center" style={{ color: "rgba(138,143,152,0.5)" }}>You can skip this step and upload your resume later.</p>
              </div>
            )}

            {/* Step 3: Alert categories */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>Choose your job alert categories</h3>
                  <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>We'll text you when new jobs are posted in your selected fields. Pick at least one.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {FIELDS.map((field) => {
                    const selected = selectedFields.has(field);
                    return (
                      <button key={field} onClick={() => toggleField(field)} className="flex items-center gap-2 p-3 text-left transition-all" style={{
                        background: selected ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.6)",
                        border: `0.5px solid ${selected ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.1)"}`,
                      }}>
                        <span className="text-sm">{FIELD_ICONS[field]}</span>
                        <span className="flex-1 text-xs font-medium" style={{ color: selected ? "#D1FF26" : "#F5F5F7" }}>{field}</span>
                        {selected && <Check size={12} style={{ color: "#D1FF26" }} />}
                      </button>
                    );
                  })}
                </div>
                <p className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.5)" }}>{selectedFields.size} categor{selectedFields.size === 1 ? "y" : "ies"} selected · SMS alerts are free</p>

                {/* Tag preferences */}
                <div className="pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// PREFERENCE TAGS (OPTIONAL)</p>
                  <p className="text-xs mb-3" style={{ color: "#8A8F98" }}>Narrow down your alerts. Only get notified for jobs matching these tags. Leave empty to receive all matches in your fields.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALERT_TAGS.map((tag) => {
                      const selected = selectedTags.has(tag.id);
                      return (
                        <button key={tag.id} onClick={() => toggleTag(tag.id)} className="flex items-center gap-2 p-3 text-left transition-all" style={{
                          background: selected ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.6)",
                          border: `0.5px solid ${selected ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.1)"}`,
                        }}>
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-medium" style={{ color: selected ? "#D1FF26" : "#F5F5F7" }}>{tag.label}</span>
                            <span className="block font-mono text-[7px] mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>{tag.description}</span>
                          </div>
                          {selected && <Check size={12} style={{ color: "#D1FF26" }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#ef4444" }}>⚠ {error}</p>}

        {/* Navigation */}
        <div className="flex items-center gap-2 mt-6">
          {step > 0 && (
            <button onClick={back} className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
              <ChevronLeft size={12} /> Back
            </button>
          )}
          <button onClick={next} disabled={!canProceed() || saving} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : step === STEPS.length - 1 ? <Check size={13} /> : <ChevronRight size={13} />}
            {saving ? "SAVING…" : step === STEPS.length - 1 ? "FINISH" : "CONTINUE"}
          </button>
        </div>
      </motion.div>
    </>
  );
}