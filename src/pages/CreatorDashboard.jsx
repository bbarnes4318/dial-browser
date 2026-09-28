import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Radio, Users, TrendingUp, Clock, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ListenerChart from "@/components/creator/ListenerChart";
import SessionCard from "@/components/creator/SessionCard";
import ListenerMap from "@/components/creator/ListenerMap";
import VoiceCommandSummaryCard from "@/components/dashboard/VoiceCommandSummaryCard";

const formatDuration = (sec) => {
  if (!sec) return "0m";
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

export default function CreatorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.StreamSession.list("-created_date", 50);
        setSessions(data || []);
        if (data && data.length > 0) setSelected(data[0]);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  // Compute summary stats
  const endedSessions = sessions.filter((s) => s.status === "ended");
  const totalStreams = endedSessions.length;
  const avgPeak = endedSessions.length > 0 ? Math.round(endedSessions.reduce((a, s) => a + (s.peak_listeners || 0), 0) / endedSessions.length) : 0;
  const totalTips = endedSessions.reduce((a, s) => a + (s.total_tips || 0), 0);
  const avgDuration = endedSessions.length > 0 ? Math.round(endedSessions.reduce((a, s) => a + (s.duration_seconds || 0), 0) / endedSessions.length) : 0;

  // Peak activity by hour of day
  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: `${h}:00`, peak: 0, count: 0 }));
  endedSessions.forEach((s) => {
    if (!s.started_at) return;
    const h = new Date(s.started_at).getHours();
    hourBuckets[h].peak += s.peak_listeners || 0;
    hourBuckets[h].count += 1;
  });
  const hourData = hourBuckets.filter((b) => b.count > 0).map((b) => ({ ...b, avg: Math.round(b.peak / b.count) }));
  const maxHourVal = Math.max(...hourData.map((d) => d.avg), 1);

  const activeSession = sessions.find((s) => s.status === "active");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <div className="w-8 h-8 border-2 border-[rgba(209,255,38,0.2)] border-t-[#D1FF26] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Radio size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CREATOR DASHBOARD</p>
        </div>
        <h1 className="font-heading font-black text-3xl lg:text-5xl mb-2" style={{ color: "#F5F5F7" }}>
          Stream <span style={{ color: "#D1FF26" }}>Analytics</span>
        </h1>
        <p className="text-sm mb-8 max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Track your live stream audience in real time. Monitor listener counts, identify peak activity windows, and measure engagement across every broadcast.
        </p>

        {activeSession && (
          <div className="mb-6 p-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#F5F5F7" }}>
              <span style={{ color: "#ef4444" }}>LIVE NOW:</span> {activeSession.stream_title} — {activeSession.artist_name}
            </p>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Radio, label: "TOTAL STREAMS", value: totalStreams },
            { icon: Users, label: "AVG PEAK", value: avgPeak.toLocaleString() },
            { icon: TrendingUp, label: "TOTAL TIPS", value: totalTips },
            { icon: Clock, label: "AVG DURATION", value: formatDuration(avgDuration) },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-4" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <Icon size={16} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[8px] tracking-widest mt-2 mb-1" style={{ color: "#8A8F98" }}>{stat.label}</p>
                <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Voice command demand summary */}
        <div className="mb-8">
          <VoiceCommandSummaryCard />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* Listener count chart */}
          <div className="lg:col-span-2 p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>LISTENER COUNT</p>
              </div>
              {selected && (
                <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{selected.stream_title}</p>
              )}
            </div>
            {selected ? (
              <>
                <ListenerChart
                  snapshots={selected.listener_snapshots}
                  peakOffset={selected.peak_time_offset}
                  peakCount={selected.peak_listeners}
                />
                {selected.peak_listeners > 0 && (
                  <div className="mt-3 flex items-center gap-2 p-2" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                    <TrendingUp size={11} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                      Peak of <span style={{ color: "#D1FF26", fontWeight: "bold" }}>{selected.peak_listeners.toLocaleString()}</span> listeners at <span style={{ color: "#D1FF26" }}>{Math.floor((selected.peak_time_offset || 0) / 60)}m</span> into the stream
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center" style={{ height: "260px" }}>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SELECT A SESSION TO VIEW DATA</p>
              </div>
            )}
          </div>

          {/* Peak activity times */}
          <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>PEAK ACTIVITY TIMES</p>
            </div>
            {hourData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hourData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#8A8F98", fontSize: 8, fontFamily: "JetBrains Mono" }}
                    axisLine={{ stroke: "rgba(138,143,152,0.15)" }}
                    tickLine={false}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: "#8A8F98", fontSize: 8, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#10141D",
                      border: "0.5px solid rgba(209,255,38,0.3)",
                      borderRadius: 0,
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                    }}
                    labelStyle={{ color: "#8A8F98" }}
                    cursor={{ fill: "rgba(209,255,38,0.05)" }}
                    formatter={(v) => [`${v} avg listeners`, ""]}
                  />
                  <Bar dataKey="avg" radius={[2, 2, 0, 0]}>
                    {hourData.map((entry, i) => (
                      <Cell key={i} fill={entry.avg === maxHourVal ? "#D1FF26" : "rgba(209,255,38,0.3)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center" style={{ height: "260px" }}>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO DATA YET</p>
              </div>
            )}
          </div>
        </div>

        {/* Listener origin map */}
        <div className="mb-8">
          <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>▸ LISTENER CALL-IN ORIGINS</p>
          <ListenerMap session={selected} />
        </div>

        {/* Session history */}
        <div>
          <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>▸ SESSION HISTORY</p>
          {sessions.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
              <Radio size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO STREAMS YET</p>
              <p className="text-sm max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                Go live from the Creators section to start tracking your audience analytics.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onSelect={setSelected}
                  isSelected={selected?.id === session.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}