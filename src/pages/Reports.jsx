import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home, Loader2, Phone, Zap, CreditCard, Activity, TrendingUp,
  Clock, Mail, CalendarClock, Mic, AlertCircle, BarChart3, ChevronRight,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatRelativeEST } from "@/lib/timeFormat";

const EST_TZ = "America/New_York";

const PLAN_LABELS = {
  free: { label: "Free", color: "#8A8F98", credits: 50 },
  plus: { label: "Plus", color: "#D1FF26", credits: 200 },
  elite: { label: "Elite", color: "#D1FF26", credits: 500 },
  ultimate: { label: "Ultimate", color: "#D1FF26", credits: 1000 },
};

const SUB_STYLES = {
  active: { color: "#D1FF26", label: "ACTIVE" },
  pending: { color: "#8A8F98", label: "PENDING" },
  canceled: { color: "#ef4444", label: "CANCELED" },
  expired: { color: "#ef4444", label: "EXPIRED" },
};

export default function Reports() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [calls, setCalls] = useState([]);
  const [credit, setCredit] = useState(null);
  const [smsSubs, setSmsSubs] = useState([]);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [ints, incCalls, credits, smsList] = await Promise.all([
        base44.entities.VoiceInteraction.list("-created_date", 200).catch(() => []),
        base44.entities.IncomingCall.list("-created_date", 100).catch(() => []),
        base44.entities.CallCredit.list("-created_date", 5).catch(() => []),
        base44.entities.SmsCalendarSubscription.list("-created_date", 10).catch(() => []),
      ]);
      setInteractions(ints || []);
      setCalls(incCalls || []);
      setCredit((credits || [])[0] || null);
      setSmsSubs(smsList || []);
    } catch {
      setError("Could not load report data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // --- Derived metrics (EST-based month boundaries) ---
  const now = new Date();
  const estParts = new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TZ, year: "numeric", month: "numeric",
  }).formatToParts(now);
  const estYear = parseInt(estParts.find((p) => p.type === "year").value);
  const estMonth = parseInt(estParts.find((p) => p.type === "month").value) - 1;
  const monthStart = new Date(estYear, estMonth, 1);
  const callsThisMonth = interactions.filter(
    (i) => i.created_date && new Date(i.created_date) >= monthStart
  ).length;

  // Build last 6 months of interaction counts (EST calendar months)
  const monthlyData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(estYear, estMonth - i, 1);
      const label = d.toLocaleString("en-US", { month: "short", timeZone: EST_TZ });
      const count = interactions.filter((it) => {
        if (!it.created_date) return false;
        const id = new Date(it.created_date);
        const idParts = new Intl.DateTimeFormat("en-US", {
          timeZone: EST_TZ, year: "numeric", month: "numeric",
        }).formatToParts(id);
        const idYear = parseInt(idParts.find((p) => p.type === "year").value);
        const idMonth = parseInt(idParts.find((p) => p.type === "month").value) - 1;
        return idYear === d.getFullYear() && idMonth === d.getMonth();
      }).length;
      months.push({ month: label, calls: count });
    }
    return months;
  })();

  const planTier = credit?.plan_tier || "free";
  const planInfo = PLAN_LABELS[planTier] || PLAN_LABELS.free;
  const totalCredits = (credit?.total_credits || planInfo.credits) + (credit?.bonus_credits || 0);
  const usedCredits = credit?.used_credits || callsThisMonth;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);
  const usagePercent = totalCredits > 0 ? Math.min(100, (usedCredits / totalCredits) * 100) : 0;

  const activeSubs = [
    ...smsSubs.map((s) => ({
      type: "SMS Calendar",
      name: s.owner_name || "SMS Scheduler",
      status: s.subscription_active ? "active" : "pending",
      plan: s.plan || "monthly",
      detail: `${s.messages_sent_this_cycle || 0} messages sent this cycle`,
    })),
  ];

  const answeredCalls = calls.filter((c) => c.status === "answered").length;
  const missedCalls = calls.filter((c) => c.status === "missed").length;
  const recentInteractions = interactions.slice(0, 8);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between"
        style={{
          background: "rgba(5,7,10,0.9)",
          borderBottom: "0.5px solid rgba(209,255,38,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
            style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
          >
            <Home size={12} /> Home
          </Link>
          <div className="hidden sm:block">
            <p className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>
              1 CALL <span style={{ color: "#D1FF26" }}>REPORTS</span>
            </p>
          </div>
        </div>
        {user && (
          <span className="hidden sm:block font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
            {user.email}
          </span>
        )}
      </header>

      <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-3" style={{ color: "#D1FF26" }}>
            // PLATFORM GROWTH REPORT
          </p>
          <h1
            className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-2"
            style={{ color: "#F5F5F7" }}
          >
            Your Growth <span style={{ color: "#D1FF26" }}>Dashboard.</span>
          </h1>
          <p className="text-sm lg:text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            A snapshot of your call usage, active subscriptions, and recent interactions — all in one place.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : error ? (
          <div
            className="p-6 text-center"
            style={{ background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.2)" }}
          >
            <AlertCircle size={24} className="mx-auto mb-2" style={{ color: "#ef4444" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>{error}</p>
            <button
              onClick={loadAll}
              className="mt-3 px-3 py-2 font-mono text-[9px] tracking-widest uppercase"
              style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Phone}
                label="CALLS THIS MONTH"
                value={callsThisMonth}
                delay={0.05}
              />
              <StatCard
                icon={Zap}
                label="CREDITS REMAINING"
                value={remainingCredits}
                subValue={`/ ${totalCredits} total`}
                delay={0.1}
                valueColor={remainingCredits < 10 ? "#ef4444" : "#D1FF26"}
              />
              <StatCard
                icon={CreditCard}
                label="ACTIVE SUBSCRIPTIONS"
                value={activeSubs.filter((s) => s.status === "active").length}
                subValue={`${activeSubs.length} total`}
                delay={0.15}
              />
              <StatCard
                icon={Activity}
                label="TOTAL INTERACTIONS"
                value={interactions.length}
                delay={0.2}
              />
            </div>

            {/* Call usage section */}
            <SectionCard
              icon={BarChart3}
              title="CALL USAGE"
              subtitle="Interactions over the last 6 months"
              delay={0.25}
            >
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,143,152,0.1)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={{ stroke: "rgba(138,143,152,0.2)" }}
                    />
                    <YAxis
                      tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={{ stroke: "rgba(138,143,152,0.2)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(209,255,38,0.06)" }}
                      contentStyle={{
                        background: "#10141D",
                        border: "0.5px solid rgba(209,255,38,0.3)",
                        fontSize: 12,
                        fontFamily: "monospace",
                      }}
                      labelStyle={{ color: "#D1FF26" }}
                    />
                    <Bar dataKey="calls" fill="#D1FF26" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Usage breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <MiniStat label="ANSWERED" value={answeredCalls} icon={Phone} />
                <MiniStat label="MISSED" value={missedCalls} icon={Clock} />
                <MiniStat label="CREDITS USED" value={usedCredits} icon={Zap} />
                <MiniStat label="USAGE %" value={`${Math.round(usagePercent)}%`} icon={TrendingUp} />
              </div>

              {/* Credit usage bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                    CREDIT USAGE — {planInfo.label.toUpperCase()} PLAN
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>
                    {usedCredits} / {totalCredits}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden" style={{ background: "rgba(16,20,29,0.8)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercent}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full"
                    style={{ background: usagePercent > 80 ? "#ef4444" : "#D1FF26" }}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Active subscriptions */}
            <SectionCard
              icon={CreditCard}
              title="ACTIVE SUBSCRIPTIONS"
              subtitle="Your premium service subscriptions"
              delay={0.3}
            >
              {activeSubs.length === 0 ? (
                <EmptyState icon={CreditCard} message="No subscriptions yet" hint="Upgrade from your profile to unlock premium services." />
              ) : (
                <div className="space-y-3">
                  {activeSubs.map((sub, i) => {
                    const status = SUB_STYLES[sub.status] || SUB_STYLES.pending;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.05 }}
                        className="p-4 flex items-center gap-3"
                        style={{
                          background: "#10141D",
                          border: `0.5px solid ${sub.status === "active" ? "rgba(209,255,38,0.25)" : "rgba(138,143,152,0.12)"}`,
                        }}
                      >
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: 40, height: 40,
                            background: "rgba(209,255,38,0.08)",
                            border: "0.5px solid rgba(209,255,38,0.25)",
                          }}
                        >
                          <CalendarClock size={16} style={{ color: "#D1FF26" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>
                            {sub.type}
                          </p>
                          <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>
                            {sub.name} · {sub.detail}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#8A8F98" }}>
                            {sub.plan.toUpperCase()}
                          </span>
                          <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Recent interactions */}
            <SectionCard
              icon={Mic}
              title="RECENT INTERACTIONS"
              subtitle="Your latest voice interactions and consultations"
              delay={0.35}
            >
              {recentInteractions.length === 0 ? (
                <EmptyState icon={Mic} message="No interactions yet" hint="Use the Dial Browser or record a voice note to get started." />
              ) : (
                <div className="space-y-2">
                  {recentInteractions.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.04 }}
                      className="p-3 flex items-start gap-3"
                      style={{
                        background: "#10141D",
                        border: "0.5px solid rgba(209,255,38,0.12)",
                      }}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          width: 32, height: 32,
                          background: "rgba(209,255,38,0.06)",
                          border: "0.5px solid rgba(209,255,38,0.2)",
                        }}
                      >
                        <Mic size={13} style={{ color: "#D1FF26" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#F5F5F7" }}>
                          {item.title || "Untitled interaction"}
                        </p>
                        {item.transcript && (
                          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "#8A8F98" }}>
                            {item.transcript}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                            {formatRelativeEST(item.created_date)}
                          </span>
                          {item.source && (
                            <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                              {item.source.replace("_", " ").toUpperCase()}
                            </span>
                          )}
                          {(item.tags || []).slice(0, 2).map((tag) => (
                            <span key={tag} className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(138,143,152,0.08)", color: "#8A8F98" }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={14} className="flex-shrink-0 mt-1" style={{ color: "#8A8F98" }} />
                    </motion.div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, delay = 0, valueColor = "#F5F5F7" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="p-5"
      style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
      </div>
      <p className="font-heading font-black text-3xl" style={{ color: valueColor }}>{value}</p>
      {subValue && <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>{subValue}</p>}
    </motion.div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="mb-6 p-5 lg:p-6"
      style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// {title}</p>
      </div>
      {subtitle && <p className="font-mono text-[9px] mb-5" style={{ color: "#8A8F98" }}>{subtitle}</p>}
      {children}
    </motion.div>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={10} style={{ color: "#8A8F98" }} />
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
      </div>
      <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div className="py-10 text-center">
      <Icon size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
      <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>{message}</p>
      <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>{hint}</p>
    </div>
  );
}