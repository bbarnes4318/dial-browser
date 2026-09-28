import React, { useState, useEffect, useCallback, useRef } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { safeSocialUrl, socialUrlLabel } from "@/lib/safeSocialUrl";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Music2, Radio, Headphones, TrendingUp, Album, ExternalLink, Calendar, Share2, Play, Pause, Sparkles, Loader2, Disc3, Mic, DollarSign, ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import VoiceReviewRecorder from "@/components/music/VoiceReviewRecorder";
import VoiceReviewsList from "@/components/music/VoiceReviewsList";
import TipButton from "@/components/music/TipButton";

const STUDIO_IMG = proxyMediaUrl(
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/49878cdb3_c88c656f-0599-4e15-a511-11f8b8213493.png"
);

export default function ArtistProfilePage() {
  const { id } = useParams();
  const decodedName = decodeURIComponent(id || "");

  const [profile, setProfile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [tips, setTips] = useState([]);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const replayTimersRef = useRef([]);

  const loadArtist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to find an ArtistProfile record by name
      const profiles = await base44.entities.ArtistProfile.list("-created_date", 50);
      const match = (profiles || []).find(
        (p) => p.artist_name?.toLowerCase() === decodedName.toLowerCase()
      );
      setProfile(match || null);

      // Load all tracks by this artist
      const allTracks = await base44.entities.ArtistTrack.list("-updated_date", 100);
      const artistTracks = (allTracks || []).filter(
        (t) => t.artist_name?.toLowerCase() === decodedName.toLowerCase()
      );
      setTracks(artistTracks);

      // Load tips for this artist
      const allTips = await base44.entities.Tip.list("-created_date", 50);
      const artistTips = (allTips || []).filter(
        (t) => t.artist_name?.toLowerCase() === decodedName.toLowerCase()
      );
      setTips(artistTips);
    } catch {
      setError("Could not load artist profile.");
    } finally {
      setLoading(false);
    }
  }, [decodedName]);

  useEffect(() => { loadArtist(); }, [loadArtist]);

  // Audio engine for generative replay
  const ensureAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = 0.5;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const synthDrum = (ctx, type, time) => {
    const gain = ctx.createGain();
    gain.connect(masterGainRef.current);
    if (type === "kick") {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      osc.connect(gain); osc.start(time); osc.stop(time + 0.5);
    } else if (type === "snare") {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = "highpass"; filt.frequency.value = 1000;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.8, time); ng.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      noise.connect(filt); filt.connect(ng); ng.connect(masterGainRef.current);
      noise.start(time); noise.stop(time + 0.2);
    } else if (type === "hihat" || type === "crash") {
      const dur = type === "crash" ? 1.0 : 0.1;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const filt = ctx.createBiquadFilter(); filt.type = "highpass"; filt.frequency.value = type === "crash" ? 5000 : 7000;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(type === "crash" ? 0.5 : 0.3, time);
      ng.gain.exponentialRampToValueAtTime(0.01, time + dur);
      noise.connect(filt); filt.connect(ng); ng.connect(masterGainRef.current);
      noise.start(time); noise.stop(time + dur);
    } else if (type === "bass" || type === "tom") {
      const osc = ctx.createOscillator();
      osc.type = type === "bass" ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(type === "bass" ? 65 : 250, time);
      osc.frequency.exponentialRampToValueAtTime(type === "bass" ? 55 : 80, time + 0.3);
      gain.gain.setValueAtTime(0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      osc.connect(gain); osc.start(time); osc.stop(time + 0.3);
    } else {
      const osc = ctx.createOscillator(); osc.type = "square";
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      osc.connect(gain); osc.start(time); osc.stop(time + 0.05);
    }
  };

  const stopReplay = () => {
    replayTimersRef.current.forEach((t) => clearTimeout(t));
    replayTimersRef.current = [];
  };

  const playTrack = (track) => {
    if (playingId === track.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(track.id);

    // If the track has a vocal recording, play that
    if (track.vocal_recording_url) {
      const audio = audioRef.current;
      if (audio) {
        audio.src = track.vocal_recording_url;
        audio.onended = () => setPlayingId(null);
        audio.play().catch(() => {});
      }
      return;
    }

    // Generative replay
    stopReplay();
    const ctx = ensureAudioCtx();
    try {
      const pattern = JSON.parse(track.beat_pattern || "{}");
      const trackBpm = track.bpm || 120;
      const stepDuration = 60 / trackBpm / 4;
      const loopLength = stepDuration * 16;

      for (let loop = 0; loop < 3; loop++) {
        Object.entries(pattern).forEach(([padId, steps]) => {
          steps.forEach((stepIdx) => {
            const time = ctx.currentTime + loop * loopLength + stepIdx * stepDuration;
            synthDrum(ctx, padId, time);
          });
        });
      }

      const stopTimer = setTimeout(() => setPlayingId(null), loopLength * 3 * 1000 + 2000);
      replayTimersRef.current.push(stopTimer);
    } catch {
      setPlayingId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      stopReplay();
    };
  }, []);

  useEffect(() => {
    if (!playingId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      stopReplay();
    }
  }, [playingId]);

  // Group tracks into albums and singles
  const albums = {};
  const singles = [];
  tracks.forEach((t) => {
    if (t.album_name) {
      if (!albums[t.album_name]) albums[t.album_name] = [];
      albums[t.album_name].push(t);
    } else {
      singles.push(t);
    }
  });

  const liveCount = tracks.filter((t) => t.radio_status === "live").length;
  const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
  const displayName = profile?.artist_name || decodedName;
  const genre = profile?.genre || tracks[0]?.genre;
  const bio = profile?.bio;
  const artwork = profile?.artwork_url;
  const socialLinks = profile?.social_links || [];
  const upcomingShows = profile?.upcoming_shows || [];
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (tracks.length === 0 && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#05070A" }}>
        <Music2 size={48} className="mb-4" style={{ color: "rgba(209,255,38,0.3)" }} />
        <p className="font-mono text-sm tracking-widest mb-2" style={{ color: "#8A8F98" }}>ARTIST NOT FOUND</p>
        <p className="text-sm mb-6" style={{ color: "#8A8F98" }}>No tracks or profile found for "{decodedName}".</p>
        <Link to="/" className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
          <ArrowLeft size={12} /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      {/* Back link */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      {/* Artist Header */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row items-start gap-6 mb-10">
          {/* Avatar / artwork */}
          <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 flex items-center justify-center" style={{ background: artwork ? "transparent" : "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            {artwork ? (
              <img src={artwork} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <Disc3 size={48} style={{ color: "#D1FF26" }} />
            )}
          </div>

          {/* Name + bio */}
          <div className="flex-1">
            <p className="font-mono text-xs tracking-[0.4em] mb-2" style={{ color: "#D1FF26" }}>// ARTIST PROFILE</p>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
              {displayName}
            </h1>
            {genre && (
              <span className="inline-block font-mono text-[9px] tracking-widest px-3 py-1.5 mb-4" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>
                {genre.toUpperCase()}
              </span>
            )}
            {bio && <p className="text-sm max-w-2xl mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{bio}</p>}

            {/* Stats */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <Music2 size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{tracks.length} TRACKS</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <Radio size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{liveCount} ON AIR</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <Headphones size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{totalPlays.toLocaleString()} PLAYS</span>
              </div>
            </div>

            {/* Tips summary */}
            {tips.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 mb-4" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <DollarSign size={12} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>{tips.length} TIPS · ${tips.reduce((s, t) => s + (t.amount || 0), 0).toFixed(2)} RECEIVED</span>
              </div>
            )}

            {/* Tip Artist button */}
            <div className="mb-4">
              <TipButton artistName={displayName} variant="default" />
            </div>

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link, i) => {
                  const safeHref = safeSocialUrl(link);
                  if (!safeHref) return null;
                  return (
                    <a key={i} href={safeHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                      <ExternalLink size={9} /> {socialUrlLabel(link)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Studio visual */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <img
            src={STUDIO_IMG}
            alt="1 Call Artist studio"
            style={{ width: "100%", maxWidth: 760, height: "auto", display: "block", borderRadius: "2px", border: "0.5px solid rgba(209,255,38,0.2)" }}
          />
        </motion.div>

        {/* Upcoming shows */}
        {upcomingShows.length > 0 && (
          <div className="mb-10 p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={14} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>UPCOMING SHOWS</span>
            </div>
            <div className="space-y-2">
              {upcomingShows.map((show, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "#F5F5F7" }}>
                  <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>►</span>
                  {show}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cover Art Gallery */}
        {tracks.some(t => t.artwork_url) && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-6">
              <ImageIcon size={16} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ COVER ART GALLERY</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tracks.filter(t => t.artwork_url).map((track) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.03 }}
                  className="group relative cursor-pointer"
                  onClick={() => playTrack(track)}
                >
                  <div className="relative aspect-square overflow-hidden" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <img src={proxyMediaUrl(track.artwork_url)} alt={track.track_title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: "rgba(5,7,10,0.7)" }}>
                      <div className="flex items-center justify-center w-12 h-12" style={{ background: "#D1FF26", borderRadius: "50%" }}>
                        <Play size={18} style={{ color: "#05070A" }} />
                      </div>
                    </div>
                    {track.radio_status === "live" && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.9)" }}>
                        <span className="rounded-full" style={{ width: 4, height: 4, background: "#05070A" }} />
                        <span className="font-mono text-[7px] tracking-widest" style={{ color: "#05070A" }}>ON AIR</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-semibold truncate" style={{ color: "#F5F5F7" }}>{track.track_title}</p>
                    {track.album_name && <p className="font-mono text-[7px] truncate" style={{ color: "#8A8F98" }}>{track.album_name}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Discography */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Album size={16} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ DISCOGRAPHY</span>
          </div>

          {/* Albums */}
          {Object.entries(albums).map(([albumName, albumTracks]) => {
            const albumArt = albumTracks.find(t => t.artwork_url)?.artwork_url;
            return (
            <div key={albumName} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: albumArt ? "transparent" : "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                  {albumArt ? (
                    <img src={albumArt} alt={albumName} className="w-full h-full object-cover" />
                  ) : (
                    <Disc3 size={24} style={{ color: "#D1FF26" }} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{albumName}</span>
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>({albumTracks.length} tracks)</span>
                  </div>
                  {albumArt && <span className="font-mono text-[7px] tracking-widest" style={{ color: "#D1FF26" }}>▸ COVER ART ATTACHED</span>}
                </div>
              </div>
              <div className="space-y-2">
                {albumTracks.sort((a, b) => (a.track_number || 0) - (b.track_number || 0)).map((track) => (
                  <TrackRow key={track.id} track={track} playingId={playingId} onPlay={playTrack} />
                ))}
              </div>
            </div>
            );
          })}

          {/* Singles */}
          {singles.length > 0 && (
            <div>
              {Object.keys(albums).length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Music2 size={14} style={{ color: "#8A8F98" }} />
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SINGLES</span>
                </div>
              )}
              <div className="space-y-2">
                {singles.map((track) => (
                  <TrackRow key={track.id} track={track} playingId={playingId} onPlay={playTrack} />
                ))}
              </div>
            </div>
          )}

          {tracks.length === 0 && (
            <div className="text-center py-12">
              <Music2 size={32} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO TRACKS PUBLISHED YET</p>
            </div>
          )}
        </div>

        {/* Listener Voice Reviews */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Mic size={16} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ LISTENER REVIEWS</span>
          </div>
          <VoiceReviewsList artistName={decodedName} />
        </div>
      </div>

      <audio ref={audioRef} preload="none" />
    </div>
  );
}

function TrackRow({ track, playingId, onPlay }) {
  const isPlaying = playingId === track.id;
  const isLive = track.radio_status === "live";
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div>
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 transition-all"
      style={{
        background: isPlaying ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.5)",
        border: `0.5px solid ${isPlaying ? "rgba(209,255,38,0.4)" : isLive ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.1)"}`,
      }}
    >
      <button
        onClick={() => onPlay(track)}
        className="flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all hover:scale-105"
        style={{ background: isPlaying ? "#D1FF26" : "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", borderRadius: "50%" }}
      >
        {isPlaying ? <Pause size={14} style={{ color: "#05070A" }} /> : <Play size={14} style={{ color: "#D1FF26" }} />}
      </button>

      {track.artwork_url && (
        <img src={proxyMediaUrl(track.artwork_url)} alt={track.track_title} className="w-12 h-12 object-cover flex-shrink-0" style={{ border: "0.5px solid rgba(209,255,38,0.2)" }} />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#F5F5F7" }}>{track.track_title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{track.genre}</span>
          {track.bpm && <span className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>{track.bpm} BPM</span>}
          {track.has_vocals && (
            <span className="flex items-center gap-1 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>
              <Sparkles size={7} /> VOCALS
            </span>
          )}
          {isLive && (
            <span className="flex items-center gap-1 font-mono text-[7px] tracking-widest" style={{ color: "#D1FF26" }}>
              <span className="rounded-full" style={{ width: 4, height: 4, background: "#D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
              ON AIR
            </span>
          )}
        </div>
      </div>

      {isLive && track.play_count > 0 && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <TrendingUp size={10} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{track.play_count}</span>
        </div>
      )}

      <TipButton artistName={track.artist_name} trackTitle={track.track_title} trackId={track.id} variant="compact" />
      <button
        onClick={() => setShowReviews(!showReviews)}
        className="flex items-center gap-1.5 px-2.5 py-2 font-mono text-[8px] tracking-widest uppercase transition-all flex-shrink-0"
        style={{
          background: showReviews ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)",
          border: `0.5px solid ${showReviews ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.2)"}`,
          color: "#D1FF26",
        }}
      >
        <Mic size={10} /> {showReviews ? "HIDE" : "REVIEW"}
      </button>
    </motion.div>

      <AnimatePresence>
        {showReviews && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              <VoiceReviewsList trackId={track.id} />
              <VoiceReviewRecorder track={track} onReviewSubmitted={() => {}} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}