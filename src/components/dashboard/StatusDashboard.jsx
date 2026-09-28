import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Phone, Mail, TrendingUp, Loader2, Zap, Clock,
  CheckCircle2, AlertCircle, Activity, Calendar,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const PLAN_LABELS = {
  free: { label: "Free", color: "#8A8F98", credits: 50 },
  plus: { label: "Plus", color: "#D1FF26", credits: 200 },
  elite: { label: "Elite", color: "#D1FF26", credits: 500 },
  ultimate: { label: "Ultimate", color: "#D1FF26", credits: 1000 },
};

const SUB_STATUS_STYLES = {
  active: { color: "#D1FF26", label: "ACTIVE" },
  pending: { color: "#8A8F98", label: "PENDING" },
  canceled: { color: "#ef4444", label: "CANCELED" },
  expired: { color: "#ef4444", label: "EXPIRED" },
};

export default function StatusDashboard() {
  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState(null);
  const [callsThisMonth, setCallsThisMonth] = useState(0);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [credits, interactions] = await Promise.all([
        base44.entities.CallCredit.list("-created_date", 10).catch(() => []),
        base44.entities.VoiceInteraction.list("-created_date", 200).catch(() => []),
      ]);

      const myCredit = (credits || [])[0] || null;
      setCreditData(myCredit);

      // Count calls this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthCalls = (interactions || []).filter(
        (i) => i.created_date && new Date(i.created_date) >= monthStart
      ).length;
      setCallsThisMonth(monthCalls);
    } catch {
      setError("Could not load account status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh every 60 seconds for real-time metrics
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
        <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>LOADING ACCOUNT STATUS…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center" style={{ background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
        <AlertCircle size={24} className="mx-auto mb-2" style={{ color: "#ef4444" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>{error}</p>
        <button onClick={loadData} className="mt-3 px-3 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
          Retry
        </button>
      </div>
    );
  }

  const planTier = creditData?.plan_tier || "free";
  const planInfo = PLAN_LABELS[planTier] || PLAN_LABELS.free;
  const totalCredits = (creditData?.total_credits || planInfo.credits) + (creditData?.bonus_credits || 0);
  const usedCredits = creditData?.used_credits || callsThisMonth;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);
  const usagePercent = totalCredits > 0 ? Math.min(100, (usedCredits / totalCredits) * 100) : 0;

  const cycleEnd = creditData?.billing_cycle_end;
  const daysUntilReset = cycleEnd ? Math.max(0, Math.ceil((new Date(cycleEnd) - new Date()) / 86400000)) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-2 mb-5">
        <Activity size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ACCOUNT STATUS</p>
        <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#D1FF26" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#D1FF26" }} /> LIVE
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Subscription Level Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.05 }}
          className="p-5"
          style={{ background: "#10141D", border: `0.5px solid rgba(209,255,38,0.3)` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SUBSCRIPTION</p>
            </div>
            <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: planInfo.color }}>
              {planInfo.label.toUpperCase()}
            </span>
          </div>
          <p className="font-heading font-black text-2xl mb-1" style={{ color: "#F5F5F7" }}>
            1 Call <span style={{ color: "#D1FF26" }}>{planInfo.label}</span>
          </p>
          <p className="font-mono text-[9px] mb-3" style={{ color: "#8A8F98" }}>
            {planTier === "free" ? "Upgrade for more credits & features" : "Premium plan active"}
          </p>
          {daysUntilReset != null && (
            <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Calendar size={10} style={{ color: "#8A8F98" }} />
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>Credits reset in {daysUntilReset} days</span>
            </div>
          )}
        </motion.div>

        {/* Call Credits Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="p-5"
          style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CALL CREDITS</p>
            </div>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <p className="font-heading font-black text-3xl" style={{ color: remainingCredits < 10 ? "#ef4444" : "#D1FF26" }}>
              {remainingCredits}
            </p>
            <p className="font-mono text-[10px] mb-1" style={{ color: "#8A8F98" }}>/ {totalCredits} remaining</p>
          </div>
          {/* Usage bar */}
          <div className="h-2 mb-2 overflow-hidden" style={{ background: "rgba(16,20,29,0.8)" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }} transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full"
              style={{ background: usagePercent > 80 ? "#ef4444" : "#D1FF26" }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[8px]" style={{ color: "#8A8F98" }}>
            <span>{usedCredits} used</span>
            <span>{Math.round(usagePercent)}%</span>
          </div>
        </motion.div>

      </div>

      {/* Real-time usage metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-4 p-5"
        style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// REAL-TIME USAGE METRICS</p>
          </div>
          <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
            <Clock size={9} /> Updated {new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true })} EST
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>CALLS THIS MONTH</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{callsThisMonth}</p>
          </div>
          <div>
            <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>CREDITS USED</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{usedCredits}</p>
          </div>
          <div>
            <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>CREDITS REMAINING</p>
            <p className="font-heading font-black text-2xl" style={{ color: remainingCredits < 10 ? "#ef4444" : "#D1FF26" }}>{remainingCredits}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}