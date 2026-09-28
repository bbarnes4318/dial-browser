import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, Phone, UserPlus, X, Contact as ContactIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * ContactsPanel — inline address-book overlay shown on the Dial Phone keypad.
 * Tap a contact to dial immediately (via onCall). Lightweight list with
 * search + favorites-first ordering. Full management lives on /address-book.
 */
export default function ContactsPanel({ onCall, onClose }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        const rows = await base44.entities.Contact.filter({ created_by_id: user.id }, "-created_date", 500);
        const sorted = (Array.isArray(rows) ? rows : []).sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
        if (alive) setContacts(sorted);
      } catch { /* empty */ }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    return !q || (c.name || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q);
  });

  const call = (num) => { onCall(num); };

  return (
    <div className="flex flex-col w-full" style={{ minHeight: 340 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ContactIcon size={15} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// CONTACTS</p>
        </div>
        <button onClick={onClose} className="p-1.5"><X size={15} style={{ color: "#8A8F98" }} /></button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 mb-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
        <Search size={13} style={{ color: "#8A8F98" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="flex-1 bg-transparent text-xs outline-none" style={{ color: "#F5F5F7" }} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5" style={{ maxHeight: 280 }}>
        {loading ? (
          <p className="font-mono text-[10px] text-center py-8" style={{ color: "#8A8F98" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ContactIcon size={22} style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[9px] tracking-widest mt-2" style={{ color: "#8A8F98" }}>NO CONTACTS SAVED</p>
            <Link to="/address-book" className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
              <UserPlus size={11} /> Add contacts
            </Link>
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => call(c.phone)}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 transition-all hover:bg-[rgba(209,255,38,0.08)] text-left"
              style={{ border: "0.5px solid rgba(138,143,152,0.12)", borderRadius: 10 }}
            >
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", borderRadius: 9999 }}>
                <span className="font-heading font-bold text-[11px]" style={{ color: "#D1FF26" }}>{(c.name || "?").charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-heading font-bold text-xs truncate" style={{ color: "#F5F5F7" }}>{c.name}</p>
                  {c.favorite && <Star size={10} style={{ color: "#D1FF26", fill: "#D1FF26" }} />}
                </div>
                <p className="font-mono text-[10px] truncate" style={{ color: "#8A8F98" }}>{c.phone}</p>
              </div>
              <Phone size={14} style={{ color: "#D1FF26" }} className="flex-shrink-0" />
            </button>
          ))
        )}
      </div>

      <Link to="/address-book" className="mt-3 text-center font-mono text-[9px] tracking-widest uppercase py-2" style={{ color: "#8A8F98", border: "0.5px solid rgba(138,143,152,0.15)" }}>
        Manage all contacts →
      </Link>
    </div>
  );
}