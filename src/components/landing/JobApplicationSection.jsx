import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Briefcase, MapPin, DollarSign, Phone, Mail, X, Loader2,
  Check, Lock, Users, Building2, Send, ChevronRight, BadgeCheck,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const FIELDS = [
  "Technology", "Telecom", "Marketing", "Design", "Hardware",
  "Sales", "Logistics", "Community", "Accessibility", "General",
];

const FIELD_ICONS = {
  Technology: "💻", Telecom: "📡", Marketing: "📣", Design: "🎨",
  Hardware: "🔧", Sales: "🤝", Logistics: "📦", Community: "🌍",
  Accessibility: "♿", General: "📋",
};

export default function JobApplicationSection() {
  const [mode, setMode] = useState("seeker"); // seeker | employer
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [applyingTo, setApplyingTo] = useState(null);
  const [employerPanel, setEmployerPanel] = useState(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const data = await base44.entities.JobListing.filter({ active: true }, "-created_date", 100);
      setListings(data || []);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return listings.filter((l) => {
      const matchesQuery = !q ||
        (l.title || "").toLowerCase().includes(q) ||
        (l.company || "").toLowerCase().includes(q) ||
        (l.location || "").toLowerCase().includes(q);
      const matchesField = fieldFilter === "all" || l.field === fieldFilter;
      return matchesQuery && matchesField;
    });
  }, [listings, query, fieldFilter]);

  return (
    <section id="jobs" className="snap-section py-16 lg:py-24 px-4 lg:px-8" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// 1 CALL JOBS</p>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Find Work. <span style={{ color: "#D1FF26" }}>One Call Away.</span>
          </h2>
          <p className="text-sm lg:text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Search open positions across every field. Apply in seconds with just your name and phone number — no resume, no account, no friction. Employers unlock applicant details on demand.
          </p>
        </motion.div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("seeker")}
            className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{
              background: mode === "seeker" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${mode === "seeker" ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
              color: mode === "seeker" ? "#D1FF26" : "#8A8F98",
            }}
          >
            <Search size={14} /> Job Seeker
          </button>
          <button
            onClick={() => setMode("employer")}
            className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{
              background: mode === "employer" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${mode === "employer" ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
              color: mode === "employer" ? "#D1FF26" : "#8A8F98",
            }}
          >
            <Building2 size={14} /> Employer
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <Search size={14} style={{ color: "#8A8F98" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === "seeker" ? "Search jobs by title, company, or location…" : "Search your postings…"}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#F5F5F7" }}
            />
          </div>
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-transparent"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
          >
            <option value="all" style={{ background: "#10141D" }}>All Fields</option>
            {FIELDS.map((f) => (
              <option key={f} value={f} style={{ background: "#10141D" }}>{f}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {!loading && filtered.length > 0 && (
          <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>
            {filtered.length} OPEN {filtered.length === 1 ? "POSITION" : "POSITIONS"}
          </p>
        )}

        {/* Job grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
            <Briefcase size={36} style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO OPEN POSITIONS</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Check back soon — new jobs are posted daily</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
                  className="p-5 flex flex-col"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}
                >
                  {/* Field badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                      {FIELD_ICONS[job.field] || "📋"} {job.field || "GENERAL"}
                    </span>
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{job.job_type}</span>
                  </div>

                  <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>{job.title}</h3>
                  <p className="text-xs mb-3" style={{ color: "#8A8F98" }}>{job.company}</p>

                  <div className="space-y-1.5 mb-4 flex-1">
                    {job.location && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "#8A8F98" }}>
                        <MapPin size={11} style={{ color: "rgba(209,255,38,0.5)" }} /> {job.location}
                      </div>
                    )}
                    {job.pay && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "#8A8F98" }}>
                        <DollarSign size={11} style={{ color: "rgba(209,255,38,0.5)" }} /> {job.pay}
                      </div>
                    )}
                    {job.dial_code && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "#8A8F98" }}>
                        <Phone size={11} style={{ color: "rgba(209,255,38,0.5)" }} /> Dial {job.dial_code}
                      </div>
                    )}
                  </div>

                  {mode === "seeker" ? (
                    <button
                      onClick={() => setApplyingTo(job)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      <Send size={12} /> Apply Now
                    </button>
                  ) : (
                    <button
                      onClick={() => setEmployerPanel(job)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                      style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}
                    >
                      <Lock size={12} /> Unlock Applicants
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Info banner */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ background: "rgba(209,255,38,0.03)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Users size={16} style={{ color: "#D1FF26", flexShrink: 0 }} />
          <p className="text-[11px]" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            <span style={{ color: "#D1FF26" }}>Job seekers:</span> Apply free with just your name and phone — we'll text you interview details. <span style={{ color: "#D1FF26" }}>Employers:</span> Pay $9.99 per listing to unlock full applicant contact details instantly.
          </p>
        </motion.div>
      </div>

      {/* Apply dialog */}
      <AnimatePresence>
        {applyingTo && (
          <ApplyDialog job={applyingTo} onClose={() => setApplyingTo(null)} onApplied={loadListings} />
        )}
      </AnimatePresence>

      {/* Employer panel */}
      <AnimatePresence>
        {employerPanel && (
          <EmployerAccessDialog job={employerPanel} onClose={() => setEmployerPanel(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---------- Apply Dialog ---------- */
function ApplyDialog({ job, onClose, onApplied }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
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
      });
      setDone(true);
      setTimeout(() => {
        onClose();
        onApplied();
      }, 2000);
    } catch {
      setError("Could not submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80]" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-md p-6"
        style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
      >
        {done ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", borderRadius: "50%" }}>
              <Check size={26} style={{ color: "#D1FF26" }} />
            </div>
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
              <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                <X size={16} style={{ color: "#8A8F98" }} />
              </button>
            </div>

            <form onSubmit={submit}>
              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>FULL NAME *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />

              <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Phone size={10} /> PHONE NUMBER *</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />

              <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Mail size={10} /> EMAIL (OPTIONAL)</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />

              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>MESSAGE TO EMPLOYER (OPTIONAL)</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} maxLength={1000} className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-5 resize-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />

              {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

              <button type="submit" disabled={submitting || !form.name.trim() || !form.phone.trim()} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit Application
              </button>
            </form>
          </>
        )}
      </motion.div>
    </>
  );
}

/* ---------- Employer Access Dialog ---------- */
function EmployerAccessDialog({ job, onClose }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(null); // EmployerAccess record or null
  const [applicants, setApplicants] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Check if any EmployerAccess exists for this job + email combo
      const records = await base44.entities.EmployerAccess.filter(
        { job_listing_id: job.id },
        "-created_date",
        10
      );
      if (records && records.length > 0) {
        const granted = records.find((r) => r.access_granted);
        if (granted) {
          setAccess(granted);
          // Load applicants
          const apps = await base44.entities.JobApplication.filter(
            { job_listing_id: job.id },
            "-created_date",
            200
          );
          setApplicants(apps || []);
        }
      }
    } catch {
      // ignore — employer hasn't paid yet
    } finally {
      setLoading(false);
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
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-lg p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// EMPLOYER ACCESS</p>
            <h3 className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{job.title}</h3>
            <p className="text-xs" style={{ color: "#8A8F98" }}>{job.company}</p>
          </div>
          <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
            <X size={16} style={{ color: "#8A8F98" }} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : access ? (
          /* Applicant list — access granted */
          <div>
            <div className="flex items-center gap-2 mb-4 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <BadgeCheck size={16} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>ACCESS UNLOCKED · {applicants.length} APPLICANT{applicants.length === 1 ? "" : "S"}</p>
            </div>

            {applicants.length === 0 ? (
              <div className="text-center py-8">
                <Users size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO APPLICANTS YET</p>
                <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Check back once job seekers start applying</p>
              </div>
            ) : (
              <div className="space-y-2">
                {applicants.map((app) => (
                  <div key={app.id} className="p-3 flex items-start gap-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                    <div className="flex items-center justify-center w-9 h-9 flex-shrink-0 font-heading font-bold text-xs" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", borderRadius: "50%" }}>
                      {(app.applicant_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{app.applicant_name}</p>
                      <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-1.5 text-[11px] mt-0.5 transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                        <Phone size={10} /> {app.applicant_phone}
                      </a>
                      {app.applicant_email && (
                        <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1.5 text-[11px] mt-0.5 transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                          <Mail size={10} /> {app.applicant_email}
                        </a>
                      )}
                      {app.notes && (
                        <p className="text-[11px] mt-2 p-2" style={{ background: "rgba(16,20,29,0.4)", color: "#8A8F98", lineHeight: 1.4 }}>{app.notes}</p>
                      )}
                      <span className="inline-block font-mono text-[8px] tracking-widest mt-1 px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: app.status === "submitted" ? "#8A8F98" : "#D1FF26" }}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Paywall — employer hasn't paid */
          <div>
            <div className="p-4 mb-4" style={{ background: "rgba(209,255,38,0.03)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>APPLICANT DETAILS LOCKED</p>
              </div>
              <p className="text-[11px]" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                Pay a one-time fee of <span style={{ color: "#D1FF26", fontWeight: 700 }}>$9.99</span> to unlock full contact details for every applicant to this listing. No subscription — pay once, access forever.
              </p>
            </div>

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
        )}
      </motion.div>
    </>
  );
}