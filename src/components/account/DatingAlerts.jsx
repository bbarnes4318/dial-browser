import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Loader2, Users, Clock, Bell, Zap, TrendingUp, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";

function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Real-time dating engagement monitor for the account hub. Subscribes to
// DatingLike events so new likes and matches appear live.
export default function DatingAlerts({ user }) {
  const [profile, setProfile] = useState(null);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [pulse, setPulse] = useState(0);

  const load = useCallback(async (u) => {
    try {
      const mine = await base44.entities.DatingProfile.filter({ created_by_id: u.id }, "-created_date", 5);
      const my = (mine && mine[0]) || null;
      setProfile(my);
      if (my) {
        const all = await base44.entities.DatingLike.filter({}, "-created_date", 200);
        setLikes((all || []).filter((l) => l.liker_profile_id === my.id || l.liked_profile_id === my.id));
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    load(user);
    const unsub = base44.entities.DatingLike.subscribe(() => {
      setPulse((p) => p + 1);
      load(user);
    });
    setLive(true);
    return () => { if (unsub) unsub(); setLive(false); };
  }, [user, load]);

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
        <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  // No dating profile yet — prompt to create one.
  if (!profile) {
    return (
      <div className="p-6" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Heart size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DATING ENGAGEMENT</p>
        </div>
        <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
          Create a verified dating profile to start tracking your matches, likes, and engagement in real time.
        </p>
        <Link to="/dating" className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
          Open Dating Portal
        </Link>
      </div>
    );
  }

  const matches = likes.filter((l) => l.matched);
  const received = likes.filter((l) => l.liked_profile_id === profile.id);
  const pending = received.filter((l) => !l.matched);
  const verified = !!profile.email_verified;

  // Build activity feed
  const feed = likes
    .map((l) => {
      const incoming = l.liked_profile_id === profile.id;
      const other = incoming ? l.liker_name : l.liked_name;
      let label, tone;
      if (l.matched) { label = `Mutual match with ${other}`; tone = "#D1FF26"; }
      else if (incoming) { label = `${other} liked you`; tone = "#FF6B35"; }
      else { label = `You liked ${other}`; tone = "#8A8F98"; }
      return { id: l.id, label, tone, matched: l.matched, incoming, date: l.created_date, matched_at: l.matched_at };
    })
    .sort((a, b) => new Date(b.matched_at || b.date || 0) - new Date(a.matched_at || a.date || 0))
    .slice(0, 8);

  const metrics = [
    { icon: Heart, label: "MATCHES", value: matches.length, tone: "#D1FF26" },
    { icon: Users, label: "LIKES RECEIVED", value: received.length, tone: "#FF6B35" },
    { icon: Bell, label: "PENDING", value: pending.length, tone: "#5AC8E0" },
    { icon: TrendingUp, label: "TOTAL ENGAGEMENT", value: likes.length, tone: "#A855F7" },
  ];

  return (
    <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DATING ENGAGEMENT</p>
        </div>
        <div className="flex items-center gap-2">
          {verified ? (
            <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>VERIFIED</span>
          ) : (
            <Link to="/dating" className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(245,166,35,0.08)", border: "0.5px solid rgba(245,166,35,0.3)", color: "#F5A623" }}>VERIFY EMAIL</Link>
          )}
          {live && (
            <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} /> LIVE
            </span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }} className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={12} style={{ color: m.tone }} />
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{m.label}</p>
              </div>
              <p className="font-heading font-black text-2xl" style={{ color: m.tone }}>{m.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Activity feed */}
      <div className="flex items-center gap-2 mb-2">
        <Radio size={11} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE ACTIVITY</p>
        {pulse > 0 && <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>· {pulse} update{pulse !== 1 ? "s" : ""}</span>}
      </div>
      {feed.length === 0 ? (
        <div className="p-6 text-center" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
          <Heart size={22} style={{ color: "rgba(209,255,38,0.25)", margin: "0 auto 8px" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO ACTIVITY YET</p>
          <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Like profiles in the portal to see live engagement here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {feed.map((f) => (
            <motion.div key={f.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-2 p-2.5" style={{ background: "rgba(5,7,10,0.4)", border: `0.5px solid ${f.matched ? "rgba(209,255,38,0.18)" : "rgba(138,143,152,0.08)"}` }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.tone, boxShadow: f.matched ? "0 0 8px rgba(209,255,38,0.5)" : "none" }} />
              <p className="text-xs flex-1 truncate" style={{ color: f.matched ? "#F5F5F7" : "#8A8F98" }}>{f.label}</p>
              {f.matched && <Zap size={11} style={{ color: "#D1FF26" }} />}
              <span className="font-mono text-[8px] flex items-center gap-1" style={{ color: "rgba(138,143,152,0.6)" }}>
                <Clock size={9} /> {timeAgo(f.matched_at || f.date)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      <Link to="/dating" className="mt-4 inline-flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
        Open Dating Portal →
      </Link>
    </div>
  );
}