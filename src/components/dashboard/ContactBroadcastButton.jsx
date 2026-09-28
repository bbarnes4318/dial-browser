import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Loader2, Check, X, AlertCircle, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ContactBroadcastButton({ contactCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("broadcastContacts", { message: message.trim() });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setOpen(false);
    setMessage("");
    setResult(null);
    setError(null);
  };

  const charCount = message.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={contactCount === 0}
        className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
        style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        title={contactCount === 0 ? "Add contacts first" : "Broadcast to all contacts"}
      >
        <Radio size={12} /> Broadcast All
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]" style={{ background: "rgba(5,7,10,0.9)", backdropFilter: "blur(6px)" }}
              onClick={sending ? undefined : reset}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[92] w-[92%] max-w-md p-6"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            >
              {!result && !sending && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Radio size={16} style={{ color: "#D1FF26" }} />
                      <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// BROADCAST TO ALL CONTACTS</p>
                    </div>
                    <button onClick={reset} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                      <X size={16} style={{ color: "#8A8F98" }} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3 p-3" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <Users size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
                      SENDING TO ALL {contactCount} CONTACT{contactCount !== 1 ? "S" : ""}
                    </p>
                  </div>

                  <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                    Send a single quick SMS to every contact in your address book at once.
                  </p>

                  {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                    placeholder="Type your broadcast message…"
                    rows={4}
                    autoFocus
                    className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-2 resize-none"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                  <p className="font-mono text-[8px] tracking-widest text-right mb-4" style={{ color: charCount > 450 ? "#ef4444" : "#8A8F98" }}>
                    {charCount}/500
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={send}
                      disabled={!message.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      <Radio size={13} /> Send to {contactCount} Contact{contactCount !== 1 ? "s" : ""}
                    </button>
                    <button onClick={reset} className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {sending && (
                <div className="py-8 text-center">
                  <Loader2 size={28} className="animate-spin mx-auto mb-4" style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#F5F5F7" }}>SENDING BROADCAST…</p>
                </div>
              )}

              {result && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, type: "spring" }}
                    className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                    style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.5)" }}
                  >
                    <Check size={28} style={{ color: "#D1FF26" }} />
                  </motion.div>
                  <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// BROADCAST SENT</p>
                  <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>
                    {result.contacts_notified} of {result.total_contacts} contacts reached
                  </p>
                  {result.results?.some((r) => !r.success) && (
                    <div className="p-3 mb-4 text-left mt-3 max-h-32 overflow-y-auto" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
                      <p className="font-mono text-[9px] tracking-widest mb-1 flex items-center gap-1" style={{ color: "#ef4444" }}>
                        <AlertCircle size={10} /> FAILED RECIPIENTS:
                      </p>
                      {result.results.filter((r) => !r.success).map((r, i) => (
                        <p key={i} className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>• {r.contact} ({r.phone})</p>
                      ))}
                    </div>
                  )}
                  <button onClick={reset} className="w-full py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}