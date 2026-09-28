import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Phone, Plus, Star, Trash2, Edit3, X, Check, Loader2,
  Heart, Stethoscope, User as UserIcon, Home as HomeIcon, HandHeart, MapPin,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const RELATIONSHIPS = [
  { value: "Family", icon: Heart },
  { value: "Spouse", icon: Heart },
  { value: "Friend", icon: UserIcon },
  { value: "Doctor", icon: Stethoscope },
  { value: "Neighbor", icon: HomeIcon },
  { value: "Caregiver", icon: HandHeart },
  { value: "Other", icon: UserIcon },
];

export default function EmergencyContactsManager() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", relationship: "Family", is_primary: false, address: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadContacts = useCallback(async () => {
    try {
      const data = await base44.entities.EmergencyContact.filter({}, "-created_date", 50);
      setContacts(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const openAddForm = () => {
    setEditing(null);
    setForm({ name: "", phone: "", relationship: "Family", is_primary: false, address: "" });
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (contact) => {
    setEditing(contact);
    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      relationship: contact.relationship || "Other",
      is_primary: contact.is_primary || false,
      address: contact.address || "",
    });
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", phone: "", relationship: "Family", is_primary: false, address: "" });
  };

  const saveContact = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    setError(null);

    // Geocode the address if provided
    let location_lat = null;
    let location_lng = null;
    if (form.address.trim()) {
      try {
        const geoResp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address.trim())}&limit=1`
        );
        const geoData = await geoResp.json();
        if (geoData && geoData.length > 0) {
          location_lat = parseFloat(geoData[0].lat);
          location_lng = parseFloat(geoData[0].lon);
        }
      } catch { /* ignore geocoding failure */ }
    }

    try {
      if (editing) {
        await base44.entities.EmergencyContact.update(editing.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          relationship: form.relationship,
          is_primary: form.is_primary,
          address: form.address.trim(),
          location_lat,
          location_lng,
        });
      } else {
        await base44.entities.EmergencyContact.create({
          name: form.name.trim(),
          phone: form.phone.trim(),
          relationship: form.relationship,
          is_primary: form.is_primary,
          active: true,
          address: form.address.trim(),
          location_lat,
          location_lng,
        });
      }
      // If marking as primary, unmark others
      if (form.is_primary) {
        const others = contacts.filter((c) => c.id !== editing?.id && c.is_primary);
        await Promise.all(others.map((c) => base44.entities.EmergencyContact.update(c.id, { is_primary: false })));
      }
      closeForm();
      await loadContacts();
    } catch {
      setError("Could not save contact. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (contact) => {
    try {
      await base44.entities.EmergencyContact.update(contact.id, { active: !contact.active });
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, active: !c.active } : c)));
    } catch { /* ignore */ }
  };

  const deleteContact = async (contact) => {
    try {
      await base44.entities.EmergencyContact.delete(contact.id);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      if (editing?.id === contact.id) closeForm();
    } catch { /* ignore */ }
  };

  const activeCount = contacts.filter((c) => c.active).length;
  const primaryContact = contacts.find((c) => c.is_primary);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: "#ef4444" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>// EMERGENCY CONTACTS</p>
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{activeCount} ACTIVE · {contacts.length} TOTAL</span>
        </div>
        {!showForm && (
          <button onClick={openAddForm} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "#D1FF26", color: "#05070A" }}>
            <Plus size={12} /> Add Contact
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="p-3 mb-4 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.15)" }}>
        <Stethoscope size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
        <p className="font-mono text-[9px] leading-relaxed" style={{ color: "rgba(138,143,152,0.8)" }}>
          Designate one contact as your <span style={{ color: "#ef4444" }}>SOS Contact</span>. When you speak an emergency voice command (e.g. "help me", "SOS", "emergency") into the Dial Browser, an automated SMS alert with your location is sent to them instantly. Keep at least one contact active at all times.
        </p>
      </div>

      {/* Add/Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={saveContact}
            className="overflow-hidden mb-4"
          >
            <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(239,68,68,0.3)" }}>
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#ef4444" }}>
                {editing ? "// EDIT CONTACT" : "// NEW EMERGENCY CONTACT"}
              </p>
              {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NAME</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Jane Doe"
                    autoFocus
                    className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>PHONE NUMBER</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 555 000 0000"
                    type="tel"
                    className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                </div>
              </div>

              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>RELATIONSHIP</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {RELATIONSHIPS.map((r) => {
                  const Icon = r.icon;
                  const sel = form.relationship === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, relationship: r.value })}
                      className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                      style={{
                        background: sel ? "rgba(239,68,68,0.12)" : "transparent",
                        border: `0.5px solid ${sel ? "rgba(239,68,68,0.5)" : "rgba(209,255,38,0.15)"}`,
                        color: sel ? "#ef4444" : "#8A8F98",
                      }}
                    >
                      <Icon size={11} /> {r.value}
                    </button>
                  );
                })}
              </div>

              <label className="block font-mono text-[9px] tracking-widest mb-2 flex items-center gap-1" style={{ color: "#8A8F98" }}>
                <MapPin size={10} /> ADDRESS (OPTIONAL — FOR MAP VIEW)
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 123 Main St, Springfield, IL"
                className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              />

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_primary: !form.is_primary })}
                  className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                  style={{ background: form.is_primary ? "#ef4444" : "rgba(138,143,152,0.2)" }}
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ left: form.is_primary ? "26px" : "2px", background: form.is_primary ? "#fff" : "#8A8F98" }} />
                </button>
                <span className="font-mono text-[9px] tracking-widest" style={{ color: form.is_primary ? "#ef4444" : "#8A8F98" }}>SOS CONTACT (receives voice-triggered alerts)</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !form.name.trim() || !form.phone.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                  style={{ background: "#ef4444", color: "#fff" }}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {editing ? "Save Changes" : "Add Contact"}
                </button>
                <button type="button" onClick={closeForm} className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(239,68,68,0.1)" }}>
          <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#ef4444" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && contacts.length === 0 && !showForm && (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(239,68,68,0.1)" }}>
          <Users size={28} style={{ color: "rgba(239,68,68,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO EMERGENCY CONTACTS YET</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Add at least one contact to enable distress alerts</p>
        </div>
      )}

      {/* Contact list */}
      {!loading && contacts.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {contacts.map((contact, idx) => {
              const RelIcon = RELATIONSHIPS.find((r) => r.value === contact.relationship)?.icon || UserIcon;
              return (
                <motion.div
                  key={contact.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.1) }}
                  className="p-4 flex items-center gap-3"
                  style={{
                    background: contact.active ? "#10141D" : "rgba(16,20,29,0.4)",
                    border: `0.5px solid ${contact.is_primary ? "rgba(239,68,68,0.4)" : contact.active ? "rgba(239,68,68,0.15)" : "rgba(138,143,152,0.1)"}`,
                    opacity: contact.active ? 1 : 0.6,
                  }}
                >
                  <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: contact.active ? "rgba(239,68,68,0.08)" : "rgba(138,143,152,0.08)" }}>
                    <RelIcon size={16} style={{ color: contact.active ? "#ef4444" : "#8A8F98" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{contact.name}</p>
                      {contact.is_primary && (
                        <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                           <Star size={8} /> SOS
                         </span>
                      )}
                      {!contact.active && (
                        <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(138,143,152,0.1)", color: "#8A8F98" }}>PAUSED</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1 font-mono text-[9px] transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                        <Phone size={9} /> {contact.phone}
                      </a>
                      <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{contact.relationship}</span>
                    </div>
                  </div>

                  {/* Toggle active */}
                  <button
                    onClick={() => toggleActive(contact)}
                    className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                    style={{ background: contact.active ? "#ef4444" : "rgba(138,143,152,0.2)" }}
                    title={contact.active ? "Pause alerts to this contact" : "Resume alerts to this contact"}
                  >
                    <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ left: contact.active ? "26px" : "2px", background: contact.active ? "#fff" : "#8A8F98" }} />
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditForm(contact)} className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]" style={{ color: "#8A8F98" }} title="Edit contact">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteContact(contact)} className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "#8A8F98" }} title="Delete contact">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Primary contact note */}
      {primaryContact && (
        <p className="font-mono text-[9px] mt-4 text-center" style={{ color: "rgba(138,143,152,0.5)" }}>
           ★ {primaryContact.name} is your SOS contact — emergency voice commands will alert them
        </p>
      )}
    </div>
  );
}