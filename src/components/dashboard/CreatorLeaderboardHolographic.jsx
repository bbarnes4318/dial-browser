import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown, Radio, Headphones, Clock, TrendingUp, Loader2, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * 5K holographic creator leaderboard.
 * Ranks the most active creators by subscriber engagement (peak listeners +
 * track plays) and total stream duration, using StreamSession + ArtistTrack +
 * ArtistProfile data. Neon cyan/magenta glassmorphism aesthetic.
 */
function fmtDuration(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const RANK_GLOW = ["#00FFFF", "#CC00FF", "#D1FF26", "#22d3ee", "#8A8F98"];

export default function CreatorLeaderboardHolographic() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [sessions, tracks, profiles] = await Promise.all([
        base44.entities.StreamSession.list("-created_date", 200).catch(() => []),
        base44.entities.ArtistTrack.list("-updated_date", 200).catch(() => []),
        base44.entities.ArtistProfile.list("-created_date", 200).catch(() => []),
      ]);

      const profileMap = {};
      (profiles || []).forEach((p) => {
        if (p.artist_name) profileMap[p.artist_name.toLowerCase()] = p;
      });

      const stats = {};
      const ensure = (name) => {
        if (!stats[name]) stats[name] = { name, totalDuration: 0, peakListeners: 0, streams: 0, tips: 0 };
        return stats[name];
      };

      (sessions || []).forEach((s) => {
        if (!s.artist_name) return;
        const c = ensure(s.artist_name);
        c.totalDuration += s.duration_seconds || 0;
        c.peakListeners += s.peak_listeners || 0;
        c.streams += 1;
        c.tips += s.total_tips || 0;
      });
      (tracks || []).forEach((t) => {
        if (!t.artist_name) return;
        ensure(t.artist_name).peakListeners += t.play_count || 0;
      });

      const ranked = Object.values(stats)
        .map((c) => {
          const p = profileMap[c.name.toLowerCase()];
          const engagement = c.peakListeners;
          const streamMin = Math.round(c.totalDuration / 60);
          return {
            ...c,
            artwork_url: p?.artwork_url,
            genre: p?.genre,
            engagement,
            streamMin,
            score: engagement + streamMin,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setCreators(ranked);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin" style={{ color: "#00FFFF" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Crown size={14} style={{ color: "#00FFFF" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#00FFFF" }}>// CREATOR LEADERBOARD — 5K HOLOGRAPHIC</p>
      </div>
      <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        The most active creators on Dial Browser, ranked by subscriber engagement and total stream duration.
      </p>

      {creators.length === 0 ? (
        <div className="text-center py-16" style={{ border: "0.5px dashed rgba(0,255,255,0.2)" }}>
          <Trophy size={32} className="mx-auto mb-3" style={{ color: "rgba(0,255,255,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO CREATOR ACTIVITY YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Stream sessions and plays will populate the leaderboard</p>
        </div>
      ) : (
        <div className="space-y-3">
          {creators.map((c, i) => {
            const glow = RANK_GLOW[i] || "#8A8F98";
            const isTop = i === 0;
            return (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative p-4"
                style={{
                  background: "linear-gradient(135deg, rgba(0,255,255,0.05) 0%, rgba(10,13,20,0.6) 50%, rgba(204,0,255,0.05) 100%)",
                  border: `0.5px solid ${isTop ? "rgba(0,255,255,0.45)" : "rgba(0,255,255,0.2)"}`,
                  boxShadow: isTop ? "0 0 40px rgba(0,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.04)" : "0 0 20px rgba(0,255,255,0.04)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px overflow-hidden pointer-events-none">
                  <div className="h-full w-1/3" style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)`, animation: "tickerScroll 6s linear infinite" }} />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 text-center">
                    <p className="font-heading font-black text-2xl" style={{ color: glow, textShadow: `0 0 16px ${glow}55` }}>#{i + 1}</p>
                  </div>

                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${glow}33, transparent 70%)` }} />
                    <div className="relative w-12 h-12 overflow-hidden" style={{ border: `0.5px solid ${glow}66`, boxShadow: `0 0 12px ${glow}33` }}>
                      {c.artwork_url ? (
                        <img src={c.artwork_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold" style={{ background: `${glow}11`, color: glow }}>{c.name?.[0]}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link to={`/artist/${encodeURIComponent(c.name)}`} className="font-heading font-bold text-base hover:opacity-80 transition-opacity" style={{ color: "#F5F5F7", textShadow: "0 0 10px rgba(0,255,255,0.1)" }}>
                      {c.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {c.genre && <span className="font-mono text-[9px] tracking-widest" style={{ color: "#CC00FF" }}>{c.genre.toUpperCase()}</span>}
                      <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#00FFFF" }}>
                        <Headphones size={10} /> {c.engagement.toLocaleString()} engagement
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#D1FF26" }}>
                        <Clock size={10} /> {fmtDuration(c.totalDuration)} streamed
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                        <Radio size={10} /> {c.streams} streams
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <TrendingUp size={14} style={{ color: glow }} />
                    <span className="font-mono text-sm font-bold" style={{ color: glow }}>{c.score.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="font-mono text-[8px] mt-5 text-center" style={{ color: "rgba(138,143,152,0.5)" }}>
        Score = subscriber engagement + total stream minutes · updates live
      </p>
    </div>
  );
}