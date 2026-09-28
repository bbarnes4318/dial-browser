import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Loader2, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { FIELDS, JOB_TYPES } from "./shared";

export default function PostJobDialog({ onClose, onPosted }) {
  const [form, setForm] = useState({ title: "", company: "", field: "General", location: "", pay: "", job_type: "Full-Time", dial_code: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await base44.entities.JobListing.create({
        title: form.title.trim(),
        company: form.company.trim(),
        field: form.field,
        location: form.location.trim() || undefined,
        pay: form.pay.trim() || undefined,
        job_type: form.job_type,
        dial_code: form.dial_code.trim() || undefined,
        active: true,
        alert_sent: false,
      });
      onPosted();
    } catch {
      setError("Could not post job. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 text-[16px] sm:text-sm";
  const inputStyle = { background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" };
  const labelCls = "block font-mono text-[9px] tracking-widest mb-2";

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80]" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.25 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-lg p-6 max-h-[85vh] overflow-y-auto" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// POST A JOB</p>
            <h3 className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>New Job Listing</h3>
          </div>
          <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]"><X size={16} style={{ color: "#8A8F98" }} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls} style={{ color: "#8A8F98" }}>JOB TITLE *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#8A8F98" }}>COMPANY *</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: "#8A8F98" }}>FIELD</label>
              <select value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} className={inputCls} style={inputStyle}>
                {FIELDS.map((f) => <option key={f} value={f} style={{ background: "#10141D" }}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: "#8A8F98" }}>JOB TYPE</label>
              <select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })} className={inputCls} style={inputStyle}>
                {JOB_TYPES.map((t) => <option key={t} value={t} style={{ background: "#10141D" }}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: "#8A8F98" }}>LOCATION</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City or Remote" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#8A8F98" }}>PAY RANGE</label>
              <input value={form.pay} onChange={(e) => setForm({ ...form, pay: e.target.value })} placeholder="$50k-$70k" className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}><Phone size={10} /> DIAL CODE (OPTIONAL)</label>
            <input value={form.dial_code} onChange={(e) => setForm({ ...form, dial_code: e.target.value })} placeholder="*109#" className={inputCls} style={inputStyle} />
          </div>
          {error && <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving || !form.title.trim() || !form.company.trim()} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Post Job
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>Cancel</button>
          </div>
          <p className="font-mono text-[8px] text-center" style={{ color: "rgba(138,143,152,0.5)" }}>Posting is free. Unlock applicants for $9.99 per listing.</p>
        </form>
      </motion.div>
    </>
  );
}