import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Edit3, Trash2, X, Loader2, Clock, Phone, Mic, Calendar, Plus, AlertCircle, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TagBar, { TagDisplay, TagEditor } from "@/components/dashboard/TagBar";
import ShareVoiceNoteDialog from "@/components/dashboard/ShareVoiceNoteDialog";

export default function VoiceNotesDashboard() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | pending | completed
  const [selectedTags, setSelectedTags] = useState([]);
  const [editing, setEditing] = useState(null); // reminder object or null
  const [editForm, setEditForm] = useState({ title: "", notes: "", due_date: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(null); // reminder object or null

  const loadReminders = async () => {
    try {
      const data = await base44.entities.Reminder.list("-created_date", 100);
      setReminders(data || []);
    } catch {
      setError("Could not load your reminders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const toggleComplete = async (item) => {
    try {
      await base44.entities.Reminder.update(item.id, { completed: !item.completed });
      setReminders((prev) => prev.map((r) => (r.id === item.id ? { ...r, completed: !r.completed } : r)));
    } catch {
      setError("Could not update reminder.");
    }
  };

  const deleteReminder = async (item) => {
    try {
      await base44.entities.Reminder.delete(item.id);
      setReminders((prev) => prev.filter((r) => r.id !== item.id));
      if (editing?.id === item.id) setEditing(null);
    } catch {
      setError("Could not delete reminder.");
    }
  };

  const openEditor = (item) => {
    setEditing(item);
    const dueLocal = item.due_date ? new Date(item.due_date).toISOString().slice(0, 16) : "";
    setEditForm({
      title: item.title || "",
      notes: item.notes || "",
      due_date: dueLocal,
      phone: item.phone || "",
    });
    setError(null);
  };

  const closeEditor = () => {
    setEditing(null);
    setEditForm({ title: "", notes: "", due_date: "", phone: "" });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing || !editForm.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: editForm.title.trim(),
        notes: editForm.notes.trim(),
        phone: editForm.phone.trim(),
        due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : editing.due_date,
      };
      await base44.entities.Reminder.update(editing.id, payload);
      setReminders((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r)));
      closeEditor();
    } catch {
      setError("Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const updateReminderTags = async (item, newTags) => {
    try {
      await base44.entities.Reminder.update(item.id, { tags: newTags });
      setReminders((prev) => prev.map((r) => (r.id === item.id ? { ...r, tags: newTags } : r)));
    } catch { /* ignore */ }
  };

  const filtered = reminders
    .filter((r) => filter === "all" || (filter === "pending" ? !r.completed : r.completed))
    .filter((r) => selectedTags.length === 0 || (r.tags || []).some((t) => selectedTags.includes(t)))
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
      return 0;
    });

  const pendingCount = reminders.filter((r) => !r.completed).length;
  const completedCount = reminders.filter((r) => r.completed).length;

  const fmtDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    const now = new Date();
    const diff = date - now;
    const overdue = diff < 0;
    const soon = diff < 86400000 && diff > 0;
    const label = date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    return { label, overdue, soon };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Bell size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE NOTES & REMINDERS</p>
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{pendingCount} PENDING · {completedCount} DONE</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "all", label: "All", count: reminders.length },
          { id: "pending", label: "Pending", count: pendingCount },
          { id: "completed", label: "Completed", count: completedCount },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{
              background: filter === f.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${filter === f.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
              color: filter === f.id ? "#D1FF26" : "#8A8F98",
            }}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Tag filter bar */}
      <TagBar items={reminders} selectedTags={selectedTags} onTagToggle={toggleTag} onClearTags={() => setSelectedTags([])} />

      {error && (
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Mic size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>
            {filter === "completed" ? "NO COMPLETED REMINDERS YET" : filter === "pending" ? "NO PENDING REMINDERS" : "NO REMINDERS YET"}
          </p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>
            Record a voice note from the home page to create your first reminder
          </p>
        </div>
      )}

      {/* Reminder list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => {
              const due = fmtDate(item.due_date);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.1) }}
                  className="p-4 flex items-start gap-3"
                  style={{
                    background: item.completed ? "rgba(16,20,29,0.4)" : "#10141D",
                    border: `0.5px solid ${item.completed ? "rgba(138,143,152,0.1)" : due?.overdue ? "rgba(239,68,68,0.3)" : due?.soon ? "rgba(209,255,38,0.35)" : "rgba(209,255,38,0.15)"}`,
                    opacity: item.completed ? 0.6 : 1,
                  }}
                >
                  {/* Complete toggle */}
                  <button
                    onClick={() => toggleComplete(item)}
                    className="flex items-center justify-center w-7 h-7 flex-shrink-0 mt-0.5 transition-all"
                    style={{
                      background: item.completed ? "#D1FF26" : "transparent",
                      border: `1px solid ${item.completed ? "#D1FF26" : "rgba(209,255,38,0.4)"}`,
                      borderRadius: "2px",
                    }}
                    title={item.completed ? "Mark as pending" : "Mark as complete"}
                  >
                    {item.completed && <Check size={14} style={{ color: "#05070A" }} />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-heading font-semibold text-sm mb-0.5"
                      style={{
                        color: item.completed ? "#8A8F98" : "#F5F5F7",
                        textDecoration: item.completed ? "line-through" : "none",
                      }}
                    >
                      {item.title}
                    </p>
                    {item.notes && (
                      <p className="text-xs leading-relaxed mb-2" style={{ color: "#8A8F98" }}>{item.notes}</p>
                    )}
                    {item.transcript && !item.notes && (
                      <p className="text-xs leading-relaxed mb-2 line-clamp-2" style={{ color: "rgba(138,143,152,0.7)" }}>🎙 {item.transcript}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {due && (
                        <span
                          className="flex items-center gap-1 font-mono text-[9px] tracking-widest"
                          style={{ color: item.completed ? "#8A8F98" : due.overdue ? "#ef4444" : due.soon ? "#D1FF26" : "#8A8F98" }}
                        >
                          {due.overdue && !item.completed ? <AlertCircle size={10} /> : <Clock size={10} />}
                          {due.label}
                        </span>
                      )}
                      {item.phone && (
                        <a href={`tel:${item.phone}`} className="flex items-center gap-1 font-mono text-[9px] transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                          <Phone size={9} /> {item.phone}
                        </a>
                      )}
                      {item.source === "followup" && item.related_interaction_title && (
                        <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                          ↳ {item.related_interaction_title.slice(0, 24)}{item.related_interaction_title.length > 24 ? "…" : ""}
                        </span>
                      )}
                      {item.sms_sent && (
                        <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>SMS SENT</span>
                      )}
                      {(item.tags || []).length > 0 && <TagDisplay tags={item.tags} />}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <TagEditor tags={item.tags || []} onSave={(tags) => updateReminderTags(item, tags)} />
                    {(item.transcript || item.notes) && (
                      <button
                        onClick={() => setSharing(item)}
                        className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                        style={{ color: "#8A8F98" }}
                        title="Share via SMS"
                      >
                        <Share2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => openEditor(item)}
                      className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                      style={{ color: "#8A8F98" }}
                      title="Edit reminder"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => deleteReminder(item)}
                      className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                      style={{ color: "#8A8F98" }}
                      title="Delete reminder"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit dialog */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80]"
              style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
              onClick={closeEditor}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-md p-6"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Edit3 size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// EDIT REMINDER</p>
                </div>
                <button onClick={closeEditor} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              <form onSubmit={saveEdit}>
                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>TITLE</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  autoFocus
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />

                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NOTES</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4 resize-none"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />

                <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
                  <Calendar size={10} /> DUE DATE & TIME
                </label>
                <input
                  type="datetime-local"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />

                <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
                  <Phone size={10} /> SMS PHONE
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+1 555 000 0000"
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-5"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !editForm.title.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={closeEditor}
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

      {/* Share via SMS dialog */}
      {sharing && (
       <ShareVoiceNoteDialog reminder={sharing} onClose={() => setSharing(null)} />
      )}
      </motion.div>
      );
      }