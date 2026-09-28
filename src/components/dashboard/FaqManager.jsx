import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, X, Check, Loader2, HelpCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "getting_started", label: "Getting Started" },
  { id: "services", label: "Services" },
  { id: "pricing", label: "Pricing" },
  { id: "devices", label: "Devices" },
  { id: "dial_codes", label: "Dial Codes" },
  { id: "privacy", label: "Privacy" },
  { id: "other", label: "Other" },
];

const catLabel = (id) => (CATEGORIES.find((c) => c.id === id) || {}).label || id;
const EMPTY = { question: "", answer: "", category: "getting_started", dial_code: "", active: true, sort_order: 0 };

// Admin-only CRUD for the Voice FAQ flow. Add, edit, toggle visibility, and
// delete FAQ entries that callers hear in the searchable Voice FAQ page.
export default function FaqManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await base44.entities.FaqEntry.list("sort_order", 200);
      setItems(data || []);
    } catch { /* admin only */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.FaqEntry.subscribe(() => load());
    return unsub;
  }, []);

  const save = async () => {
    if (!editing.question.trim() || !editing.answer.trim()) { setError("Question and answer are required."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        question: editing.question.trim(),
        answer: editing.answer.trim(),
        category: editing.category,
        dial_code: editing.dial_code || undefined,
        active: editing.active,
        sort_order: editing.sort_order || 0,
      };
      if (editing.id) {
        await base44.entities.FaqEntry.update(editing.id, payload);
      } else {
        await base44.entities.FaqEntry.create(payload);
      }
      setEditing(null);
      await load();
    } catch (e) { setError(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const toggle = async (item) => {
    try { await base44.entities.FaqEntry.update(item.id, { active: !item.active }); await load(); } catch {}
  };

  const remove = async (item) => {
    try { await base44.entities.FaqEntry.delete(item.id); await load(); } catch {}
  };

  return (
    <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE FAQ MANAGER</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
          <Plus size={11} /> Add FAQ
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        These answers power the searchable Voice FAQ callers hear. Keep wording concise and on-brand with the Dial Browser theme.
      </p>

      {editing && (
        <div className="p-4 mb-4 space-y-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
          <input value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} placeholder="Question" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
          <textarea value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} placeholder="Answer (spoken aloud when callers listen)" rows={3} className="w-full px-3 py-2.5 text-sm resize-none outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="px-2 py-2 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input value={editing.dial_code || ""} onChange={(e) => setEditing({ ...editing, dial_code: e.target.value })} placeholder="Dial code (e.g. *200#)" className="px-2 py-2 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
            <input type="number" value={editing.sort_order || 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} placeholder="Order" className="px-2 py-2 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
          </div>
          <label className="flex items-center gap-2 font-mono text-[10px] tracking-widest cursor-pointer" style={{ color: "#8A8F98" }}>
            <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> ACTIVE (visible to callers)
          </label>
          {error && <p className="font-mono text-[10px]" style={{ color: "#ef4444" }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
            </button>
            <button onClick={() => setEditing(null)} className="flex items-center gap-1 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4"><Loader2 size={14} className="animate-spin" style={{ color: "#8A8F98" }} /><span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING…</span></div>
      ) : items.length === 0 ? (
        <p className="font-mono text-[9px] tracking-widest py-4" style={{ color: "#8A8F98" }}>NO FAQ ENTRIES — ADD ONE FOR CALLERS TO HEAR</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-auto pr-1">
          {items.map((it) => (
            <motion.div key={it.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${it.active ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.15)"}` }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-heading font-bold text-sm pr-1" style={{ color: it.active ? "#F5F5F7" : "#8A8F98" }}>{it.question}</p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggle(it)} title={it.active ? "Active" : "Hidden"}>{it.active ? <ToggleRight size={16} style={{ color: "#D1FF26" }} /> : <ToggleLeft size={16} style={{ color: "#8A8F98" }} />}</button>
                  <button onClick={() => setEditing({ ...it })} className="p-1"><Pencil size={12} style={{ color: "#8A8F98" }} /></button>
                  <button onClick={() => remove(it)} className="p-1"><Trash2 size={12} style={{ color: "#ef4444" }} /></button>
                </div>
              </div>
              <p className="text-xs mb-1 line-clamp-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{it.answer}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5" style={{ background: "rgba(138,143,152,0.1)", color: "#8A8F98" }}>{catLabel(it.category)}</span>
                {it.dial_code && <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>{it.dial_code}</span>}
                {!it.active && <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: "#ef4444" }}>HIDDEN</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}