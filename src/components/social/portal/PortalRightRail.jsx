import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, UserPlus, MessageSquare, Share2, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { PORTAL } from "./portalTheme";
import PortalDataCounter from "./PortalDataCounter";

const VOICE_PROMPTS = [
  "Open Google",
  "Show me news",
  "Call a friend",
  "Play music",
  "Find a service",
];

function ActivityRow({ icon: Icon, text, time, color }) {
  return (
    <div className="flex items-start gap-2 px-2.5 py-2" style={{ borderBottom: "0.5px solid rgba(0,240,255,0.08)" }}>
      <Icon size={12} className="mt-0.5 flex-shrink-0" style={{ color }} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] leading-snug" style={{ color: "#d0d0d0" }}>{text}</p>
        <p className="font-mono text-[8px] mt-0.5" style={{ color: PORTAL.muted }}>{time}</p>
      </div>
    </div>
  );
}

export default function PortalRightRail({ myProfile, onVoiceCommand, extra, className }) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!myProfile) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const myPosts = await base44.entities.SocialPost.filter({ author_profile_id: myProfile.id }, "-created_date", 50);
        const postIds = new Set(myPosts.map((p) => p.id));
        const [likes, comments, follows] = await Promise.all([
          base44.entities.SocialLike.filter({}, "-created_date", 40),
          base44.entities.SocialComment.filter({}, "-created_date", 40),
          base44.entities.SocialFollow.filter({ followed_profile_id: myProfile.id }, "-created_date", 40),
        ]);
        if (cancelled) return;
        const rows = [];
        (likes || []).forEach((l) => { if (postIds.has(l.post_id)) rows.push({ type: "like", text: `New Like from @${l.liker_handle || "someone"}`, t: l.created_date, Icon: Heart, color: PORTAL.magenta }); });
        (comments || []).forEach((c) => { if (postIds.has(c.post_id)) rows.push({ type: "comment", text: `New Comment from @${c.author_handle || "someone"}`, t: c.created_date, Icon: MessageSquare, color: PORTAL.cyan }); });
        (follows || []).forEach((f) => rows.push({ type: "follow", text: `New Follower @${f.follower_handle || "someone"}`, t: f.created_date, Icon: UserPlus, color: "#42E1F6" }));
        rows.sort((a, b) => new Date(b.t || 0) - new Date(a.t || 0));
        setActivity(rows.slice(0, 8));
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [myProfile]);

  const fmt = (t) => (t ? formatDistanceToNow(new Date(t), { addSuffix: true }) : "");

  return (
    <aside className={`flex flex-col gap-3 ${className || ""}`}>
      {/* Live network data counter */}
      <PortalDataCounter />

      {/* VOICE module */}
      <div className="p-3" style={{ background: "rgba(255,0,255,0.04)", border: "0.5px solid rgba(255,0,255,0.22)", borderRadius: 10 }}>
        <p className="font-mono text-[8px] tracking-[0.3em] mb-2" style={{ color: PORTAL.magenta }}>// VOICE</p>
        <div className="flex flex-col gap-1.5">
          {VOICE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => onVoiceCommand?.(p)}
              className="text-left px-2.5 py-1.5 font-mono text-[10px] transition-all hover:translate-x-0.5"
              style={{ background: "rgba(0,240,255,0.05)", border: "0.5px solid rgba(0,240,255,0.18)", color: "#c8e9ff", borderRadius: 6 }}
            >
              <span style={{ color: PORTAL.cyan }}>›</span> {p}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-2.5" style={{ background: "rgba(12,12,32,0.6)", border: "0.5px solid rgba(0,240,255,0.18)", borderRadius: 10 }}>
        <p className="font-mono text-[8px] tracking-[0.3em] mb-2 px-1" style={{ color: PORTAL.cyan }}>// RECENT ACTIVITY</p>
        {loading ? (
          <p className="text-[10px] px-2 py-3" style={{ color: PORTAL.muted }}>Loading…</p>
        ) : activity.length === 0 ? (
          <p className="text-[10px] px-2 py-3" style={{ color: PORTAL.muted }}>No recent activity yet.</p>
        ) : (
          <div>
            {activity.map((a, i) => <ActivityRow key={i} icon={a.Icon} text={a.text} time={fmt(a.t)} color={a.color} />)}
          </div>
        )}
      </div>

      {extra}

      {/* Footer card */}
      <Link to="/" className="flex items-center justify-around p-3 transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]" style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.08), rgba(255,0,255,0.08))", border: "0.5px solid rgba(0,240,255,0.25)", borderRadius: 10 }}>
        <span className="flex items-center justify-center w-8 h-8 font-heading font-black text-xs" style={{ background: "linear-gradient(135deg,#00f0ff,#ff00ff)", color: "#050515", borderRadius: 6 }}>DB</span>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: PORTAL.cyan }}>Internet</span>
          <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: PORTAL.magenta }}>Social</span>
        </div>
        <Radio size={14} style={{ color: PORTAL.cyan }} />
      </Link>
    </aside>
  );
}