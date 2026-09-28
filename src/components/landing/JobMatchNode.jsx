import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Briefcase, Search, Phone, MessageSquare, MapPin, DollarSign, CheckCircle2, ArrowUpRight, Star, Users, Globe, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";

const alertFields = [
  { id: "Technology", label: "Technology" },
  { id: "Telecom", label: "Telecom" },
  { id: "Marketing", label: "Marketing" },
  { id: "Design", label: "Design" },
  { id: "Hardware", label: "Hardware" },
  { id: "Sales", label: "Sales" },
  { id: "Logistics", label: "Logistics" },
  { id: "Community", label: "Community" },
  { id: "Accessibility", label: "Accessibility" },
  { id: "General", label: "General" },
];

const jobs = [
  { id: "j1", title: "Voice App Developer", company: "1CALL Networks", location: "Remote · Global", pay: "$95k–$130k", type: "Full-Time", tags: ["React", "Voice", "Node.js"], dialCode: "*301#", posted: "1 day ago", matchScore: 96 },
  { id: "j2", title: "Telecom Integration Engineer", company: "SignalBridge", location: "Lagos, NG", pay: "$80k–$110k", type: "Full-Time", tags: ["Telephony", "SIP", "APIs"], dialCode: "*302#", posted: "3 days ago", matchScore: 91 },
  { id: "j3", title: "SMS Campaign Manager", company: "DialReach", location: "Remote · Global", pay: "$55k–$72k", type: "Contract", tags: ["SMS", "Marketing", "Analytics"], dialCode: "*303#", posted: "2 days ago", matchScore: 88 },
  { id: "j4", title: "Accessibility QA Tester", company: "InclusiveTech", location: "London, UK", pay: "$45k–$60k", type: "Part-Time", tags: ["WCAG", "Testing", "Voice UI"], dialCode: "*304#", posted: "4 days ago", matchScore: 84 },
  { id: "j5", title: "Field Technician", company: "RuralConnect", location: "Nairobi, KE", pay: "$22–$28/hr", type: "Full-Time", tags: ["Hardware", "Network", "Travel"], dialCode: "*305#", posted: "5 days ago", matchScore: 79 },
  { id: "j6", title: "Community Liaison", company: "1CALL Networks", location: "Detroit, US", pay: "$48k–$65k", type: "Full-Time", tags: ["Outreach", "Bilingual", "Events"], dialCode: "*306#", posted: "1 day ago", matchScore: 92 },
  { id: "j7", title: "Voice UI Designer", company: "EchoUX", location: "Remote · Global", pay: "$70k–$95k", type: "Contract", tags: ["UX", "VUI", "Prototyping"], dialCode: "*307#", posted: "6 days ago", matchScore: 87 },
  { id: "j8", title: "Logistics Coordinator", company: "DialFreight", location: "São Paulo, BR", pay: "$40k–$55k", type: "Full-Time", tags: ["Logistics", "Phone", "Scheduling"], dialCode: "*308#", posted: "2 days ago", matchScore: 81 },
  { id: "j9", title: "Onboarding Specialist", company: "DialReach", location: "Mumbai, IN", pay: "$30k–$42k", type: "Full-Time", tags: ["Training", "Voice", "Support"], dialCode: "*309#", posted: "3 days ago", matchScore: 85 },
  { id: "j10", title: "Sales Representative", company: "SignalBridge", location: "Remote · LATAM", pay: "$38k–$58k + comm", type: "Full-Time", tags: ["Sales", "Phone", "Bilingual"], dialCode: "*310#", posted: "4 days ago", matchScore: 78 },
];

const candidates = [
  { id: "c1", name: "Aisha B.", role: "Voice App Developer", location: "Nashville, US", rating: 4.9, projects: 23, skills: ["React", "Node.js", "Voice UI"], availability: "Available Now", dialCode: "*321#" },
  { id: "c2", name: "Devin W.", role: "Telecom Engineer", location: "Seattle, US", rating: 4.8, projects: 31, skills: ["SIP", "VoIP", "APIs"], availability: "2 Weeks", dialCode: "*322#" },
  { id: "c3", name: "Maya L.", role: "UX Designer", location: "London, UK", rating: 5.0, projects: 18, skills: ["Figma", "VUI", "Branding"], availability: "Available Now", dialCode: "*323#" },
  { id: "c4", name: "Trevor M.", role: "Field Technician", location: "Lagos, NG", rating: 4.7, projects: 27, skills: ["Hardware", "Network", "Install"], availability: "1 Week", dialCode: "*324#" },
  { id: "c5", name: "Priya S.", role: "SMS Campaign Manager", location: "Mumbai, IN", rating: 4.9, projects: 41, skills: ["SMS", "Marketing", "Analytics"], availability: "Available Now", dialCode: "*325#" },
  { id: "c6", name: "Carlos R.", role: "Sales Representative", location: "São Paulo, BR", rating: 4.8, projects: 35, skills: ["Sales", "Bilingual", "Phone"], availability: "Available Now", dialCode: "*326#" },
];

