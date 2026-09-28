import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Phone, Calendar, Send, Check, Loader2, Bell, Clock, AlertCircle, ListChecks } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceReminderScheduler() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [phone, setPhone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedList, setSavedList] = useState([]);
  const [error, setError] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);

  // Load user's existing reminders
  const loadReminders = async () => {
    try {
      const res = await base44.entities.Reminder.filter({ source: "voice_note" }, "-created_date", 10);
      setSavedList(res || []);
    } catch (e) {
      setSavedList([]);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  // Voice recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = transcript;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript((finalText + interim).trim());
    };

    recognition.onerror = (event) => {
      setVoiceError(event.error === "not-allowed" ? "Microphone access denied" : `Voice error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, [transcript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setVoiceError("Voice recognition not supported in this browser");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setVoiceError(null);
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        setVoiceError("Could not start microphone");
      }
    }
  };

  // Default due date: tomorrow 9 AM
  useEffect(() => {
    if (!dueDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const pad = (n) => String(n).padStart(2, "0");
      setDueDate(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`);
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!transcript.trim() || !dueDate || !phone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const title = transcript.trim().slice(0, 100);
      await base44.entities.Reminder.create({
        title,
        notes: transcript.trim(),
        source: "voice_note",
        due_date: new Date(dueDate).toISOString(),
        phone: phone.trim(),
        sms_sent: false,
        completed: false,
      });
      setSaved(true);
      setTranscript("");
      setPhone("");
      loadReminders();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError("Could not schedule reminder. Please try again.");
    }
    setSaving(false);
  };

  const fmtDue = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <section id="voice-reminders" className="snap-section relative py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.4), transparent)" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Bell size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE REMINDER SCHEDULER</span>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Speak It. <span style={{ color: "#D1FF26" }}>We'll Text You.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Dictate your task or reminder out loud. We'll schedule an SMS alert to your phone at the exact time you choose — no typing, no app, no fuss.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="p-6 lg:p-8" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {saved ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.4)" }}>
                <Check size={28} style={{ color: "#D1FF26" }} />
              </div>
              <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>Reminder Scheduled!</p>
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>FREE SMS REMINDER · NO CHARGE</p>
              <p className="text-xs mt-3" style={{ color: "#8A8F98" }}>You'll get a text at the scheduled time.</p>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* Voice dictation area */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>DICTATE YOUR REMINDER</label>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest font-bold transition-all"
                    style={{
                      background: listening ? "rgba(239,68,68,0.15)" : "rgba(209,255,38,0.1)",
                      border: `0.5px solid ${listening ? "rgba(239,68,68,0.4)" : "rgba(209,255,38,0.3)"}`,
                      color: listening ? "#ef4444" : "#D1FF26",
                    }}
                  >
                    {listening ? <><MicOff size={12} /> STOP</> : <><Mic size={12} /> START VOICE</>}
                  </button>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={listening ? "Listening… speak your reminder now" : "Tap 'Start Voice' and speak, or type your reminder here…"}
                  rows={4}
                  className="w-full px-4 py-3 text-sm resize-none focus:outline-none"
                  style={{
                    background: listening ? "rgba(209,255,38,0.04)" : "rgba(5,7,10,0.8)",
                    border: `0.5px solid ${listening ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.2)"}`,
                    color: "#F5F5F7",
                  }}
                />
                {listening && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-1 rounded-full" style={{ background: "#D1FF26", animation: `eqBar 0.6s ease-in-out ${i * 0.1}s infinite`, height: "12px" }} />
                      ))}
                    </div>
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>● LIVE</span>
                  </div>
                )}
                {voiceError && (
                  <p className="font-mono text-[9px] tracking-widest mt-2" style={{ color: "#ef4444" }}>⚠ {voiceError}</p>
                )}
              </div>

              {/* Phone + date */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR PHONE NUMBER</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      type="tel"
                      required
                      className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm focus:outline-none"
                      style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>REMIND ME ON</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
                    <input
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      type="datetime-local"
                      required
                      className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm focus:outline-none"
                      style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

              <button
                type="submit"
                disabled={!transcript.trim() || !dueDate || !phone.trim() || saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                {saving ? <><Loader2 size={13} className="animate-spin" /> Scheduling…</> : <><Send size={13} /> Schedule SMS Reminder</>}
              </button>
              <p className="text-center font-mono text-[8px] tracking-widest mt-3" style={{ color: "rgba(138,143,152,0.5)" }}>
                ✓ FREE SERVICE · NO CHARGE · STANDARD SMS RATES MAY APPLY
              </p>
            </form>
          )}
        </motion.div>

        {/* Saved reminders list */}
        {savedList.length > 0 && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// YOUR SCHEDULED REMINDERS</p>
            </div>
            <div className="space-y-2">
              {savedList.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${r.sms_sent ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.2)"}` }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.sms_sent ? "#8A8F98" : "#D1FF26", boxShadow: r.sms_sent ? "none" : "0 0 6px #D1FF26" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: r.sms_sent ? "#8A8F98" : "#F5F5F7" }}>{r.title}</p>
                    <div className="flex items-center gap-3 font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.6)" }}>
                      <span className="flex items-center gap-1"><Clock size={9} /> {fmtDue(r.due_date)}</span>
                      <span>📞 {r.phone}</span>
                      {r.sms_sent && <span style={{ color: "#8A8F98" }}>✓ SENT</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}