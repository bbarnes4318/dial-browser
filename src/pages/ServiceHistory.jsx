import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { History, ShoppingCart, Stethoscope, Smile, Home, Receipt, Phone, Search, Loader2, Clock, CheckCircle2, AlertCircle, ArrowRight, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SERVICE_ICONS = {
  medical: Stethoscope,
};

const SERVICE_COLORS = {
  medical: "#22D3EE",
};

const SERVICE_LABELS = {
  medical: "Medical Request",
};

const STATUS_COLORS = {
  pending: "#FBBF24",
  confirmed: "#D1FF26",
  out_for_delivery: "#22D3EE",
  delivered: "#D1FF26",
  cancelled: "#ef4444",
  submitted: "#8A8F98",
  ai_processing: "#D1FF26",
  in_review: "#FBBF24",
  action_needed: "#FB923C",
  completed: "#D1FF26",
  processing: "#FBBF24",
  failed: "#ef4444",
};

export default function ServiceHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [appliedPhone, setAppliedPhone] = useState("");

  useEffect(() => {
    loadHistory();
  }, [appliedPhone]);

  const loadHistory = async () => {
    setLoading(true);
    const phoneQuery = appliedPhone ? { requester_phone: appliedPhone } : {};

    const requests = await base44.entities.ServiceRequest.filter(phoneQuery, "-created_date", 50).catch(() => []);

    const items = [];

    // Service requests (medical)
    (requests || []).forEach((r) => {
      items.push({
        id: r.id,
        type: "medical",
        title: r.details ? r.details.slice(0, 100) : "Medical Request",
        subtitle: r.ai_notes || "",
        status: r.status,
        amount: null,
        phone: r.requester_phone,
        created_date: r.created_date,
        extra: r.ai_urgency ? `Urgency: ${r.ai_urgency}` : null,
      });
    });

    // Sort all by date descending
    items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setHistory(items);
    setLoading(false);
  };

  const filtered = filter === "all" ? history : history.filter((i) => i.type === filter);

  const stats = {
    total: history.length,
    medical: history.filter((i) => i.type === "medical").length,
  };

  const fmtTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const handlePhoneSearch = (e) => {
    e.preventDefault();
    setAppliedPhone(phoneFilter.trim());
  };

  return (
    <div className="min-h-screen py-20 px-6 lg:px-16" style={{ background: "#05070A" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <History size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// SERVICE HISTORY</span>
          </div>
          <h1 className="font-heading font-black text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Your <span style={{ color: "#D1FF26" }}>Activity Log</span>
          </h1>
          <p className="text-base max-w-2xl" style={{ color: "#8A8F98" }}>
            All your service requests in one unified timeline. Filter by phone number to see only your records.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-8">
          {[
            { label: "TOTAL", value: stats.total, type: "all", icon: History },
            { label: "MEDICAL", value: stats.medical, type: "medical", icon: Stethoscope },
          ].map((stat) => {
            const Icon = stat.icon;
            const isActive = filter === stat.type;
            return (
              <button
                key={stat.label}
                onClick={() => setFilter(stat.type)}
                className="p-3 text-left transition-all"
                style={{
                  background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.8)",
                  border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`,
                }}
              >
                <Icon size={14} style={{ color: isActive ? "#D1FF26" : "#8A8F98" }} className="mb-1.5" />
                <p className="font-heading font-black text-xl" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>{stat.value}</p>
                <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>{stat.label}</p>
              </button>
            );
          })}
        </div>

        {/* Phone filter */}
        <form onSubmit={handlePhoneSearch} className="flex gap-2 mb-8 max-w-md">
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
          {appliedPhone && (
            <button type="button" onClick={() => { setPhoneFilter(""); setAppliedPhone(""); }} className="px-3 py-3 font-mono text-[10px] tracking-widest" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
              CLEAR
            </button>
          )}
        </form>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 p-8" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <History size={48} className="mx-auto mb-4" style={{ color: "rgba(209,255,38,0.2)" }} />
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO SERVICE HISTORY FOUND</p>
            <p className="text-sm mb-6" style={{ color: "rgba(138,143,152,0.6)" }}>Start using 1 Call services to build your activity log.</p>
            <Link to="/#medical" className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
              TRY A SERVICE <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Timeline */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((item, i) => {
              const Icon = SERVICE_ICONS[item.type] || History;
              const color = SERVICE_COLORS[item.type] || "#8A8F98";
              const statusColor = STATUS_COLORS[item.status] || "#8A8F98";
              return (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="relative flex items-start gap-4 p-5"
                  style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}
                >
                  {/* Type icon */}
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: `${color}12`, border: `0.5px solid ${color}30` }}>
                    <Icon size={18} style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row: type + status + date */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[8px] tracking-widest px-2 py-0.5 uppercase" style={{ background: `${color}15`, color, border: `0.5px solid ${color}30` }}>
                          {SERVICE_LABELS[item.type] || item.type}
                        </span>
                        <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: `${statusColor}15`, color: statusColor, border: `0.5px solid ${statusColor}30` }}>
                          {item.status?.toUpperCase().replace(/_/g, " ")}
                        </span>
                        {item.extra && (
                          <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.6)" }}>{item.extra}</span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 font-mono text-[9px] whitespace-nowrap" style={{ color: "rgba(138,143,152,0.6)" }}>
                        <Clock size={10} /> {fmtTime(item.created_date)}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm mb-1" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{item.title}</p>

                    {/* Subtitle */}
                    {item.subtitle && (
                      <p className="text-xs mb-2" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{item.subtitle.length > 150 ? item.subtitle.slice(0, 150) + "…" : item.subtitle}</p>
                    )}

                    {/* Bottom row: phone + amount */}
                    <div className="flex items-center gap-4 font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.6)" }}>
                      {item.phone && <span>📞 {item.phone}</span>}
                      {item.amount && <span style={{ color: "#D1FF26" }}>{item.amount}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Usage report link + Back link */}
        <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
          <Link to="/usage-report" className="inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
            <BarChart3 size={12} /> MONTHLY USAGE REPORT
          </Link>
          <Link to="/" className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>← BACK TO HOME</Link>
        </div>
      </div>
    </div>
  );
}