import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Loader2, Check, X, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BroadcastButton() {
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
      const response = await base44.functions.invoke("broadcastEmergencyContacts", { message: message.trim() });
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

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-3 py-4 font-mono text-xs tracking-widest uppercase font-bold transition-all"
        style={{ background: "rgba(209,255,38,0.08)", border: "1px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}
      >
        <Radio size={18} /> Broadcast to Emergency Contacts
      </motion.button>

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
                      <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// BROADCAST MESSAGE (FREE)</p>
                    </div>
                    <button onClick={reset} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                      <X size={16} style={{ color: "#8A8F98" }} />
                    </button>
                  </div>

                  <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                    Send a quick SMS to all your active emergency contacts at once.
                  </p>

                  {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your broadcast message…"
                    rows={4}
                    autoFocus
                    className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4 resize-none"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={send}
                      disabled={!message.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      <Radio size={13} /> Send Broadcast
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
                    <div className="p-3 mb-4 text-left mt-3" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
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