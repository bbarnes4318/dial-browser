import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Briefcase, MapPin, DollarSign, Phone, Check, Send, Loader2 } from "lucide-react";
import { FIELDS, FIELD_ICONS } from "./shared";
import ApplicationTracker from "./ApplicationTracker";

export default function SeekerView({ loading, jobs, query, setQuery, fieldFilter, setFieldFilter, myApplications, onApply }) {
  const appliedJobIds = useMemo(() => new Set(myApplications.map((a) => a.job_listing_id)), [myApplications]);

  return (
    <>
      {myApplications.length > 0 && <ApplicationTracker applications={myApplications} />}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
          <Search size={14} style={{ color: "#8A8F98" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jobs by title, company, or location…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
        </div>
        <select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)} className="px-3 py-2.5 text-sm" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}>
          <option value="all" style={{ background: "#10141D" }}>All Fields</option>
          {FIELDS.map((f) => <option key={f} value={f} style={{ background: "#10141D" }}>{f}</option>)}
        </select>
      </div>

      {!loading && jobs.length > 0 && (
        <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>{jobs.length} OPEN {jobs.length === 1 ? "POSITION" : "POSITIONS"}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Briefcase size={36} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO OPEN POSITIONS</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Check back soon — new jobs are posted daily</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {jobs.map((job, idx) => {
              const applied = appliedJobIds.has(job.id);
              return (
                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }} className="p-5 flex flex-col" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${applied ? "rgba(209,255,38,0.3)" : "rgba(209,255,38,0.15)"}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{FIELD_ICONS[job.field] || "📋"} {job.field || "GENERAL"}</span>
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{job.job_type}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>{job.title}</h3>
                  <p className="text-xs mb-3" style={{ color: "#8A8F98" }}>{job.company}</p>
                  <div className="space-y-1.5 mb-4 flex-1">
                    {job.location && <div className="flex items-center gap-2 text-[11px]" style={{ color: "#8A8F98" }}><MapPin size={11} style={{ color: "rgba(209,255,38,0.5)" }} /> {job.location}</div>}
                    {job.pay && <div className="flex items-center gap-2 text-[11px]" style={{ color: "#8A8F98" }}><DollarSign size={11} style={{ color: "rgba(209,255,38,0.5)" }} /> {job.pay}</div>}
                    {job.dial_code && <div className="flex items-center gap-2 text-[11px]" style={{ color: "#8A8F98" }}><Phone size={11} style={{ color: "rgba(209,255,38,0.5)" }} /> Dial {job.dial_code}</div>}
                  </div>
                  {applied ? (
                    <div className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                      <Check size={12} /> Applied
                    </div>
                  ) : (
                    <button onClick={() => onApply(job)} className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                      <Send size={12} /> Apply Now
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}