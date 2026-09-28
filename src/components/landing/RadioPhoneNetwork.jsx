import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Play, Pause, Music, Headphones, Upload, DollarSign, Star, Users, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ArtistLeaderboard from "@/components/music/ArtistLeaderboard";
import TrackShareButton from "@/components/music/TrackShareButton";
import TipButton from "@/components/music/TipButton";
import RadioScheduleBoard from "@/components/landing/RadioScheduleBoard";

const stations = [
  { id: "s1", name: "Phosphor Beats", genre: "Electronic", listeners: 12453, nowPlaying: "Live ambient & downtempo stream", streamUrl: "https://ice1.somafm.com/groovesalad-128-mp3" },
  { id: "s2", name: "The Underground", genre: "Electronic", listeners: 8921, nowPlaying: "cliqhop idm & experimental beats", streamUrl: "https://ice1.somafm.com/cliqhop-128-mp3" },
  { id: "s3", name: "Midnight Jazz", genre: "Jazz", listeners: 5432, nowPlaying: "Sonic Universe — transcending jazz", streamUrl: "https://ice1.somafm.com/sonicuniverse-128-mp3" },
  { id: "s4", name: "Country Roads FM", genre: "Country", listeners: 7834, nowPlaying: "Boot Liquor — Americana roots", streamUrl: "https://ice1.somafm.com/bootliquor-128-mp3" },
  { id: "s5", name: "Rock Frequency", genre: "Rock", listeners: 9876, nowPlaying: "Fluid — futuristic beats", streamUrl: "https://ice1.somafm.com/fluid-128-mp3" },
  { id: "s6", name: "R&B Soul Channel", genre: "R&B", listeners: 6543, nowPlaying: "Seven Inch Soul — vintage 45s", streamUrl: "https://ice1.somafm.com/7soul-128-mp3" },
  { id: "s7", name: "Ambient Drone", genre: "Ambient", listeners: 3421, nowPlaying: "Drone Zone — served best chilled", streamUrl: "https://ice1.somafm.com/dronezone-128-mp3" },
  { id: "s8", name: "Reggae Vibes", genre: "World", listeners: 4567, nowPlaying: "Suburbs of Goa — global rhythms", streamUrl: "https://ice1.somafm.com/suburbsofgoa-128-mp3" },
  { id: "s9", name: "Pop Pulse", genre: "Pop", listeners: 11234, nowPlaying: "Indie Pop Rocks — new & classic", streamUrl: "https://ice1.somafm.com/indiepop-128-mp3" },
  { id: "s10", name: "DEF Con Radio", genre: "Electronic", listeners: 8765, nowPlaying: "Music for the hacker community", streamUrl: "https://ice1.somafm.com/defcon-128-mp3" },
  { id: "s11", name: "Indie Frequency", genre: "Indie", listeners: 5678, nowPlaying: "Indie Pop Rocks — fresh tracks", streamUrl: "https://ice1.somafm.com/indiepop-128-mp3" },
  { id: "s12", name: "Space Station", genre: "Ambient", listeners: 4321, nowPlaying: "Tune in, turn on, space out", streamUrl: "https://ice1.somafm.com/spacestation-128-mp3" },
];

// Genres are now built dynamically from station + artist track data

