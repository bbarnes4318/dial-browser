import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Loader2, Check, Clock, X, ChevronRight, FileText, RefreshCw, Phone, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DISPUTE_TYPES = [
  { value: "other", label: "Service Call Issue", icon: Phone },
  { value: "item_not_received", label: "Service Not Delivered", icon: Clock },
  { value: "payment_not_received", label: "Overcharged", icon: ShieldAlert },
  { value: "item_not_as_described", label: "Wrong Service", icon: FileText },
  { value: "damaged_item", label: "Poor Quality", icon: ShieldAlert },
];

const STATUS_FLOW = ["pending", "under_review", "resolved"];

const STATUS_META = {
  pending: { label: "Filed", color: "#8A8F98", icon: FileText },
  under_review: { label: "Under Review", color: "#D1FF26", icon: Clock },
  resolved: { label: "Resolved", color: "#22c55e", icon: Check },
  dismissed: { label: "Dismissed", color: "#ef4444", icon: X },
};

export default function DisputeSection() {
  const [form, setForm] = useState({ service_name: "", reporter_name: "", reporter_phone: "", dispute_type: "other", call_reference: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  const loadDisputes = useCallback(async (name) => {
    if (!name?.trim()) return;
    setLoadingTracker(true);
    try {
      const data = await base44.entities.Dispute.filter({ reporter_name: name.trim() }, "-created_date", 20);
      setDisputes(data || []);
      setShowTracker(true);
    } catch {
      setDisputes([]);
    } finally {
      setLoadingTracker(false);
    }
  }, []);

  useEffect(() => {
    if (success?.name) {
      loadDisputes(success.name);
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, loadDisputes]);

  // Realtime update of disputes
  useEffect(() => {
    if (!showTracker || !form.reporter_name.trim()) return;
    const unsub = base44.entities.Dispute.subscribe((event) => {
      if (event.type === "create" && event.data?.reporter_name === form.reporter_name.trim()) {
        setDisputes((prev) => [event.data, ...prev.filter((d) => d.id !== event.data.id)]);
      } else if (event.type === "update") {
        setDisputes((prev) => prev.map((d) => (d.id === event.data.id ? event.data : d)));
      }
    });
    return unsub;
  }, [showTracker, form.reporter_name]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.service_name.trim() || !form.reporter_name.trim() || !form.description.trim()) {
      setError("Service name, your name, and a description of the issue are required.");
      return;
    }
    if (form.description.trim().length < 20) {
      setError("Please provide a more detailed description (at least 20 characters).");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.Dispute.create({
        listing_title: form.service_name.trim(),
        reporter_name: form.reporter_name.trim(),
        counterparty_name: form.reporter_phone.trim() || "N/A",
        dispute_type: form.dispute_type,
        description: form.description.trim(),
        trade_id: form.call_reference.trim() || undefined,
        status: "pending",
      });
      setSuccess({ name: form.reporter_name.trim(), message: "Your dispute has been filed. Track its progress below." });
      setForm((p) => ({ ...p, service_name: "", call_reference: "", description: "" }));
    } catch {
      setError("Could not file your dispute. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = () => loadDisputes(form.reporter_name);

  const getStatusIndex = (status) => (status === "dismissed" ? 2 : STATUS_FLOW.indexOf(status));
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  return (
    <section className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.03), transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mb-10 lg:mb-12">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DISPUTE RESOLUTION</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Report an <span style={{ color: "#D1FF26" }}>Issue.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Had a problem with a service call? File a dispute and track its resolution from filing to fix in real time.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="p-5 lg:p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <p className="font-mono text-[9px] tracking-widest mb-5" style={{ color: "#D1FF26" }}>▸ FILE A DISPUTE</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>SERVICE NAME *</label>
                  <input value={form.service_name} onChange={(e) => update("service_name", e.target.value)} placeholder="e.g. Weather (*200#), Medical Triage" className="w-full px-3 py-2.5 text-[16px] sm:text-sm outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>YOUR NAME *</label>
                    <input value={form.reporter_name} onChange={(e) => update("reporter_name", e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 text-[16px] sm:text-sm outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>PHONE (OPTIONAL)</label>
                    <input value={form.reporter_phone} onChange={(e) => update("reporter_phone", e.target.value)} placeholder="For follow-up" type="tel" className="w-full px-3 py-2.5 text-[16px] sm:text-sm outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-widest block mb-2" style={{ color: "#8A8F98" }}>ISSUE TYPE</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DISPUTE_TYPES.map((dt) => {
                      const Icon = dt.icon;
                      const isSelected = form.dispute_type === dt.value;
                      return (
                        <button key={dt.value} type="button" onClick={() => update("dispute_type", dt.value)} className="flex flex-col items-center gap-1.5 p-2.5 transition-all" style={{ background: isSelected ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.6)", border: `0.5px solid ${isSelected ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}` }}>
                          <Icon size={14} style={{ color: isSelected ? "#D1FF26" : "#8A8F98" }} />
                          <span className="font-mono text-[8px] text-center leading-tight" style={{ color: isSelected ? "#D1FF26" : "#8A8F98" }}>{dt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>CALL REFERENCE (OPTIONAL)</label>
                  <input value={form.call_reference} onChange={(e) => update("call_reference", e.target.value)} placeholder="Dial code or call ID if available" className="w-full px-3 py-2.5 text-[16px] sm:text-sm outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-widest block mb-1.5" style={{ color: "#8A8F98" }}>DESCRIBE THE ISSUE *</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} placeholder="What went wrong with the service call? Include dates, times, and what you expected vs. what happened…" className="w-full px-3 py-2.5 text-sm resize-none outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>

                {error && <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>}
                {success && <p className="font-mono text-[10px] tracking-widest" style={{ color: "#22c55e" }}>✓ {success.message}</p>}

                <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                  Submit Dispute
                </button>
              </form>
            </div>
          </motion.div>

          {/* Status Tracker */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="p-5 lg:p-6 h-full" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>▸ RESOLUTION TRACKER</p>
                {showTracker && (
                  <button onClick={handleTrack} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ color: "#8A8F98" }}>
                    <RefreshCw size={10} /> Refresh
                  </button>
                )}
              </div>

              {!showTracker ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock size={28} style={{ color: "rgba(209,255,38,0.3)", marginBottom: 12 }} />
                  <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO DISPUTES TRACKED YET</p>
                  <p className="text-xs max-w-xs mb-5" style={{ color: "#8A8F98", lineHeight: 1.5 }}>Enter your name in the form, file a dispute, or look up existing ones.</p>
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <input value={form.reporter_name} onChange={(e) => update("reporter_name", e.target.value)} placeholder="Your name" className="flex-1 px-3 py-2 text-[16px] sm:text-sm outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                    <button onClick={handleTrack} disabled={loadingTracker || !form.reporter_name.trim()} className="flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                      {loadingTracker ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
                      Find
                    </button>
                  </div>
                </div>
              ) : loadingTracker ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
                </div>
              ) : disputes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={28} style={{ color: "rgba(209,255,38,0.3)", marginBottom: 12 }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO DISPUTES FOUND</p>
                  <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>File one using the form on the left.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                  <AnimatePresence>
                    {disputes.map((dispute) => {
                      const stepIdx = getStatusIndex(dispute.status);
                      const isDismissed = dispute.status === "dismissed";
                      const meta = STATUS_META[dispute.status] || STATUS_META.pending;
                      return (
                        <motion.div key={dispute.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <span className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5" style={{ background: `${meta.color}15`, color: meta.color, border: `0.5px solid ${meta.color}30` }}>
                                {meta.label}
                              </span>
                              <p className="font-heading font-bold text-sm mt-1.5 truncate" style={{ color: "#F5F5F7" }}>{dispute.listing_title}</p>
                              <p className="font-mono text-[8px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>FILED {formatDate(dispute.created_date)}</p>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs mb-3 line-clamp-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{dispute.description}</p>

                          {/* Progress tracker */}
                          {isDismissed ? (
                            <div className="flex items-center gap-2 p-2.5" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
                              <X size={12} style={{ color: "#ef4444" }} />
                              <p className="font-mono text-[8px] tracking-widest" style={{ color: "#ef4444" }}>DISMISSED</p>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              {STATUS_FLOW.map((step, idx) => {
                                const isComplete = idx < stepIdx;
                                const isCurrent = idx === stepIdx;
                                const stepMeta = STATUS_META[step];
                                const StepIcon = stepMeta.icon;
                                return (
                                  <div key={step} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="flex items-center justify-center w-7 h-7 transition-all" style={{ background: isComplete || isCurrent ? `${stepMeta.color}15` : "rgba(5,7,10,0.5)", border: `1px solid ${isComplete || isCurrent ? stepMeta.color : "rgba(138,143,152,0.2)"}`, boxShadow: isCurrent ? `0 0 10px ${stepMeta.color}40` : "none" }}>
                                        <StepIcon size={11} style={{ color: isComplete || isCurrent ? stepMeta.color : "#8A8F98" }} />
                                      </div>
                                      <span className="font-mono text-[7px] tracking-widest uppercase" style={{ color: isComplete || isCurrent ? stepMeta.color : "#8A8F98" }}>{stepMeta.label}</span>
                                    </div>
                                    {idx < STATUS_FLOW.length - 1 && (
                                      <div className="flex-1 h-0.5 mx-1.5" style={{ background: idx < stepIdx ? stepMeta.color : "rgba(138,143,152,0.15)" }} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}