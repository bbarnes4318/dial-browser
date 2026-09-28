import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Headphones, Share2, MessageSquare, TrendingUp, Music2, Radio,
  DollarSign, Star, Loader2, BarChart3, Disc3, ArrowLeft, Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ArtistAnalytics() {
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [comments, setComments] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);

      // Fetch user's tracks
      const allTracks = await base44.entities.ArtistTrack.list("-updated_date", 100);
      const myTracks = (allTracks || []).filter(
        (t) => t.created_by_id === me.id
      );
      setTracks(myTracks);

      // Fetch comments on artist tracks
      const allComments = await base44.entities.Comment.list("-created_date", 50);
      const myTrackIds = new Set(myTracks.map((t) => t.id));
      const myComments = (allComments || []).filter(
        (c) => c.content_type === "artist_track" && myTrackIds.has(c.content_id)
      );
      setComments(myComments);

      // Fetch tips for this artist's tracks
      const artistNames = new Set(myTracks.map((t) => t.artist_name?.toLowerCase()));
      const allTips = await base44.entities.Tip.list("-created_date", 50);
      const myTips = (allTips || []).filter(
        (t) => artistNames.has(t.artist_name?.toLowerCase())
      );
      setTips(myTips);
    } catch {
      setError("Could not load your artist analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Compute aggregate stats
  const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
  const totalShares = tracks.reduce((sum, t) => sum + (t.share_count || 0), 0);
  const totalTips = tips.reduce((sum, t) => sum + (t.amount || 0), 0);
  const liveCount = tracks.filter((t) => t.radio_status === "live").length;
  const totalComments = comments.length;

  // Sort tracks by play count for the performance table
  const sortedTracks = [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ARTIST ANALYTICS</p>
        </div>
        <h1 className="font-heading font-black text-3xl lg:text-5xl mb-2" style={{ color: "#F5F5F7" }}>
          Track <span style={{ color: "#D1FF26" }}>Performance</span>
        </h1>
        <p className="text-sm mb-8 max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Monitor your total listen count, share stats, tip earnings, and recent comment feedback across all your tracks on the radio network.
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Headphones, label: "TOTAL LISTENS", value: totalPlays.toLocaleString(), color: "#D1FF26" },
            { icon: Share2, label: "TOTAL SHARES", value: totalShares.toLocaleString(), color: "#D1FF26" },
            { icon: DollarSign, label: "TIPS RECEIVED", value: `$${totalTips.toFixed(2)}`, color: "#D1FF26" },
            { icon: MessageSquare, label: "COMMENTS", value: totalComments, color: "#D1FF26" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4"
                style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}
              >
                <Icon size={16} style={{ color: stat.color }} />
                <p className="font-mono text-[8px] tracking-widest mt-2 mb-1" style={{ color: "#8A8F98" }}>{stat.label}</p>
                <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Secondary stats */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <Disc3 size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{tracks.length} TRACKS PUBLISHED</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <Radio size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>{liveCount} ON AIR</span>
          </div>
        </div>

        {/* Track Performance Table */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ TRACK PERFORMANCE</p>
          </div>

          {tracks.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
              <Music2 size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO TRACKS YET</p>
              <p className="text-sm max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                Head to the Music Studio to create and publish your first track. Your analytics will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th className="text-left p-3 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>TRACK</th>
                    <th className="text-right p-3 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>PLAYS</th>
                    <th className="text-right p-3 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>SHARES</th>
                    <th className="text-center p-3 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTracks.map((track, idx) => (
                    <motion.tr
                      key={track.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <td className="p-3" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{String(idx + 1).padStart(2, "0")}</span>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#F5F5F7" }}>{track.track_title}</p>
                            <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{track.genre}{track.bpm ? ` · ${track.bpm} BPM` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                        <span className="font-mono text-sm" style={{ color: "#D1FF26" }}>{(track.play_count || 0).toLocaleString()}</span>
                      </td>
                      <td className="p-3 text-right" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                        <span className="font-mono text-sm" style={{ color: "#8A8F98" }}>{(track.share_count || 0).toLocaleString()}</span>
                      </td>
                      <td className="p-3 text-center" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                        {track.radio_status === "live" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[7px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>
                            <span className="rounded-full" style={{ width: 4, height: 4, background: "#D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
                            ON AIR
                          </span>
                        ) : track.radio_status === "pending" ? (
                          <span className="font-mono text-[7px] tracking-widest px-2 py-1" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>PENDING</span>
                        ) : (
                          <span className="font-mono text-[7px] tracking-widest px-2 py-1" style={{ background: "rgba(138,143,152,0.1)", color: "#8A8F98" }}>DRAFT</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Comments */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ RECENT COMMENT FEEDBACK</p>
          </div>

          {comments.length === 0 ? (
            <div className="p-6 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
              <MessageSquare size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 8px" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO COMMENTS YET</p>
              <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>When listeners comment on your tracks, their feedback will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {comments.slice(0, 10).map((comment, idx) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-4 flex items-start gap-3"
                  style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}
                >
                  <div className="flex items-center justify-center w-8 h-8 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <MessageSquare size={12} style={{ color: "#D1FF26" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color: "#F5F5F7" }}>{comment.author_name}</span>
                      {comment.is_host && (
                        <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>
                          <Sparkles size={7} className="inline" /> HOST
                        </span>
                      )}
                      <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>on "{comment.content_title || "track"}"</span>
                    </div>
                    <p className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{comment.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tips */}
        {tips.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ RECENT TIPS</p>
            </div>
            <div className="space-y-2">
              {tips.slice(0, 5).map((tip, idx) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-4 flex items-center gap-3"
                  style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}
                >
                  <div className="flex items-center justify-center w-8 h-8 flex-shrink-0" style={{ background: "rgba(209,255,38,0.15)" }}>
                    <DollarSign size={12} style={{ color: "#D1FF26" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "#F5F5F7" }}>{tip.tipper_name} tipped ${tip.amount.toFixed(2)}</p>
                    {tip.track_title && <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>on "{tip.track_title}"</p>}
                    {tip.message && <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>"{tip.message}"</p>}
                  </div>
                  <Star size={10} style={{ color: "#D1FF26" }} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}