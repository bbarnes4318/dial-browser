import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, Heart, Send, Clock } from "lucide-react";

const relTime = (ts) => {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// 14-day engagement timeline (likes + matches per day) with a recent-activity
// feed. Pure visualization over the already-loaded like data — no new fetches.
export default function EngagementTimeline({ likes = [], matches = [] }) {
  const { buckets, events } = useMemo(() => {
    const DAYS = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 86400000;
    const buckets = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today.getTime() - (DAYS - 1 - i) * dayMs);
      return { label: `${d.getMonth() + 1}/${d.getDate()}`, likes: 0, matches: 0 };
    });
    const bucket = (ts, key) => {
      if (!ts) return;
      const t = new Date(ts); t.setHours(0, 0, 0, 0);
      const daysAgo = Math.round((today.getTime() - t.getTime()) / dayMs);
      if (daysAgo >= 0 && daysAgo < DAYS) buckets[DAYS - 1 - daysAgo][key]++;
    };
    likes.forEach((l) => bucket(l.created_date, "likes"));
    matches.forEach((l) => bucket(l.matched_at || l.created_date, "matches"));

    const events = [
      ...likes.map((l) => ({ id: l.id, ts: l.created_date, type: "like", name: l.liked_name })),
      ...matches.map((l) => ({ id: l.id + "_m", ts: l.matched_at || l.created_date, type: "match", name: l.liked_name })),
    ]
      .filter((e) => e.ts)
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      .slice(0, 6);

    return { buckets, events };
  }, [likes, matches]);

  const total14 = buckets.reduce((a, b) => a + b.likes, 0);
  const matches14 = buckets.reduce((a, b) => a + b.matches, 0);

  return (
    <div className="p-5 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// 14-DAY ENGAGEMENT TIMELINE</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LIKES · <span style={{ color: "#D1FF26" }}>{total14}</span></span>
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>MATCHES · <span style={{ color: "#FF6B35" }}>{matches14}</span></span>
        </div>
      </div>

      <div style={{ height: 180 }}>
        {total14 === 0 && matches14 === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO ENGAGEMENT IN THE LAST 14 DAYS — START LIKING PROFILES TO FILL THIS CHART</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D1FF26" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#D1FF26" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(138,143,152,0.1)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(138,143,152,0.15)" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#8A8F98", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.3)", fontSize: 11, fontFamily: "monospace", color: "#F5F5F7" }}
                labelStyle={{ color: "#D1FF26" }}
              />
              <Area type="monotone" dataKey="likes" name="Likes" stroke="#D1FF26" strokeWidth={1.5} fill="url(#likesGrad)" />
              <Area type="monotone" dataKey="matches" name="Matches" stroke="#FF6B35" strokeWidth={1.5} fill="url(#matchGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent activity feed */}
      <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.12)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={12} style={{ color: "#8A8F98" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>RECENT ACTIVITY</p>
        </div>
        {events.length === 0 ? (
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>NO RECENT INTERACTIONS YET</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 flex-shrink-0" style={{ background: e.type === "match" ? "rgba(255,107,53,0.12)" : "rgba(209,255,38,0.1)", border: `0.5px solid ${e.type === "match" ? "rgba(255,107,53,0.3)" : "rgba(209,255,38,0.25)"}` }}>
                  {e.type === "match" ? <Heart size={11} style={{ color: "#FF6B35", fill: "#FF6B35" }} /> : <Send size={10} style={{ color: "#D1FF26" }} />}
                </span>
                <span className="font-mono text-[10px] flex-1 min-w-0 truncate" style={{ color: "#F5F5F7" }}>
                  {e.type === "match" ? "Matched with " : "Liked "}<span style={{ color: e.type === "match" ? "#FF6B35" : "#D1FF26" }}>{e.name || "a member"}</span>
                </span>
                <span className="font-mono text-[9px] flex-shrink-0" style={{ color: "#8A8F98" }}>{relTime(e.ts)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}