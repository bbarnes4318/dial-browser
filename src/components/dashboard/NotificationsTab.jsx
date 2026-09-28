import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Bell, PhoneMissed, Mail, Video, Clock, Voicemail, Briefcase, MessageSquare,
  Check, CheckCheck, Trash2, Loader2, BellOff, ChevronRight, AlertTriangle,
  Store, Calendar, Heart,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const TYPE_CONFIG = {
  missed_call: { icon: PhoneMissed, color: "#ef4444", label: "MISSED CALL" },
  new_email: { icon: Mail, color: "#60A5FA", label: "NEW EMAIL" },
  meeting_reminder: { icon: Video, color: "#D1FF26", label: "MEETING" },
  voicemail: { icon: Voicemail, color: "#D1FF26", label: "VOICEMAIL" },
  job_alert: { icon: Briefcase, color: "#D1FF26", label: "JOB ALERT" },
  sms_alert: { icon: MessageSquare, color: "#60A5FA", label: "SMS ALERT" },
  new_service: { icon: Store, color: "#22d3ee", label: "NEW SERVICE" },
  social_message: { icon: Heart, color: "#CC00FF", label: "MESSAGE" },
  community_event: { icon: Calendar, color: "#22d3ee", label: "EVENT" },
  system: { icon: Bell, color: "#8A8F98", label: "SYSTEM" },
};

