import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, LogOut, Search, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SeekerView from "@/components/jobs/SeekerView";
import EmployerView from "@/components/jobs/EmployerView";
import PostJobDialog from "@/components/jobs/PostJobDialog";
import ApplyDialog from "@/components/jobs/ApplyDialog";
import ManageApplicantsDialog from "@/components/jobs/ManageApplicantsDialog";
import JobSeekerOnboarding from "@/components/jobs/JobSeekerOnboarding";

export default function JobsDashboard() {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState("seeker");
  const [listings, setListings] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [employerAccess, setEmployerAccess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyingTo, setApplyingTo] = useState(null);
  const [seekerProfile, setSeekerProfile] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [jobs, apps, access, profiles] = await Promise.all([
        base44.entities.JobListing.filter({ active: true }, "-created_date", 200),
        base44.entities.JobApplication.list("-created_date", 200),
        base44.entities.EmployerAccess.list("-created_date", 100).catch(() => []),
        base44.entities.JobSeekerProfile.list("-created_date", 5).catch(() => []),
      ]);
      setListings(jobs || []);
      setMyApplications(apps || []);
      setEmployerAccess(access || []);
      const profile = profiles && profiles.length > 0 ? profiles[0] : null;
      setSeekerProfile(profile);
      if (!profile) setShowOnboarding(true);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredJobs = useMemo(() => {
    const q = query.toLowerCase();
    return listings.filter((l) => {
      const matchesQuery = !q || (l.title || "").toLowerCase().includes(q) || (l.company || "").toLowerCase().includes(q) || (l.location || "").toLowerCase().includes(q);
      const matchesField = fieldFilter === "all" || l.field === fieldFilter;
      return matchesQuery && matchesField;
    });
  }, [listings, query, fieldFilter]);

  const applicationsByJob = useMemo(() => {
    const map = {};
    for (const app of myApplications) {
      if (!map[app.job_listing_id]) map[app.job_listing_id] = [];
      map[app.job_listing_id].push(app);
    }
    return map;
  }, [myApplications]);

  const accessByJob = useMemo(() => {
    const map = {};
    for (const ea of employerAccess) {
      if (ea.access_granted) map[ea.job_listing_id] = ea;
    }
    return map;
  }, [employerAccess]);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between" style={{ background: "rgba(5,7,10,0.9)", borderBottom: "0.5px solid rgba(209,255,38,0.15)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
            <Home size={12} /> Home
          </Link>
          <div className="hidden sm:block">
            <p className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>1 CALL <span style={{ color: "#D1FF26" }}>JOBS</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="hidden sm:block font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{user.email}</span>}
          <button onClick={() => logout()} className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#8A8F98" }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <p className="font-mono text-xs tracking-[0.4em] mb-3" style={{ color: "#D1FF26" }}>// JOB MANAGEMENT</p>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>Find Work. <span style={{ color: "#D1FF26" }}>Hire Talent.</span></h1>
          <p className="text-sm lg:text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>Search open positions, track your applications, or manage your job postings and applicants — all in one place.</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode("seeker")} className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: mode === "seeker" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${mode === "seeker" ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: mode === "seeker" ? "#D1FF26" : "#8A8F98" }}>
            <Search size={14} /> Job Seeker
          </button>
          <button onClick={() => setMode("employer")} className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: mode === "employer" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${mode === "employer" ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: mode === "employer" ? "#D1FF26" : "#8A8F98" }}>
            <Building2 size={14} /> Employer
          </button>
        </div>

        {mode === "seeker" && seekerProfile && !seekerProfile.onboarding_completed && (
          <div className="mb-6 p-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <div>
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// COMPLETE YOUR PROFILE</p>
              <p className="text-xs" style={{ color: "#F5F5F7" }}>Finish setting up your seeker profile to get matched with the right jobs.</p>
            </div>
            <button onClick={() => setShowOnboarding(true)} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
              Finish Setup
            </button>
          </div>
        )}
        {mode === "seeker" && !seekerProfile && !showOnboarding && (
          <div className="mb-6 p-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <div>
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// NEW HERE?</p>
              <p className="text-xs" style={{ color: "#F5F5F7" }}>Create your seeker profile in 3 quick steps to start applying.</p>
            </div>
            <button onClick={() => setShowOnboarding(true)} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
              Get Started
            </button>
          </div>
        )}
        {mode === "seeker" ? (
          <SeekerView loading={loading} jobs={filteredJobs} query={query} setQuery={setQuery} fieldFilter={fieldFilter} setFieldFilter={setFieldFilter} myApplications={myApplications} onApply={setApplyingTo} />
        ) : (
          <EmployerView loading={loading} listings={listings} applicationsByJob={applicationsByJob} accessByJob={accessByJob} onShowPostForm={() => setShowPostForm(true)} onManageApplicants={setSelectedJob} allApplications={myApplications} />
        )}
      </div>

      <AnimatePresence>
        {showPostForm && <PostJobDialog onClose={() => setShowPostForm(false)} onPosted={() => { setShowPostForm(false); loadAll(); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {applyingTo && <ApplyDialog job={applyingTo} onClose={() => setApplyingTo(null)} onApplied={loadAll} />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedJob && (
          <ManageApplicantsDialog job={selectedJob} applicants={applicationsByJob[selectedJob.id] || []} hasAccess={!!accessByJob[selectedJob.id]} onClose={() => setSelectedJob(null)} onRefresh={loadAll} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showOnboarding && (
          <JobSeekerOnboarding onClose={() => setShowOnboarding(false)} onComplete={() => { setShowOnboarding(false); loadAll(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}