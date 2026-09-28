import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X, Star, BadgeCheck, Loader2, Plus, Award,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function EndorsementDialog({ candidate, onClose, onSaved }) {
  const [endorsements, setEndorsements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    skill: "",
    rating: 5,
    comment: "",
    endorser_name: "",
    endorser_company: "",
    endorser_role: "",
  });

  const loadEndorsements = useCallback(async () => {
    try {
      const data = await base44.entities.SkillEndorsement.filter(
        { candidate_phone: candidate.phone },
        "-created_date",
        50
      );
      setEndorsements(data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [candidate.phone]);

  useEffect(() => {
    loadEndorsements();
  }, [loadEndorsements]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.skill.trim() || !form.endorser_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.SkillEndorsement.create({
        candidate_phone: candidate.phone,
        candidate_name: candidate.name,
        skill: form.skill.trim(),
        rating: form.rating,
        comment: form.comment.trim(),
        endorser_name: form.endorser_name.trim(),
        endorser_company: form.endorser_company.trim(),
        endorser_role: form.endorser_role.trim(),
      });
      setForm({ skill: "", rating: 5, comment: "", endorser_name: "", endorser_company: "", endorser_role: "" });
      setShowForm(false);
      loadEndorsements();
      if (onSaved) onSaved();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80]" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.25 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-lg p-6 max-h-[88vh] overflow-y-auto" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>// SKILL ENDORSEMENTS</p>
            <h3 className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{candidate.name}</h3>
            <p className="text-xs" style={{ color: "#8A8F98" }}>{endorsements.length} endorsement{endorsements.length === 1 ? "" : "s"}</p>
          </div>
          <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]"><X size={16} style={{ color: "#8A8F98" }} /></button>
        </div>

        {/* Endorsement list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : endorsements.length === 0 && !showForm ? (
          <div className="text-center py-10">
            <Award size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO ENDORSEMENTS YET</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Be the first to endorse this candidate's skills</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {endorsements.map((end) => (
              <div key={end.id} className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>{end.skill}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={9} fill={n <= end.rating ? "#D1FF26" : "none"} style={{ color: n <= end.rating ? "#D1FF26" : "rgba(138,143,152,0.3)" }} />
                        ))}
                      </div>
                    </div>
                    {end.comment && <p className="text-[11px] mt-1.5" style={{ color: "#8A8F98", lineHeight: 1.4 }}>"{end.comment}"</p>}
                    <p className="font-mono text-[9px] mt-1.5" style={{ color: "rgba(138,143,152,0.6)" }}>
                      — {end.endorser_name}{end.endorser_role ? `, ${end.endorser_role}` : ""}{end.endorser_company ? ` · ${end.endorser_company}` : ""}
                    </p>
                  </div>
                  <BadgeCheck size={14} style={{ color: "rgba(209,255,38,0.5)" }} className="flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add endorsement form */}
        {showForm ? (
          <form onSubmit={handleSave} className="p-4" style={{ background: "rgba(209,255,38,0.03)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// LEAVE AN ENDORSEMENT</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>SKILL *</label>
                <input value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} placeholder="e.g. JavaScript" className="w-full px-3 py-2 text-[16px] sm:text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>RATING</label>
                <div className="flex items-center gap-1 py-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
                      <Star size={18} fill={n <= form.rating ? "#D1FF26" : "none"} style={{ color: n <= form.rating ? "#D1FF26" : "rgba(138,143,152,0.3)" }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>YOUR NAME *</label>
                <input value={form.endorser_name} onChange={(e) => setForm({ ...form, endorser_name: e.target.value })} className="w-full px-3 py-2 text-[16px] sm:text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>COMPANY</label>
                <input value={form.endorser_company} onChange={(e) => setForm({ ...form, endorser_company: e.target.value })} className="w-full px-3 py-2 text-[16px] sm:text-sm" style={inputStyle} />
              </div>
            </div>
            <div className="mb-3">
              <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>YOUR ROLE / TITLE</label>
              <input value={form.endorser_role} onChange={(e) => setForm({ ...form, endorser_role: e.target.value })} placeholder="e.g. Former Manager, CTO" className="w-full px-3 py-2 text-[16px] sm:text-sm" style={inputStyle} />
            </div>
            <div className="mb-4">
              <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>COMMENT (OPTIONAL)</label>
              <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} maxLength={500} placeholder="Share a brief note about this candidate's skill…" className="w-full px-3 py-2 text-sm resize-none" style={inputStyle} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>Cancel</button>
              <button type="submit" disabled={saving || !form.skill.trim() || !form.endorser_name.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={12} />} Submit
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <Plus size={12} /> Add Endorsement
          </button>
        )}
      </motion.div>
    </>
  );
}