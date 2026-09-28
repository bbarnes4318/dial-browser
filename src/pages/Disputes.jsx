import React, { useState, useEffect, useRef } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Loader2, Check, ChevronRight, X, ShieldAlert,
  Clock, FileText, MessageSquare, ArrowRight, Filter, RefreshCw, Paperclip, Link2, Mic, Play, Pause,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import DisputeVoiceRecorder from "@/components/disputes/DisputeVoiceRecorder";

const DISPUTE_TYPES = [
  { value: "item_not_received", label: "Item Not Received" },
  { value: "item_not_as_described", label: "Item Not As Described" },
  { value: "payment_not_received", label: "Payment Not Received" },
  { value: "damaged_item", label: "Damaged Item" },
  { value: "service_not_completed", label: "Service Not Completed" },
  { value: "poor_service_quality", label: "Poor Service Quality" },
  { value: "overcharged", label: "Overcharged" },
  { value: "unprofessional_conduct", label: "Unprofessional Conduct" },
  { value: "no_show", label: "Provider No-Show" },
  { value: "other", label: "Other Issue" },
];

const STATUS_STEPS = [
  { value: "pending", label: "Filed", icon: FileText, color: "#8A8F98" },
  { value: "under_review", label: "Under Review", icon: Clock, color: "#D1FF26" },
  { value: "resolved", label: "Resolved", icon: Check, color: "#22c55e" },
  { value: "dismissed", label: "Dismissed", icon: X, color: "#ef4444" },
];

const STATUS_FLOW = ["pending", "under_review", "resolved"];

