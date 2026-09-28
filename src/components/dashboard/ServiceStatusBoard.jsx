import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ClipboardList, BrainCircuit, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STAGES = [
  { key: "submitted", label: "Received", icon: ClipboardList, color: "#8A8F98" },
  { key: "ai_processing", label: "Processing", icon: BrainCircuit, color: "#D1FF26" },
  { key: "in_review", label: "In Review", icon: Eye, color: "#43C6AC" },
  { key: "action_needed", label: "Action Needed", icon: AlertTriangle, color: "#FF6B35" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "#10B981" },
];

export default function ServiceStatusBoard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadCounts = async () => {
    try {
      const requests = await base44.entities.ServiceRequest.filter({}, "-created_date", 200);
      const grouped = {};
      requests.forEach((r) => {
        const s = r.status || "submitted";
        grouped[s] = (grouped[s] || 0) + 1;
      });
      setCounts(grouped);
      setTotal(requests.length);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = (counts.submitted || 0) + (counts.ai_processing || 0) + (counts.in_review || 0);
  const actionCount = counts.action_needed || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden p-4 lg:p-5"
      style={{
        background: "linear-gradient(135deg, rgba(16,20,29,0.95), rgba(10,13,20,0.98))",
        border: "0.5px solid rgba(209,255,38,0.2)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Scanning line accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/3" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// LIVE SERVICE STATUS</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ACTIVE</span>
            <span className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{activeCount}</span>
          </div>
          {actionCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1" style={{ background: "rgba(255,107,53,0.1)", border: "0.5px solid rgba(255,107,53,0.3)" }}>
              <AlertTriangle size={11} style={{ color: "#FF6B35" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#FF6B35" }}>{actionCount} NEEDS ACTION</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>TOTAL</span>
            <span className="font-mono text-sm font-bold" style={{ color: "#F5F5F7" }}>{total}</span>
          </div>
        </div>
      </div>

      {/* Stage pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const count = counts[stage.key] || 0;
          const isActive = count > 0;
          return (
            <div
              key={stage.key}
              className="relative p-3 transition-all"
              style={{
                background: isActive ? `rgba(${hexToRgb(stage.color)},0.06)` : "rgba(5,7,10,0.4)",
                border: `0.5px solid ${isActive ? `rgba(${hexToRgb(stage.color)},0.35)` : "rgba(138,143,152,0.08)"}`,
                boxShadow: isActive ? `0 0 12px rgba(${hexToRgb(stage.color)},0.08)` : "none",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={14} style={{ color: isActive ? stage.color : "#3a3f48" }} />
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color, boxShadow: `0 0 6px ${stage.color}`, animation: "dotPulse 2s ease-in-out infinite" }} />
                )}
              </div>
              <p className="font-mono text-[8px] tracking-widest uppercase mb-1" style={{ color: "#8A8F98" }}>{stage.label}</p>
              <p className="font-heading font-black text-2xl" style={{ color: isActive ? stage.color : "#2a2f38" }}>
                {loading ? <Loader2 size={16} className="animate-spin inline" style={{ color: "#3a3f48" }} /> : count}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}