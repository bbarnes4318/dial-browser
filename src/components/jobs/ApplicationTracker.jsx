import React, { useState } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Eye, UserCheck, Trophy, XCircle, ChevronDown,
  ChevronUp, MapPin, Building2, FileText, Clock, Calendar,
} from "lucide-react";
import { STATUS_STYLES } from "./shared";

const PIPELINE = [
  { id: "submitted", label: "Submitted", icon: ClipboardList, desc: "Application received" },
  { id: "viewed", label: "Under Review", icon: Eye, desc: "Employer reviewing" },
  { id: "shortlisted", label: "Shortlisted", icon: UserCheck, desc: "Selected for interview" },
  { id: "interview_requested", label: "Interview", icon: Calendar, desc: "Interview requested" },
  { id: "hired", label: "Hired", icon: Trophy, desc: "Offer extended" },
];

function getStepIndex(status) {
  if (status === "rejected") return -1;
  return PIPELINE.findIndex((s) => s.id === status);
}

export default function ApplicationTracker({ applications }) {
  const [expanded, setExpanded] = useState(null);

  const stats = PIPELINE.map((step) => ({
    ...step,
    count: applications.filter((a) => a.status === step.id).length,
  }));
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// APPLICATION TRACKER</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{applications.length} TOTAL</span>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {stats.map((step) => {
          const Icon = step.icon;
          const active = step.count > 0;
          return (
            <div key={step.id} className="p-3 text-center" style={{ background: active ? STATUS_STYLES[step.id].bg : "rgba(16,20,29,0.4)", border: `0.5px solid ${active ? STATUS_STYLES[step.id].color + "40" : "rgba(138,143,152,0.1)"}` }}>
              <Icon size={16} className="mx-auto mb-1.5" style={{ color: active ? STATUS_STYLES[step.id].color : "rgba(138,143,152,0.4)" }} />
              <p className="font-heading font-black text-lg leading-none" style={{ color: active ? STATUS_STYLES[step.id].color : "#8A8F98" }}>{step.count}</p>
              <p className="font-mono text-[7px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>{step.label.toUpperCase()}</p>
            </div>
          );
        })}
        {rejectedCount > 0 && (
          <div className="p-3 text-center" style={{ background: STATUS_STYLES.rejected.bg, border: `0.5px solid ${STATUS_STYLES.rejected.color}40` }}>
            <XCircle size={16} className="mx-auto mb-1.5" style={{ color: STATUS_STYLES.rejected.color }} />
            <p className="font-heading font-black text-lg leading-none" style={{ color: STATUS_STYLES.rejected.color }}>{rejectedCount}</p>
            <p className="font-mono text-[7px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>REJECTED</p>
          </div>
        )}
      </div>

      {/* Individual application cards */}
      <div className="space-y-2">
        {applications.map((app) => {
          const stepIdx = getStepIndex(app.status);
          const isRejected = app.status === "rejected";
          const isHired = app.status === "hired";
          const st = STATUS_STYLES[app.status] || STATUS_STYLES.submitted;
          const isExpanded = expanded === app.id;

          return (
            <div key={app.id} className="overflow-hidden" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${isHired ? "rgba(209,255,38,0.3)" : "rgba(209,255,38,0.1)"}` }}>
              {/* Summary row */}
              <button onClick={() => toggle(app.id)} className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-[rgba(209,255,38,0.02)]">
                <div className="flex items-center justify-center w-9 h-9 flex-shrink-0 font-heading font-bold text-xs" style={{ background: st.bg, color: st.color, borderRadius: "50%" }}>
                  {(app.applicant_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{app.job_title}</p>
                    <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: st.bg, color: st.color }}>{app.status.toUpperCase()}</span>
                  </div>
                  <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "#8A8F98" }}>
                    <Building2 size={9} /> {app.company}
                  </p>
                </div>
                {/* Mini progress dots */}
                <div className="hidden sm:flex items-center gap-1.5 mr-2">
                  {PIPELINE.map((step, i) => {
                    const done = !isRejected && i <= stepIdx;
                    const current = !isRejected && i === stepIdx;
                    return (
                      <div key={step.id} className="w-2 h-2 rounded-full transition-all" style={{
                        background: done ? st.color : "rgba(138,143,152,0.2)",
                        boxShadow: current ? `0 0 6px ${st.color}` : "none",
                      }} />
                    );
                  })}
                </div>
                {isExpanded ? <ChevronUp size={14} style={{ color: "#8A8F98" }} /> : <ChevronDown size={14} style={{ color: "#8A8F98" }} />}
              </button>

              {/* Expanded timeline */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                      {/* Vertical timeline */}
                      <div className="relative pl-6 mt-4">
                        {/* Vertical line */}
                        <div className="absolute left-[10px] top-2 bottom-2 w-px" style={{ background: "rgba(138,143,152,0.15)" }} />
                        <div className="absolute left-[10px] top-2 w-px transition-all" style={{
                          height: isRejected ? "0%" : `${(stepIdx / (PIPELINE.length - 1)) * 100}%`,
                          background: st.color,
                        }} />

                        {PIPELINE.map((step, i) => {
                          const Icon = step.icon;
                          const done = !isRejected && i <= stepIdx;
                          const current = !isRejected && i === stepIdx;
                          const isPastRejection = isRejected;
                          return (
                            <div key={step.id} className="relative flex items-start gap-3 mb-4 last:mb-0">
                              <div className="absolute -left-6 flex items-center justify-center w-5 h-5 rounded-full transition-all" style={{
                                background: done ? st.color : "#10141D",
                                border: `1px solid ${done ? st.color : "rgba(138,143,152,0.2)"}`,
                                boxShadow: current ? `0 0 8px ${st.color}80` : "none",
                              }}>
                                <Icon size={10} style={{ color: done ? "#05070A" : "rgba(138,143,152,0.4)" }} />
                              </div>
                              <div className="pt-0.5">
                                <p className="font-mono text-[10px] tracking-widest" style={{
                                  color: done ? st.color : "#8A8F98",
                                  fontWeight: current ? 700 : 400,
                                }}>
                                  {step.label.toUpperCase()}
                                  {current && <span style={{ color: st.color }}> ← YOU ARE HERE</span>}
                                </p>
                                <p className="text-[10px] mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>{step.desc}</p>
                              </div>
                            </div>
                          );
                        })}

                        {/* Rejected state */}
                        {isRejected && (
                          <div className="relative flex items-start gap-3 -mt-1">
                            <div className="absolute -left-6 flex items-center justify-center w-5 h-5 rounded-full" style={{ background: STATUS_STYLES.rejected.color, border: `1px solid ${STATUS_STYLES.rejected.color}` }}>
                              <XCircle size={10} style={{ color: "#05070A" }} />
                            </div>
                            <div className="pt-0.5">
                              <p className="font-mono text-[10px] tracking-widest" style={{ color: STATUS_STYLES.rejected.color, fontWeight: 700 }}>NOT SELECTED</p>
                              <p className="text-[10px] mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>The employer chose not to move forward with this application.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Application details */}
                      <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.08)" }}>
                        {app.field && <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{app.field.toUpperCase()}</span>}
                        {app.desired_location && <span className="flex items-center gap-1 font-mono text-[8px] px-2 py-1" style={{ background: "rgba(16,20,29,0.6)", color: "#8A8F98" }}><MapPin size={8} /> {app.desired_location}</span>}
                        {app.resume_url && (
                          <a href={proxyMediaUrl(app.resume_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-1 transition-colors hover:text-[#D1FF26]" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                            <FileText size={8} /> Resume
                          </a>
                        )}
                        {app.notes && <p className="w-full text-[10px] mt-1 p-2" style={{ background: "rgba(16,20,29,0.4)", color: "rgba(138,143,152,0.7)", lineHeight: 1.4 }}>"{app.notes}"</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}