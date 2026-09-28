import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Play, Pause, Music, Headphones, Sparkles, Volume2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function DashboardRadioStation() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const replayTimersRef = useRef([]);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.ArtistTrack.list("-updated_date", 50);
      const live = (all || []).filter((t) => t.radio_status === "live");
      live.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
      setTracks(live);
    } catch {
      setError("Could not load radio stations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTracks(); }, [loadTracks]);

  // Audio engine for generative replay of artist tracks
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
      const startFreq = type === "bass" ? 65 : 250;
      const endFreq = type === "bass" ? 55 : 80;
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.3);
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
    if (playing === track.id) {
      setPlaying(null);
      return;
    }
    setPlaying(track.id);

    // If the track has a vocal recording, play that audio file
    if (track.vocal_recording_url) {
      const audio = audioRef.current;
      if (audio) {
        audio.src = track.vocal_recording_url;
        audio.play().catch(() => setError("Could not play vocal track."));
      }
      return;
    }

    // Otherwise, generative replay via Web Audio
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

      const stopTimer = setTimeout(() => {
        setPlaying(null);
      }, loopLength * 3 * 1000 + 2000);
      replayTimersRef.current.push(stopTimer);
    } catch {
      setError("Could not play this track.");
      setPlaying(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      stopReplay();
    };
  }, []);

  // Stop audio when playing changes to null
  useEffect(() => {
    if (!playing) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      stopReplay();
    }
  }, [playing]);

  const totalListeners = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Radio size={16} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ GLOBAL RADIO STATION</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Music size={11} style={{ color: "#8A8F98" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{tracks.length} LIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Headphones size={11} style={{ color: "#8A8F98" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{totalListeners.toLocaleString()} plays</span>
          </div>
        </div>
      </div>

      {error && <p className="font-mono text-[9px]" style={{ color: "#ef4444" }}>⚠ {error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "#D1FF26", borderRightColor: "#D1FF26" }} />
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12 p-6" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Radio size={32} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO TRACKS ON AIR YET</p>
          <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>Artist tracks submitted to radio will appear here.</p>
          <Link to="/#music-studio" className="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            Open Music Studio <ChevronRight size={11} />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {tracks.map((track) => {
              const isPlaying = playing === track.id;
              return (
                <motion.div
                  key={track.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3 p-4 transition-all"
                  style={{
                    background: isPlaying ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.5)",
                    border: `0.5px solid ${isPlaying ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                  }}
                >
                  {/* Play button */}
                  <button
                    onClick={() => playTrack(track)}
                    className="flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all hover:scale-105"
                    style={{
                      background: isPlaying ? "#D1FF26" : "rgba(209,255,38,0.1)",
                      border: "0.5px solid rgba(209,255,38,0.3)",
                      borderRadius: "50%",
                    }}
                  >
                    {isPlaying ? <Pause size={14} style={{ color: "#05070A" }} /> : <Play size={14} style={{ color: "#D1FF26" }} />}
                  </button>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#F5F5F7" }}>{track.track_title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/artist/${encodeURIComponent(track.artist_name)}`} className="font-mono text-[8px] hover:underline" style={{ color: "#D1FF26" }}>{track.artist_name}</Link>
                      <span className="font-mono text-[7px] px-1.5 py-0.5" style={{ background: "rgba(138,143,152,0.1)", color: "#8A8F98" }}>{track.genre}</span>
                      {track.bpm && <span className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>{track.bpm} BPM</span>}
                      {track.has_vocals && (
                        <span className="flex items-center gap-1 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>
                          <Sparkles size={7} /> VOCALS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Equalizer when playing */}
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-6 flex-shrink-0">
                      {[0, 1, 2, 3, 4].map((b) => (
                        <div key={b} className="w-0.5" style={{ background: "#D1FF26", height: "100%", animation: `eqBar 0.6s ${b * 0.12}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  )}

                  {/* Play count */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Headphones size={10} style={{ color: "#8A8F98" }} />
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{(track.play_count || 0).toLocaleString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Hidden audio element for vocal track playback */}
      <audio ref={audioRef} preload="none" />
    </div>
  );
}