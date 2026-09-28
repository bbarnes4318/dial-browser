import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, CheckCircle2, Loader2, ChevronUp, Lightbulb, X, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const categories = [
  "Local Services", "Travel", "Transportation", "Housing", "Music", "Shopping",
  "Creators", "AI Assistants", "Healthcare", "Finance", "Education", "Government", "Social", "Other"
];

export default function ServiceRequestForm() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [upvoted, setUpvoted] = useState({});
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    service_name: "",
    category: "Other",
    description: "",
    use_case: "",
    proposed_dial_code: "",
    requester_name: "",
    requester_region: "",
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await base44.entities.DialServiceRequest.list("-upvotes", 50);
      setRequests(data);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.service_name.trim()) return "Service name is required";
    if (!form.description.trim()) return "Description is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        service_name: form.service_name.trim(),
        category: form.category,
        description: form.description.trim(),
        use_case: form.use_case.trim() || undefined,
        proposed_dial_code: form.proposed_dial_code.trim() || undefined,
        requester_name: form.requester_name.trim() || undefined,
        requester_region: form.requester_region.trim() || undefined,
        upvotes: 0,
      };
      const created = await base44.entities.DialServiceRequest.create(payload);
      setRequests((prev) => [created, ...prev]);
      setSubmitted(true);
      setForm({
        service_name: "", category: "Other", description: "",
        use_case: "", proposed_dial_code: "", requester_name: "", requester_region: "",
      });
      setTimeout(() => { setSubmitted(false); setShowForm(false); }, 2500);
    } catch (err) {
      setError(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    if (upvoted[id]) return;
    setUpvoted((prev) => ({ ...prev, [id]: true }));
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r));
    try {
      const req = requests.find((r) => r.id === id);
      await base44.entities.DialServiceRequest.update(id, { upvotes: (req?.upvotes || 0) + 1 });
    } catch (err) {
      setUpvoted((prev) => ({ ...prev, [id]: false }));
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, upvotes: Math.max(0, (r.upvotes || 0) - 1) } : r));
    }
  };

  const inputStyle = {
    background: "rgba(5,7,10,0.6)",
    border: "0.5px solid rgba(138,143,152,0.2)",
    color: "#F5F5F7",
  };

  const statusColors = {
    submitted: "#8A8F98",
    under_review: "#4CB4FF",
    planned: "#f59e0b",
    in_development: "#D1FF26",
    launched: "#D1FF26",
    declined: "#ef4444",
  };

  return (
    <div className="mt-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// COMMUNITY REQUESTS</p>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tight" style={{ color: "#F5F5F7" }}>
            Request a <span style={{ color: "#D1FF26" }}>New Service</span>
          </h2>
          <p className="text-sm mt-2 max-w-xl" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            Don't see what you need? Submit a request and let the community upvote it into reality.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-3 font-mono text-[11px] tracking-widest uppercase transition-all whitespace-nowrap"
          style={{
            background: showForm ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.08)",
            border: `0.5px solid ${showForm ? "rgba(138,143,152,0.3)" : "rgba(209,255,38,0.3)"}`,
            color: showForm ? "#8A8F98" : "#D1FF26",
            boxShadow: !showForm ? "0 0 20px rgba(209,255,38,0.1)" : "none",
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Close Form" : "Submit Request"}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-8"
          >
            <div className="p-6 lg:p-8" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              {submitted ? (
                <div className="text-center py-12">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, type: "spring" }}>
                    <CheckCircle2 size={48} style={{ color: "#D1FF26", margin: "0 auto 16px" }} />
                  </motion.div>
                  <p className="font-heading font-bold text-xl mb-2" style={{ color: "#F5F5F7" }}>Request Submitted</p>
                  <p className="font-mono text-sm" style={{ color: "#8A8F98" }}>Your service request is now live for community upvotes.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Service Name */}
                    <div>
                      <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SERVICE NAME *</label>
                      <input
                        type="text"
                        value={form.service_name}
                        onChange={(e) => handleChange("service_name", e.target.value)}
                        placeholder="e.g. Vet Finder"
                        className="w-full px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle}
                      />
                    </div>
                    {/* Category */}
                    <div>
                      <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>CATEGORY *</label>
                      <select
                        value={form.category}
                        onChange={(e) => handleChange("category", e.target.value)}
                        className="w-full px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle}
                      >
                        {categories.map((cat) => <option key={cat} value={cat} style={{ background: "#10141D" }}>{cat}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>DESCRIPTION *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="What should this service do? How would a member use it via voice or SMS?"
                      rows={3}
                      className="w-full px-4 py-3 text-sm outline-none transition-all resize-none"
                      style={inputStyle}
                    />
                  </div>

                  {/* Use Case */}
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>EXAMPLE USE CASE</label>
                    <input
                      type="text"
                      value={form.use_case}
                      onChange={(e) => handleChange("use_case", e.target.value)}
                      placeholder="e.g. 'Find a 24-hour vet near me'"
                      className="w-full px-4 py-3 text-sm outline-none transition-all"
                      style={inputStyle}
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* Proposed Dial Code */}
                    <div>
                      <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SUGGESTED DIAL CODE</label>
                      <input
                        type="text"
                        value={form.proposed_dial_code}
                        onChange={(e) => handleChange("proposed_dial_code", e.target.value)}
                        placeholder="*109#"
                        className="w-full px-4 py-3 font-mono text-sm outline-none transition-all"
                        style={inputStyle}
                      />
                    </div>
                    {/* Requester Name */}
                    <div>
                      <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR NAME</label>
                      <input
                        type="text"
                        value={form.requester_name}
                        onChange={(e) => handleChange("requester_name", e.target.value)}
                        placeholder="Anonymous"
                        className="w-full px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle}
                      />
                    </div>
                    {/* Region */}
                    <div>
                      <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>REGION</label>
                      <input
                        type="text"
                        value={form.requester_region}
                        onChange={(e) => handleChange("requester_region", e.target.value)}
                        placeholder="e.g. Brooklyn, NY"
                        className="w-full px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 font-mono text-[10px] tracking-wider" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                      ⚠ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-4 font-mono text-[11px] tracking-widest uppercase transition-all disabled:opacity-50"
                    style={{
                      background: submitting ? "rgba(138,143,152,0.2)" : "rgba(209,255,38,0.1)",
                      border: "0.5px solid rgba(209,255,38,0.4)",
                      color: "#D1FF26",
                      boxShadow: !submitting ? "0 0 24px rgba(209,255,38,0.12)" : "none",
                    }}
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Requests List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// TRENDING REQUESTS</p>
          </div>
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
            {requests.length} REQUEST{requests.length !== 1 ? "S" : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16" style={{ background: "rgba(16,20,29,0.3)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
            <Lightbulb size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-sm tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO REQUESTS YET</p>
            <p className="text-sm" style={{ color: "#8A8F98" }}>Be the first to suggest a new dial service.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {requests.map((req, i) => {
                const statusColor = statusColors[req.status] || "#8A8F98";
                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.2) }}
                    className="p-5 flex flex-col"
                    style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.08)" }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                        {req.category}
                      </span>
                      <span className="font-mono text-[8px] tracking-widest uppercase flex items-center gap-1.5" style={{ color: statusColor }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 4px ${statusColor}` }} />
                        {(req.status || "submitted").replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="font-heading font-bold text-base mb-2" style={{ color: "#F5F5F7" }}>{req.service_name}</h3>

                    {/* Description */}
                    <p className="text-xs leading-relaxed mb-3 flex-1" style={{ color: "#8A8F98", lineHeight: "1.6" }}>{req.description}</p>

                    {/* Use case */}
                    {req.use_case && (
                      <div className="mb-3 p-2 font-mono text-[10px]" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                        <span style={{ color: "#8A8F98" }}>EXAMPLE: </span>
                        <span style={{ color: "#F5F5F7" }}>"{req.use_case}"</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                      <div className="flex items-center gap-3">
                        {req.proposed_dial_code && (
                          <span className="font-mono text-[10px] font-bold" style={{ color: "#D1FF26" }}>{req.proposed_dial_code}</span>
                        )}
                        {req.requester_name && (
                          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>by {req.requester_name}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUpvote(req.id)}
                        disabled={upvoted[req.id]}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 transition-all disabled:cursor-default"
                        style={{
                          background: upvoted[req.id] ? "rgba(209,255,38,0.12)" : "transparent",
                          border: `0.5px solid ${upvoted[req.id] ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.15)"}`,
                          color: upvoted[req.id] ? "#D1FF26" : "#8A8F98",
                        }}
                      >
                        <ChevronUp size={12} style={{ color: upvoted[req.id] ? "#D1FF26" : "#8A8F98" }} />
                        <span className="font-mono text-[10px] font-bold">{req.upvotes || 0}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}