export default function RadioPhoneNetwork() {
  const [inView, setInView] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [selectedId, setSelectedId] = useState(stations[0].id);
  const [activeGenre, setActiveGenre] = useState("All");
  const [uploadStep, setUploadStep] = useState("idle");
  const [artistName, setArtistName] = useState("");
  const [trackName, setTrackName] = useState("");
  const [artistTracks, setArtistTracks] = useState([]);
  const [artistTrackLoading, setArtistTrackLoading] = useState(false);
  const sectionRef = useRef(null);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const replayTimersRef = useRef([]);

  // Load live artist tracks from the database
  const [trackLoadError, setTrackLoadError] = useState(false);
  const loadArtistTracks = useCallback(async () => {
    setArtistTrackLoading(true);
    setTrackLoadError(false);
    try {
      const all = await base44.entities.ArtistTrack.list("-updated_date", 50);
      const live = (all || []).filter(t => t.radio_status === "live");
      setArtistTracks(live);
    } catch (e) {
      console.error("[RadioPhoneNetwork] Failed to load artist tracks:", e);
      setTrackLoadError(true);
      setArtistTracks([]);
    } finally {
      setArtistTrackLoading(false);
    }
  }, []);

  useEffect(() => { loadArtistTracks(); }, [loadArtistTracks]);

  // Build a combined station list: artist originals first, then SomaFM
  const allStations = [
    ...artistTracks.map(t => ({
      id: `artist-${t.id}`,
      name: t.track_title,
      genre: t.genre || "Electronic",
      listeners: t.play_count || 0,
      nowPlaying: `Original by ${t.artist_name}${t.bpm ? ` · ${t.bpm} BPM` : ""}`,
      streamUrl: null, // generative — replayed via Web Audio
      isArtistOriginal: true,
      trackData: t,
    })),
    ...stations,
  ];

  // Sync audio element with playing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      const station = allStations.find((s) => s.id === playing);
      if (!station) return;

      // Artist originals are generative — replay via Web Audio API
      if (station.isArtistOriginal) {
        replayArtistTrack(station.trackData);
        return;
      }

      if (!station.streamUrl) return;
      setStreamLoading(true);
      setStreamError(null);
      audio.src = station.streamUrl;
      audio.play()
        .then(() => setStreamLoading(false))
        .catch(() => {
          setStreamLoading(false);
          setStreamError("Unable to connect. Try another station.");
          setPlaying(null);
        });
    } else {
      audio.pause();
      audio.src = "";
      setStreamError(null);
      stopReplay();
    }
  }, [playing, artistTracks]);

  // Drum synthesis for artist track replay (matches MusicStudio)
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
      const osc = ctx.createOscillator(); osc.frequency.value = 200;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.5, time); og.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.connect(og); og.connect(masterGainRef.current); osc.start(time); osc.stop(time + 0.1);
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

  const synthNote = (ctx, freq, time) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    osc.connect(gain); gain.connect(masterGainRef.current);
    osc.start(time); osc.stop(time + 0.5);
  };

  const stopReplay = () => {
    replayTimersRef.current.forEach(t => clearTimeout(t));
    replayTimersRef.current = [];
  };

  const replayArtistTrack = (track) => {
    stopReplay();
    const ctx = ensureAudioCtx();

    try {
      // Play beat pattern in a loop
      const pattern = JSON.parse(track.beat_pattern || "{}");
      const trackBpm = track.bpm || 120;
      const stepDuration = (60 / trackBpm / 4);
      const loopLength = stepDuration * 16; // 16-step loop

      // Schedule 3 loops for a satisfying listen
      for (let loop = 0; loop < 3; loop++) {
        Object.entries(pattern).forEach(([padId, steps]) => {
          steps.forEach((stepIdx) => {
            const time = ctx.currentTime + loop * loopLength + stepIdx * stepDuration;
            synthDrum(ctx, padId, time);
          });
        });
      }

      // Schedule recorded melody notes
      const notes = JSON.parse(track.recorded_notes || "[]");
      notes.forEach((event) => {
        const timer = setTimeout(() => {
          if (!audioCtxRef.current) return;
          if (event.type === "drum") synthDrum(audioCtxRef.current, event.padId, audioCtxRef.current.currentTime);
          else if (event.type === "note") synthNote(audioCtxRef.current, event.freq, audioCtxRef.current.currentTime);
        }, event.time * 1000);
        replayTimersRef.current.push(timer);
      });

      // Auto-stop after loops complete
      const stopTimer = setTimeout(() => {
        if (playing && playing.startsWith("artist-")) setPlaying(null);
      }, loopLength * 3 * 1000 + 2000);
      replayTimersRef.current.push(stopTimer);
    } catch {
      setStreamError("Could not play this track.");
      setPlaying(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      stopReplay();
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const filteredStations = activeGenre === "All" ? allStations : allStations.filter((s) => s.genre === activeGenre);
  const totalListeners = allStations.reduce((sum, s) => sum + s.listeners, 0);
  const selectedStation = allStations.find((s) => s.id === selectedId) || allStations[0];

  // Dropdown options: group by genre — include any genres from artist tracks
  const allGenres = [...new Set([...stations.map(s => s.genre), ...artistTracks.map(t => t.genre)])];
  const dropdownGenres = activeGenre === "All" ? allGenres : [activeGenre];

  const handleUpload = () => {
    if (!artistName.trim() || !trackName.trim()) return;
    setUploadStep("submitting");
    setTimeout(() => setUploadStep("submitted"), 1500);
  };

  const resetUpload = () => {
    setUploadStep("idle");
    setArtistName("");
    setTrackName("");
  };

  return (
    <section ref={sectionRef} id="radio-phone" className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Radio Phone Station branding graphic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-8 flex justify-center"
        >
          <img
            src="https://media.base44.com/images/public/6a422320311efd575ae6536c/15ccd3c88_Gemini_Generated_Image_q3x02aq3x02aq3x0.jpg"
            alt="Radio Phone Station — Model RPS-01 console"
            draggable={false}
            style={{ width: "100%", maxWidth: "1000px", height: "auto", display: "block", borderRadius: "2px", border: "0.5px solid rgba(209,255,38,0.15)" }}
          />
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
              <Star size={12} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>PREMIUM SERVICE</span>
            </div>
          </div>
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// RADIO PHONE NETWORK™</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            50+ Stations. <span style={{ color: "#D1FF26" }}>Zero Apps.</span>
          </h2>
          <p className="text-lg font-light max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Over 50 radio phone stations broadcasting music from every genre, 24/7. Dial in and listen instantly — no downloads, no data plans. Artists: get your music heard by millions of new listeners.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="grid grid-cols-3 gap-3 mb-8 max-w-2xl mx-auto">
          <div className="p-4 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>STATIONS</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{allStations.length}+</p>
          </div>
          <div className="p-4 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>LIVE LISTENERS</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{(totalListeners / 1000).toFixed(1)}K</p>
          </div>
          <div className="p-4 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>GENRES</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{allGenres.length}+</p>
          </div>
        </motion.div>

        {/* Genre filter */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.15 }} className="flex flex-wrap justify-center gap-2 mb-8">
          {["All", ...allGenres].map((genre) => {
            const isActive = activeGenre === genre;
            return (
              <button key={genre} onClick={() => { setActiveGenre(genre); const first = genre === "All" ? allStations[0] : allStations.find((s) => s.genre === genre); if (first) setSelectedId(first.id); }} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>
                {genre}
              </button>
            );
          })}
        </motion.div>

        {/* Artist original badge */}
        {artistTracks.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
              <Sparkles size={12} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>{artistTracks.length} ARTIST ORIGINALS ON AIR</span>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Station dropdown + detail */}
          <div className="lg:col-span-2">
            {/* Dropdown selector */}
            <div className="mb-4">
              <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>▸ SELECT A STATION</label>
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-4 py-3 font-mono text-sm appearance-none cursor-pointer"
                  style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#F5F5F7" }}
                >
                  {dropdownGenres.map((genre) => {
                    const genreStations = allStations.filter((s) => s.genre === genre);
                    if (genreStations.length === 0) return null;
                    return (
                      <optgroup key={genre} label={genre} style={{ color: "#D1FF26" }}>
                        {genreStations.map((s) => (
                          <option key={s.id} value={s.id} style={{ color: "#F5F5F7", background: "#10141D" }}>
                            {s.isArtistOriginal ? "★ " : ""}{s.name} — {s.nowPlaying}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                  <Radio size={14} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>{selectedStation.genre.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Selected station detail card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="p-5"
                style={{ background: playing === selectedStation.id ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${playing === selectedStation.id ? "rgba(209,255,38,0.35)" : "rgba(138,143,152,0.12)"}` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center" style={{ width: 40, height: 40, background: selectedStation.isArtistOriginal ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.08)", border: `0.5px solid ${selectedStation.isArtistOriginal ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.25)"}` }}>
                      {selectedStation.isArtistOriginal ? <Music size={16} style={{ color: "#D1FF26" }} /> : <Radio size={16} style={{ color: "#D1FF26" }} />}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{selectedStation.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>{selectedStation.genre.toUpperCase()}</p>
                        {selectedStation.isArtistOriginal && (
                          <span className="flex items-center gap-1 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>
                            <Sparkles size={8} /> ARTIST ORIGINAL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {playing === selectedStation.id && <div className="flex items-end gap-0.5 h-4">{[0,1,2,3].map((b) => <div key={b} className="w-0.5" style={{ background: "#D1FF26", height: "100%", animation: `eqBar 0.6s ${b * 0.15}s ease-in-out infinite` }} />)}</div>}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>NOW PLAYING</p>
                    <p className="text-xs truncate" style={{ color: "#F5F5F7" }}>{selectedStation.nowPlaying}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Headphones size={9} style={{ color: "#8A8F98" }} />
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{selectedStation.listeners.toLocaleString()} listening</span>
                  </div>
                </div>

                {streamError && playing === selectedStation.id && (
                  <p className="font-mono text-[9px] mb-2" style={{ color: "#ef4444" }}>⚠ {streamError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPlaying(playing === selectedStation.id ? null : selectedStation.id)}
                    disabled={streamLoading && !selectedStation.isArtistOriginal}
                    className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-50"
                    style={{ background: playing === selectedStation.id ? "#D1FF26" : "rgba(209,255,38,0.08)", border: `0.5px solid ${playing === selectedStation.id ? "#D1FF26" : "rgba(209,255,38,0.3)"}`, color: playing === selectedStation.id ? "#05070A" : "#D1FF26" }}
                  >
                    {streamLoading && !selectedStation.isArtistOriginal ? <Radio size={12} className="animate-pulse" /> : playing === selectedStation.id ? <Pause size={12} /> : <Play size={12} />}
                    {streamLoading && !selectedStation.isArtistOriginal ? "CONNECTING..." : playing === selectedStation.id ? "ON AIR" : selectedStation.isArtistOriginal ? "PLAY ORIGINAL" : "TUNE IN"}
                  </button>
                  {selectedStation.isArtistOriginal && (
                    <>
                      <TipButton artistName={selectedStation.trackData.artist_name} trackTitle={selectedStation.trackData.track_title} trackId={selectedStation.trackData.id} variant="compact" />
                      <TrackShareButton track={selectedStation.trackData} />
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Artist upload + now playing */}
          <div className="space-y-4">
            {/* Now playing panel */}
            {playing && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Radio size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// NOW STREAMING</p>
                </div>
                {(() => {
                  const st = allStations.find((s) => s.id === playing);
                  if (!st) return null;
                  return (
                    <div>
                      <p className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{st.name}</p>
                      <p className="font-mono text-[9px] mb-3" style={{ color: "#8A8F98" }}>{st.genre}</p>
                      <div className="flex items-end gap-0.5 h-10 mb-3">{[...Array(20)].map((_, i) => <div key={i} className="flex-1" style={{ background: "#D1FF26", opacity: 0.2 + Math.random() * 0.8, animation: `eqBar ${0.4 + Math.random() * 0.5}s ${i * 0.04}s ease-in-out infinite` }} />)}</div>
                      <p className="text-xs" style={{ color: "#F5F5F7" }}>{st.nowPlaying}</p>
                      {st.isArtistOriginal && <p className="font-mono text-[8px] mt-1" style={{ color: "#D1FF26" }}>★ ARTIST ORIGINAL · GENERATIVE REPLAY</p>}
                      <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>Dial *535# to tune in</p>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* Artist upload demo */}
            <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Upload size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ARTIST SUBMISSION</p>
              </div>
              <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>Get your music on 50+ stations heard by millions of new listeners.</p>

              <AnimatePresence mode="wait">
                {uploadStep === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Artist name" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                    <input type="text" value={trackName} onChange={(e) => setTrackName(e.target.value)} placeholder="Track title" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                    <button onClick={handleUpload} disabled={!artistName.trim() || !trackName.trim()} className="w-full py-3 flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                      <Upload size={12} /> Submit Track
                    </button>
                  </motion.div>
                )}
                {uploadStep === "submitting" && (
                  <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
                    <div className="w-8 h-8 border-2 border-transparent rounded-full animate-spin mb-4" style={{ borderTopColor: "#D1FF26", borderRightColor: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>SUBMITTING TO STATIONS...</p>
                  </motion.div>
                )}
                {uploadStep === "submitted" && (
                  <motion.div key="submitted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                    <Music size={32} className="mx-auto mb-3" style={{ color: "#D1FF26" }} />
                    <p className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>Track Submitted!</p>
                    <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>"{trackName}" by {artistName} is now in rotation across matching genre stations.</p>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Users size={12} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>EST. REACH: 2.4M LISTENERS</span>
                    </div>
                    <button onClick={resetUpload} className="w-full py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>Submit Another</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pricing */}
            <div className="p-5 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
              <DollarSign size={20} className="mx-auto mb-2" style={{ color: "#D1FF26" }} />
              <p className="font-heading font-black text-3xl" style={{ color: "#F5F5F7" }}>$7.99<span className="text-sm font-mono" style={{ color: "#8A8F98" }}>/mo</span></p>
              <p className="font-mono text-[9px] mt-2" style={{ color: "#8A8F98" }}>Unlimited station access</p>
              <button className="w-full mt-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>Subscribe</button>
            </div>
          </div>
        </div>

        {/* Radio Schedule — what's playing next */}
        <RadioScheduleBoard />

        {/* Artist Leaderboard — top artists and songs by engagement */}
        <ArtistLeaderboard />
      </div>
      {/* Hidden audio element for real stream playback */}
      <audio ref={audioRef} preload="none" />
    </section>
  );
}