import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Calendar, Phone, Send, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ReminderScheduler({ item, onClose }) {
  const [task, setTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) {
      const snippet = (item.transcript || item.query || "").slice(0, 300);
      setTask(snippet);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const pad = (n) => String(n).padStart(2, "0");
      setDueDate(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`);
      setSaved(false);
      setError(null);
    }
  }, [item]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!task.trim() || !dueDate || !phone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await base44.entities.Reminder.create({
        title: `Follow-up: ${item.title}`.slice(0, 120),
        notes: task.trim(),
        source: "followup",
        related_interaction_id: item.id,
        related_interaction_title: item.title,
        due_date: new Date(dueDate).toISOString(),
        phone: phone.trim(),
        sms_sent: false,
        completed: false,
      });
      setSaved(true);
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      setError("Could not schedule reminder. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {item && (
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-md p-6"
            style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
          >
            {saved ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.4)" }}>
                  <Check size={28} style={{ color: "#D1FF26" }} />
                </div>
                <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>Reminder Scheduled!</p>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>FREE SMS REMINDER · NO CHARGE</p>
                <p className="text-xs mt-3" style={{ color: "#8A8F98" }}>You'll get an SMS at the scheduled time.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SCHEDULE FOLLOW-UP REMINDER</p>
                  </div>
                  <button onClick={onClose} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                    <X size={16} style={{ color: "#8A8F98" }} />
                  </button>
                </div>

                <p className="font-heading font-bold text-sm mb-1 line-clamp-1" style={{ color: "#F5F5F7" }}>{item.title}</p>
                {item.transcript && (
                  <p className="text-xs leading-relaxed mb-4 line-clamp-2 p-3" style={{ color: "#8A8F98", background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                    {item.transcript.slice(0, 150)}{item.transcript.length > 150 ? "…" : ""}
                  </p>
                )}

                <form onSubmit={handleSave}>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>WHAT SHOULD WE REMIND YOU ABOUT?</label>
                  <textarea
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="e.g. Call the clinic to book an appointment…"
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-3 text-sm mb-4 resize-none"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />

                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>REMIND ME ON</label>
                  <div className="relative mb-4">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
                    <input
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      type="datetime-local"
                      className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </div>

                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR PHONE NUMBER</label>
                  <div className="relative mb-4">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      type="tel"
                      className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm"
                      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </div>

                  {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

                  <button
                    type="submit"
                    disabled={!task.trim() || !dueDate || !phone.trim() || saving}
                    className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    {saving ? <><Loader2 size={13} className="animate-spin" /> Scheduling…</> : <><Send size={13} /> Schedule Free SMS Reminder</>}
                  </button>
                </form>

                <p className="text-center font-mono text-[8px] tracking-widest mt-3" style={{ color: "rgba(138,143,152,0.5)" }}>
                  ✓ FREE SERVICE · NO CHARGE · STANDARD SMS RATES MAY APPLY
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}