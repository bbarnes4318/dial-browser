import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { GitCompare, X, Plus, Zap, Users, Phone, Clock, TrendingUp } from "lucide-react";
import { dialServices, getServiceStats } from "@/data/dialServices";

const METRICS = [
  { key: "avgDuration", label: "LATENCY", icon: Clock, unit: "s", lowerIsBetter: true, format: (v) => v },
  { key: "totalCalls", label: "TOTAL CALLS", icon: Phone, unit: "", lowerIsBetter: false, format: (v) => v.toLocaleString() },
  { key: "uniqueUsers", label: "UNIQUE USERS", icon: Users, unit: "", lowerIsBetter: false, format: (v) => v.toLocaleString() },
  { key: "successRate", label: "SUCCESS RATE", icon: Zap, unit: "%", lowerIsBetter: false, format: (v) => v },
  { key: "trendPercent", label: "TREND", icon: TrendingUp, unit: "%", lowerIsBetter: false, format: (v) => v },
];

function bestValue(metricKey, selectedStats) {
  const values = selectedStats.map((s) => s.stats[metricKey]);
  return Math.min(...values);
}

function isBest(metric, value, selectedStats) {
  const best = metric.lowerIsBetter
    ? Math.min(...selectedStats.map((s) => s.stats[metric.key]))
    : Math.max(...selectedStats.map((s) => s.stats[metric.key]));
  return value === best;
}

export default function ServiceComparisonTable({ currentService }) {
  const [selectedIds, setSelectedIds] = useState(() => [currentService.id]);
  const [showPicker, setShowPicker] = useState(false);

  const selectedStats = useMemo(() => {
    return selectedIds
      .map((sid) => {
        const svc = dialServices.find((s) => s.id === sid);
        if (!svc) return null;
        return { service: svc, stats: getServiceStats(sid) };
      })
      .filter(Boolean);
  }, [selectedIds]);

  const toggleService = (sid) => {
    if (sid === currentService.id) return; // always include current
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  const available = dialServices.filter((s) => !selectedIds.includes(s.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <GitCompare size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
            // COMPARE SERVICES
          </p>
        </div>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 px-3 py-2 transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
          style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}
        >
          <Plus size={12} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
            ADD SERVICE
          </span>
        </button>
      </div>

      <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
        Stack up services side-by-side by latency and popularity. Best values per metric are highlighted.
      </p>

      {/* Picker dropdown */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-5"
          >
            <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              {available.length === 0 ? (
                <p className="font-mono text-[10px] text-center py-3" style={{ color: "#8A8F98" }}>
                  All services added — remove one to swap.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {available.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      className="flex items-center gap-2 p-2.5 text-left transition-all hover:border-[rgba(209,255,38,0.4)]"
                      style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}
                    >
                      <span className="text-lg">{svc.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs truncate" style={{ color: "#F5F5F7" }}>{svc.name}</p>
                        <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{svc.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison table */}
      <div className="overflow-x-auto" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
        <table className="w-full" style={{ minWidth: selectedStats.length > 2 ? 600 : "100%" }}>
          {/* Header row — service names */}
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(138,143,152,0.15)" }}>
              <th className="p-4 text-left font-mono text-[9px] tracking-widest align-bottom" style={{ color: "#8A8F98", minWidth: 120 }}>
                METRIC
              </th>
              {selectedStats.map(({ service: svc }) => {
                const isCurrent = svc.id === currentService.id;
                return (
                  <th key={svc.id} className="p-4 text-left align-bottom">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/directory/${svc.id}`} className="flex items-center gap-2 group min-w-0">
                        <span className="text-2xl flex-shrink-0">{svc.icon}</span>
                        <div className="min-w-0">
                          <p className="font-heading font-bold text-sm truncate group-hover:text-[#D1FF26] transition-colors" style={{ color: isCurrent ? "#D1FF26" : "#F5F5F7" }}>
                            {svc.name}
                          </p>
                          <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{svc.category}</p>
                        </div>
                      </Link>
                      {!isCurrent && (
                        <button
                          onClick={() => toggleService(svc.id)}
                          className="p-1 flex-shrink-0 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                        >
                          <X size={12} style={{ color: "#8A8F98" }} />
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => {
              const Icon = metric.icon;
              return (
                <tr key={metric.key} style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Icon size={12} style={{ color: "#8A8F98" }} />
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                        {metric.label}
                      </span>
                    </div>
                  </td>
                  {selectedStats.map(({ service: svc, stats }) => {
                    const value = stats[metric.key];
                    const best = isBest(metric, value, selectedStats);
                    return (
                      <td key={svc.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-heading font-black text-lg"
                            style={{ color: best ? "#D1FF26" : "#F5F5F7" }}
                          >
                            {metric.format(value)}{metric.unit}
                          </span>
                          {best && (
                            <span
                              className="font-mono text-[8px] tracking-widest px-1.5 py-0.5"
                              style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26" }}
                            >
                              BEST
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Latency rank row */}
            <tr>
              <td className="p-4">
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LATENCY RANK</span>
              </td>
              {selectedStats.map(({ service: svc, stats }) => {
                const sorted = [...selectedStats].sort((a, b) => a.stats.avgDuration - b.stats.avgDuration);
                const rank = sorted.findIndex((s) => s.service.id === svc.id) + 1;
                return (
                  <td key={svc.id} className="p-4">
                    <span
                      className="font-heading font-black text-lg"
                      style={{ color: rank === 1 ? "#D1FF26" : "#8A8F98" }}
                    >
                      #{rank}
                    </span>
                    <span className="font-mono text-[9px] ml-1" style={{ color: "#8A8F98" }}>of {selectedStats.length}</span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}