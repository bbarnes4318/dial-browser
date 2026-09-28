import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, PhoneIncoming, PhoneOutgoing, FileText } from "lucide-react";

export default function CallHistoryChart({ calls }) {
  const chartData = useMemo(() => {
    // Last 7 days
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" });
      const dayStart = new Date(d.toLocaleDateString("en-US", { timeZone: "America/New_York" }));
      const dayCalls = calls.filter((c) => {
        if (!c.timestamp) return false;
        const callDate = new Date(c.timestamp);
        return callDate.toLocaleDateString("en-US", { timeZone: "America/New_York" }) === d.toLocaleDateString("en-US", { timeZone: "America/New_York" });
      });
      days.push({
        day: dateStr,
        calls: dayCalls.length,
        duration: Math.round(dayCalls.reduce((s, c) => s + (c.duration_sec || 0), 0) / 60 * 10) / 10,
      });
    }
    return days;
  }, [calls]);

  const statusData = useMemo(() => {
    const answered = calls.filter((c) => ["answered", "completed", "ringing"].includes(c.status_key)).length;
    const missed = calls.filter((c) => ["missed", "declined"].includes(c.status_key)).length;
    const unknown = calls.length - answered - missed;
    return [
      { name: "Answered", value: answered, color: "#D1FF26" },
      { name: "Missed", value: missed, color: "#ef4444" },
      { name: "Other", value: unknown, color: "#8A8F98" },
    ].filter((d) => d.value > 0);
  }, [calls]);

  const typeData = useMemo(() => {
    const incoming = calls.filter((c) => c.direction === "incoming").length;
    const outgoing = calls.filter((c) => c.direction === "outgoing").length;
    const service = calls.filter((c) => c.direction === "service").length;
    return [
      { name: "Incoming", value: incoming, color: "#D1FF26" },
      { name: "Outgoing", value: outgoing, color: "#22D3EE" },
      { name: "Service", value: service, color: "#FBBF24" },
    ].filter((d) => d.value > 0);
  }, [calls]);

  if (calls.length === 0) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-3 mb-4">
      {/* Calls per day - area chart */}
      <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>CALLS · LAST 7 DAYS</p>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D1FF26" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#D1FF26" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: "#8A8F98", fontSize: 9 }} axisLine={{ stroke: "rgba(138,143,152,0.2)" }} tickLine={false} />
            <YAxis tick={{ fill: "#8A8F98", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 11, color: "#F5F5F7" }}
              labelStyle={{ color: "#D1FF26" }}
            />
            <Area type="monotone" dataKey="calls" stroke="#D1FF26" strokeWidth={2} fill="url(#callGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Duration per day - bar chart */}
      <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>TALK TIME (MIN) · 7 DAYS</p>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: "#8A8F98", fontSize: 9 }} axisLine={{ stroke: "rgba(138,143,152,0.2)" }} tickLine={false} />
            <YAxis tick={{ fill: "#8A8F98", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 11, color: "#F5F5F7" }}
              labelStyle={{ color: "#D1FF26" }}
              formatter={(v) => [`${v} min`, "Talk Time"]}
            />
            <Bar dataKey="duration" fill="#D1FF26" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status breakdown - pie chart */}
      {statusData.length > 0 && (
        <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <PhoneIncoming size={12} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>STATUS BREAKDOWN</p>
          </div>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width="50%" height={100}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 11, color: "#F5F5F7" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="rounded-full" style={{ width: 6, height: 6, background: d.color }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{d.name.toUpperCase()}</span>
                  <span className="font-mono text-[8px]" style={{ color: "#F5F5F7" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Type breakdown - pie chart */}
      {typeData.length > 0 && (
        <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={12} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>CALL TYPES</p>
          </div>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width="50%" height={100}>
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2}>
                  {typeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 11, color: "#F5F5F7" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {typeData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="rounded-full" style={{ width: 6, height: 6, background: d.color }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{d.name.toUpperCase()}</span>
                  <span className="font-mono text-[8px]" style={{ color: "#F5F5F7" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}