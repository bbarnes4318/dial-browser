import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Siren, Send, Loader2, AlertCircle, Users, MapPin,
  CheckCircle2, X, Radio, Activity, ShieldAlert, Globe2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import RegionMapSelector from "@/components/broadcast/RegionMapSelector";
import { REGIONS, deriveRegion } from "@/lib/regionMap";

const SEVERITY_CONFIG = {
  sos: { label: "SOS", color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)", icon: Siren },
  critical: { label: "Critical", color: "#FB923C", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.4)", icon: AlertCircle },
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

function formatEst(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) + " EST";
}

export default function RegionalBroadcast() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    message_body: "",
    severity: "warning",
    category: "service_outage",
    affected_regions: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.role === "admin") {
          const [m, b] = await Promise.all([
            base44.entities.Member.list("-created_date", 500).catch(() => []),
            base44.entities.EmergencyBroadcast.list("-created_date", 50).catch(() => []),
          ]);
          setMembers(m || []);
          setBroadcasts(b || []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isAdmin = user?.role === "admin";

  const toggleRegion = (region) => {
    setForm((prev) => {
      if (region === "all" || region === "national") {
        const isAll = prev.affected_regions.includes("all");
        return { ...prev, affected_regions: isAll ? [] : ["all"] };
      }
      const withoutAll = prev.affected_regions.filter((r) => r !== "all" && r !== "national");
      const has = withoutAll.includes(region);
      const next = has ? withoutAll.filter((r) => r !== region) : [...withoutAll, region];
      return { ...prev, affected_regions: next };
    });
  };

  const recipientEstimate = useMemo(() => {
    const targets = form.affected_regions;
    if (targets.includes("all") || targets.includes("national")) {
      return members.filter((m) => m.phone).length;
    }
    if (targets.length === 0) return 0;
    return members.filter((m) => m.phone && targets.includes(deriveRegion(m.location))).length;
  }, [members, form.affected_regions]);

  const reloadBroadcasts = async () => {
    const b = await base44.entities.EmergencyBroadcast.list("-created_date", 50).catch(() => []);
    setBroadcasts(b || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message_body.trim()) {
      toast({ title: "Missing fields", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    if (form.affected_regions.length === 0) {
      toast({ title: "No region selected", description: "Select at least one region on the map.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const created = await base44.entities.EmergencyBroadcast.create({
        ...form,
        triggered_by_name: user?.full_name || user?.email || "Admin",
      });
      try {
        const res = await base44.functions.invoke("broadcastEmergencySos", {
          broadcast_id: created.id,
          manual_trigger: true,
        });
        toast({
          title: "Broadcast sent",
          description: `SMS delivered to ${res.data?.sent_count ?? res.sent_count ?? 0} members in the selected region(s).`,
        });
      } catch {
        toast({ title: "Broadcast saved", description: "SMS delivery failed — try resending from the list.", variant: "destructive" });
      }
      setForm({ title: "", message_body: "", severity: "warning", category: "service_outage", affected_regions: [] });
      await reloadBroadcasts();
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
      toast({ title: "Broadcast re-sent", description: `Delivered to ${res.data?.sent_count ?? res.sent_count ?? 0} members.` });
      await reloadBroadcasts();
    } catch (err) {
      toast({ title: "Resend failed", description: err.message, variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#05070A" }}>
        <div className="max-w-md text-center p-8" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={32} className="mx-auto mb-3" style={{ color: "#ef4444" }} />
          <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>Admin access required</p>
          <p className="text-sm mb-4" style={{ color: "#8A8F98" }}>This regional broadcast console is restricted to workspace admins.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <ArrowLeft size={12} /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6 lg:px-12" style={{ background: "#05070A" }}>
      <div className="relative z-10 max-w-7xl mx-auto">
        <Link to="/admin" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Admin Dashboard
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// REGIONAL SMS BROADCAST CONSOLE</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Targeted <span style={{ color: "#D1FF26" }}>Region Broadcast</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Send urgent SMS alerts or service updates to members in specific regions. Click regions on the map to build your target area — only members whose saved location maps to a selected region receive the message.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Map + selection */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3">
            <div className="p-4" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>SELECT TARGET AREA</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRegion("all")}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                  style={{
                    background: form.affected_regions.includes("all") ? "rgba(209,255,38,0.15)" : "rgba(5,7,10,0.4)",
                    border: `0.5px solid ${form.affected_regions.includes("all") ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.2)"}`,
                    color: form.affected_regions.includes("all") ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  <Globe2 size={11} /> All Regions
                </button>
              </div>

              <div className="relative w-full" style={{ height: "380px", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <RegionMapSelector selected={form.affected_regions} onToggle={toggleRegion} />
              </div>

              {/* Selected chips */}
              <div className="mt-3">
                <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SELECTED REGIONS</p>
                {form.affected_regions.length === 0 ? (
                  <p className="font-mono text-[10px]" style={{ color: "rgba(138,143,152,0.6)" }}>None — click a region on the map above.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {form.affected_regions.map((r) => {
                      const label = REGIONS.find((x) => x.value === r)?.label || r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRegion(r)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                          style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}
                        >
                          {label} <X size={11} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recipient estimate */}
              <div className="mt-3 flex items-center gap-3 p-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <Users size={16} style={{ color: "#D1FF26" }} />
                <div>
                  <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{recipientEstimate}</p>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>ESTIMATED RECIPIENTS</p>
                </div>
                <p className="ml-auto font-mono text-[8px] tracking-wider text-right" style={{ color: "rgba(138,143,152,0.7)" }}>
                  {members.length} members loaded<br />match by saved location
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="p-6 space-y-5 h-full" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="flex items-center gap-2 pb-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
                <Siren size={16} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>MESSAGE DETAILS</p>
              </div>

              <div>
                <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>ALERT TITLE</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Network outage — Northeast"
                  maxLength={120}
                  className="w-full px-3 py-3 text-sm outline-none"
                  style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>

              <div>
                <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>SEVERITY</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isActive = form.severity === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, severity: key })}
                        className="flex flex-col items-center gap-1 py-2.5 transition-all"
                        style={{ background: isActive ? cfg.bg : "rgba(5,7,10,0.4)", border: `0.5px solid ${isActive ? cfg.border : "rgba(138,143,152,0.1)"}` }}
                      >
                        <Icon size={15} style={{ color: isActive ? cfg.color : "#8A8F98" }} />
                        <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: isActive ? cfg.color : "#8A8F98" }}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>CATEGORY</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className="px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
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

              <div>
                <label className="font-mono text-[9px] tracking-widest mb-1.5 block" style={{ color: "#8A8F98" }}>SMS MESSAGE ({form.message_body.length}/1000)</label>
                <textarea
                  value={form.message_body}
                  onChange={(e) => setForm({ ...form, message_body: e.target.value })}
                  placeholder="The message members in the selected region(s) will receive via SMS..."
                  maxLength={1000}
                  rows={5}
                  className="w-full px-3 py-3 text-sm outline-none resize-none"
                  style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || form.affected_regions.length === 0}
                className="w-full flex items-center justify-center gap-2 py-4 font-mono text-xs tracking-[0.3em] uppercase transition-all disabled:opacity-50"
                style={{ background: form.severity === "sos" ? "#EF4444" : form.severity === "critical" ? "#FB923C" : "#D1FF26", color: "#05070A" }}
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> SENDING...</> : <><Send size={14} /> BROADCAST TO REGION</>}
              </button>
              {form.affected_regions.length === 0 && (
                <p className="font-mono text-[9px] text-center" style={{ color: "rgba(138,143,152,0.6)" }}>Select at least one region on the map to enable sending.</p>
              )}
            </form>
          </motion.div>
        </div>

        {/* Recent broadcasts */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>RECENT BROADCASTS</p>
            </div>
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{broadcasts.length} TOTAL</span>
          </div>

          {broadcasts.length === 0 ? (
            <div className="text-center py-12 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
              <Radio size={32} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO BROADCASTS YET</p>
              <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>Select a region on the map and issue your first alert.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {broadcasts.map((b, i) => {
                  const cfg = SEVERITY_CONFIG[b.severity] || SEVERITY_CONFIG.warning;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-4"
                      style={{ background: "rgba(16,20,29,0.8)", border: `0.5px solid ${cfg.border}` }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Icon size={14} style={{ color: cfg.color }} className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{b.title}</p>
                          <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{formatEst(b.created_date)}</p>
                        </div>
                      </div>
                      <p className="text-xs mb-2 line-clamp-2" style={{ color: "#8A8F98", lineHeight: 1.45 }}>{b.message_body}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        {(b.affected_regions || []).map((r) => (
                          <span key={r} className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                            {REGIONS.find((x) => x.value === r)?.label || r}
                          </span>
                        ))}
                      </div>
                      {b.broadcast_status === "delivered" && (
                        <div className="flex items-center gap-1.5 mb-2 font-mono text-[8px]" style={{ color: "#D1FF26" }}>
                          <CheckCircle2 size={11} /> DELIVERED: {b.sent_count}/{b.total_recipients}
                        </div>
                      )}
                      <button
                        onClick={() => handleResend(b)}
                        disabled={resendingId === b.id}
                        className="w-full flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-50"
                        style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                      >
                        {resendingId === b.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />} RESEND
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}