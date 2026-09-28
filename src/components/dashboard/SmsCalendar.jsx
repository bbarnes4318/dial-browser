import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock, Plus, Trash2, Check, X, Loader2, Mail, MessageSquare,
  Users, Lock, Zap, Bell, ChevronDown, ChevronRight,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const DEMO_CONTACTS = [
  { id: "demo1", name: "Sarah Johnson", phone: "+1 555 0101", email: "sarah@example.com" },
  { id: "demo2", name: "Mike Chen", phone: "+1 555 0102", email: "mike@example.com" },
  { id: "demo3", name: "Lisa Rodriguez", phone: "+1 555 0103", email: "lisa@example.com" },
];

export default function SmsCalendar({ user }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message_body: "",
    send_date: "",
    channels: ["sms"],
    contact_ids: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const loadSubscription = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const subs = await base44.entities.SmsCalendarSubscription.filter({ owner_user_id: user.id }, "-created_date", 5);
      if (subs && subs.length > 0) {
        setSubscription(subs[0]);
        setIsDemo(false);
      } else {
        setSubscription(null);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  const loadMessages = useCallback(async () => {
    try {
      const data = await base44.entities.ScheduledMessage.list("-created_date", 50);
      setMessages(data || []);
    } catch { /* ignore */ }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const data = await base44.entities.Contact.list("-created_date", 200);
      setContacts(data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadSubscription();
    loadMessages();
    loadContacts();
  }, [loadSubscription, loadMessages, loadContacts]);

  const startCheckout = async (plan) => {
    setCheckingOut(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("create-checkout", {
        plan: `sms_calendar_${plan}`,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
      });
      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        setError("Could not start checkout. Try again.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed. Try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const toggleContact = (id) => {
    setForm((prev) => ({
      ...prev,
      contact_ids: prev.contact_ids.includes(id)
        ? prev.contact_ids.filter((c) => c !== id)
        : [...prev.contact_ids, id],
    }));
  };

  const toggleChannel = (ch) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter((c) => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  const saveMessage = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message_body.trim() || !form.send_date || form.contact_ids.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const selectedContacts = isDemo
        ? DEMO_CONTACTS.filter((c) => form.contact_ids.includes(c.id))
        : contacts.filter((c) => form.contact_ids.includes(c.id));
      const recipientSummary = selectedContacts.map((c) => c.name).join(", ");

      if (isDemo) {
        // Demo mode: create a simulated scheduled message
        const demoMsg = {
          id: `demo_${Date.now()}`,
          title: form.title.trim(),
          message_body: form.message_body.trim(),
          send_date: new Date(form.send_date).toISOString(),
          channels: form.channels,
          recipient_summary: recipientSummary,
          status: "scheduled",
          is_demo: true,
        };
        setMessages((prev) => [demoMsg, ...prev]);
        setShowForm(false);
        setForm({ title: "", message_body: "", send_date: "", channels: ["sms"], contact_ids: [] });
      } else {
        const created = await base44.entities.ScheduledMessage.create({
          title: form.title.trim(),
          message_body: form.message_body.trim(),
          send_date: new Date(form.send_date).toISOString(),
          channels: form.channels,
          contact_ids: form.contact_ids,
          recipient_summary: recipientSummary,
          status: "scheduled",
        });
        setMessages((prev) => [created, ...prev]);
        setShowForm(false);
        setForm({ title: "", message_body: "", send_date: "", channels: ["sms"], contact_ids: [] });
      }
    } catch {
      setError("Could not save scheduled message.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMessage = async (msg) => {
    if (msg.is_demo) {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      return;
    }
    try {
      await base44.entities.ScheduledMessage.delete(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch { /* ignore */ }
  };

  const cancelMessage = async (msg) => {
    if (msg.is_demo) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: "cancelled" } : m)));
      return;
    }
    try {
      await base44.entities.ScheduledMessage.update(msg.id, { status: "cancelled" });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: "cancelled" } : m)));
    } catch { /* ignore */ }
  };

  const isActive = subscription?.subscription_active;
  const activeContacts = isDemo ? DEMO_CONTACTS : contacts;

  const statusStyles = {
    scheduled: { color: "#D1FF26", bg: "rgba(209,255,38,0.1)" },
    sending: { color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
    sent: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    partially_sent: { color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
    failed: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    cancelled: { color: "#8A8F98", bg: "rgba(138,143,152,0.1)" },
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SMS / TEXT CALENDAR</p>
          {isActive && <span className="font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>PREMIUM ACTIVE</span>}
          {isDemo && <span className="font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(96,165,250,0.1)", color: "#60A5FA" }}>DEMO MODE</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInstructions(!showInstructions)} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
            {showInstructions ? <ChevronDown size={12} /> : <ChevronRight size={12} />} How It Works
          </button>
        </div>
      </div>

      {/* Instructions panel */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// HOW SMS / TEXT CALENDAR WORKS</p>
              <div className="space-y-3">
                {[
                  { icon: Users, text: "Select multiple contacts from your address book to receive the message" },
                  { icon: CalendarClock, text: "Choose a date and time for the system to automatically send your message" },
                  { icon: Mail, text: "Pick SMS, email, or both as delivery channels for each scheduled message" },
                  { icon: Bell, text: "You'll receive an in-app alert the moment each message is delivered to its recipients" },
                ].map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-7 h-7 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)" }}>
                        <Icon size={13} style={{ color: "#D1FF26" }} />
                      </div>
                      <p className="text-xs leading-relaxed pt-1" style={{ color: "#8A8F98" }}>{step.text}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3" style={{ background: "rgba(96,165,250,0.05)", border: "0.5px solid rgba(96,165,250,0.2)" }}>
                <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#60A5FA" }}>💡 TRY THE DEMO</p>
                <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
                  Click "Try Demo" below to schedule a test message with sample contacts — no subscription required. You'll see exactly how the calendar and delivery alerts work.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paywall */}
      {!isActive && !isDemo && (
        <div className="p-5 mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Lock size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// PREMIUM FEATURE</p>
          </div>
          <p className="text-sm mb-4" style={{ color: "#F5F5F7", lineHeight: 1.6 }}>
            Schedule SMS and email messages to multiple contacts at once. Get notified when each message is delivered.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => startCheckout("monthly")}
              disabled={checkingOut}
              className="flex-1 p-4 text-left transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.2)]"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.4)" }}
            >
              <p className="font-heading font-bold text-lg" style={{ color: "#D1FF26" }}>$4.99<span className="text-xs" style={{ color: "#8A8F98" }}>/mo</span></p>
              <p className="font-mono text-[9px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>MONTHLY PLAN</p>
            </button>
            <button
              onClick={() => startCheckout("annual")}
              disabled={checkingOut}
              className="flex-1 p-4 text-left transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.2)]"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.4)" }}
            >
              <p className="font-heading font-bold text-lg" style={{ color: "#D1FF26" }}>$49.99<span className="text-xs" style={{ color: "#8A8F98" }}>/yr</span></p>
              <p className="font-mono text-[9px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>ANNUAL — SAVE 17%</p>
            </button>
          </div>
          {checkingOut && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Loader2 size={14} className="animate-spin" style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>REDIRECTING TO CHECKOUT…</p>
            </div>
          )}
          {error && <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}
          <button
            onClick={() => { setIsDemo(true); setShowForm(true); }}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{ border: "0.5px solid rgba(96,165,250,0.3)", color: "#60A5FA" }}
          >
            <Zap size={13} /> Try Demo (Free)
          </button>
        </div>
      )}

      {/* Active or Demo: create button */}
      {(isActive || isDemo) && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          <Plus size={13} /> Schedule New Message
        </button>
      )}

      {/* New message form */}
      <AnimatePresence>
        {showForm && (isActive || isDemo) && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={saveMessage}
            className="overflow-hidden mb-4"
          >
            <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// NEW SCHEDULED MESSAGE</p>
                <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-[rgba(138,143,152,0.1)]">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>TITLE</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Team Meeting Reminder"
                className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              />

              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>MESSAGE</label>
              <textarea
                value={form.message_body}
                onChange={(e) => setForm({ ...form, message_body: e.target.value })}
                placeholder="Type your message…"
                rows={3}
                className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4 resize-none"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              />

              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SEND DATE & TIME</label>
              <input
                type="datetime-local"
                value={form.send_date}
                onChange={(e) => setForm({ ...form, send_date: e.target.value })}
                className="w-full px-3 py-2.5 text-[16px] sm:text-sm mb-4"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              />

              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>DELIVERY CHANNELS</label>
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => toggleChannel("sms")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: form.channels.includes("sms") ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${form.channels.includes("sms") ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: form.channels.includes("sms") ? "#D1FF26" : "#8A8F98" }}>
                  <MessageSquare size={11} /> SMS
                </button>
                <button type="button" onClick={() => toggleChannel("email")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: form.channels.includes("email") ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${form.channels.includes("email") ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`, color: form.channels.includes("email") ? "#D1FF26" : "#8A8F98" }}>
                  <Mail size={11} /> Email
                </button>
              </div>

              <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
                <Users size={10} /> SELECT RECIPIENTS ({form.contact_ids.length} SELECTED)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 mb-4" style={{ border: "0.5px solid rgba(209,255,38,0.1)" }}>
                {activeContacts.length === 0 ? (
                  <p className="font-mono text-[9px] p-3 text-center" style={{ color: "#8A8F98" }}>No contacts available. Add contacts first.</p>
                ) : activeContacts.map((c) => {
                  const sel = form.contact_ids.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleContact(c.id)}
                      className="w-full flex items-center gap-3 p-3 text-left transition-all"
                      style={{ background: sel ? "rgba(209,255,38,0.08)" : "transparent", borderBottom: "0.5px solid rgba(138,143,152,0.05)" }}
                    >
                      <div className="flex items-center justify-center w-5 h-5 flex-shrink-0" style={{ background: sel ? "#D1FF26" : "transparent", border: `1px solid ${sel ? "#D1FF26" : "rgba(209,255,38,0.4)"}` }}>
                        {sel && <Check size={12} style={{ color: "#05070A" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: sel ? "#D1FF26" : "#F5F5F7" }}>{c.name}</p>
                        <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={saving || !form.title.trim() || !form.message_body.trim() || !form.send_date || form.contact_ids.length === 0} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Schedule Message
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <CalendarClock size={32} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO SCHEDULED MESSAGES YET</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>
            {isActive ? "Schedule your first message to multiple contacts" : isDemo ? "Try scheduling a demo message below" : "Subscribe or try the demo to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => {
              const st = statusStyles[msg.status] || statusStyles.scheduled;
              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.1) }}
                  className="p-4"
                  style={{ background: "#10141D", border: `0.5px solid ${st.color}30` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[8px] tracking-widest px-2 py-0.5 flex-shrink-0" style={{ background: st.bg, color: st.color }}>
                        {msg.status?.toUpperCase().replace("_", " ")}
                      </span>
                      {msg.is_demo && (
                        <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(96,165,250,0.1)", color: "#60A5FA" }}>DEMO</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(msg.status === "scheduled") && (
                        <button onClick={() => cancelMessage(msg)} className="px-2 py-1 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                          Cancel
                        </button>
                      )}
                      <button onClick={() => deleteMessage(msg)} className="flex items-center justify-center w-7 h-7 transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ color: "#8A8F98" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-heading font-semibold text-sm mb-1" style={{ color: "#F5F5F7" }}>{msg.title}</h3>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: "#8A8F98" }}>{msg.message_body}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    {(msg.channels || []).includes("sms") && <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}><MessageSquare size={8} /> SMS</span>}
                    {(msg.channels || []).includes("email") && <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(96,165,250,0.06)", color: "#60A5FA" }}><Mail size={8} /> EMAIL</span>}
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                      <CalendarClock size={8} className="inline" /> {new Date(msg.send_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>

                  {msg.recipient_summary && (
                    <p className="font-mono text-[9px] mt-2" style={{ color: "rgba(138,143,152,0.6)" }}>→ {msg.recipient_summary}</p>
                  )}

                  {msg.status === "sent" && (
                    <p className="font-mono text-[9px] mt-2 flex items-center gap-1" style={{ color: "#22c55e" }}>
                      <Bell size={9} /> Delivery alert sent
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Exit demo button */}
      {isDemo && (
        <button
          onClick={() => { setIsDemo(false); setShowForm(false); }}
          className="w-full mt-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
          style={{ color: "#8A8F98" }}
        >
          Exit Demo Mode
        </button>
      )}
    </motion.div>
  );
}