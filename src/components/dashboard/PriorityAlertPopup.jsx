import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronRight, BrainCircuit, Eye, AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_META = {
  submitted: { label: "Request Received", icon: ClipboardList, color: "#8A8F98" },
  ai_processing: { label: "AI Processing", icon: BrainCircuit, color: "#D1FF26" },
  in_review: { label: "In Review", icon: Eye, color: "#43C6AC" },
  action_needed: { label: "Action Needed", icon: AlertTriangle, color: "#FF6B35" },
  completed: { label: "Completed", icon: CheckCircle2, color: "#10B981" },
};

export default function PriorityAlertPopup() {
  const [alert, setAlert] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const prevStatuses = useRef({});
  const mountedRef = useRef(false);

  useEffect(() => {
    let interval;
    let unsub;

    const checkForChanges = async () => {
      try {
        const requests = await base44.entities.ServiceRequest.filter({}, "-updated_date", 50);
        const next = {};
        requests.forEach((r) => { next[r.id] = r.status; });

        if (mountedRef.current) {
          for (const r of requests) {
            const prev = prevStatuses.current[r.id];
            if (prev && prev !== r.status && r.status !== "submitted") {
              setAlert({
                id: r.id,
                status: r.status,
                prevStatus: prev,
                serviceType: r.service_type,
                requesterName: r.requester_name,
                details: r.details,
                aiNotes: r.ai_notes,
                aiUrgency: r.ai_urgency,
              });
              setDismissed(false);
              break;
            }
          }
        }
        prevStatuses.current = next;
        mountedRef.current = true;
      } catch { /* silent */ }
    };

    // Initial load — seed statuses without triggering alerts
    checkForChanges();
    interval = setInterval(checkForChanges, 10000);

    // Real-time subscription for instant updates
    try {
      unsub = base44.entities.ServiceRequest.subscribe((event) => {
        if (event.type === "update") {
          const r = event.data;
          const prev = prevStatuses.current[r.id];
          if (prev && prev !== r.status && r.status !== "submitted") {
            setAlert({
              id: r.id,
              status: r.status,
              prevStatus: prev,
              serviceType: r.service_type,
              requesterName: r.requester_name,
              details: r.details,
              aiNotes: r.ai_notes,
              aiUrgency: r.ai_urgency,
            });
            setDismissed(false);
          }
          if (r?.id) prevStatuses.current[r.id] = r.status;
        }
      });
    } catch { /* subscription not available */ }

    return () => {
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setTimeout(() => setAlert(null), 300);
  };

  const isUrgent = alert?.status === "action_needed";

  return (
    <AnimatePresence>
      {alert && !dismissed && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          className="fixed top-20 right-4 z-50 w-full max-w-sm"
        >
          <div
            className="relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(10,13,20,0.99), rgba(16,20,29,0.99))",
              border: `0.5px solid ${isUrgent ? "rgba(255,107,53,0.6)" : "rgba(209,255,38,0.4)"}`,
              boxShadow: isUrgent
                ? "0 0 30px rgba(255,107,53,0.2), 0 8px 32px rgba(0,0,0,0.6)"
                : "0 0 30px rgba(209,255,38,0.12), 0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            {/* Pulsing top border */}
            <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
              <div
                className="h-full w-full"
                style={{
                  background: isUrgent ? "#FF6B35" : "#D1FF26",
                  animation: "tickerScroll 2s linear infinite",
                  opacity: 0.8,
                }}
              />
            </div>

            {/* Urgent expanding ring */}
            {isUrgent && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,107,53,0.15), transparent)" }}
              />
            )}

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusIcon alert={alert} />
                  <div>
                    <p
                      className="font-mono text-[9px] tracking-[0.3em] uppercase"
                      style={{ color: isUrgent ? "#FF6B35" : "#D1FF26" }}
                    >
                      {isUrgent ? "// PRIORITY ALERT" : "// STATUS UPDATE"}
                    </p>
                    <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>
                      Service Request Updated
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="p-1.5 transition-colors hover:bg-[rgba(138,143,152,0.1)]"
                  style={{ color: "#8A8F98" }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Status transition */}
              <div className="flex items-center gap-2 mb-3 p-2.5" style={{ background: "rgba(5,7,10,0.5)" }}>
                <StatusBadge status={alert.prevStatus} />
                <ChevronRight size={12} style={{ color: "#3a3f48" }} />
                <StatusBadge status={alert.status} highlighted />
              </div>

              {/* Details */}
              <div className="space-y-1.5">
                {alert.serviceType && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>TYPE</span>
                    <span className="font-mono text-[10px] uppercase" style={{ color: "#D1FF26" }}>{alert.serviceType.replace("_", " ")}</span>
                  </div>
                )}
                {alert.aiUrgency && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>URGENCY</span>
                    <span className="font-mono text-[10px] uppercase" style={{ color: alert.aiUrgency === "emergency" || alert.aiUrgency === "high" ? "#FF6B35" : "#D1FF26" }}>{alert.aiUrgency}</span>
                  </div>
                )}
                {alert.aiNotes && (
                  <p className="text-xs mt-2 pt-2 leading-relaxed" style={{ color: "#8A8F98", borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                    {alert.aiNotes.substring(0, 120)}{alert.aiNotes.length > 120 ? "…" : ""}
                  </p>
                )}
              </div>

              {/* CTA */}
              {isUrgent && (
                <a
                  href="/dashboard"
                  onClick={dismiss}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(255,107,53,0.3)]"
                  style={{ background: "#FF6B35", color: "#05070A" }}
                >
                  <Bell size={12} /> View Details
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatusIcon({ alert }) {
  const meta = STATUS_META[alert.status] || STATUS_META.submitted;
  const Icon = meta.icon;
  return (
    <motion.div
      animate={alert.status === "action_needed" ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.8, repeat: alert.status === "action_needed" ? Infinity : 0 }}
      className="flex items-center justify-center w-9 h-9 flex-shrink-0"
      style={{
        background: `rgba(${hexToRgb(meta.color)},0.1)`,
        border: `0.5px solid rgba(${hexToRgb(meta.color)},0.4)`,
      }}
    >
      <Icon size={16} style={{ color: meta.color }} />
    </motion.div>
  );
}

function StatusBadge({ status, highlighted }) {
  const meta = STATUS_META[status] || { label: status, color: "#8A8F98" };
  return (
    <span
      className="font-mono text-[9px] tracking-widest uppercase px-2 py-1"
      style={{
        background: highlighted ? `rgba(${hexToRgb(meta.color)},0.15)` : "rgba(5,7,10,0.5)",
        border: `0.5px solid rgba(${hexToRgb(meta.color)},${highlighted ? 0.5 : 0.2})`,
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}