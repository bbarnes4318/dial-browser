import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, Calendar, X, Check, Send, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NOTIFICATION_CONFIG = {
  new_match: { icon: Heart, label: "NEW MATCH", color: "#D1FF26" },
  new_message: { icon: MessageCircle, label: "NEW MESSAGE", color: "#D1FF26" },
  event_starting: { icon: Calendar, label: "EVENT SOON", color: "#D1FF26" },
};

const DEMO_TRIGGERS = [
  {
    notification_type: "new_match",
    label: "Trigger: New Match",
    recipient_name: "Marcus J.",
    recipient_phone: "+14045550123",
    related_name: "Amara, 28",
  },
  {
    notification_type: "new_message",
    label: "Trigger: New Message",
    recipient_name: "Marcus J.",
    recipient_phone: "+14045550123",
    related_name: "Trey, 29",
  },
  {
    notification_type: "event_starting",
    label: "Trigger: Event Soon",
    recipient_name: "Marcus J.",
    recipient_phone: "+14045550123",
    related_name: "Afrobeats Music Festival",
    event_date: "2026-07-03",
    event_location: "Atlanta, GA",
  },
];

const fmtTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [toast, setToast] = useState(null);
  const panelRef = useRef(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SmsNotification.list("-created_date", 20);
      setNotifications(res || []);
    } catch (e) {
      // Fallback to demo data if entity not yet available
      setNotifications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Open from bottom bar trigger
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-notification-center", handler);
    return () => window.removeEventListener("open-notification-center", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTrigger = async (trigger) => {
    setSending(trigger.notification_type);
    try {
      const res = await base44.functions.invoke("sendSmsNotification", trigger);
      const newNotif = res.data || res;
      if (newNotif && newNotif.notification_id) {
        setNotifications((prev) => [
          {
            id: newNotif.notification_id,
            notification_type: trigger.notification_type,
            recipient_name: trigger.recipient_name,
            recipient_phone: trigger.recipient_phone,
            title: newNotif.title,
            message_body: newNotif.sms_message,
            related_name: trigger.related_name,
            status: "sent",
            read: false,
            created_date: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setToast({ type: "success", message: `SMS alert sent to ${trigger.recipient_name}` });
    } catch (e) {
      setToast({ type: "error", message: "Failed to send SMS alert" });
    }
    setSending(null);
    setTimeout(() => setToast(null), 3000);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      {/* Floating bell button — hidden on mobile (in bottom bar) */}
      <div className="hidden lg:block fixed bottom-24 right-4 z-[65]">
        <button
          onClick={() => setOpen(!open)}
          className="relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:shadow-[0_0_24px_rgba(209,255,38,0.4)]"
          style={{
            background: open ? "#D1FF26" : "rgba(209,255,38,0.12)",
            border: "1px solid rgba(209,255,38,0.5)",
            backdropFilter: "blur(8px)",
          }}
          aria-label="SMS Notifications"
        >
          <Bell size={18} style={{ color: open ? "#05070A" : "#D1FF26" }} />
          {unreadCount > 0 && !open && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[9px] font-bold rounded-full animate-pulse"
              style={{ background: "#D1FF26", color: "#05070A", boxShadow: "0 0 8px rgba(209,255,38,0.6)" }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-56 right-4 lg:bottom-40 z-[65] w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] flex flex-col overflow-hidden"
            style={{
              background: "rgba(10,13,20,0.98)",
              border: "0.5px solid rgba(209,255,38,0.3)",
              boxShadow: "0 12px 50px rgba(0,0,0,0.7)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Signal line accent */}
            <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
              <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
              <div className="flex items-center gap-2">
                <Phone size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// SMS ALERTS</p>
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="font-mono text-[8px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                  Mark all read
                </button>
              )}
            </div>

            {/* Demo triggers */}
            <div className="p-3 space-y-2" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>// SIMULATE SMS ALERT</p>
              {DEMO_TRIGGERS.map((trigger) => {
                const cfg = NOTIFICATION_CONFIG[trigger.notification_type];
                const Icon = cfg.icon;
                const isSending = sending === trigger.notification_type;
                return (
                  <button
                    key={trigger.type}
                    onClick={() => handleTrigger(trigger)}
                    disabled={sending !== null}
                    className="w-full flex items-center gap-2 px-3 py-2.5 transition-all disabled:opacity-50 hover:bg-[rgba(209,255,38,0.06)]"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}
                  >
                    <Icon size={12} style={{ color: "#D1FF26" }} />
                    <span className="font-mono text-[9px] tracking-widest uppercase flex-1 text-left" style={{ color: "#F5F5F7" }}>
                      {trigger.label}
                    </span>
                    {isSending ? (
                      <div className="w-3 h-3 border border-[#D1FF26] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={11} style={{ color: "#D1FF26" }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Notification feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>// ALERT FEED</p>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border border-[#D1FF26] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell size={28} style={{ color: "rgba(209,255,38,0.3)" }} />
                  <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>No alerts yet</p>
                  <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Trigger an SMS alert above</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => {
                    const cfg = NOTIFICATION_CONFIG[notif.notification_type] || NOTIFICATION_CONFIG.new_message;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="relative p-3 group"
                        style={{
                          background: notif.read ? "rgba(16,20,29,0.6)" : "rgba(209,255,38,0.04)",
                          border: `0.5px solid ${notif.read ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.3)"}`,
                        }}
                      >
                        {/* Dismiss button */}
                        <button
                          onClick={() => handleDismiss(notif.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} style={{ color: "#8A8F98" }} />
                        </button>

                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Icon size={12} style={{ color: "#D1FF26" }} />
                            <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>{cfg.label}</span>
                          </div>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26" }} />
                          )}
                        </div>

                        <p className="font-heading font-semibold text-sm mb-1" style={{ color: "#F5F5F7" }}>
                          {notif.title}
                        </p>
                        <p className="text-xs mb-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                          {notif.message_body}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>
                            📱 {notif.recipient_phone} · {notif.created_date ? fmtTimeAgo(notif.created_date) : "Just now"}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#D1FF26" }}>
                            <Check size={9} /> {notif.status || "sent"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
              <div className="flex-1 h-px" style={{ background: "rgba(209,255,38,0.15)" }} />
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>AUTO-SMS ACTIVE</span>
              <div className="flex-1 h-px" style={{ background: "rgba(209,255,38,0.15)" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[75] px-5 py-3 flex items-center gap-2"
            style={{
              background: toast.type === "success" ? "rgba(209,255,38,0.15)" : "rgba(239,68,68,0.15)",
              border: `0.5px solid ${toast.type === "success" ? "rgba(209,255,38,0.5)" : "rgba(239,68,68,0.5)"}`,
              backdropFilter: "blur(8px)",
            }}
          >
            {toast.type === "success" ? (
              <Check size={14} style={{ color: "#D1FF26" }} />
            ) : (
              <X size={14} style={{ color: "#ef4444" }} />
            )}
            <span className="font-mono text-[10px] tracking-widest" style={{ color: toast.type === "success" ? "#D1FF26" : "#ef4444" }}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}