import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Plus, Phone, MessageSquare, Star, Trash2, X, Search, UserPlus, Contact as ContactIcon, Pencil, Check, Send,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import BroadcastDialog from "@/components/phone/BroadcastDialog";
import { useAuth } from "@/lib/AuthContext";

const CATEGORIES = [
  { id: "personal", label: "Personal", color: "#D1FF26" },
  { id: "work", label: "Work", color: "#42E1F6" },
  { id: "service", label: "Service", color: "#fb923c" },
  { id: "emergency", label: "Emergency", color: "#ef4444" },
  { id: "other", label: "Other", color: "#a78bfa" },
];

const catColor = (c) => (CATEGORIES.find((x) => x.id === c) || CATEGORIES[4]).color;

export default function AddressBook() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // contact or "new"
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", category: "personal", favorite: false, notes: "" });
  const [broadcast, setBroadcast] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const rows = await base44.entities.Contact.filter({ created_by_id: user.id }, "-created_date", 500);
      const sorted = (Array.isArray(rows) ? rows : []).sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
      setContacts(sorted);
    } catch { /* empty state */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm({ name: "", phone: "", category: "personal", favorite: false, notes: "" }); setEditing("new"); };
  const openEdit = (c) => { setForm({ name: c.name || "", phone: c.phone || "", category: c.category || "personal", favorite: !!c.favorite, notes: c.notes || "" }); setEditing(c); };
  const close = () => setEditing(null);

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    try {
      if (editing === "new") {
        await base44.entities.Contact.create({ ...form, contact_type: "phone" });
      } else {
        await base44.entities.Contact.update(editing.id, form);
      }
      await load();
      close();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const remove = async (c) => {
    try { await base44.entities.Contact.delete(c.id); setContacts((p) => p.filter((x) => x.id !== c.id)); } catch {}
  };

  const toggleFav = async (c) => {
    try { await base44.entities.Contact.update(c.id, { favorite: !c.favorite }); await load(); } catch {}
  };

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    return !q || (c.name || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 pt-8 pb-24">
        <Link to="/phone" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Dial Phone
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ContactIcon size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// ADDRESS BOOK</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl" style={{ color: "#F5F5F7" }}>
            Saved <span style={{ color: "#D1FF26" }}>Contacts</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "#8A8F98" }}>Tap a contact to call them instantly from your Dial Phone.</p>
        </motion.div>

        {/* Search + Add */}
        <div className="flex gap-2 mb-5">
          <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <Search size={14} style={{ color: "#8A8F98" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or number…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
          </div>
          <button onClick={() => setBroadcast(true)} disabled={contacts.length === 0} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold disabled:opacity-40" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
            <Send size={14} /> Broadcast
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.25)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            <UserPlus size={14} /> Add
          </button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.15)" }}>
            <ContactIcon size={28} style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO CONTACTS YET</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Save numbers you call often for one-tap dialing.</p>
            <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
              <Plus size={12} /> Add your first contact
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const color = catColor(c.category);
              return (
                <div key={c.id} className="flex items-center gap-3 p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                  <button onClick={() => toggleFav(c)} className="flex-shrink-0">
                    <Star size={15} style={{ color: c.favorite ? "#D1FF26" : "#8A8F98", fill: c.favorite ? "#D1FF26" : "transparent" }} />
                  </button>
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${color}12`, border: `0.5px solid ${color}40` }}>
                    <span className="font-heading font-bold text-xs" style={{ color: color }}>{(c.name || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{c.name}</p>
                    <p className="font-mono text-[11px] truncate" style={{ color: "#8A8F98" }}>{c.phone}</p>
                  </div>
                  <button onClick={() => navigate(`/phone?dial=${encodeURIComponent(c.phone)}`)} title="Call" className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all hover:bg-[rgba(209,255,38,0.15)]" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    <Phone size={14} style={{ color: "#D1FF26" }} />
                  </button>
                  <button onClick={() => navigate("/messages")} title="Text" className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all hover:bg-[rgba(66,225,246,0.15)]" style={{ background: "rgba(66,225,246,0.08)", border: "0.5px solid rgba(66,225,246,0.25)" }}>
                    <MessageSquare size={14} style={{ color: "#42E1F6" }} />
                  </button>
                  <button onClick={() => openEdit(c)} title="Edit" className="w-9 h-9 flex items-center justify-center flex-shrink-0 hover:bg-[rgba(138,143,152,0.1)]" style={{ border: "0.5px solid rgba(138,143,152,0.2)" }}>
                    <Pencil size={13} style={{ color: "#8A8F98" }} />
                  </button>
                  <button onClick={() => remove(c)} title="Delete" className="w-9 h-9 flex items-center justify-center flex-shrink-0 hover:bg-[rgba(239,68,68,0.1)]" style={{ border: "0.5px solid rgba(239,68,68,0.2)" }}>
                    <Trash2 size={13} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {broadcast && (
        <BroadcastDialog contacts={contacts} title="Broadcast SMS" onClose={() => setBroadcast(false)} />
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={close}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md p-6" style={{ background: "#10141d", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{editing === "new" ? "// NEW CONTACT" : "// EDIT CONTACT"}</p>
              <button onClick={close}><X size={16} style={{ color: "#8A8F98" }} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Name">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className="w-full bg-transparent text-sm outline-none px-3 py-2.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }} />
              </Field>
              <Field label="Phone number">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 1234" className="w-full bg-transparent text-sm outline-none px-3 py-2.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }} />
              </Field>
              <Field label="Category">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => setForm({ ...form, category: c.id })} className="px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: form.category === c.id ? `${c.color}15` : "rgba(5,7,10,0.6)", border: `0.5px solid ${form.category === c.id ? c.color : "rgba(138,143,152,0.15)"}`, color: form.category === c.id ? c.color : "#8A8F98" }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Notes (optional)">
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="" className="w-full bg-transparent text-sm outline-none px-3 py-2.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }} />
              </Field>
              <button onClick={() => setForm({ ...form, favorite: !form.favorite })} className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(209,255,38,0.25)", color: form.favorite ? "#D1FF26" : "#8A8F98" }}>
                <Star size={12} style={{ fill: form.favorite ? "#D1FF26" : "transparent", color: form.favorite ? "#D1FF26" : "#8A8F98" }} /> {form.favorite ? "Favorited" : "Mark as favorite"}
              </button>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={close} className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.25)", color: "#8A8F98" }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.name.trim() || !form.phone.trim()} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.25)] disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>{label.toUpperCase()}</p>
      {children}
    </div>
  );
}