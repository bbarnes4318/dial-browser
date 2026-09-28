import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Share2, Crown, Music2, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import TrackShareButton from "@/components/music/TrackShareButton";

export default function ArtistLeaderboard() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTracks = useCallback(async () => {
    try {
      const all = await base44.entities.ArtistTrack.list("-updated_date", 100);
      const live = (all || []).filter((t) => t.radio_status === "live");
      setTracks(live);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTracks(); }, [loadTracks]);

  // Calculate artist scores
  const artistMap = {};
  tracks.forEach((t) => {
    const name = t.artist_name;
    if (!artistMap[name]) {
      artistMap[name] = { name, plays: 0, shares: 0, tracks: 0 };
    }
    artistMap[name].plays += t.play_count || 0;
    artistMap[name].shares += t.share_count || 0;
    artistMap[name].tracks += 1;
  });

  const topArtists = Object.values(artistMap)
    .map((a) => ({ ...a, score: a.plays + a.shares * 2 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const topSongs = tracks
    .map((t) => ({ ...t, score: (t.play_count || 0) + (t.share_count || 0) * 2 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "#D1FF26", borderRightColor: "#D1FF26" }} />
      </div>
    );
  }

  if (tracks.length === 0) return null;

  const rankColors = ["#D1FF26", "#C0C0C0", "#CD7F32", "#8A8F98", "#8A8F98"];

  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-8">
      {/* Top Artists */}
      <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Crown size={14} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ TOP ARTISTS</span>
        </div>
        <div className="space-y-2">
          {topArtists.map((artist, i) => (
            <motion.div
              key={artist.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3"
              style={{ background: i === 0 ? "rgba(209,255,38,0.06)" : "rgba(5,7,10,0.4)", border: `0.5px solid ${i === 0 ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}` }}
            >
              <span className="font-heading font-black text-lg flex-shrink-0 w-6 text-center" style={{ color: rankColors[i] }}>#{i + 1}</span>
              <Link to={`/artist/${encodeURIComponent(artist.name)}`} className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate hover:underline" style={{ color: "#F5F5F7" }}>{artist.name}</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>{artist.tracks} tracks</span>
                  <span className="flex items-center gap-1 font-mono text-[7px]" style={{ color: "#D1FF26" }}>
                    <Headphones size={7} /> {artist.plays.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[7px]" style={{ color: "#8A8F98" }}>
                    <Share2 size={7} /> {artist.shares}
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Trophy size={10} style={{ color: rankColors[i] }} />
                <span className="font-mono text-[9px] font-bold" style={{ color: rankColors[i] }}>{artist.score}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Songs */}
      <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Music2 size={14} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ TOP SONGS</span>
        </div>
        <div className="space-y-2">
          {topSongs.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3"
              style={{ background: i === 0 ? "rgba(209,255,38,0.06)" : "rgba(5,7,10,0.4)", border: `0.5px solid ${i === 0 ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}` }}
            >
              <span className="font-heading font-black text-lg flex-shrink-0 w-6 text-center" style={{ color: rankColors[i] }}>#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#F5F5F7" }}>{track.track_title}</p>
                <div className="flex items-center gap-3">
                  <Link to={`/artist/${encodeURIComponent(track.artist_name)}`} className="font-mono text-[7px] hover:underline" style={{ color: "#8A8F98" }}>{track.artist_name}</Link>
                  <span className="font-mono text-[7px]" style={{ color: "#D1FF26" }}>{track.genre}</span>
                  <span className="flex items-center gap-1 font-mono text-[7px]" style={{ color: "#D1FF26" }}>
                    <Headphones size={7} /> {track.play_count || 0}
                  </span>
                </div>
              </div>
              <TrackShareButton track={track} compact />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <TrendingUp size={10} style={{ color: rankColors[i] }} />
                <span className="font-mono text-[9px] font-bold" style={{ color: rankColors[i] }}>{track.score}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}