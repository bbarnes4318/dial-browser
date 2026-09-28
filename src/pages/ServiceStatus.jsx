import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Stethoscope, Smile, Home, Loader2, Search, Clock, AlertCircle, CheckCircle2, Phone, History } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const SERVICE_ICONS = {
  medical: Stethoscope,
};

const STATUS_COLORS = {
  submitted: "#8A8F98",
  ai_processing: "#D1FF26",
  in_review: "#FBBF24",
  action_needed: "#FB923C",
  completed: "#D1FF26",
};

const STATUS_LABELS = {
  submitted: "Submitted",
  ai_processing: "AI Processing",
  in_review: "In Review",
  action_needed: "Action Needed",
  completed: "Completed",
};

export default function ServiceStatus() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      let res;
      if (phoneFilter) {
        res = await base44.entities.ServiceRequest.filter({ requester_phone: phoneFilter }, "-created_date", 50);
      } else {
        res = await base44.entities.ServiceRequest.list("-created_date", 50);
      }
      setRequests(res || []);
    } catch (e) {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.service_type === filter);

  const stats = {
    total: requests.length,
    medical: requests.filter((r) => r.service_type === "medical").length,
  };

  const fmtTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen py-20 px-6 lg:px-16" style={{ background: "#05070A" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Activity size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// SERVICE REQUEST STATUS</span>
          </div>
          <h1 className="font-heading font-black text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Your <span style={{ color: "#D1FF26" }}>Request Dashboard</span>
          </h1>
          <p className="text-base max-w-2xl" style={{ color: "#8A8F98" }}>
            Track the progress of your Medical requests. View AI analysis notes and current status in real time.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { label: "TOTAL", value: stats.total, icon: Activity },
            { label: "MEDICAL", value: stats.medical, icon: Stethoscope },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <Icon size={16} style={{ color: "#D1FF26" }} className="mb-2" />
                <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{stat.value}</p>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Phone filter + service filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <form onSubmit={(e) => { e.preventDefault(); loadRequests(); }} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
              <input
                type="tel"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                placeholder="Filter by your phone number..."
                className="w-full pl-11 pr-4 py-3 font-mono text-sm bg-transparent focus:outline-none"
                style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              />
            </div>
            <button type="submit" className="px-5 py-3 font-mono text-[10px] tracking-widest font-bold flex items-center gap-2" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
              <Search size={12} /> FILTER
            </button>
          </form>
          <div className="flex gap-1">
            {["all", "medical"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-3 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{
                  background: filter === f ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.8)",
                  border: `0.5px solid ${filter === f ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                  color: filter === f ? "#D1FF26" : "#8A8F98",
                }}
              >
                {f === "all" ? "ALL" : "MED"}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 p-8" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <Activity size={48} className="mx-auto mb-4" style={{ color: "rgba(209,255,38,0.2)" }} />
            <p className="font-mono text-xs tracking-widest mb-4" style={{ color: "#8A8F98" }}>NO SERVICE REQUESTS FOUND</p>
            <Link to="/#medical" className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
              SUBMIT A REQUEST →
            </Link>
          </div>
        )}

        {/* Request list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((req, i) => {
              const Icon = SERVICE_ICONS[req.service_type] || Activity;
              const statusColor = STATUS_COLORS[req.status] || "#8A8F98";
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5"
                  style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <Icon size={18} style={{ color: "#D1FF26" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm uppercase" style={{ color: "#F5F5F7" }}>{req.service_type.replace("_", " ")}</span>
                          <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: `${statusColor}15`, color: statusColor, border: `0.5px solid ${statusColor}40` }}>
                            {STATUS_LABELS[req.status] || req.status}
                          </span>
                          {req.ai_urgency && (
                            <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#8A8F98" }}>
                              URGENCY: {req.ai_urgency.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.6)" }}>
                          <Clock size={10} /> {fmtTime(req.created_date)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>// YOUR SUBMISSION</p>
                        <p className="text-sm" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{req.details}</p>
                      </div>

                      {req.ai_notes && (
                        <div className="p-3 mb-2" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                          <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// AI NOTES</p>
                          <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{req.ai_notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.6)" }}>
                        {req.requester_name && <span>👤 {req.requester_name}</span>}
                        {req.requester_phone && <span>📞 {req.requester_phone}</span>}
                        {req.location && <span>📍 {req.location}</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Links */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <Link to="/history" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
            <History size={12} /> VIEW FULL SERVICE HISTORY
          </Link>
          <Link to="/" className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>← BACK TO HOME</Link>
        </div>
      </div>
    </div>
  );
}