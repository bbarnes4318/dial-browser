import React, { useState, useEffect } from "react";
import { Users, Search, Heart, MessageSquare, AlertCircle, Download, TrendingUp, ShieldAlert, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export default function GrowthOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getAdminGrowthMetrics", {});
        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Members", data.growth.totalMembers],
      ["Total Users", data.growth.totalUsers],
      ["Total Searches", data.growth.totalSearches],
      ["Total Matches", data.growth.totalMatches],
      ["Total Social Posts", data.growth.totalSocialPosts],
      ["Total Dating Profiles", data.growth.totalDatingProfiles],
      ["Open Disputes", data.operations.openDisputes],
      ["Open Reports", data.operations.openReports],
      ["Failed SMS", data.operations.failedSms],
      [],
      ["Date", "Signups", "Searches", "Matches"],
      ...data.growth.trend.map((t) => [t.date, t.signups, t.searches, t.matches]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "growth-metrics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
        <AlertCircle size={14} style={{ color: "#ef4444" }} />
        <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  const g = data.growth;
  const op = data.operations;

  const tiles = [
    { icon: Users, label: "TOTAL MEMBERS", value: g.totalMembers, sub: `${g.totalUsers} user accounts`, accent: "#D1FF26" },
    { icon: Search, label: "TOTAL SEARCHES", value: g.totalSearches, sub: "Voice + text queries", accent: "#5AE0C8" },
    { icon: Heart, label: "MUTUAL MATCHES", value: g.totalMatches, sub: `${g.totalDatingProfiles} dating profiles`, accent: "#E0A85A" },
    { icon: MessageSquare, label: "SOCIAL POSTS", value: g.totalSocialPosts, sub: "Community activity", accent: "#C8A0FF" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// GROWTH & ENGAGEMENT — LIVE</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.12)]"
          style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          <Download size={11} /> Export CSV
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="p-5" style={{ background: "rgba(16,20,29,0.8)", border: `0.5px solid ${t.accent}40` }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={14} style={{ color: t.accent }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{t.label}</p>
              </div>
              <p className="font-heading font-black text-2xl mb-1" style={{ color: "#F5F5F7" }}>{t.value.toLocaleString()}</p>
              <p className="font-mono text-[8px] tracking-wider" style={{ color: "rgba(138,143,152,0.7)" }}>{t.sub}</p>
            </div>
          );
        })}
      </div>

      {/* 14-day trend */}
      <div className="p-5 mb-4" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>// 14-DAY TREND — SIGNUPS · SEARCHES · MATCHES</p>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={g.trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSignups" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D1FF26" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#D1FF26" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSearches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5AE0C8" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#5AE0C8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMatches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E0A85A" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#E0A85A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,143,152,0.1)" />
              <XAxis dataKey="date" tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "JetBrains Mono" }} stroke="rgba(138,143,152,0.2)" />
              <YAxis tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "JetBrains Mono" }} stroke="rgba(138,143,152,0.2)" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "rgba(10,13,20,0.96)", border: "0.5px solid rgba(209,255,38,0.3)", borderRadius: 0, fontSize: 11, fontFamily: "JetBrains Mono", color: "#F5F5F7" }}
                labelStyle={{ color: "#D1FF26" }}
              />
              <Area type="monotone" dataKey="signups" stroke="#D1FF26" strokeWidth={1.5} fill="url(#gradSignups)" name="Signups" />
              <Area type="monotone" dataKey="searches" stroke="#5AE0C8" strokeWidth={1.5} fill="url(#gradSearches)" name="Searches" />
              <Area type="monotone" dataKey="matches" stroke="#E0A85A" strokeWidth={1.5} fill="url(#gradMatches)" name="Matches" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operations counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OpTile icon={ShieldAlert} label="OPEN DISPUTES" value={op.openDisputes} accent={op.openDisputes > 0 ? "#ef4444" : "#D1FF26"} />
        <OpTile icon={ShieldAlert} label="OPEN REPORTS" value={op.openReports} accent={op.openReports > 0 ? "#ef4444" : "#D1FF26"} />
        <OpTile icon={AlertCircle} label="FAILED SMS" value={op.failedSms} accent={op.failedSms > 0 ? "#E0A85A" : "#D1FF26"} />
      </div>
    </div>
  );
}

function OpTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="p-4 flex items-center gap-3" style={{ background: "rgba(16,20,29,0.8)", border: `0.5px solid ${accent}40` }}>
      <Icon size={16} style={{ color: accent }} />
      <div>
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
        <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{value}</p>
      </div>
    </div>
  );
}