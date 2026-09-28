import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity } from "lucide-react";

const dailyRevenue = [
  { day: "Mon", revenue: 142.50, plays: 11875 },
  { day: "Tue", revenue: 189.00, plays: 15750 },
  { day: "Wed", revenue: 134.25, plays: 11188 },
  { day: "Thu", revenue: 227.75, plays: 18979 },
  { day: "Fri", revenue: 265.40, plays: 22117 },
  { day: "Sat", revenue: 234.00, plays: 19500 },
  { day: "Sun", revenue: 200.50, plays: 16708 },
];

const fmtMoney = (n) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="px-3 py-2" style={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.4)" }}>
      <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>{label}</p>
      <p className="font-mono text-[11px] font-bold" style={{ color: "#D1FF26" }}>{fmtMoney(payload[0].value)}</p>
      <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{payload[0].payload.plays.toLocaleString()} plays</p>
    </div>
  );
};

export default function RevenueChart() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const total = dailyRevenue.reduce((a, d) => a + d.revenue, 0);
  const peak = Math.max(...dailyRevenue.map((d) => d.revenue));
  const peakDay = dailyRevenue.find((d) => d.revenue === peak).day;
  const today = dailyRevenue[dailyRevenue.length - 1];
  const yesterday = dailyRevenue[dailyRevenue.length - 2];
  const delta = ((today.revenue - yesterday.revenue) / yesterday.revenue) * 100;
  const isUp = delta >= 0;

  return (
    <div ref={sectionRef} className="relative overflow-hidden p-5 mb-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Signal line top */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DAILY REVENUE TREND</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1" style={{ background: isUp ? "rgba(209,255,38,0.12)" : "rgba(255,100,100,0.12)" }}>
          <TrendingUp size={11} style={{ color: isUp ? "#D1FF26" : "#FF6464" }} className={isUp ? "" : "rotate-180"} />
          <span className="font-mono text-[9px] font-bold" style={{ color: isUp ? "#D1FF26" : "#FF6464" }}>
            {isUp ? "+" : ""}{delta.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: "#8A8F98" }}>7-DAY TOTAL</p>
          <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{fmtMoney(total)}</p>
        </div>
        <div>
          <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: "#8A8F98" }}>AVG / DAY</p>
          <p className="font-heading font-bold text-xl" style={{ color: "#D1FF26" }}>{fmtMoney(total / dailyRevenue.length)}</p>
        </div>
        <div>
          <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: "#8A8F98" }}>PEAK · {peakDay}</p>
          <p className="font-heading font-bold text-xl" style={{ color: "#F5F5F7" }}>{fmtMoney(peak)}</p>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        style={{ height: 180 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyRevenue} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="phosphorGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D1FF26" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#D1FF26" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "JetBrains Mono" }}
              axisLine={{ stroke: "rgba(209,255,38,0.1)" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#D1FF26", strokeWidth: 1, strokeDasharray: "3 3" }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#D1FF26"
              strokeWidth={2}
              fill="url(#phosphorGlow)"
              dot={{ fill: "#D1FF26", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#D1FF26", stroke: "#05070A", strokeWidth: 2 }}
              style={{ filter: "drop-shadow(0 0 6px rgba(209,255,38,0.5))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}