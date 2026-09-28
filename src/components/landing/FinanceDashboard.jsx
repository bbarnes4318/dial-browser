import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { DollarSign, TrendingUp, Loader2, PieChart, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() };
}

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [totals, setTotals] = useState({ shares: 0, fees: 0, combined: 0 });

  useEffect(() => {
    const load = async () => {
      const monthMap = {};

      const addRevenue = (dateStr, sharesAmount, feeAmount) => {
        const mk = getMonthKey(dateStr);
        if (!mk) return;
        const key = `${mk.year}-${mk.month}`;
        if (!monthMap[key]) {
          monthMap[key] = { year: mk.year, month: mk.month, shares: 0, fees: 0 };
        }
        monthMap[key].shares += sharesAmount || 0;
        monthMap[key].fees += feeAmount || 0;
      };

      let sharesTotal = 0;
      let feesTotal = 0;

      try {
        const shows = await base44.entities.ShowShare.list("-created_date", 200);
        (shows || []).forEach((s) => {
          const revenue = (s.shares_sold || 0) * (s.price_per_share || 0);
          if (revenue > 0) {
            addRevenue(s.created_date, revenue, 0);
            sharesTotal += revenue;
          }
        });
      } catch { /* ShowShare not available */ }

      try {
        const access = await base44.entities.EmployerAccess.list("-created_date", 200);
        (access || []).forEach((a) => {
          if (a.access_granted) {
            const fee = a.price_paid || 9.99;
            addRevenue(a.created_date, 0, fee);
            feesTotal += fee;
          }
        });
      } catch { /* EmployerAccess not available */ }

      // Build last 6 months of data including current month
      const now = new Date();
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const entry = monthMap[key] || { year: d.getFullYear(), month: d.getMonth(), shares: 0, fees: 0 };
        data.push({
          name: MONTHS[d.getMonth()],
          "Show Shares": Math.round(entry.shares * 100) / 100,
          "Service Fees": Math.round(entry.fees * 100) / 100,
        });
      }

      setMonthlyData(data);
      setTotals({
        shares: Math.round(sharesTotal * 100) / 100,
        fees: Math.round(feesTotal * 100) / 100,
        combined: Math.round((sharesTotal + feesTotal) * 100) / 100,
      });
      setLoading(false);
    };
    load();
  }, []);

  return (
    <section id="finance" className="snap-section relative py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, threshold: 0.15 }} transition={{ duration: 0.7 }} className="mb-8 lg:mb-10">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// FINANCE DASHBOARD — REVENUE OVERVIEW</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Platform <span style={{ color: "#D1FF26" }}>Revenue.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Live aggregation of show share sales and service fee revenue across the 1 Call Away network.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <SummaryCard icon={PieChart} label="Show Share Revenue" value={totals.shares} accent />
              <SummaryCard icon={BarChart3} label="Service Fee Revenue" value={totals.fees} />
              <SummaryCard icon={TrendingUp} label="Total Combined" value={totals.combined} highlight />
            </div>

            {/* Monthly chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, threshold: 0.15 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6 lg:p-8"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}
            >
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>MONTHLY REVENUE BREAKDOWN</p>
                </div>
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>LAST 6 MONTHS</span>
              </div>

              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,143,152,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(138,143,152,0.2)" }} tickLine={false} />
                    <YAxis tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      cursor={{ fill: "rgba(209,255,38,0.05)" }}
                      contentStyle={{
                        background: "rgba(5,7,10,0.95)",
                        border: "0.5px solid rgba(209,255,38,0.3)",
                        borderRadius: 0,
                        fontSize: 11,
                        fontFamily: "monospace",
                      }}
                      labelStyle={{ color: "#D1FF26" }}
                      tickFormatter={(v) => `$${v.toFixed(2)}`}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace", color: "#8A8F98" }} />
                    <Bar dataKey="Show Shares" fill="#D1FF26" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Service Fees" fill="rgba(209,255,38,0.4)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend note */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3" style={{ background: "#D1FF26" }} />
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SHOW SHARE SALES</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3" style={{ background: "rgba(209,255,38,0.4)" }} />
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SERVICE FEES (EMPLOYER ACCESS)</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ icon: Icon, label, value, accent, highlight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, threshold: 0.15 }}
      transition={{ duration: 0.5 }}
      className="p-5"
      style={{
        background: highlight ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.6)",
        border: `0.5px solid ${highlight ? "rgba(209,255,38,0.4)" : accent ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.12)"}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{label.toUpperCase()}</p>
      </div>
      <p className="font-heading font-black text-2xl lg:text-3xl" style={{ color: highlight ? "#D1FF26" : "#F5F5F7" }}>
        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </motion.div>
  );
}