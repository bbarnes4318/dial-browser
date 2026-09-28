import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  PhoneCall, Users, Gift, DollarSign, Radio, TrendingUp, ArrowUpRight, Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AppSidebar from "@/components/landing/AppSidebar";
import MobileTabBar from "@/components/landing/MobileTabBar";

const ARPU = 4.99; // estimated avg monthly membership per active subscriber
const CREATOR_SHARE = 0.70; // creator keeps 70% per revenue-share agreement
const fmt$ = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
};

export default function CreatorAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [subs, setSubs] = useState([]);
  const [tips, setTips] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setMe(user);
        const [s, su, t] = await Promise.all([
          base44.entities.StreamSession.list("-created_date", 100),
          base44.entities.LiveStreamSubscriber.list("-created_date", 200),
          base44.entities.Tip.list("-created_date", 200),
        ]);
        setSessions(s || []);
        setSubs(su || []);
        setTips(t || []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const isAdmin = me?.role === "admin";
  const name = me?.full_name || "Creator";

  // Scope: admin sees network-wide creator economy; a regular creator sees only their own.
  const mySessions = isAdmin ? sessions : sessions.filter((s) => s.created_by_id === me?.id);
  const mySubs = isAdmin ? subs : subs.filter((s) => s.created_by_id === me?.id);
  const myTips = isAdmin
    ? tips.filter((t) => t.status === "completed")
    : tips.filter((t) => (t.artist_name || "").trim().toLowerCase() === name.trim().toLowerCase() && t.status === "completed");

  // ── metrics ──
  const callVolume = mySessions.reduce((a, s) => a + (s.peak_listeners || 0), 0);
  const activeSubs = mySubs.filter((s) => s.active !== false).length;
  const giftsTotal = myTips.reduce((a, t) => a + (t.amount || 0), 0);
  const membershipEst = activeSubs * ARPU;
  const grossEst = giftsTotal + membershipEst;
  const creatorNet = grossEst * CREATOR_SHARE;
  const platformFee = grossEst * (1 - CREATOR_SHARE);
  const liveNow = mySessions.find((s) => s.status === "active");
  const newThisWeek = mySubs.filter((s) => s.created_date && Date.now() - new Date(s.created_date).getTime() < 7 * 864e5).length;

  // subscriber growth — cumulative over last 12 weeks
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - (11 - i) * 7);
    return { end, label: `${end.getMonth() + 1}/${end.getDate()}` };
  });
  const growthData = weeks.map((w) => ({
    label: w.label,
    subs: mySubs.filter((s) => s.created_date && new Date(s.created_date) <= w.end).length,
  }));

  // call volume by stream — top 6
  const topSessions = [...mySessions]
    .sort((a, b) => (b.peak_listeners || 0) - (a.peak_listeners || 0))
    .slice(0, 6)
    .map((s) => ({ name: (s.stream_title || "Stream").slice(0, 14), listeners: s.peak_listeners || 0 }));
  const maxSession = Math.max(...topSessions.map((d) => d.listeners), 1);

  const earningsBreakdown = [
    { label: "Gifts", value: Math.round(giftsTotal), fill: "#D1FF26" },
    { label: "Memberships", value: Math.round(membershipEst), fill: "#22d3ee" },
  ];

  const recentTips = [...myTips].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <div className="w-8 h-8 border-2 border-[rgba(209,255,38,0.2)] border-t-[#D1FF26] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:pl-[var(--sidebar-w)]" style={{ background: "#05070A" }}>
      <AppSidebar />
      <MobileTabBar />
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* header */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CREATOR ADMIN</p>
        </div>
        <h1 className="font-heading font-black text-3xl lg:text-5xl mb-2" style={{ color: "#F5F5F7" }}>
          Creator <span style={{ color: "#D1FF26" }}>Dashboard</span>
        </h1>
        <p className="text-sm mb-2 max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Track your call volume, subscriber growth, and estimated earnings from gifts and memberships.
        </p>
        <p className="font-mono text-[9px] tracking-widest uppercase mb-8" style={{ color: "#22d3ee" }}>
          ▸ {isAdmin ? "NETWORK-WIDE CREATOR ECONOMY" : `YOUR CREATOR METRICS · ${name.toUpperCase()}`}
        </p>

        {liveNow && (
          <div className="mb-6 p-3 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#F5F5F7" }}>
              <span style={{ color: "#ef4444" }}>LIVE NOW:</span> {liveNow.stream_title} — {liveNow.artist_name}
            </p>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Kpi icon={PhoneCall} label="TOTAL CALL VOLUME" value={callVolume.toLocaleString()} sub={`${mySessions.length} streams`} />
          <Kpi icon={Users} label="SUBSCRIBERS" value={mySubs.length.toLocaleString()} sub={`${activeSubs} active · +${newThisWeek} this wk`} />
          <Kpi icon={Gift} label="EST. GIFTS" value={fmt$(giftsTotal)} sub={`${myTips.length} gifts`} />
          <Kpi icon={DollarSign} label="EST. TOTAL EARNINGS" value={fmt$(grossEst)} sub={`Net ${fmt$(creatorNet)} · 30% ${fmt$(platformFee)}`} accent />
        </div>

        {/* charts row 1 */}
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* subscriber growth */}
          <div className="lg:col-span-2 p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>SUBSCRIBER GROWTH</p>
              </div>
              <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>LAST 12 WEEKS · CUMULATIVE</p>
            </div>
            {mySubs.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={growthData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D1FF26" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#D1FF26" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: "#8A8F98", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "rgba(138,143,152,0.15)" }} tickLine={false} interval={1} />
                  <YAxis tick={{ fill: "#8A8F98", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono" }} labelStyle={{ color: "#8A8F98" }} cursor={{ stroke: "rgba(209,255,38,0.2)" }} formatter={(v) => [`${v} subscribers`, ""]} />
                  <Area type="monotone" dataKey="subs" stroke="#D1FF26" strokeWidth={2} fill="url(#subGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty label="NO SUBSCRIBERS YET" icon={Users} />
            )}
          </div>

          {/* earnings breakdown */}
          <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>EARNINGS BREAKDOWN</p>
            </div>
            <div className="space-y-4">
              {earningsBreakdown.map((e) => {
                const pct = grossEst > 0 ? (e.value / grossEst) * 100 : 0;
                return (
                  <div key={e.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>{e.label}</span>
                      <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{fmt$(e.value)}</span>
                    </div>
                    <div className="h-2" style={{ background: "rgba(138,143,152,0.12)" }}>
                      <FillBar pct={pct} fill={e.fill} />
                    </div>
                    <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>{pct.toFixed(1)}% of estimated gross</p>
                  </div>
                );
              })}
              <div className="pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.12)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>Creator net (70%)</span>
                  <span className="font-heading font-black text-lg" style={{ color: "#D1FF26" }}>{fmt$(creatorNet)}</span>
                </div>
                <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>After 30% platform fee · {fmt$(platformFee)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* call volume by stream */}
        <div className="p-5 mb-8" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>CALL VOLUME BY STREAM</p>
            </div>
            <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>TOP 6 · PEAK LISTENERS</p>
          </div>
          {topSessions.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSessions} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#8A8F98", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "rgba(138,143,152,0.15)" }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fill: "#8A8F98", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono" }} labelStyle={{ color: "#8A8F98" }} cursor={{ fill: "rgba(209,255,38,0.05)" }} formatter={(v) => [`${v} listeners`, ""]} />
                <Bar dataKey="listeners" radius={[2, 2, 0, 0]}>
                  {topSessions.map((e, i) => (
                    <Cell key={i} fill={e.listeners === maxSession ? "#D1FF26" : "rgba(209,255,38,0.3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty label="NO STREAM DATA YET" icon={Radio} />
          )}
        </div>

        {/* recent gifts */}
        <div>
          <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>▸ RECENT GIFTS</p>
          {recentTips.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
              <Gift size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO GIFTS YET</p>
              <p className="text-sm" style={{ color: "#8A8F98" }}>Tips you receive will appear here with estimated earnings.</p>
            </div>
          ) : (
            <div className="overflow-hidden" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              {recentTips.map((t, i) => (
                <div key={t.id || i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < recentTips.length - 1 ? "0.5px solid rgba(138,143,152,0.08)" : "none" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <Gift size={14} style={{ color: "#D1FF26" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{t.tipper_name || "Anonymous"}</p>
                      <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{t.track_title || "Gift"} · {fmtDate(t.created_date)}</p>
                    </div>
                  </div>
                  <p className="font-heading font-bold text-sm flex-shrink-0 ml-3" style={{ color: "#D1FF26" }}>+{fmt$(t.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FillBar({ pct, fill }) {
  return (
    <div
      className="h-full transition-all duration-700"
      style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: fill, boxShadow: `0 0 10px ${fill}55` }}
    />
  );
}

function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="p-4 relative overflow-hidden" style={{ background: accent ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${accent ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.1)"}` }}>
      {accent && <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)" }} />}
      <div className="flex items-center justify-between">
        <Icon size={16} style={{ color: "#D1FF26" }} />
        {accent && <ArrowUpRight size={12} style={{ color: "#D1FF26" }} />}
      </div>
      <p className="font-mono text-[8px] tracking-widest mt-2 mb-1" style={{ color: "#8A8F98" }}>{label}</p>
      <p className="font-heading font-black text-2xl" style={{ color: accent ? "#D1FF26" : "#F5F5F7" }}>{value}</p>
      <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>{sub}</p>
    </div>
  );
}

function Empty({ label, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height: 220 }}>
      <Icon size={28} style={{ color: "rgba(209,255,38,0.2)", marginBottom: 10 }} />
      <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
    </div>
  );
}