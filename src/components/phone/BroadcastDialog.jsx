import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Send, Check, AlertCircle, Loader2, Search, CheckCheck, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * BroadcastDialog — multi-select contacts and send a single SMS to all of
 * them at once, with a live progress tracker. Sends via the send-phone-sms
 * function (one real SMS per recipient, metered against the monthly cap).
 * Used by the Address Book (all contacts) and the Groups page (group members).
 */
export default function BroadcastDialog({ contacts, title = "Broadcast SMS", onClose, onDone }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null); // { sent, failed, total, done }
  const [results, setResults] = useState(null);
  const [stopped, setStopped] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (contacts || []).filter((c) => !q || (c.name || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q));
  }, [contacts, query]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setResults(null);
  };

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });
    setResults(null);
  };

  const send = async () => {
    if (!text.trim() || selected.size === 0) return;
    setSending(true);
    setStopped(null);
    const items = (contacts || []).filter((c) => selected.has(c.id));
    setProgress({ sent: 0, failed: 0, total: items.length, done: 0 });
    const out = [];
    let sent = 0, failed = 0;
    let halt = null;
    for (const c of items) {
      if (halt) { out.push({ name: c.name, phone: c.phone, ok: false, error: "Skipped" }); continue; }
      try {
        const res = await base44.functions.invoke("send-phone-sms", { to: c.phone, text });
        const d = res?.data || res;
        if (d?.error) {
          failed++;
          out.push({ name: c.name, phone: c.phone, ok: false, error: d.error });
          if (d.needsUpgrade || d.needsDisclaimer) halt = d.needsUpgrade ? "out of credits" : "disclaimer required";
        } else {
          sent++;
          out.push({ name: c.name, phone: c.phone, ok: true });
        }
      } catch (e) {
        failed++;
        const msg = e?.response?.data?.error || e?.message || "Failed";
        out.push({ name: c.name, phone: c.phone, ok: false, error: msg });
        if (e?.response?.status === 402) halt = "out of credits";
      }
      setProgress({ sent, failed, total: items.length, done: sent + failed });
    }
    setResults(out);
    setStopped(halt);
    setSending(false);
    if (onDone) onDone({ sent, failed });
  };

  const reset = () => { setResults(null); setProgress(null); setStopped(null); setText(""); setSelected(new Set()); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[88vh] flex flex-col" style={{ background: "#10141d", border: "0.5px solid rgba(209,255,38,0.3)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.15)" }}>
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// {title.toUpperCase()}</p>
          </div>
          <button onClick={onClose}><X size={16} style={{ color: "#8A8F98" }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {results ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Summary label="SENT" value={progress.sent} color="#D1FF26" />
                <Summary label="FAILED" value={progress.failed} color="#ef4444" />
                <Summary label="TOTAL" value={progress.total} color="#42E1F6" />
              </div>
              {stopped && (
                <div className="flex items-center gap-2 p-3" style={{ background: "rgba(251,146,60,0.08)", border: "0.5px solid rgba(251,146,60,0.3)" }}>
                  <AlertCircle size={14} style={{ color: "#fb923c" }} />
                  <p className="text-xs" style={{ color: "#F5F5F7" }}>Stopped early: {stopped}. Remaining recipients were skipped.</p>
                </div>
              )}
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 p-2" style={{ background: "rgba(5,7,10,0.5)", border: `0.5px solid ${r.ok ? "rgba(209,255,38,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                    {r.ok ? <Check size={13} style={{ color: "#D1FF26" }} /> : <AlertCircle size={13} style={{ color: "#ef4444" }} />}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[11px] truncate" style={{ color: "#F5F5F7" }}>{r.name}</p>
                      <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{r.ok ? r.phone : r.error}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={reset} className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.25)", color: "#8A8F98" }}>Send another</button>
                <button onClick={onClose} className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>Done</button>
              </div>
            </div>
          ) : (
            <>
              {/* Selection */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 px-3 py-2 flex-1" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
                  <Search size={13} style={{ color: "#8A8F98" }} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="flex-1 bg-transparent text-xs outline-none" style={{ color: "#F5F5F7" }} />
                </div>
                <button onClick={toggleAll} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap" style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: allSelected ? "#D1FF26" : "#8A8F98" }}>
                  <CheckCheck size={12} /> {allSelected ? "Clear" : "All"}
                </button>
              </div>
              <p className="font-mono text-[9px] mb-2" style={{ color: "#8A8F98" }}>{selected.size} selected · {filtered.length} shown</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto mb-4">
                {filtered.map((c) => {
                  const on = selected.has(c.id);
                  return (
                    <button key={c.id} onClick={() => toggle(c.id)} className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all" style={{ background: on ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.5)", border: `0.5px solid ${on ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}` }}>
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0" style={{ background: on ? "#D1FF26" : "transparent", border: `0.5px solid ${on ? "#D1FF26" : "rgba(138,143,152,0.4)"}`, borderRadius: 4 }}>
                        {on && <Check size={12} style={{ color: "#05070A" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-xs truncate" style={{ color: "#F5F5F7" }}>{c.name}</p>
                        <p className="font-mono text-[10px] truncate" style={{ color: "#8A8F98" }}>{c.phone}</p>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && <p className="font-mono text-[10px] text-center py-6" style={{ color: "#8A8F98" }}>No contacts found.</p>}
              </div>

              {/* Message */}
              <div className="mb-2">
                <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>MESSAGE</p>
                <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1600} rows={3} placeholder="Type one message — it goes to every selected contact." className="w-full bg-transparent text-sm outline-none px-3 py-2.5 resize-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }} />
                <p className="font-mono text-[9px] text-right" style={{ color: "#8A8F98" }}>{text.length}/1600</p>
              </div>

              {/* Live progress */}
              {sending && progress && (
                <div className="mb-3 p-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>SENDING…</span>
                    <span className="font-mono text-[10px]" style={{ color: "#F5F5F7" }}>{progress.done}/{progress.total}</span>
                  </div>
                  <div className="h-2 w-full" style={{ background: "rgba(138,143,152,0.12)", borderRadius: 2 }}>
                    <div className="h-full transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, background: "#D1FF26", borderRadius: 2 }} />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] mt-1.5" style={{ color: "#8A8F98" }}>
                    <span>{progress.sent} sent</span><span>{progress.failed} failed</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!results && (
          <div className="px-5 py-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.15)" }}>
            <button onClick={send} disabled={sending || !text.trim() || selected.size === 0} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.25)] disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {sending ? "Sending…" : `Send to ${selected.size}`}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Summary({ label, value, color }) {
  return (
    <div className="p-3 text-center" style={{ background: "rgba(5,7,10,0.5)", border: `0.5px solid ${color}30` }}>
      <p className="font-heading font-black text-2xl" style={{ color }}>{value}</p>
      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
    </div>
  );
}