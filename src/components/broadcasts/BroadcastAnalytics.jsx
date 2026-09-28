import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, AlertCircle, CheckCircle2, Calendar, TrendingUp, Users, Percent } from "lucide-react";

/**
 * BroadcastAnalytics — aggregate delivery success-rate summary card.
 * Reads VoiceBroadcast records (which carry sent_count, failed_count,
 * total_recipients) and rolls them up into a dashboard summary.
 */
export default function BroadcastAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.VoiceBroadcast.list("-created_date", 100);
        const b = Array.isArray(list) ? list : [];
        const total = b.length;
        const sentB = b.filter((x) => x.status === "sent");
        const scheduled = b.filter((x) => x.status === "scheduled").length;
        const drafts = b.filter((x) => x.status === "draft").length;
        const totalRecipients = b.reduce((s, x) => s + (x.total_recipients || 0), 0);
        const totalSent = b.reduce((s, x) => s + (x.sent_count || 0), 0);
        const totalFailed = b.reduce((s, x) => s + (x.failed_count || 0), 0);
        const attempted = totalSent + totalFailed;
        const successRate = attempted > 0 ? (totalSent / attempted) * 100 : 0;
        const deliveredRate = totalRecipients > 0 ? (totalSent / totalRecipients) * 100 : 0;
        if (active) setStats({ total, sentCount: sentB.length, scheduled, drafts, totalRecipients, totalSent, totalFailed, successRate, deliveredRate });
      } catch { /* empty */ }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const cardStyle = { background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" };

  return (
    <div className="p-5" style={{ background: "rgba(10,13,20,0.7)", border: "0.5px solid rgba(34,197,94,0.25)", boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: "#22c55e" }} />
          <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#22c55e" }}>// DELIVERY ANALYTICS</p>
        </div>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>UPLOADED CONTACT LISTS</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2">
          <Loader2 size={16} className="animate-spin" style={{ color: "#22c55e" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>CALCULATING...</span>
        </div>
      ) : !stats || stats.total === 0 ? (
        <div className="text-center py-6">
          <Users size={20} className="mx-auto mb-2" style={{ color: "rgba(138,143,152,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>NO BROADCAST DATA YET</p>
        </div>
      ) : (
        <>
          {/* Headline success rate */}
          <div className="mb-4 p-4 flex items-center gap-4" style={{ background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.25)" }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0" style={{ background: "rgba(34,197,94,0.12)", border: "0.5px solid rgba(34,197,94,0.4)" }}>
              <Percent size={22} style={{ color: "#22c55e" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-black text-3xl leading-none" style={{ color: "#22c55e" }}>{stats.successRate.toFixed(1)}%</p>
              <p className="font-mono text-[9px] tracking-widest uppercase mt-1" style={{ color: "#8A8F98" }}>DELIVERY SUCCESS RATE</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8A8F98" }}>{stats.totalSent} delivered of {stats.totalSent + stats.totalFailed} attempted · {stats.totalFailed} failed</p>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatTile icon={Send} value={stats.sentCount} label="SENT" color="#22c55e" style={cardStyle} />
            <StatTile icon={Calendar} value={stats.scheduled} label="SCHEDULED" color="#A4FF00" style={cardStyle} />
            <StatTile icon={Users} value={stats.totalRecipients} label="RECIPIENTS" color="#BC00FF" style={cardStyle} />
            <StatTile icon={TrendingUp} value={`${stats.deliveredRate.toFixed(0)}%`} label="REACH RATE" color="#42E1F6" style={cardStyle} />
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, value, label, color, style }) {
  return (
    <div className="p-3 flex items-center gap-2.5" style={style}>
      <Icon size={14} style={{ color }} />
      <div className="min-w-0">
        <p className="font-heading font-bold text-base leading-none truncate" style={{ color: "#F5F5F7" }}>{value}</p>
        <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>{label}</p>
      </div>
    </div>
  );
}