const PRIORITY_STYLES = {
  high: { border: "rgba(239,68,68,0.4)", glow: "0 0 12px rgba(239,68,68,0.1)" },
  normal: { border: "rgba(209,255,38,0.15)", glow: "none" },
  low: { border: "rgba(138,143,152,0.1)", glow: "none" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsTab() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [generated, setGenerated] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await base44.entities.AppNotification.list("-created_date", 100);
      setNotifications(data || []);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, []);

  // Aggregate real platform data into notification records for unified view
  const generateAggregated = useCallback(async () => {
    if (generated) return;
    setGenerated(true);
    try {
      const [missedCalls, voicemails, upcomingReminders, unreadSms, activeMeetings, newServices, socialMessages] = await Promise.all([
        base44.entities.IncomingCall.filter({ status: "missed" }, "-created_date", 5).catch(() => []),
        base44.entities.Voicemail.filter({ listened: false }, "-created_date", 5).catch(() => []),
        base44.entities.Reminder.filter({ completed: false, sms_sent: false }, "-created_date", 5).catch(() => []),
        base44.entities.SmsNotification.filter({ read: false }, "-created_date", 5).catch(() => []),
        base44.entities.VideoMeeting.filter({ status: "active" }, "-created_date", 5).catch(() => []),
        base44.entities.DialServiceListing.list("-created_date", 8).catch(() => []),
        user ? base44.entities.SocialMessage.filter({ recipient_user_id: user.id, read: false }, "-created_date", 8).catch(() => []) : [],
      ]);

      const sevenDaysAgo = Date.now() - 7 * 86400000;

      const toCreate = [];

      // Missed calls
      (missedCalls || []).forEach((call) => {
        toCreate.push({
          notification_type: "missed_call",
          title: `Missed call from ${call.caller_name || "Unknown"}`,
          message: `${call.caller_phone || "Unknown number"} tried to reach you${call.caller_location ? ` · ${call.caller_location}` : ""}`,
          related_id: call.id,
          related_type: "IncomingCall",
          priority: "high",
          action_url: "/profile",
          action_label: "View Caller ID",
        });
      });

      // Unlistened voicemails
      (voicemails || []).forEach((vm) => {
        toCreate.push({
          notification_type: "voicemail",
          title: `New voicemail from ${vm.caller_name || vm.caller_phone || "Unknown"}`,
          message: vm.transcript ? vm.transcript.slice(0, 120) + (vm.transcript.length > 120 ? "…" : "") : `Duration: ${vm.duration_sec || 0}s`,
          related_id: vm.id,
          related_type: "Voicemail",
          priority: "normal",
          action_url: "/profile",
          action_label: "Listen",
        });
      });

      // Upcoming reminders (meeting-like)
      (upcomingReminders || []).forEach((rem) => {
        const due = rem.due_date ? new Date(rem.due_date) : null;
        const isSoon = due && (due.getTime() - Date.now()) < 86400000;
        toCreate.push({
          notification_type: "meeting_reminder",
          title: rem.title || "Upcoming reminder",
          message: rem.notes || rem.transcript || `Due ${due ? due.toLocaleString() : "soon"}`,
          related_id: rem.id,
          related_type: "Reminder",
          priority: isSoon ? "high" : "normal",
          action_url: "/profile",
          action_label: "View Details",
        });
      });

      // Unread SMS alerts
      (unreadSms || []).forEach((sms) => {
        toCreate.push({
          notification_type: "sms_alert",
          title: sms.title || "New SMS alert",
          message: sms.message_body ? sms.message_body.slice(0, 120) + (sms.message_body.length > 120 ? "…" : "") : "",
          related_id: sms.id,
          related_type: "SmsNotification",
          priority: "normal",
          action_url: "/profile",
          action_label: "View",
        });
      });

      // Active meetings
      (activeMeetings || []).forEach((mtg) => {
        toCreate.push({
          notification_type: "meeting_reminder",
          title: `Meeting in progress: ${mtg.room_code}`,
          message: `Hosted by ${mtg.host_name} · ${mtg.participant_names?.length || 0} participant(s)`,
          related_id: mtg.id,
          related_type: "VideoMeeting",
          priority: "normal",
          action_url: "/dashboard",
          action_label: "Join Meeting",
        });
      });

      // New service listings (within the last 7 days)
      (newServices || []).forEach((svc) => {
        if (!svc.created_date || new Date(svc.created_date).getTime() < sevenDaysAgo) return;
        toCreate.push({
          notification_type: "new_service",
          title: `New service: ${svc.provider_name || "Provider"}`,
          message: svc.description ? svc.description.slice(0, 120) + (svc.description.length > 120 ? "…" : "") : `${svc.service_category || "Service"}${svc.city ? ` · ${svc.city}` : ""}`.trim(),
          related_id: svc.id,
          related_type: "DialServiceListing",
          priority: "normal",
          action_url: `/directory/${svc.id}`,
          action_label: "View Service",
        });
      });

      // Personal social messages (unread DMs)
      (socialMessages || []).forEach((msg) => {
        toCreate.push({
          notification_type: "social_message",
          title: `Message from ${msg.sender_name || msg.sender_handle || "a member"}`,
          message: msg.text ? msg.text.slice(0, 120) + (msg.text.length > 120 ? "…" : "") : (msg.voice_note_transcript ? msg.voice_note_transcript.slice(0, 120) : "Voice message"),
          related_id: msg.id,
          related_type: "SocialMessage",
          priority: "normal",
          action_url: "/social",
          action_label: "Open Social",
        });
      });

      // Deduplicate by related_id+type to avoid spamming
      const existingKeys = new Set(
        (await base44.entities.AppNotification.list("-created_date", 200).catch(() => [])).map(
          (n) => `${n.notification_type}:${n.related_id}`
        )
      );

      const newOnes = toCreate.filter((n) => n.related_id && !existingKeys.has(`${n.notification_type}:${n.related_id}`));
      if (newOnes.length > 0) {
        await base44.entities.AppNotification.bulkCreate(newOnes);
      }
      loadNotifications();
    } catch {
      loadNotifications();
    }
  }, [generated, loadNotifications]);

  useEffect(() => {
    generateAggregated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (notif) => {
    try {
      await base44.entities.AppNotification.update(notif.id, { read: true });
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await base44.entities.AppNotification.bulkUpdate(unread.map((n) => ({ id: n.id, read: true })));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const deleteNotif = async (notif) => {
    try {
      await base44.entities.AppNotification.delete(notif.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    } catch { /* ignore */ }
  };

  const clearRead = async () => {
    const readOnes = notifications.filter((n) => n.read);
    if (readOnes.length === 0) return;
    try {
      await base44.entities.AppNotification.deleteMany({ read: true });
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch { /* ignore */ }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.notification_type === filter);
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const counts = useMemo(() => {
    const c = {};
    notifications.forEach((n) => { c[n.notification_type] = (c[n.notification_type] || 0) + 1; });
    return c;
  }, [notifications]);

  const FILTER_TABS = [
    { id: "all", label: "All", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "missed_call", label: "Missed Calls", count: counts.missed_call || 0 },
    { id: "new_email", label: "Emails", count: counts.new_email || 0 },
    { id: "meeting_reminder", label: "Meetings", count: counts.meeting_reminder || 0 },
    { id: "voicemail", label: "Voicemail", count: counts.voicemail || 0 },
    { id: "new_service", label: "New Services", count: counts.new_service || 0 },
    { id: "social_message", label: "Messages", count: counts.social_message || 0 },
    { id: "system", label: "Alerts", count: counts.system || 0 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Bell size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// NOTIFICATIONS</p>
          {unreadCount > 0 && (
            <span className="font-mono text-[9px] px-2 py-0.5 animate-pulse" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.3)" }}>
              {unreadCount} UNREAD
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
            >
              <CheckCheck size={11} /> Mark All Read
            </button>
          )}
          {notifications.some((n) => n.read) && (
            <button
              onClick={clearRead}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
            >
              <Trash2 size={11} /> Clear Read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTER_TABS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all whitespace-nowrap"
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

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <BellOff size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>ALL CAUGHT UP</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Missed calls, new emails, and meeting reminders will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((notif, idx) => {
              const config = TYPE_CONFIG[notif.notification_type] || TYPE_CONFIG.system;
              const Icon = config.icon;
              const prio = PRIORITY_STYLES[notif.priority] || PRIORITY_STYLES.normal;
              const actionTarget = notif.action_url && notif.action_url.startsWith("/") ? notif.action_url : null;

              const content = (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.015, 0.1) }}
                  className="p-4 flex items-start gap-3"
                  style={{
                    background: notif.read ? "rgba(16,20,29,0.4)" : "#10141D",
                    border: `0.5px solid ${notif.read ? "rgba(138,143,152,0.1)" : prio.border}`,
                    boxShadow: notif.read ? "none" : prio.glow,
                    opacity: notif.read ? 0.6 : 1,
                  }}
                >
                  {/* Icon */}
                  <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: `${config.color}15` }}>
                    <Icon size={16} style={{ color: config.color }} />
                    {!notif.read && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: config.color }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-semibold text-sm" style={{ color: notif.read ? "#8A8F98" : "#F5F5F7" }}>{notif.title}</p>
                      <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: `${config.color}15`, color: config.color }}>
                        {config.label}
                      </span>
                      {notif.priority === "high" && !notif.read && (
                        <span className="flex items-center gap-0.5 font-mono text-[7px] tracking-widest" style={{ color: "#ef4444" }}>
                          <AlertTriangle size={8} /> HIGH
                        </span>
                      )}
                    </div>
                    {notif.message && (
                      <p className="text-xs leading-relaxed mt-1" style={{ color: "#8A8F98" }}>{notif.message}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.6)" }}>
                        <Clock size={9} /> {timeAgo(notif.created_date)}
                      </span>
                      {notif.action_label && actionTarget && (
                        <span className="flex items-center gap-0.5 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
                          {notif.action_label} <ChevronRight size={9} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => markRead(notif)}
                        className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(209,255,38,0.08)]"
                        style={{ color: "#8A8F98" }}
                        title="Mark as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif(notif)}
                      className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                      style={{ color: "#8A8F98" }}
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );

              if (actionTarget) {
                return (
                  <Link key={notif.id} to={actionTarget} onClick={() => !notif.read && markRead(notif)} style={{ display: "block" }}>
                    {content}
                  </Link>
                );
              }
              return content;
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}