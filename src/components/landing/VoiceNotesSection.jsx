import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Pause, Trash2, Check, Bell, Calendar, Phone, Clock, Loader2, X, StickyNote, Send, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceNotesSection() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [draftTranscript, setDraftTranscript] = useState("");
  const [draftAudio, setDraftAudio] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  const loadReminders = async () => {
    try {
      const data = await base44.entities.Reminder.list("-due_date", 50);
      setReminders(data || []);
    } catch (err) {
      setError("Could not load reminders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
    const observer = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        handleUpload();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      let transcript = "";
      try {
        const result = (await base44.functions.invoke("transcribe-audio", { audio_url: file_url })).data;
        transcript = (result?.transcript || "").trim();
      } catch { /* transcription optional */ }
      setDraftAudio(file_url);
      setDraftTranscript(transcript);
      setFormTitle(transcript ? transcript.slice(0, 60) : `Voice Note · ${new Date().toLocaleString()}`);
      setFormNotes(transcript);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const pad = (n) => String(n).padStart(2, "0");
      setFormDate(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`);
      setShowForm(true);
    } catch (err) {
      setError("Could not save recording.");
    } finally {
      setUploading(false);
    }
  };

  const saveReminder = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate || !formPhone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await base44.entities.Reminder.create({
        title: formTitle.trim(),
        notes: formNotes.trim(),
        audio_url: draftAudio,
        transcript: draftTranscript,
        source: "voice_note",
        due_date: new Date(formDate).toISOString(),
        phone: formPhone.trim(),
        sms_sent: false,
        completed: false,
      });
      setShowForm(false);
      setDraftAudio("");
      setDraftTranscript("");
      setFormTitle("");
      setFormNotes("");
      setFormDate("");
      setFormPhone("");
      await loadReminders();
    } catch (err) {
      setError("Could not save reminder.");
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setDraftAudio("");
    setDraftTranscript("");
    setFormTitle("");
    setFormNotes("");
    setFormDate("");
    setFormPhone("");
  };

  const toggleComplete = async (r) => {
    try {
      await base44.entities.Reminder.update(r.id, { completed: !r.completed });
      setReminders((prev) => prev.map((i) => (i.id === r.id ? { ...i, completed: !i.completed } : i)));
    } catch { setError("Could not update."); }
  };

  const deleteReminder = async (r) => {
    try {
      await base44.entities.Reminder.delete(r.id);
      setReminders((prev) => prev.filter((i) => i.id !== r.id));
      if (playingId === r.id) { if (audioRef.current) audioRef.current.pause(); setPlayingId(null); }
    } catch { setError("Could not delete."); }
  };

  const togglePlay = (r) => {
    if (!r.audio_url) return;
    if (playingId === r.id) { if (audioRef.current) audioRef.current.pause(); setPlayingId(null); return; }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(r.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(r.id);
  };

  const playTranscript = (r) => {
    if (!r.transcript) return;
    if (!("speechSynthesis" in window)) return;
    if (playingId === `t-${r.id}`) { window.speechSynthesis.cancel(); setPlayingId(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(r.transcript);
    u.onend = () => setPlayingId(null);
    u.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(u);
    setPlayingId(`t-${r.id}`);
  };

  const grouped = (() => {
    const now = new Date();
    const today = new Date(now); today.setHours(23, 59, 59, 999);
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(23, 59, 59, 999);
    const week = new Date(now); week.setDate(week.getDate() + 7);

    const groups = { Overdue: [], Today: [], Tomorrow: [], "This Week": [], Later: [], Completed: [] };
    reminders.forEach((r) => {
      if (r.completed) { groups.Completed.push(r); return; }
      if (filter === "completed") return;
      const d = new Date(r.due_date);
      if (d < now && !r.sms_sent) groups.Overdue.push(r);
      else if (d <= today) groups.Today.push(r);
      else if (d <= tomorrow) groups.Tomorrow.push(r);
      else if (d <= week) groups["This Week"].push(r);
      else groups.Later.push(r);
    });
    if (filter === "completed") return { Completed: groups.Completed };
    return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
  })();

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <section
      ref={sectionRef}
      id="voice-notes"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden min-h-[700px]"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 6s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-8 lg:mb-10">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE NOTES & REMINDERS — FREE SERVICE</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Never Forget A <span style={{ color: "#D1FF26" }}>Task.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Leave voice notes for yourself, schedule follow-up reminders from past calls, and get automated SMS alerts when tasks are due — all free.
          </p>
        </motion.div>

        {/* Recorder */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-col sm:flex-row items-center gap-4 p-5 mb-6" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center gap-3 flex-1 w-full">
            <button onClick={recording ? stopRecording : startRecording} disabled={uploading || showForm} className="flex items-center justify-center w-14 h-14 rounded-full transition-all flex-shrink-0 disabled:opacity-50" style={{ background: recording ? "rgba(239,68,68,0.15)" : "#D1FF26", border: `1px solid ${recording ? "#ef4444" : "#D1FF26"}`, boxShadow: recording ? "0 0 20px rgba(239,68,68,0.4)" : "0 0 20px rgba(209,255,38,0.2)" }}>
              {recording ? <Square size={20} style={{ color: "#ef4444" }} /> : <Mic size={20} style={{ color: "#05070A" }} />}
            </button>
            <div className="flex-1">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>{uploading ? "SAVING & TRANSCRIBING…" : recording ? "RECORDING VOICE NOTE…" : "READY TO RECORD"}</p>
              <p className="font-heading font-bold text-lg" style={{ color: recording ? "#ef4444" : "#F5F5F7" }}>{recording ? fmtTime(recordSecs) : uploading ? "Transcribing…" : "Tap to leave yourself a note"}</p>
            </div>
            {recording && (
              <div className="flex items-end gap-0.5 h-8">
                {[0, 1, 2, 3, 4].map((i) => (<span key={i} className="w-1" style={{ background: "#ef4444", animation: `eqBar ${0.5 + i * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.08}s` }} />))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Reminder form after recording */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-6">
              <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SET REMINDER FOR THIS NOTE</p>
                  </div>
                  <button onClick={cancelForm} className="p-1 hover:bg-[rgba(138,143,152,0.1)]"><X size={16} style={{ color: "#8A8F98" }} /></button>
                </div>

                {draftTranscript && (
                  <div className="flex items-center gap-2 mb-4 p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                    <button onClick={() => { const a = new Audio(draftAudio); a.play(); }} className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase flex-shrink-0" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                      <Play size={10} /> Play
                    </button>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#8A8F98" }}>{draftTranscript}</p>
                  </div>
                )}

                <form onSubmit={saveReminder}>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>TITLE</label>
                  <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full px-3 py-2.5 text-sm mb-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />

                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NOTES (OPTIONAL)</label>
                  <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 text-sm mb-3 resize-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />

                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>REMIND ME ON</label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
                        <input value={formDate} onChange={(e) => setFormDate(e.target.value)} type="datetime-local" className="w-full pl-9 pr-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR PHONE</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                        <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+1 555 000 0000" type="tel" className="w-full pl-9 pr-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={!formTitle.trim() || !formDate || !formPhone.trim() || saving} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                    {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Send size={13} /> Save & Schedule SMS Reminder</>}
                  </button>
                  <p className="text-center font-mono text-[8px] tracking-widest mt-2" style={{ color: "rgba(138,143,152,0.5)" }}>✓ FREE SERVICE · NO CHARGE</p>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          {[{ id: "upcoming", label: "Upcoming" }, { id: "completed", label: "Completed" }].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className="px-3 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: filter === f.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${filter === f.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: filter === f.id ? "#D1FF26" : "#8A8F98" }}>
              {f.label}
            </button>
          ))}
        </div>

        {error && <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#ef4444" }}>⚠ {error}</p>}

        {/* Calendar / grouped list */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={12} style={{ color: groupName === "Overdue" ? "#ef4444" : "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: groupName === "Overdue" ? "#ef4444" : "#8A8F98" }}>{groupName}</p>
                <span className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.4)" }}>({items.length})</span>
                <div className="flex-1 h-px" style={{ background: "rgba(209,255,38,0.1)" }} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {items.map((r, idx) => (
                    <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.1) }} className="p-4" style={{ background: r.completed ? "rgba(16,20,29,0.4)" : groupName === "Overdue" ? "rgba(239,68,68,0.04)" : "#10141D", border: `0.5px solid ${r.completed ? "rgba(138,143,152,0.1)" : groupName === "Overdue" ? "rgba(239,68,68,0.3)" : "rgba(209,255,38,0.1)"}` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: r.source === "followup" ? "rgba(209,255,38,0.06)" : "rgba(173,58,39,0.1)", color: r.source === "followup" ? "#D1FF26" : "#D1FF26" }}>
                            {r.source === "followup" ? "FOLLOW-UP" : "VOICE NOTE"}
                          </span>
                          {r.sms_sent && <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>SMS SENT</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleComplete(r)} className="p-1 transition-colors hover:bg-[rgba(209,255,38,0.08)]" title={r.completed ? "Mark incomplete" : "Mark done"}>
                            <Check size={13} style={{ color: r.completed ? "#D1FF26" : "#8A8F98" }} />
                          </button>
                          <button onClick={() => deleteReminder(r)} className="p-1 transition-colors hover:bg-[rgba(239,68,68,0.1)]" title="Delete">
                            <Trash2 size={13} style={{ color: "#8A8F98" }} />
                          </button>
                        </div>
                      </div>

                      <h3 className={`font-heading font-bold text-sm mb-1 line-clamp-1 ${r.completed ? "line-through" : ""}`} style={{ color: r.completed ? "#8A8F98" : "#F5F5F7" }}>{r.title}</h3>
                      {r.notes && <p className="text-xs leading-relaxed mb-2 line-clamp-2" style={{ color: "#8A8F98" }}>{r.notes}</p>}
                      {r.related_interaction_title && <p className="font-mono text-[9px] mb-2" style={{ color: "rgba(138,143,152,0.5)" }}>↳ {r.related_interaction_title}</p>}

                      <div className="flex items-center gap-2 pt-2" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                        {r.audio_url && (
                          <button onClick={() => togglePlay(r)} className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: playingId === r.id ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                            {playingId === r.id ? <Pause size={10} /> : <Play size={10} />} Play
                          </button>
                        )}
                        {r.transcript && (
                          <button onClick={() => playTranscript(r)} className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: playingId === `t-${r.id}` ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                            <Volume2 size={10} /> {playingId === `t-${r.id}` ? "Stop" : "Read"}
                          </button>
                        )}
                        <span className="flex items-center gap-1 font-mono text-[8px] ml-auto" style={{ color: groupName === "Overdue" && !r.sms_sent ? "#ef4444" : "#8A8F98" }}>
                          <Clock size={9} /> {fmtDate(r.due_date)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {!loading && Object.keys(grouped).length === 0 && (
          <div className="text-center py-16" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <Bell size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO REMINDERS YET</p>
            <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Record a voice note or schedule a follow-up to get started</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-[rgba(209,255,38,0.2)] border-t-[#D1FF26] rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>
    </section>
  );
}