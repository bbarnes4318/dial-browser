import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Loader2, Activity } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { base44 } from "@/api/base44Client";

export default function VoiceServicePopularityChart() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke("getVoiceCommandStats", {});
        setStats(res.data);
      } catch {
        setStats(null);
      }
      setLoading(false);
    };
    load();
  }, []);

  const chartData = (stats?.top_categories || []).map((c) => ({
    name: c.category?.length > 10 ? c.category.substring(0, 10) + "…" : c.category,
    fullName: c.category,
    count: c.count,
  }));

  const maxCount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.count)) : 0;

  return (
    <div className="relative p-5 lg:p-6 overflow-hidden" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div style={{ animation: "phosphorPulse 2.5s ease-in-out infinite" }}>
            <BarChart3 size={16} style={{ color: "#D1FF26" }} />
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE SERVICE POPULARITY</p>
        </div>
        {stats && (
          <span className="font-mono text-[9px] tracking-widest flex items-center gap-1 px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <Activity size={9} /> {stats.total_commands} TOTAL
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : !chartData || chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp size={32} style={{ color: "rgba(209,255,38,0.2)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO VOICE DATA YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Voice commands will appear here as members use the Dial Browser</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "rgba(138,143,152,0.15)" }}
                tickLine={false}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "rgba(138,143,152,0.15)" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(209,255,38,0.05)" }}
                contentStyle={{
                  background: "#0A0D14",
                  border: "0.5px solid rgba(209,255,38,0.3)",
                  borderRadius: "0px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
                labelStyle={{ color: "#D1FF26" }}
                itemStyle={{ color: "#F5F5F7" }}
                formatter={(value) => [`${value} commands`, "Count"]}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => {
                  const ratio = maxCount > 0 ? entry.count / maxCount : 0;
                  const opacity = 0.4 + ratio * 0.6;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill="#D1FF26"
                      fillOpacity={opacity}
                      style={{ filter: ratio > 0.7 ? "drop-shadow(0 0 6px rgba(209,255,38,0.4))" : "none" }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {chartData.slice(0, 5).map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>#{i + 1}</span>
              <span className="text-[10px] font-semibold" style={{ color: "#F5F5F7" }}>{d.fullName}</span>
              <span className="font-mono text-[9px] font-bold" style={{ color: "#D1FF26" }}>{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}