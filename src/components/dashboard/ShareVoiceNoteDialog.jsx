import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Search, Check, Loader2, Send, Phone, AlertCircle, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ShareVoiceNoteDialog({ reminder, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const transcript = reminder?.transcript || reminder?.notes || "";

  useEffect(() => {
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
    loadContacts();
  }, []);

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    return !q ||
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q);
  });

  const toggleContact = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0 || !transcript) return;
    setSending(true);
    setError(null);
    try {
      const selectedContacts = contacts
        .filter((c) => selected.has(c.id))
        .map((c) => ({ name: c.name, phone: c.phone }));

      const response = await base44.functions.invoke("shareVoiceNoteSms", {
        voice_note_title: reminder.title,
        transcript,
        contacts: selectedContacts,
        sender_name: reminder.created_by_id || "A 1 CALL AWAY member",
      });

      setResult(response.data);
      if (response.data?.sent > 0) {
        setTimeout(() => onClose(), 2000);
      }
    } catch (err) {
      setError(err.message || "Failed to send voice note.");
    } finally {
      setSending(false);
    }
  };

  const previewMessage = transcript
    ? `1 CALL AWAY — Voice Note:\n"${reminder?.title || "Untitled Note"}"\n\n${transcript}`
    : "";

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80]"
          style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[94%] max-w-lg max-h-[85vh] flex flex-col"
          style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
            <div className="flex items-center gap-2">
              <Share2 size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SHARE VIA SMS</p>
            </div>
            <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
              <X size={16} style={{ color: "#8A8F98" }} />
            </button>
          </div>

          {/* Voice note preview */}
          <div className="px-5 py-3" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
            <p className="font-heading font-semibold text-sm mb-1" style={{ color: "#F5F5F7" }}>{reminder?.title || "Untitled Note"}</p>
            {previewMessage ? (
              <div className="p-3 mt-1" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare size={9} style={{ color: "#8A8F98" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>SMS PREVIEW</span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "#F5F5F7" }}>
                  {previewMessage.length > 200 ? previewMessage.slice(0, 200) + "…" : previewMessage}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3" style={{ background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={12} style={{ color: "#ef4444" }} />
                <p className="font-mono text-[9px]" style={{ color: "#ef4444" }}>No transcript available to share.</p>
              </div>
            )}
          </div>

          {/* Result state */}
          {result && (
            <div className="px-5 py-4" style={{ background: "rgba(209,255,38,0.04)" }}>
              <div className="flex items-center gap-2">
                <Check size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
                  SENT TO {result.sent} OF {result.total} CONTACTS
                </p>
              </div>
            </div>
          )}

          {/* Contact picker */}
          {!result && (
            <>
              {/* Search */}
              <div className="px-5 py-3">
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                  <Search size={13} style={{ color: "#8A8F98" }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search contacts…"
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "#F5F5F7" }}
                  />
                  {selected.size > 0 && (
                    <span className="font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26" }}>
                      {selected.size} SELECTED
                    </span>
                  )}
                </div>
              </div>

              {/* Contact list */}
              <div className="flex-1 overflow-y-auto px-5 pb-3" style={{ maxHeight: "300px" }}>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO CONTACTS FOUND</p>
                    <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Add contacts from the Contacts tab</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filtered.map((contact) => {
                      const isSelected = selected.has(contact.id);
                      return (
                        <button
                          key={contact.id}
                          onClick={() => toggleContact(contact.id)}
                          className="w-full flex items-center gap-3 p-3 text-left transition-all"
                          style={{
                            background: isSelected ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.3)",
                            border: `0.5px solid ${isSelected ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                          }}
                        >
                          <div className="flex items-center justify-center w-5 h-5 flex-shrink-0" style={{
                            background: isSelected ? "#D1FF26" : "transparent",
                            border: `1px solid ${isSelected ? "#D1FF26" : "rgba(209,255,38,0.3)"}`,
                          }}>
                            {isSelected && <Check size={11} style={{ color: "#05070A" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-semibold text-sm truncate" style={{ color: isSelected ? "#D1FF26" : "#F5F5F7" }}>{contact.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Phone size={9} style={{ color: "#8A8F98" }} />
                              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{contact.phone}</span>
                              {contact.company && (
                                <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.5)" }}>· {contact.company}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
                {error && (
                  <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSend}
                    disabled={sending || selected.size === 0 || !transcript}
                    className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {sending ? "Sending…" : `Send to ${selected.size} Contact${selected.size === 1 ? "" : "s"}`}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase"
                    style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );
}