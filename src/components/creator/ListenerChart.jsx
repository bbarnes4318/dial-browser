import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

const formatOffset = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export default function ListenerChart({ snapshots, peakOffset, peakCount }) {
  let data = [];
  try {
    data = JSON.parse(snapshots || "[]");
  } catch {
    data = [];
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: "260px" }}>
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO LISTENER DATA FOR THIS SESSION</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ offset: d.offset, listeners: d.count }));
  const peakData = peakOffset ? [{ offset: peakOffset, listeners: peakCount }] : [];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="listenerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D1FF26" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#D1FF26" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="offset"
          tickFormatter={formatOffset}
          tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "JetBrains Mono" }}
          axisLine={{ stroke: "rgba(138,143,152,0.15)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip
          contentStyle={{
            background: "#10141D",
            border: "0.5px solid rgba(209,255,38,0.3)",
            borderRadius: 0,
            fontSize: 11,
            fontFamily: "JetBrains Mono",
          }}
          labelStyle={{ color: "#8A8F98" }}
          labelFormatter={formatOffset}
          formatter={(v) => [`${v} listeners`, ""]}
        />
        <Area
          type="monotone"
          dataKey="listeners"
          stroke="#D1FF26"
          strokeWidth={2}
          fill="url(#listenerGrad)"
        />
        {peakOffset && peakCount && (
          <ReferenceDot
            x={peakOffset}
            y={peakCount}
            r={5}
            fill="#D1FF26"
            stroke="#05070A"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}