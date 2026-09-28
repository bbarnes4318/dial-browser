import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Siren, Send, Loader2, AlertTriangle, CheckCircle2,
  Radio, Users, Clock, Activity, ShieldAlert, X,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const SEVERITY_CONFIG = {
  sos: { label: "SOS", color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)", icon: Siren },
  critical: { label: "Critical", color: "#FB923C", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.4)", icon: AlertTriangle },
  warning: { label: "Warning", color: "#FBBF24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.4)", icon: ShieldAlert },
  info: { label: "Info", color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.4)", icon: Activity },
};

const CATEGORIES = [
  { value: "service_outage", label: "Service Outage" },
  { value: "safety_alert", label: "Safety Alert" },
  { value: "weather_emergency", label: "Weather Emergency" },
  { value: "system_maintenance", label: "System Maintenance" },
  { value: "medical_advisory", label: "Medical Advisory" },
  { value: "security_incident", label: "Security Incident" },
  { value: "other", label: "Other" },
];

const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "northeast", label: "Northeast" },
  { value: "southeast", label: "Southeast" },
  { value: "midwest", label: "Midwest" },
  { value: "southwest", label: "Southwest" },
  { value: "west", label: "West" },
  { value: "national", label: "National" },
];

function formatEst(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) + " EST";
}

