import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Search, Users, Loader2, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * RecipientPreviewModal — opens a sample of the selected contact group's
 * members (name + phone) so the advertiser can verify their uploaded CSV
 * list was mapped correctly before broadcasting. Read-only.
 *
 * Props: group (ContactGroup) | null, onClose
 */
const SAMPLE = 25;

export default function RecipientPreviewModal({ group, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!group) return;
      setLoading(true);
      try {
        const ids = new Set(group.member_contact_ids || []);
        let all = [];
        if (ids.size > 0) {
          all = await base44.entities.Contact.list("-created_date", 500);
        }
        if (alive) {
          setContacts((Array.isArray(all) ? all : []).filter((c) => ids.has(c.id)));
        }
      } catch {
        if (alive) setContacts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [group]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q));
  }, [contacts, query]);

  if (!group) return null;

  const sample = filtered.slice(0, SAMPLE);
  const unmapped = contacts.filter((c) => !c.phone).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[88vh] flex flex-col" style={{ background: "#10141d", border: "0.5px solid rgba(209,255,38,0.3)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.15)" }}>
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// RECIPIENT PREVIEW</p>
          </div>
          <button onClick={onClose}><X size={16} style={{ color: "#8A8F98" }} /></button>
        </div>

        <div className="px-5 py-3" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
          <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{group.name}</p>
          <p className="font-mono text-[9px] mt-0.5" style={{ color: "#8A8F98" }}>
            {contacts.length} mapped member{contacts.length === 1 ? "" : "s"}
            {unmapped > 0 && <span style={{ color: "#fb923c" }}> · {unmapped} missing a phone number</span>}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-2 px-3 py-2 mb-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
            <Search size={13} style={{ color: "#8A8F98" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or number…" className="flex-1 bg-transparent text-xs outline-none" style={{ color: "#F5F5F7" }} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2">
              <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING…</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle size={24} className="mx-auto mb-3" style={{ color: "rgba(138,143,152,0.4)" }} />
              <p className="text-sm" style={{ color: "rgba(138,143,152,0.6)" }}>No members in this group yet.</p>
              <p className="font-mono text-[10px] mt-1" style={{ color: "rgba(138,143,152,0.4)" }}>Import a list or add contacts first.</p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                {sample.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                    {c.phone
                      ? <CheckCircle2 size={13} className="flex-shrink-0" style={{ color: "#D1FF26" }} />
                      : <AlertCircle size={13} className="flex-shrink-0" style={{ color: "#fb923c" }} />}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-xs truncate" style={{ color: "#F5F5F7" }}>{c.name || "(no name)"}</p>
                      <p className="font-mono text-[10px] truncate flex items-center gap-1" style={{ color: c.phone ? "#8A8F98" : "#fb923c" }}>
                        <Phone size={9} /> {c.phone || "missing phone"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {filtered.length > SAMPLE && (
                <p className="text-center font-mono text-[9px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>
                  SHOWING FIRST {SAMPLE} OF {filtered.length} · SEARCH TO NARROW
                </p>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.15)" }}>
          <button onClick={onClose} className="w-full py-3 font-mono text-[10px] tracking-widest uppercase font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}