import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Phone, Mail, Calendar, Mic, Briefcase, MessageSquare, Radio, Sparkles, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const TYPE_META = {
  missed_call: { icon: Phone, color: "#D1FF26" },
  new_email: { icon: Mail, color: "#5AE0C8" },
  meeting_reminder: { icon: Calendar, color: "#5AE0C8" },
  voicemail: { icon: Mic, color: "#D1FF26" },
  job_alert: { icon: Briefcase, color: "#E0A85A" },
  sms_alert: { icon: MessageSquare, color: "#D1FF26" },
  system: { icon: Sparkles, color: "#8A8F98" },
  new_service: { icon: Sparkles, color: "#D1FF26" },
  social_message: { icon: MessageSquare, color: "#5AE0C8" },
  community_event: { icon: Radio, color: "#E0A85A" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsBell({ variant = "sidebar" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  const load = async () => {
    try {
      const list = await base44.entities.AppNotification.filter({}, "-created_date", 30);
      setItems(list || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Realtime subscription — new events appear live without a refresh
    const unsub = base44.entities.AppNotification.subscribe((event) => {
      if (event.type === "create") {
        setItems((prev) => [event.data, ...prev].slice(0, 50));
      } else if (event.type === "update") {
        setItems((prev) => prev.map((n) => (n.id === event.data.id ? event.data : n)));
      } else if (event.type === "delete") {
        setItems((prev) => prev.filter((n) => n.id !== event.data.id));
      }
    });
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const unreadItems = items.filter((n) => !n.read);
    if (unreadItems.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await base44.entities.AppNotification.bulkUpdate(
        unreadItems.map((n) => ({ id: n.id, read: true }))
      );
    } catch {
      /* non-blocking — optimistic update already applied */
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markAllRead();
  };

  const isMobile = variant === "mobile";

  const BellButton = (
    <button
      onClick={toggle}
      aria-label="Notifications"
      className="relative flex items-center justify-center transition-all"
      style={isMobile ? { width: 36, height: 36, background: "rgba(10,13,20,0.9)", border: "0.5px solid rgba(209,255,38,0.25)" } : {}}
    >
      <Bell size={isMobile ? 18 : 15} style={{ color: open ? "#D1FF26" : "#8A8F98" }} />
      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-1 font-mono text-[8px] font-bold"
          style={{ background: "#D1FF26", color: "#05070A", borderRadius: "999px", boxShadow: "0 0 8px rgba(209,255,38,0.5)" }}
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );

  // Mobile: fixed floating bell (bottom-left, above the tab bar)
  if (isMobile) {
    return (
      <div className="fixed bottom-16 left-3 z-50 lg:hidden" ref={ref}>
        {BellButton}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-12 left-0 w-[88vw] max-w-sm max-h-[60vh] overflow-y-auto overscroll-contain"
              style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 16px 60px rgba(0,0,0,0.7)" }}
            >
              <PanelContent items={items} loading={loading} onNavigate={() => setOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop sidebar variant
  return (
    <div className="relative flex justify-center" ref={ref}>
      {BellButton}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-9 left-0 w-80 max-h-[70vh] overflow-y-auto overscroll-contain z-50"
            style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 16px 60px rgba(0,0,0,0.7)" }}
          >
            <PanelContent items={items} loading={loading} onNavigate={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelContent({ items, loading, onNavigate }) {
  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-3 sticky top-0 z-10"
        style={{ background: "rgba(10,13,20,0.98)", borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}
      >
        <Bell size={12} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// NOTIFICATIONS</p>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-6 text-center">
          <BellOff size={20} className="mx-auto mb-2" style={{ color: "rgba(138,143,152,0.4)" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO NOTIFICATIONS YET</p>
          <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Matches, calls, and alerts appear here</p>
        </div>
      ) : (
        <div>
          {items.map((n) => {
            const meta = TYPE_META[n.notification_type] || TYPE_META.system;
            const Icon = meta.icon;
            const hasAction = !!(n.action_url && n.action_label);
            const body = (
              <div
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${hasAction ? "hover:bg-[rgba(209,255,38,0.04)]" : ""}`}
                style={{ opacity: n.read ? 0.55 : 1, borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 flex-shrink-0"
                  style={{ background: `${meta.color}15`, border: `0.5px solid ${meta.color}40` }}
                >
                  <Icon size={13} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-heading font-semibold text-xs truncate" style={{ color: "#F5F5F7" }}>{n.title}</p>
                    <span className="font-mono text-[8px] flex-shrink-0" style={{ color: "rgba(138,143,152,0.6)" }}>
                      {timeAgo(n.created_date)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug" style={{ color: "#8A8F98", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {n.message}
                  </p>
                  {hasAction && (
                    <span className="inline-block mt-1 font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>
                      {n.action_label.toUpperCase()} →
                    </span>
                  )}
                </div>
                {!n.read && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26" }} />
                )}
              </div>
            );
            return hasAction ? (
              <Link key={n.id} to={n.action_url} onClick={onNavigate} style={{ display: "block" }}>
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      )}
    </>
  );
}