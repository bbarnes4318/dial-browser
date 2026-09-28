import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Phone, Mail, Plus, Search, Star, Trash2, Edit3, X, Check,
  Loader2, Briefcase, Heart, AlertTriangle, Settings, UserPlus,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import CsvImport from "@/components/dashboard/CsvImport";
import ContactBroadcastButton from "@/components/dashboard/ContactBroadcastButton";

const CATEGORIES = [
  { id: "all", label: "All", icon: Users },
  { id: "favorite", label: "Favorites", icon: Star },
  { id: "personal", label: "Personal", icon: Heart },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "service", label: "Service", icon: Settings },
  { id: "emergency", label: "Emergency", icon: AlertTriangle },
];

const TYPE_LABELS = {
  phone: { label: "PHONE", color: "#D1FF26" },
  email_phone: { label: "EMAIL-PHONE", color: "#60A5FA" },
};

export default function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", contact_type: "phone", email: "", company: "", notes: "", category: "personal", favorite: false,
  });

  const loadContacts = async () => {
    try {
      const data = await base44.entities.Contact.list("-created_date", 200);
      setContacts(data || []);
    } catch {
      setError("Could not load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filtered = useMemo(() => {
    return contacts
      .filter((c) => {
        if (category === "all") return true;
        if (category === "favorite") return c.favorite;
        return c.category === category;
      })
      .filter((c) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          (c.name || "").toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.company || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [contacts, category, query]);

  const openForm = (contact = null) => {
    if (contact) {
      setEditing(contact);
      setForm({
        name: contact.name || "",
        phone: contact.phone || "",
        contact_type: contact.contact_type || "phone",
        email: contact.email || "",
        company: contact.company || "",
        notes: contact.notes || "",
        category: contact.category || "personal",
        favorite: contact.favorite || false,
      });
    } else {
      setEditing(null);
      setForm({ name: "", phone: "", contact_type: "phone", email: "", company: "", notes: "", category: "personal", favorite: false });
    }
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const saveContact = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        contact_type: form.contact_type,
        email: form.email.trim(),
        company: form.company.trim(),
        notes: form.notes.trim(),
        category: form.category,
        favorite: form.favorite,
      };
      if (editing) {
        const updated = await base44.entities.Contact.update(editing.id, payload);
        setContacts((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
      } else {
        const created = await base44.entities.Contact.create(payload);
        setContacts((prev) => [created, ...prev]);
      }
      closeForm();
    } catch {
      setError("Could not save contact. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async (contact) => {
    try {
      const updated = await base44.entities.Contact.update(contact.id, { favorite: !contact.favorite });
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? updated : c)));
    } catch { /* ignore */ }
  };

  const deleteContact = async (contact) => {
    try {
      await base44.entities.Contact.delete(contact.id);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } catch { /* ignore */ }
  };

  const favCount = contacts.filter((c) => c.favorite).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// PERSONAL CONTACTS</p>
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{contacts.length} SAVED · {favCount} FAVORITES</span>
        </div>
        <div className="flex items-center gap-2">
          <CsvImport onImported={(created) => setContacts((prev) => [...(created || []), ...prev])} />
          <ContactBroadcastButton contactCount={contacts.length} />
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            <UserPlus size={12} /> Add Contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
        <Search size={14} style={{ color: "#8A8F98" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, number, email, or company…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#F5F5F7" }}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = category === cat.id;
          const count = cat.id === "all"
            ? contacts.length
            : cat.id === "favorite"
              ? favCount
              : contacts.filter((c) => c.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all whitespace-nowrap"
              style={{
                background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                color: active ? "#D1FF26" : "#8A8F98",
              }}
            >
              <Icon size={11} /> {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

      {/* Contacts grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Users size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO CONTACTS YET</p>
          <p className="font-mono text-[9px] mt-1 mb-4" style={{ color: "rgba(138,143,152,0.5)" }}>Save frequently called numbers and email-phone contacts for quick access</p>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            <Plus size={12} /> Add Your First Contact
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((contact, idx) => {
              const typeInfo = TYPE_LABELS[contact.contact_type] || TYPE_LABELS.phone;
              return (
                <motion.div
                  key={contact.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.15) }}
                  className="p-4 flex flex-col gap-3"
                  style={{
                    background: "#10141D",
                    border: `0.5px solid ${contact.favorite ? "rgba(209,255,38,0.35)" : "rgba(209,255,38,0.12)"}`,
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-full" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <span className="font-heading font-black text-base" style={{ color: "#D1FF26" }}>{(contact.name || "?").charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{contact.name}</p>
                      {contact.company && (
                        <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{contact.company}</p>
                      )}
                      <span className="inline-block font-mono text-[7px] tracking-widest px-1.5 py-0.5 mt-1" style={{ background: `${typeInfo.color}15`, color: typeInfo.color }}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(contact)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                      title={contact.favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star size={15} style={{ color: contact.favorite ? "#D1FF26" : "#8A8F98", fill: contact.favorite ? "#D1FF26" : "none" }} />
                    </button>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1">
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 font-mono text-[10px] transition-colors hover:text-[#D1FF26]" style={{ color: "#F5F5F7" }}>
                      <Phone size={11} style={{ color: "#D1FF26" }} /> {contact.phone}
                    </a>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 font-mono text-[10px] transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                        <Mail size={11} /> {contact.email}
                      </a>
                    )}
                  </div>

                  {contact.notes && (
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(138,143,152,0.7)" }}>{contact.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: "0.5px solid rgba(209,255,38,0.08)" }}>
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      <Phone size={11} /> Call
                    </a>
                    <button
                      onClick={() => openForm(contact)}
                      className="flex items-center justify-center w-9 h-9 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                      style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                      title="Edit contact"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => deleteContact(contact)}
                      className="flex items-center justify-center w-9 h-9 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                      style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                      title="Delete contact"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80]" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
              onClick={closeForm}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-md p-6 max-h-[90vh] overflow-y-auto"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {editing ? <Edit3 size={14} style={{ color: "#D1FF26" }} /> : <UserPlus size={14} style={{ color: "#D1FF26" }} />}
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{editing ? "// EDIT CONTACT" : "// NEW CONTACT"}</p>
                </div>
                <button onClick={closeForm} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              <form onSubmit={saveContact}>
                {/* Contact type toggle */}
                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>CONTACT TYPE</label>
                <div className="flex gap-2 mb-4">
                  {[
                    { id: "phone", label: "Phone Number", icon: Phone },
                    { id: "email_phone", label: "Email-as-Phone", icon: Mail },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = form.contact_type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, contact_type: t.id })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                        style={{
                          background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                          border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                          color: active ? "#D1FF26" : "#8A8F98",
                        }}
                      >
                        <Icon size={11} /> {t.label}
                      </button>
                    );
                  })}
                </div>

                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NAME *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />

                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
                  {form.contact_type === "email_phone" ? "EMAIL ADDRESS *" : "PHONE NUMBER *"}
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder={form.contact_type === "email_phone" ? "name@example.com" : "+1 555 000 0000"}
                  type={form.contact_type === "email_phone" ? "email" : "tel"}
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />

                {form.contact_type === "email_phone" && (
                  <>
                    <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>BACKUP PHONE (OPTIONAL)</label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="+1 555 000 0000"
                      type="tel"
                      className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </>
                )}
                {form.contact_type === "phone" && (
                  <>
                    <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>EMAIL (OPTIONAL)</label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="name@example.com"
                      type="email"
                      className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </>
                )}

                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>COMPANY (OPTIONAL)</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />

                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>CATEGORY</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["personal", "work", "service", "emergency", "other"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className="px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                      style={{
                        background: form.category === cat ? "rgba(209,255,38,0.12)" : "transparent",
                        border: `0.5px solid ${form.category === cat ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.15)"}`,
                        color: form.category === cat ? "#D1FF26" : "#8A8F98",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NOTES (OPTIONAL)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4 resize-none"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />

                <label className="flex items-center gap-2 mb-5 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, favorite: !form.favorite })}
                    className="flex items-center gap-2"
                  >
                    <span className="flex items-center justify-center w-5 h-5" style={{ background: form.favorite ? "#D1FF26" : "transparent", border: `1px solid ${form.favorite ? "#D1FF26" : "rgba(209,255,38,0.4)"}` }}>
                      {form.favorite && <Check size={12} style={{ color: "#05070A" }} />}
                    </span>
                    <span className="font-mono text-[10px] tracking-widest" style={{ color: form.favorite ? "#D1FF26" : "#8A8F98" }}>ADD TO FAVORITES</span>
                  </button>
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !form.name.trim() || !form.phone.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {editing ? "Save Changes" : "Add Contact"}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase"
                    style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}