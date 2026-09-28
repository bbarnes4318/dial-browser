import React, { useState } from "react";
import { Search, Briefcase, Plus, Lock, Users, Loader2 } from "lucide-react";
import { FIELD_ICONS } from "./shared";
import CandidateSearch from "./CandidateSearch";

export default function EmployerView({ loading, listings, applicationsByJob, accessByJob, onShowPostForm, onManageApplicants, allApplications }) {
  const [empTab, setEmpTab] = useState("listings");

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex gap-2">
          <button onClick={() => setEmpTab("listings")} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: empTab === "listings" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${empTab === "listings" ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: empTab === "listings" ? "#D1FF26" : "#8A8F98" }}>
            <Briefcase size={14} /> Listings
          </button>
          <button onClick={() => setEmpTab("candidates")} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: empTab === "candidates" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${empTab === "candidates" ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: empTab === "candidates" ? "#D1FF26" : "#8A8F98" }}>
            <Search size={14} /> Find Candidates
          </button>
        </div>
        {empTab === "listings" && (
          <button onClick={onShowPostForm} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            <Plus size={14} /> Post a Job
          </button>
        )}
      </div>

      {empTab === "candidates" ? (
        <CandidateSearch applications={allApplications} listings={listings} accessByJob={accessByJob} onManageApplicants={onManageApplicants} />
      ) : loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Briefcase size={36} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO LISTINGS YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Post your first job to start receiving applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((job) => {
            const apps = applicationsByJob[job.id] || [];
            const hasAccess = !!accessByJob[job.id];
            return (
              <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{FIELD_ICONS[job.field] || "📋"} {job.field}</span>
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{job.job_type}</span>
                    {job.alert_sent && <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>ALERTS SENT</span>}
                  </div>
                  <h3 className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{job.title}</h3>
                  <p className="text-xs" style={{ color: "#8A8F98" }}>{job.company}{job.location ? ` · ${job.location}` : ""}{job.pay ? ` · ${job.pay}` : ""}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-center">
                    <p className="font-heading font-black text-xl" style={{ color: apps.length > 0 ? "#D1FF26" : "#8A8F98" }}>{apps.length}</p>
                    <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>APPLICANTS</p>
                  </div>
                  <button onClick={() => onManageApplicants(job)} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: hasAccess ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${hasAccess ? "rgba(209,255,38,0.3)" : "rgba(209,255,38,0.15)"}`, color: hasAccess ? "#D1FF26" : "#8A8F98" }}>
                    {hasAccess ? <><Users size={12} /> Manage</> : <><Lock size={12} /> Unlock</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}