export default function EmergencyBroadcast() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    message_body: "",
    severity: "critical",
    category: "safety_alert",
    affected_regions: ["all"],
  });

  const loadData = useCallback(async () => {
    try {
      const [broadcastList, members] = await Promise.all([
        base44.entities.EmergencyBroadcast.list("-created_date", 100),
        base44.entities.Member.list("-created_date", 500).catch(() => []),
      ]);
      setBroadcasts(broadcastList || []);
      setMemberCount((members || []).filter((m) => m.phone).length);
    } catch {
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleRegion = (region) => {
    setForm((prev) => {
      if (region === "all") return { ...prev, affected_regions: ["all"] };
      const withoutAll = prev.affected_regions.filter((r) => r !== "all");
      const has = withoutAll.includes(region);
      const next = has ? withoutAll.filter((r) => r !== region) : [...withoutAll, region];
      return { ...prev, affected_regions: next.length === 0 ? ["all"] : next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message_body.trim()) {
      toast({ title: "Missing fields", description: "Title and message are required.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      const created = await base44.entities.EmergencyBroadcast.create({
        ...form,
        triggered_by_name: user?.full_name || user?.email || "Admin",
      });

      const sev = SEVERITY_CONFIG[form.severity];
      const willAutoBroadcast = form.severity === "critical" || form.severity === "sos";

      if (willAutoBroadcast) {
        toast({
          title: `${sev.label} broadcast issued`,
          description: `Automated SOS SMS is being sent to ${memberCount} registered members.`,
        });
      } else {
        // For non-critical, manually trigger the broadcast
        try {
          await base44.functions.invoke("broadcastEmergencySos", {
            broadcast_id: created.id,
            manual_trigger: true,
          });
          toast({
            title: `${sev.label} broadcast sent`,
            description: `SMS delivered to registered members.`,
          });
        } catch {
          toast({ title: "Broadcast created", description: "Saved, but SMS delivery failed. Try resending.", variant: "destructive" });
        }
      }

      setForm({ title: "", message_body: "", severity: "critical", category: "safety_alert", affected_regions: ["all"] });
      await loadData();
    } catch (err) {
      toast({ title: "Failed to issue broadcast", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (broadcast) => {
    setResendingId(broadcast.id);
    try {
      const res = await base44.functions.invoke("broadcastEmergencySos", {
        broadcast_id: broadcast.id,
        manual_trigger: true,
      });
      toast({
        title: "Broadcast re-sent",
        description: `Delivered to ${res.data?.sent_count ?? res.sent_count ?? 0} members.`,
      });
      await loadData();
    } catch (err) {
      toast({ title: "Resend failed", description: err.message, variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const handleResolve = async (broadcast) => {
    try {
      await base44.entities.EmergencyBroadcast.update(broadcast.id, {
        active: false,
        broadcast_status: "cancelled",
        resolved_at: new Date().toISOString(),
      });
      toast({ title: "Emergency resolved", description: `"${broadcast.title}" marked as resolved.` });
      await loadData();
    } catch (err) {
      toast({ title: "Failed to resolve", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen py-20 px-6 lg:px-16" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Siren size={20} style={{ color: "#EF4444" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#EF4444" }}>// SOS EMERGENCY BROADCAST SYSTEM</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Emergency <span style={{ color: "#EF4444" }}>Alert Console</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Issue critical safety announcements and service status updates. Critical and SOS broadcasts automatically send an immediate SMS to every registered member.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <Users size={16} className="mb-2" style={{ color: "#D1FF26" }} />
            <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{memberCount}</p>
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>RECIPIENTS</p>
          </div>
          <div className="p-4" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <Radio size={16} className="mb-2" style={{ color: "#D1FF26" }} />
            <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{broadcasts.filter((b) => b.active).length}</p>
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>ACTIVE ALERTS</p>
          </div>
          <div className="p-4" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <Activity size={16} className="mb-2" style={{ color: "#D1FF26" }} />
            <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{broadcasts.length}</p>
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>TOTAL BROADCASTS</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Broadcast Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-5" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
              <div className="flex items-center gap-2 pb-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
                <Siren size={16} style={{ color: "#EF4444" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#EF4444" }}>ISSUE NEW BROADCAST</p>
              </div>

              {/* Title */}
              <div>
                <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>ALERT TITLE</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Network outage in Northeast region"
                  maxLength={120}
                  className="w-full px-3 py-3 text-sm outline-none"
                  style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>SMS MESSAGE ({form.message_body.length}/1000)</label>
                <textarea
                  value={form.message_body}
                  onChange={(e) => setForm({ ...form, message_body: e.target.value })}
                  placeholder="The full message members will receive via SMS..."
                  maxLength={1000}
                  rows={4}
                  className="w-full px-3 py-3 text-sm outline-none resize-none"
                  style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>

              {/* Severity */}
              <div>
                <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>SEVERITY LEVEL</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isActive = form.severity === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, severity: key })}
                        className="flex flex-col items-center gap-1 py-3 transition-all"
                        style={{
                          background: isActive ? cfg.bg : "rgba(5,7,10,0.4)",
                          border: `0.5px solid ${isActive ? cfg.border : "rgba(138,143,152,0.1)"}`,
                        }}
                      >
                        <Icon size={16} style={{ color: isActive ? cfg.color : "#8A8F98" }} />
                        <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: isActive ? cfg.color : "#8A8F98" }}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
                {(form.severity === "critical" || form.severity === "sos") && (
                  <p className="font-mono text-[9px] mt-2 flex items-center gap-1" style={{ color: "#EF4444" }}>
                    <Siren size={10} /> AUTO-BROADCAST: SMS will send immediately to all {memberCount} members
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>CATEGORY</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                      style={{
                        background: form.category === cat.value ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                        border: `0.5px solid ${form.category === cat.value ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                        color: form.category === cat.value ? "#D1FF26" : "#8A8F98",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regions */}
              <div>
                <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>AFFECTED REGIONS</label>
                <div className="flex flex-wrap gap-1.5">
                  {REGIONS.map((reg) => {
                    const isActive = form.affected_regions.includes(reg.value);
                    return (
                      <button
                        key={reg.value}
                        type="button"
                        onClick={() => toggleRegion(reg.value)}
                        className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{
                          background: isActive ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.4)",
                          border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                          color: isActive ? "#D1FF26" : "#8A8F98",
                        }}
                      >
                        {reg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 font-mono text-xs tracking-[0.3em] uppercase transition-all disabled:opacity-50"
                style={{ background: form.severity === "sos" ? "#EF4444" : form.severity === "critical" ? "#FB923C" : "#D1FF26", color: "#05070A" }}
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> SENDING...</>
                ) : (
                  <><Send size={14} /> ISSUE BROADCAST</>
                )}
              </button>
            </form>
          </motion.div>

          {/* Recent Broadcasts */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>RECENT BROADCASTS</p>
              </div>
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{broadcasts.length} TOTAL</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-16 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <Siren size={36} className="mx-auto mb-3" style={{ color: "rgba(239,68,68,0.3)" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO BROADCASTS YET</p>
                <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>Issue your first emergency alert using the form.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {broadcasts.map((b, i) => {
                    const cfg = SEVERITY_CONFIG[b.severity] || SEVERITY_CONFIG.warning;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="p-4"
                        style={{ background: "rgba(16,20,29,0.8)", border: `0.5px solid ${cfg.border}` }}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center" style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}` }}>
                            <Icon size={16} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{b.title}</p>
                            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{formatEst(b.created_date)}</p>
                          </div>
                          {b.active && (
                            <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(239,68,68,0.2)", color: "#EF4444", border: "0.5px solid rgba(239,68,68,0.4)" }}>ACTIVE</span>
                          )}
                        </div>

                        <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{b.message_body}</p>

                        <div className="flex items-center gap-3 mb-3 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                          <span style={{ color: cfg.color }}>{cfg.label}</span>
                          <span>·</span>
                          <span>{b.category?.replace(/_/g, " ").toUpperCase()}</span>
                        </div>

                        {b.broadcast_status === "delivered" && (
                          <div className="flex items-center gap-2 mb-3 p-2" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                            <CheckCircle2 size={12} style={{ color: "#D1FF26" }} />
                            <p className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>
                              DELIVERED TO {b.sent_count}/{b.total_recipients} MEMBERS
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResend(b)}
                            disabled={resendingId === b.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-50"
                            style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                          >
                            {resendingId === b.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} RESEND
                          </button>
                          {b.active && (
                            <button
                              onClick={() => handleResolve(b)}
                              className="flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-[9px] tracking-widest uppercase transition-all"
                              style={{ background: "rgba(138,143,152,0.1)", border: "0.5px solid rgba(138,143,152,0.3)", color: "#8A8F98" }}
                            >
                              <X size={11} /> RESOLVE
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}