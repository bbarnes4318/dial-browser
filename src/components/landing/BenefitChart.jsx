import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { BarChart3, Radar } from "lucide-react";

const categoryColors = {
  "Media & Streaming": "#D1FF26",
  "E-commerce & Streaming": "#D1FF26",
  Social: "#5A8FE0",
  "Industry Vertical": "#F5A623",
  Entertainment: "#A855F7",
  Sports: "#D1FF26",
  Finance: "#F5A623",
  Technology: "#5A8FE0",
};

// Benefit keywords → scoring dimensions for the radar
const benefitDimensions = [
  { key: "Discovery", regex: /discover|search|find|visibility|acquisition/i, color: "#D1FF26" },
  { key: "Engagement", regex: /engagement|fan|conversation|interact|listening/i, color: "#5A8FE0" },
  { key: "Commerce", regex: /purchas|shop|ticket|merchandise|sale|payment|order/i, color: "#F5A623" },
  { key: "Inclusion", regex: /inclusion|accessibility|feature-phone|literacy|alternative|without smartphone/i, color: "#A855F7" },
  { key: "Promotion", regex: /promot|advertis|marketing|reach|broadcast/i, color: "#D1FF26" },
  { key: "Support", regex: /support|service|assist|tracking|customer|fraud|recall/i, color: "#5A8FE0" },
];

function scoreBenefit(benefit) {
  return benefitDimensions.map((dim) => {
    const matches = benefit.match(new RegExp(dim.regex.source, "gi"));
    return { dimension: dim.key, value: matches ? matches.length : 0, color: dim.color };
  });
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 font-mono text-[10px] tracking-wider" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}>
      <p className="font-bold mb-0.5" style={{ color: "#D1FF26" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: "#F5F5F7" }}>{p.dataKey}: {p.value}</p>
      ))}
    </div>
  );
}

export default function BenefitChart({ industries }) {
  const [view, setView] = useState("bar");
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Bar chart: count of industries per category
  const categoryData = Object.entries(
    industries.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([category, count]) => ({ category, Industries: count, color: categoryColors[category] || "#D1FF26" }))
    .sort((a, b) => b.Industries - a.Industries);

  // Radar data: aggregate benefit dimension scores across all industries
  const radarData = benefitDimensions.map((dim) => {
    const total = industries.reduce((sum, i) => {
      const m = i.benefit.match(new RegExp(dim.regex.source, "gi"));
      return sum + (m ? m.length : 0);
    }, 0);
    return { dimension: dim.key, Score: total, fill: dim.color };
  });
  const maxScore = Math.max(...radarData.map((d) => d.Score), 1);

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="mb-10 p-6 lg:p-8"
      style={{
        background: "rgba(16,20,29,0.5)",
        border: "0.5px solid rgba(209,255,38,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.3em]" style={{ color: "#D1FF26" }}>
            // BENEFIT DISTRIBUTION
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setView("bar")}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{
              background: view === "bar" ? "rgba(209,255,38,0.12)" : "transparent",
              border: `0.5px solid ${view === "bar" ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.12)"}`,
              color: view === "bar" ? "#D1FF26" : "#8A8F98",
            }}
          >
            <BarChart3 size={12} /> By Category
          </button>
          <button
            onClick={() => setView("radar")}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{
              background: view === "radar" ? "rgba(209,255,38,0.12)" : "transparent",
              border: `0.5px solid ${view === "radar" ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.12)"}`,
              color: view === "radar" ? "#D1FF26" : "#8A8F98",
            }}
          >
            <Radar size={12} /> By Benefit Type
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          {view === "bar" ? (
            <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
              <XAxis
                type="number"
                tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={{ stroke: "rgba(138,143,152,0.15)" }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={130}
                tick={{ fill: "#F5F5F7", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={{ stroke: "rgba(138,143,152,0.15)" }}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(209,255,38,0.05)" }} />
              <Bar dataKey="Industries" radius={[0, 2, 2, 0]} barSize={18}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <RadialBarChart
              data={radarData}
              innerRadius="20%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <PolarAngleAxis
                type="category"
                dataKey="dimension"
                tick={{ fill: "#F5F5F7", fontSize: 10, fontFamily: "JetBrains Mono" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(209,255,38,0.05)" }} />
              <RadialBar dataKey="Score" background={{ fill: "rgba(138,143,152,0.05)" }} cornerRadius={3} />
            </RadialBarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend / footer */}
      <div className="mt-4 pt-4 flex flex-wrap items-center gap-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
          {view === "bar"
            ? `▸ ${categoryData.length} CATEGORIES · ${industries.length} TOTAL INDUSTRIES`
            : `▸ BENEFIT KEYWORDS ANALYZED ACROSS ${industries.length} INDUSTRIES`}
        </p>
      </div>
    </motion.div>
  );
}