const getStatusIndex = (status) => {
  if (status === "dismissed") return 2;
  return STATUS_FLOW.indexOf(status);
};

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    listing_title: "",
    reporter_name: "",
    counterparty_name: "",
    dispute_type: "item_not_received",
    description: "",
    trade_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [voiceNoteUrl, setVoiceNoteUrl] = useState("");
  const [voiceNoteDuration, setVoiceNoteDuration] = useState(0);
  const [playingVoice, setPlayingVoice] = useState(null);
  const voiceAudioRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    try {
      const data = await base44.entities.Dispute.list("-created_date", 50);
      setDisputes(data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachmentUrl(file_url);
      setAttachmentName(file.name);
    } catch {
      setError("Could not upload the file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl("");
    setAttachmentName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.listing_title.trim() || !form.reporter_name.trim() || !form.description.trim()) {
      setError("Listing title, your name, and a description of the issue are required.");
      return;
    }
    if (form.description.trim().length < 20) {
      setError("Please provide a more detailed description (at least 20 characters).");
      return;
    }
    setSubmitting(true);
    try {
      const created = await base44.entities.Dispute.create({
        ...form,
        trade_id: form.trade_id || undefined,
        attachment_url: attachmentUrl || undefined,
        attachment_name: attachmentName || undefined,
        voice_note_url: voiceNoteUrl || undefined,
        voice_note_duration: voiceNoteDuration || undefined,
        status: "pending",
      });
      // Auto-transcribe the voice note so admins can read complaints instantly.
      if (voiceNoteUrl && created?.id) {
        base44.functions.invoke("transcribe-dispute-voice", { dispute_id: created.id }).catch(() => {});
      }
      setSuccess("Your dispute has been filed. Our team will review it and update the status shortly.");
      setShowForm(false);
      setForm({ listing_title: "", reporter_name: "", counterparty_name: "", dispute_type: "item_not_received", description: "", trade_id: "" });
      setAttachmentUrl("");
      setAttachmentName("");
      setVoiceNoteUrl("");
      setVoiceNoteDuration(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDisputes();
    } catch {
      setError("Could not file your dispute. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (disputeId, newStatus) => {
    setUpdatingId(disputeId);
    try {
      await base44.entities.Dispute.update(disputeId, { status: newStatus });
      setSuccess(`Dispute status updated to "${newStatus === "under_review" ? "In Progress" : newStatus}".`);
      await loadDisputes();
    } catch {
      setError("Could not update dispute status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredDisputes = filter === "all" ? disputes : disputes.filter((d) => d.status === filter);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DISPUTE RESOLUTION</p>
        </div>
        <h1 className="font-heading font-black text-3xl lg:text-5xl mb-2" style={{ color: "#F5F5F7" }}>
          File & Track <span style={{ color: "#D1FF26" }}>Disputes</span>
        </h1>
        <p className="text-sm mb-8 max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Flag issues with marketplace transactions, content, or services. Track the resolution progress from filing to resolution.
        </p>

        {/* Action bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={12} style={{ color: "#8A8F98" }} />
            <div className="flex gap-1.5">
              {["all", "pending", "under_review", "resolved", "dismissed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all"
                  style={{
                    background: filter === f ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                    border: `0.5px solid ${filter === f ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`,
                    color: filter === f ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  {f === "under_review" ? "Review" : f}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
            style={{
              background: showForm ? "rgba(16,20,29,0.6)" : "rgba(209,255,38,0.1)",
              border: `0.5px solid ${showForm ? "rgba(138,143,152,0.2)" : "rgba(209,255,38,0.3)"}`,
              color: showForm ? "#8A8F98" : "#D1FF26",
            }}
          >
            {showForm ? <X size={12} /> : <AlertTriangle size={12} />}
            {showForm ? "Cancel" : "File New Dispute"}
          </button>
        </div>

        {/* File dispute form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-6 space-y-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>▸ FILE A DISPUTE</p>

                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>LISTING TITLE *</label>
                  <input
                    value={form.listing_title}
                    onChange={(e) => update("listing_title", e.target.value)}
                    placeholder="Title of the listing, transaction, or content involved"
                    className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                    style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>YOUR NAME *</label>
                    <input
                      value={form.reporter_name}
                      onChange={(e) => update("reporter_name", e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>COUNTERPARTY (OPTIONAL)</label>
                    <input
                      value={form.counterparty_name}
                      onChange={(e) => update("counterparty_name", e.target.value)}
                      placeholder="Name of the other party"
                      className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>ISSUE TYPE</label>
                    <select
                      value={form.dispute_type}
                      onChange={(e) => update("dispute_type", e.target.value)}
                      className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    >
                      {DISPUTE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>TRADE ID (OPTIONAL)</label>
                    <input
                      value={form.trade_id}
                      onChange={(e) => update("trade_id", e.target.value)}
                      placeholder="Transaction reference if available"
                      className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>DESCRIPTION OF THE PROBLEM *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={4}
                    placeholder="Describe what happened in detail. Include dates, amounts, and any communication you've had with the other party…"
                    className="w-full px-3 py-2.5 text-sm resize-none"
                    style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                </div>

                {/* File attachment */}
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>ATTACH EVIDENCE (OPTIONAL)</label>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="hidden" />
                  {attachmentUrl ? (
                    <div className="flex items-center justify-between gap-3 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip size={12} style={{ color: "#D1FF26" }} />
                        <span className="font-mono text-[10px] truncate" style={{ color: "#F5F5F7" }}>{attachmentName}</span>
                      </div>
                      <button type="button" onClick={removeAttachment} className="p-1 hover:bg-[rgba(239,68,68,0.1)]">
                        <X size={12} style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 py-3 transition-all disabled:opacity-40"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px dashed rgba(138,143,152,0.3)", color: "#8A8F98" }}
                    >
                      {uploading ? <><Loader2 size={12} className="animate-spin" /> Uploading…</> : <><Paperclip size={12} /> Attach screenshot or document</>}
                    </button>
                  )}
                </div>

                {/* Voice note */}
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>EXPLAIN THE PROBLEM IN YOUR OWN WORDS (OPTIONAL)</label>
                  <DisputeVoiceRecorder
                    existingUrl={voiceNoteUrl}
                    existingDuration={voiceNoteDuration}
                    onRecorded={(url, dur) => { setVoiceNoteUrl(url); setVoiceNoteDuration(dur); }}
                    onClear={() => { setVoiceNoteUrl(""); setVoiceNoteDuration(0); }}
                  />
                </div>

                {error && <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                  Submit Dispute
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {success && (
          <div className="mb-6 p-4 flex items-center justify-between gap-3" style={{ background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.2)" }}>
            <div className="flex items-center gap-3">
              <Check size={16} style={{ color: "#22c55e" }} />
              <p className="text-sm" style={{ color: "#F5F5F7" }}>{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="p-1 hover:bg-[rgba(138,143,152,0.1)]">
              <X size={14} style={{ color: "#8A8F98" }} />
            </button>
          </div>
        )}

        <audio ref={voiceAudioRef} onEnded={() => setPlayingVoice(null)} className="hidden" />

        {/* Disputes list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <ShieldAlert size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
              {filter === "all" ? "NO DISPUTES FILED" : `NO ${filter.toUpperCase().replace("_", " ")} DISPUTES`}
            </p>
            <p className="text-sm max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
              {filter === "all" ? "File a dispute to report an issue with a transaction or content." : "Try a different filter or file a new dispute."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDisputes.map((dispute) => {
              const stepIdx = getStatusIndex(dispute.status);
              const isDismissed = dispute.status === "dismissed";
              return (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5"
                  style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 font-mono text-[8px] tracking-widest uppercase"
                          style={{
                            background: isDismissed ? "rgba(239,68,68,0.1)" : dispute.status === "resolved" ? "rgba(34,197,94,0.1)" : dispute.status === "under_review" ? "rgba(209,255,38,0.1)" : "rgba(138,143,152,0.1)",
                            color: isDismissed ? "#ef4444" : dispute.status === "resolved" ? "#22c55e" : dispute.status === "under_review" ? "#D1FF26" : "#8A8F98",
                            border: `0.5px solid ${isDismissed ? "rgba(239,68,68,0.2)" : dispute.status === "resolved" ? "rgba(34,197,94,0.2)" : dispute.status === "under_review" ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.2)"}`,
                          }}
                        >
                          {dispute.status === "under_review" ? "UNDER REVIEW" : dispute.status.toUpperCase()}
                        </span>
                        <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                          {DISPUTE_TYPES.find((t) => t.value === dispute.dispute_type)?.label || "Other"}
                        </span>
                      </div>
                      <p className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{dispute.listing_title}</p>
                      <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>
                        FILED {formatDate(dispute.created_date)} · BY {dispute.reporter_name?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4 p-3" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageSquare size={10} style={{ color: "#8A8F98" }} />
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>DESCRIPTION</span>
                    </div>
                    <p className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{dispute.description}</p>
                  </div>

                  {/* Attachment */}
                  {dispute.attachment_url && (
                    <div className="mb-4 p-3" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Paperclip size={10} style={{ color: "#8A8F98" }} />
                        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>ATTACHED EVIDENCE</span>
                      </div>
                      {dispute.attachment_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <a href={proxyMediaUrl(dispute.attachment_url)} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={proxyMediaUrl(dispute.attachment_url)} alt={dispute.attachment_name || "evidence"} className="max-h-48 w-auto rounded" style={{ border: "0.5px solid rgba(209,255,38,0.15)" }} />
                        </a>
                      ) : (
                        <a href={proxyMediaUrl(dispute.attachment_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 transition-all hover:bg-[rgba(209,255,38,0.05)]" style={{ border: "0.5px solid rgba(138,143,152,0.1)" }}>
                          <Link2 size={12} style={{ color: "#D1FF26" }} />
                          <span className="text-xs truncate" style={{ color: "#D1FF26" }}>{dispute.attachment_name || "View attachment"}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Voice note */}
                  {dispute.voice_note_url && (
                    <div className="mb-4 p-3" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Mic size={10} style={{ color: "#D1FF26" }} />
                        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>VOICE NOTE · {dispute.voice_note_duration || 0}s</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const a = voiceAudioRef.current;
                          if (!a) return;
                          if (playingVoice === dispute.id) { a.pause(); setPlayingVoice(null); }
                          else {
                            a.src = dispute.voice_note_url;
                            a.play().then(() => setPlayingVoice(dispute.id)).catch(() => {});
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 font-mono text-[9px] tracking-widest uppercase"
                        style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}
                      >
                        {playingVoice === dispute.id ? <Pause size={11} /> : <Play size={11} />} {playingVoice === dispute.id ? "Pause" : "Play Voice Note"}
                      </button>
                    </div>
                  )}

                  {/* Admin status controls */}
                  <div className="mb-4 p-3" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                    <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>▸ UPDATE STATUS</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(dispute.id, "under_review")}
                        disabled={updatingId === dispute.id || dispute.status === "under_review"}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-30 hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]"
                        style={{
                          background: dispute.status === "under_review" ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.05)",
                          border: "0.5px solid rgba(209,255,38,0.25)",
                          color: "#D1FF26",
                        }}
                      >
                        {updatingId === dispute.id ? <Loader2 size={10} className="animate-spin" /> : <Clock size={10} />}
                        In Progress
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(dispute.id, "resolved")}
                        disabled={updatingId === dispute.id || dispute.status === "resolved"}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-30 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                        style={{
                          background: dispute.status === "resolved" ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.05)",
                          border: "0.5px solid rgba(34,197,94,0.25)",
                          color: "#22c55e",
                        }}
                      >
                        {updatingId === dispute.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                        Resolved
                      </button>
                    </div>
                  </div>

                  {/* Status tracker */}
                  <div>
                    <p className="font-mono text-[8px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>▸ RESOLUTION STATUS</p>
                    {isDismissed ? (
                      <div className="flex items-center gap-2 p-3" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
                        <X size={14} style={{ color: "#ef4444" }} />
                        <p className="text-xs" style={{ color: "#F5F5F7" }}>This dispute has been dismissed. If you believe this is an error, please contact support.</p>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {STATUS_FLOW.map((step, idx) => {
                          const isComplete = idx < stepIdx;
                          const isCurrent = idx === stepIdx;
                          const Icon = STATUS_STEPS.find((s) => s.value === step)?.icon || Clock;
                          const stepColor = STATUS_STEPS.find((s) => s.value === step)?.color || "#8A8F98";
                          return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center gap-1.5">
                                <div
                                  className="flex items-center justify-center w-8 h-8 transition-all"
                                  style={{
                                    background: isComplete || isCurrent ? `${stepColor}15` : "rgba(5,7,10,0.5)",
                                    border: `1px solid ${isComplete || isCurrent ? stepColor : "rgba(138,143,152,0.2)"}`,
                                    boxShadow: isCurrent ? `0 0 12px ${stepColor}40` : "none",
                                  }}
                                >
                                  <Icon size={13} style={{ color: isComplete || isCurrent ? stepColor : "#8A8F98" }} />
                                </div>
                                <span className="font-mono text-[7px] tracking-widest uppercase" style={{ color: isComplete || isCurrent ? stepColor : "#8A8F98" }}>
                                  {STATUS_STEPS.find((s) => s.value === step)?.label}
                                </span>
                              </div>
                              {idx < STATUS_FLOW.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2" style={{ background: idx < stepIdx ? stepColor : "rgba(138,143,152,0.15)" }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}