const jobCategories = ["All", "Full-Time", "Part-Time", "Contract"];

export default function JobMatchNode() {
  const [inView, setInView] = useState(true);
  const [tab, setTab] = useState("seekers"); // seekers | employers
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [applied, setApplied] = useState([]);
  const [alertName, setAlertName] = useState("");
  const [alertPhone, setAlertPhone] = useState("");
  const [alertField, setAlertField] = useState("Technology");
  const [alertStatus, setAlertStatus] = useState(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const filteredJobs = jobs.filter((j) => {
    const matchesCat = activeCat === "All" || j.type === activeCat;
    const q = search.toLowerCase().trim();
    const matchesQ = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.tags.join(" ").toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.skills.join(" ").toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
  });

  const toggleApply = (id) => {
    setApplied((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSubscribe = async () => {
    if (!alertName.trim() || !alertPhone.trim()) return;
    setAlertLoading(true);
    try {
      await base44.entities.JobAlertSubscription.create({
        full_name: alertName.trim(),
        phone: alertPhone.trim(),
        selected_field: alertField,
        active: true,
      });
      setAlertStatus("subscribed");
      setAlertName("");
      setAlertPhone("");
      setTimeout(() => setAlertStatus(null), 4000);
    } catch (e) {
      setAlertStatus("error");
      setTimeout(() => setAlertStatus(null), 4000);
    }
    setAlertLoading(false);
  };

  return (
    <section ref={sectionRef} id="jobs" className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
              <Globe size={12} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>GLOBAL JOB NETWORK</span>
            </div>
          </div>
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// JOB MATCH NODE™</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Hire &amp; Get Hired by <span style={{ color: "#D1FF26" }}>Voice &amp; SMS.</span>
          </h2>
          <p className="text-lg font-light max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            A two-sided global job network. Workers find opportunities, employers find qualified talent — all through a simple phone call or text, no internet required.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button onClick={() => { setTab("seekers"); setSearch(""); setActiveCat("All"); }} className="flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: tab === "seekers" ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${tab === "seekers" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`, color: tab === "seekers" ? "#D1FF26" : "#8A8F98" }}>
            <Briefcase size={12} /> Find Jobs
          </button>
          <button onClick={() => { setTab("employers"); setSearch(""); }} className="flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: tab === "employers" ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${tab === "employers" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`, color: tab === "employers" ? "#D1FF26" : "#8A8F98" }}>
            <Users size={12} /> Find Talent
          </button>
        </div>

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="max-w-2xl mx-auto mb-4">
          <div className="relative">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "seekers" ? "Search jobs, companies, skills, or locations..." : "Search candidates by name, role, skills, or location..."} className="w-full px-5 py-3 pl-12 text-sm outline-none" style={{ background: "rgba(16,20,29,0.8)", border: search.trim() ? "0.5px solid rgba(209,255,38,0.4)" : "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: search.trim() ? "#D1FF26" : "#8A8F98" }} />
          </div>
          {tab === "seekers" && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {jobCategories.map((cat) => {
                const isActive = activeCat === cat;
                return <button key={cat} onClick={() => setActiveCat(cat)} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>{cat}</button>;
              })}
            </div>
          )}
        </motion.div>

        {/* Count */}
        <div className="text-center mb-6">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
            {tab === "seekers" ? `${filteredJobs.length} JOB${filteredJobs.length !== 1 ? "S" : ""} AVAILABLE` : `${filteredCandidates.length} CANDIDATE${filteredCandidates.length !== 1 ? "S" : ""} AVAILABLE`}
          </p>
        </div>

        {/* Content */}
        {tab === "seekers" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job, i) => {
              const isApplied = applied.includes(job.id);
              return (
                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: Math.min(i * 0.05, 0.4) }} className="relative p-5 flex flex-col" style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${isApplied ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>{job.type.toUpperCase()}</span>
                    <div className="flex items-center gap-1"><Star size={11} style={{ color: "#D1FF26" }} /><span className="font-mono text-[10px] font-bold" style={{ color: "#F5F5F7" }}>{job.matchScore}% MATCH</span></div>
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>{job.title}</h3>
                  <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>{job.company.toUpperCase()}</p>
                  <div className="flex items-center gap-3 mb-3 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3 font-mono text-[9px]" style={{ color: "#D1FF26" }}><DollarSign size={10} /> {job.pay}</div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {job.tags.map((tag) => <span key={tag} className="px-2 py-1 font-mono text-[8px] tracking-widest" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}>{tag}</span>)}
                  </div>
                  <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                    <div className="flex items-center gap-1.5"><Phone size={11} style={{ color: "#D1FF26" }} /><span className="font-mono text-[10px] font-bold" style={{ color: "#D1FF26" }}>{job.dialCode}</span></div>
                    <button onClick={() => toggleApply(job.id)} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: isApplied ? "rgba(209,255,38,0.15)" : "#D1FF26", border: `0.5px solid ${isApplied ? "rgba(209,255,38,0.4)" : "#D1FF26"}`, color: isApplied ? "#D1FF26" : "#05070A" }}>
                      {isApplied ? <CheckCircle2 size={11} /> : <ArrowUpRight size={11} />} {isApplied ? "Applied" : "Apply"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.map((c, i) => {
              const isContacted = applied.includes(c.id);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: Math.min(i * 0.05, 0.4) }} className="relative p-5 flex flex-col" style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${isContacted ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", color: c.availability === "Available Now" ? "#D1FF26" : "#8A8F98" }}>{c.availability.toUpperCase()}</span>
                    <div className="flex items-center gap-1"><Star size={11} style={{ color: "#D1FF26" }} /><span className="font-mono text-[10px] font-bold" style={{ color: "#F5F5F7" }}>{c.rating}</span></div>
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>{c.name}</h3>
                  <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>{c.role.toUpperCase()}</p>
                  <div className="flex items-center gap-3 mb-3 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {c.location}</span>
                    <span>{c.projects} jobs</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.skills.map((skill) => <span key={skill} className="px-2 py-1 font-mono text-[8px] tracking-widest" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}>{skill}</span>)}
                  </div>
                  <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                    <div className="flex items-center gap-1.5"><Phone size={11} style={{ color: "#D1FF26" }} /><span className="font-mono text-[10px] font-bold" style={{ color: "#D1FF26" }}>{c.dialCode}</span></div>
                    <button onClick={() => toggleApply(c.id)} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: isContacted ? "rgba(209,255,38,0.15)" : "#D1FF26", border: `0.5px solid ${isContacted ? "rgba(209,255,38,0.4)" : "#D1FF26"}`, color: isContacted ? "#D1FF26" : "#05070A" }}>
                      {isContacted ? <CheckCircle2 size={11} /> : <ArrowUpRight size={11} />} {isContacted ? "Contacted" : "Contact"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {(tab === "seekers" ? filteredJobs : filteredCandidates).length === 0 && (
          <div className="text-center py-16"><p className="font-mono text-sm tracking-widest" style={{ color: "#8A8F98" }}>NO MATCHES FOUND</p></div>
        )}

        {/* Job Alert Subscription */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.25 }} className="mt-10 max-w-2xl mx-auto p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// AUTO JOB ALERTS — FREE</p>
          </div>
          <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Pick your field and enter your phone number. We'll text you the moment a new job in your field is posted — so you can apply fast, right from your phone.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input type="text" value={alertName} onChange={(e) => setAlertName(e.target.value)} placeholder="Your name" className="px-4 py-3 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
            <input type="tel" value={alertPhone} onChange={(e) => setAlertPhone(e.target.value)} placeholder="Phone number" className="px-4 py-3 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {alertFields.map((f) => {
              const isActive = alertField === f.id;
              return <button key={f.id} onClick={() => setAlertField(f.id)} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>{f.label}</button>;
            })}
          </div>
          <button onClick={handleSubscribe} disabled={!alertName.trim() || !alertPhone.trim() || alertLoading} className="w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            {alertLoading ? "Subscribing..." : "Get Job Alerts"}
          </button>
          {alertStatus === "subscribed" && (
            <div className="mt-3 flex items-center gap-2 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <CheckCircle2 size={14} style={{ color: "#D1FF26" }} />
              <p className="text-xs" style={{ color: "#D1FF26" }}>You're subscribed! We'll text you when new {alertField} jobs are posted.</p>
            </div>
          )}
          {alertStatus === "error" && (
            <div className="mt-3 flex items-center gap-2 p-3" style={{ background: "rgba(255,80,80,0.06)", border: "0.5px solid rgba(255,80,80,0.2)" }}>
              <p className="text-xs" style={{ color: "#FF5050" }}>Something went wrong. Please try again.</p>
            </div>
          )}
        </motion.div>

        {/* Apply note */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }} className="mt-6 max-w-xl mx-auto p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// NEXT STEP</p>
          </div>
          <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            {applied.length > 0 ? `You have ${applied.length} item${applied.length !== 1 ? "s" : ""} selected. Use the job alert sign-up above to get real SMS notifications when new ${tab === "seekers" ? "jobs" : "candidates"} matching your search are posted.` : `Select ${tab === "seekers" ? "jobs" : "candidates"} above, then sign up for job alerts to get real SMS notifications when new matches are posted.`}
          </p>
        </motion.div>
      </div>
    </section>
  );
}