import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart3, PieChart as PieIcon, TrendingUp, ShoppingCart, Receipt, Stethoscope,
  Smile, Home, Loader2, AlertCircle, ArrowLeft, Activity, Calendar,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";

const EST_TZ = "America/New_York";

const SERVICE_COLORS = {
  medical: "#22D3EE",
};

const SERVICE_LABELS = {
  medical: "Medical",
};

export default function MonthlyUsageReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setError(null);
    try {
      const servicesRes = await base44.entities.ServiceRequest.list("-created_date", 200).catch(() => []);
      setServiceRequests(servicesRes || []);
    } catch {
      setError("Could not load usage data.");
    } finally {
      setLoading(false);
    }
  };

  // --- Monthly data for last 6 months (EST-based) ---
  const now = new Date();
  const estParts = new Intl.DateTimeFormat("en-US", {
    timeZone: EST_TZ, year: "numeric", month: "numeric",
  }).formatToParts(now);
  const estYear = parseInt(estParts.find((p) => p.type === "year").value);
  const estMonth = parseInt(estParts.find((p) => p.type === "month").value) - 1;
  const monthStart = new Date(estYear, estMonth, 1);

  const monthlyData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(estYear, estMonth - i, 1);
      const label = d.toLocaleString("en-US", { month: "short", timeZone: EST_TZ });
      const inMonth = (dateStr) => {
        if (!dateStr) return false;
        const id = new Date(dateStr);
        const idParts = new Intl.DateTimeFormat("en-US", {
          timeZone: EST_TZ, year: "numeric", month: "numeric",
        }).formatToParts(id);
        const idYear = parseInt(idParts.find((p) => p.type === "year").value);
        const idMonth = parseInt(idParts.find((p) => p.type === "month").value) - 1;
        return idYear === d.getFullYear() && idMonth === d.getMonth();
      };
      const sCount = serviceRequests.filter((r) => inMonth(r.created_date)).length;
      months.push({
        month: label,
        services: sCount,
        total: sCount,
      });
    }
    return months;
  })();

  // --- This month stats ---
  const thisMonth = monthlyData[monthlyData.length - 1] || { services: 0, total: 0 };

  // --- Service request breakdown by type ---
  const serviceBreakdown = (() => {
    const counts = { medical: 0 };
    serviceRequests.forEach((r) => {
      if (counts[r.service_type] !== undefined) counts[r.service_type]++;
    });
    return [
      { name: "Medical", value: counts.medical, key: "medical" },
    ].filter((d) => d.value > 0);
  })();

  const currentMonthName = now.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: EST_TZ });

  return (
    <div className="min-h-screen py-20 px-6 lg:px-16" style={{ background: "#05070A" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <BarChart3 size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// MONTHLY USAGE REPORT</span>
          </div>
          <h1 className="font-heading font-black text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Your <span style={{ color: "#D1FF26" }}>{currentMonthName}</span> Activity
          </h1>
          <p className="text-base max-w-2xl" style={{ color: "#8A8F98" }}>
            Track service requests submitted — with a 6-month trend of your platform usage.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : error ? (
          <div className="p-6 text-center" style={{ background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={24} className="mx-auto mb-2" style={{ color: "#ef4444" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>{error}</p>
            <button onClick={loadAll} className="mt-3 px-3 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>Retry</button>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <StatCard icon={Stethoscope} label="SERVICE REQUESTS" value={thisMonth.services} subValue={`${serviceRequests.length} all-time`} delay={0.05} />
              <StatCard icon={Activity} label="TOTAL ACTIONS" value={thisMonth.total} subValue={`${serviceRequests.length} all-time`} delay={0.1} />
            </div>

            {/* Monthly bar chart */}
            <SectionCard icon={BarChart3} title="6-MONTH ACTIVITY" subtitle="Service requests over time" delay={0.25}>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,143,152,0.1)" />
                    <XAxis dataKey="month" tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(138,143,152,0.2)" }} />
                    <YAxis tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(138,143,152,0.2)" }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(209,255,38,0.06)" }}
                      contentStyle={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 12, fontFamily: "monospace" }}
                      labelStyle={{ color: "#D1FF26" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#8A8F98" }} />
                    <Bar dataKey="services" name="Service Requests" fill="#22D3EE" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Breakdown + Trend row */}
            <div className="grid lg:grid-cols-2 gap-4 mb-8">
              {/* Pie chart - breakdown by type */}
              <SectionCard icon={PieIcon} title="BREAKDOWN BY TYPE" subtitle="All-time service distribution" delay={0.3}>
                {serviceBreakdown.length === 0 ? (
                  <EmptyState icon={PieIcon} message="No data yet" hint="Use services to see your breakdown." />
                ) : (
                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={serviceBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {serviceBreakdown.map((entry) => (
                            <Cell key={entry.key} fill={SERVICE_COLORS[entry.key]} stroke="#05070A" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 12, fontFamily: "monospace" }}
                          labelStyle={{ color: "#D1FF26" }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#8A8F98" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>

              {/* Area chart - total trend */}
              <SectionCard icon={TrendingUp} title="TOTAL ACTIVITY TREND" subtitle="Cumulative monthly actions" delay={0.35}>
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D1FF26" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#D1FF26" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,143,152,0.1)" />
                      <XAxis dataKey="month" tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(138,143,152,0.2)" }} />
                      <YAxis tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(138,143,152,0.2)" }} allowDecimals={false} />
                      <Tooltip
                        cursor={{ stroke: "rgba(209,255,38,0.3)" }}
                        contentStyle={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 12, fontFamily: "monospace" }}
                        labelStyle={{ color: "#D1FF26" }}
                      />
                      <Area type="monotone" dataKey="total" name="Total Actions" stroke="#D1FF26" strokeWidth={2} fill="url(#limeGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            {/* This month detail breakdown */}
            <SectionCard icon={Calendar} title="THIS MONTH DETAIL" subtitle={currentMonthName} delay={0.4}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                {[
                    { label: "Medical", value: monthlyData[monthlyData.length - 1]?.services || 0, icon: Stethoscope, key: "medical" },
                 ].map((item) => {
                  const Icon = item.icon;
                  const color = SERVICE_COLORS[item.key];
                  return (
                    <div key={item.key} className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}25` }}>
                      <Icon size={14} style={{ color }} className="mb-2" />
                      <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{item.value}</p>
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{item.label.toUpperCase()}</p>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Link to full history */}
            <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
              <Link to="/history" className="inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>
                VIEW FULL HISTORY <ArrowLeft size={12} className="rotate-180" />
              </Link>
              <Link to="/" className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>← BACK TO HOME</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, delay = 0 }) {
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
      <p className="font-heading font-black text-3xl" style={{ color: "#D1FF26" }}>{value}</p>
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

function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div className="py-10 text-center">
      <Icon size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
      <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>{message}</p>
      <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>{hint}</p>
    </div>
  );
}