import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, RefreshCw, ChevronRight, Phone, CheckCircle2,
  Inbox, Cpu, Eye, AlertCircle, Clock,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const STAGES = [
  { key: "submitted", label: "Received", icon: Inbox, desc: "Your request was received and logged" },
  { key: "ai_processing", label: "Processing", icon: Cpu, desc: "AI is analyzing your request and matching providers" },
  { key: "in_review", label: "In Review", icon: Eye, desc: "A provider is reviewing your request" },
  { key: "action_needed", label: "Action Needed", icon: AlertCircle, desc: "The provider needs more details from you" },
  { key: "completed", label: "Completed", icon: CheckCircle2, desc: "Your service request has been fulfilled" },
];

const STAGE_ORDER = ["submitted", "ai_processing", "in_review", "action_needed", "completed"];

const TYPE_META = {
  medical: { color: "#ef4444", label: "Medical" },
  dental: { color: "#22d3ee", label: "Dental" },
  real_estate: { color: "#3b82f6", label: "Real Estate" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function ServiceStatusTracker() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ServiceRequest.list("-created_date", 30);
      setRequests(data || []);
      if (data?.length > 0 && !selected) {
        setSelected(data[0]);
      }
    } catch {
      setRequests([]);
    }
    setLoading(false);
  }, [selected]);

  useEffect(() => {
    load();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep selected request in sync with updates
  useEffect(() => {
    if (!selected) return;
    const updated = requests.find((r) => r.id === selected.id);
    if (updated && updated.status !== selected.status) {
      setSelected(updated);
    }
  }, [requests, selected]);

  const currentStageIndex = selected ? STAGE_ORDER.indexOf(selected.status) : -1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SERVICE STATUS TRACKER</p>
          {!loading && requests.length > 0 && (
            <span className="font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              {requests.length} REQUESTS
            </span>
          )}
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40"
          style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Inbox size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO SERVICE REQUESTS YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Submit a request from any service page to track it here</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Request list */}
          <div className="lg:col-span-1">
            <p className="font-mono text-[9px] tracking-widest mb-3 px-1" style={{ color: "#8A8F98" }}>// YOUR REQUESTS</p>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "480px" }}>
              <AnimatePresence mode="popLayout">
                {requests.map((req) => {
                  const meta = TYPE_META[req.service_type] || { color: "#D1FF26", label: req.service_type || "Service" };
                  const isSelected = selected?.id === req.id;
                  const stageIdx = STAGE_ORDER.indexOf(req.status);
                  const isActive = req.status !== "completed";
                  return (
                    <motion.button
                      key={req.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelected(req)}
                      className="w-full text-left p-3 transition-all"
                      style={{
                        background: isSelected ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.6)",
                        border: `0.5px solid ${isSelected ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                          background: isActive ? meta.color : "#8A8F98",
                          boxShadow: isActive ? `0 0 6px ${meta.color}` : "none",
                          animation: isActive ? "dotPulse 1.5s ease-in-out infinite" : "none",
                        }} />
                        <p className="font-heading font-semibold text-xs truncate" style={{ color: "#F5F5F7" }}>
                          {meta.label}
                        </p>
                        <span className="ml-auto font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                          {timeAgo(req.created_date)}
                        </span>
                      </div>
                      <p className="text-[10px] truncate" style={{ color: "#8A8F98" }}>
                        {req.details ? req.details.slice(0, 60) + (req.details.length > 60 ? "…" : "") : "No details"}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5" style={{
                          background: isActive ? meta.color + "15" : "rgba(138,143,152,0.08)",
                          color: isActive ? meta.color : "#8A8F98",
                        }}>
                          {STAGES[stageIdx]?.label || req.status}
                        </span>
                        <span className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>
                          {stageIdx + 1}/{STAGES.length}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Detail — status timeline */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                {/* Request header */}
                <div className="mb-5 pb-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {(() => {
                      const meta = TYPE_META[selected.service_type] || { color: "#D1FF26", label: selected.service_type || "Service" };
                      return (
                        <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: meta.color + "15", color: meta.color, border: `0.5px solid ${meta.color}30` }}>
                          {meta.label.toUpperCase()}
                        </span>
                      );
                    })()}
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                      REQ #{selected.id?.slice(-8).toUpperCase()}
                    </span>
                    <span className="font-mono text-[8px] ml-auto" style={{ color: "rgba(138,143,152,0.6)" }}>
                      Submitted {timeAgo(selected.created_date)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#F5F5F7" }}>
                    {selected.details || "No details provided"}
                  </p>
                  {selected.requester_name && (
                    <p className="font-mono text-[9px] mt-2" style={{ color: "#8A8F98" }}>
                      <Phone size={9} className="inline mr-1" /> {selected.requester_name}{selected.requester_phone ? ` · ${selected.requester_phone}` : ""}
                    </p>
                  )}
                  {selected.ai_urgency && (
                    <p className="font-mono text-[9px] mt-1" style={{ color: selected.ai_urgency?.includes("high") || selected.ai_urgency?.includes("emergency") ? "#ef4444" : "#8A8F98" }}>
                      ⚠ Urgency: {selected.ai_urgency}
                    </p>
                  )}
                </div>

                {/* Timeline */}
                <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>// STATUS TIMELINE</p>
                <div className="space-y-0">
                  {STAGES.map((stage, i) => {
                    const Icon = stage.icon;
                    const isCompleted = i < currentStageIndex;
                    const isCurrent = i === currentStageIndex;
                    const isPending = i > currentStageIndex;
                    const isLast = i === STAGES.length - 1;
                    const meta = TYPE_META[selected.service_type] || { color: "#D1FF26" };
                    const stageColor = isCompleted ? "#D1FF26" : isCurrent ? meta.color : "rgba(138,143,152,0.3)";

                    return (
                      <div key={stage.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                        {/* Vertical connector line */}
                        {!isLast && (
                          <div
                            className="absolute left-[15px] top-8 bottom-0 w-px"
                            style={{
                              background: isCompleted ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)",
                            }}
                          />
                        )}

                        {/* Icon circle */}
                        <div className="relative flex-shrink-0 z-10">
                          <div
                            className="w-8 h-8 flex items-center justify-center transition-all"
                            style={{
                              background: isCompleted ? "rgba(209,255,38,0.12)" : isCurrent ? stageColor + "15" : "rgba(16,20,29,0.8)",
                              border: `0.5px solid ${stageColor}`,
                              boxShadow: isCurrent ? `0 0 16px ${stageColor}40` : "none",
                            }}
                          >
                            {isPending ? (
                              <Icon size={13} style={{ color: "rgba(138,143,152,0.4)" }} />
                            ) : isCurrent ? (
                              <Icon size={13} style={{ color: stageColor }} />
                            ) : (
                              <CheckCircle2 size={13} style={{ color: "#D1FF26" }} />
                            )}
                          </div>
                          {/* Glowing pulse ring for current stage */}
                          {isCurrent && (
                            <span
                              className="absolute inset-0 rounded-full pointer-events-none"
                              style={{
                                border: `0.5px solid ${stageColor}`,
                                animation: "emergencyPulse 2s ease-out infinite",
                              }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-heading font-semibold text-sm" style={{
                              color: isPending ? "#8A8F98" : "#F5F5F7",
                            }}>
                              {stage.label}
                            </p>
                            {isCurrent && (
                              <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5 animate-pulse" style={{
                                background: stageColor + "15",
                                color: stageColor,
                                border: `0.5px solid ${stageColor}40`,
                              }}>
                                IN PROGRESS
                              </span>
                            )}
                            {isCompleted && (
                              <span className="font-mono text-[7px] tracking-widest" style={{ color: "#D1FF26" }}>✓ DONE</span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed mt-0.5" style={{
                            color: isPending ? "rgba(138,143,152,0.4)" : "#8A8F98",
                          }}>
                            {stage.desc}
                          </p>
                          {isCurrent && selected.ai_notes && i === 1 && (
                            <div className="mt-2 p-2 text-[10px]" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.12)", color: "#8A8F98" }}>
                              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>AI NOTES: </span>
                              {selected.ai_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action hint */}
                {selected.status === "action_needed" && (
                  <div className="mt-4 p-3 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                    <AlertCircle size={13} style={{ color: "#ef4444" }} className="flex-shrink-0" />
                    <p className="text-xs" style={{ color: "#F5F5F7" }}>A provider needs more details. Check your phone for a follow-up message.</p>
                  </div>
                )}
                {selected.status === "completed" && (
                  <div className="mt-4 p-3 flex items-center gap-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    <CheckCircle2 size={13} style={{ color: "#D1FF26" }} className="flex-shrink-0" />
                    <p className="text-xs" style={{ color: "#F5F5F7" }}>Request completed. A summary has been saved to your service history.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                <ChevronRight size={24} style={{ color: "rgba(209,255,38,0.3)" }} />
                <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>SELECT A REQUEST</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}