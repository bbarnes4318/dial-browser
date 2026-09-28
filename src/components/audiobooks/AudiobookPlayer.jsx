import React, { useState, useRef, useEffect, useCallback } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, X, RotateCcw, Volume2, VolumeX, Gauge, Sliders,
  SkipBack, SkipForward, Loader2, Check, Headphones, Radio, Download,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fileSafe(name) {
  return (name || "audiobook").replace(/[^a-z0-9 _-]/gi, "").trim().replace(/\s+/g, "_") || "audiobook";
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export default function AudiobookPlayer({ book, onClose }) {
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const bassRef = useRef(null);
  const trebleRef = useRef(null);
  const gainRef = useRef(null);
  const chapterIndexRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const resumeChapterRef = useRef(0);
  const resumePositionRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [bassGain, setBassGain] = useState(0);
  const [trebleGain, setTrebleGain] = useState(0);
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [resumed, setResumed] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);

  // Resolve the ordered chapter playlist for this book.
  const chapterUrls = (book.chapter_audio_urls && book.chapter_audio_urls.length > 0)
    ? book.chapter_audio_urls.filter(Boolean)
    : (book.audio_url ? [book.audio_url] : []);
  const multiChapter = chapterUrls.length > 1;

  // Load saved progress for this book and jump to the exact chapter + position.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await base44.entities.AudiobookProgress.list("-updated_date", 50);
        const match = (existing || []).find((p) => p.audiobook_id === book.id);
        if (!cancelled) {
          setProgress(match || null);
          const ch = Math.max(0, Math.min(chapterUrls.length - 1, match?.chapter_index || 0));
          const pos = match?.position_seconds || 0;
          resumeChapterRef.current = ch;
          resumePositionRef.current = pos;
          if (ch > 0 && ch !== chapterIndexRef.current) {
            chapterIndexRef.current = ch;
            setChapterIndex(ch);
          }
        }
      } catch {
        // no progress
      } finally {
        if (!cancelled) setLoadingProgress(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  // Reset playback state when the book changes. The exact chapter is (re)set by
  // the progress loader below once any saved position is known.
  useEffect(() => {
    chapterIndexRef.current = 0;
    setChapterIndex(0);
    resumeChapterRef.current = 0;
    resumePositionRef.current = 0;
    setResumed(false);
    wasPlayingRef.current = false;
  }, [book.id]);

  // Keep ref in sync.
  useEffect(() => { chapterIndexRef.current = chapterIndex; }, [chapterIndex]);

  // Load the current chapter's source into the audio element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = proxyMediaUrl(chapterUrls[chapterIndex] || book.audio_url);
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    setCurrentTime(0);
    setDuration(0);
    if (wasPlayingRef.current) {
      setTimeout(() => {
        const a = audioRef.current;
        if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIndex, book.id]);

  // Setup Web Audio API for EQ
  const setupAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioCtxRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(audio);
      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 250;
      bass.gain.value = bassGain;
      const treble = ctx.createBiquadFilter();
      treble.type = "highshelf";
      treble.frequency.value = 3000;
      treble.gain.value = trebleGain;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(bass);
      bass.connect(treble);
      treble.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      sourceRef.current = source;
      bassRef.current = bass;
      trebleRef.current = treble;
      gainRef.current = gain;
    } catch {
      // Web Audio not available — fallback to normal playback
    }
  }, [bassGain, trebleGain, volume]);

  useEffect(() => { if (bassRef.current) bassRef.current.gain.value = bassGain; }, [bassGain]);
  useEffect(() => { if (trebleRef.current) trebleRef.current.gain.value = trebleGain; }, [trebleGain]);
  useEffect(() => { if (gainRef.current) gainRef.current.gain.value = muted ? 0 : volume; }, [volume, muted]);

  // Go to a specific chapter (used by next/prev and auto-advance).
  const goChapter = useCallback((n) => {
    if (n < 0 || n >= chapterUrls.length) return;
    wasPlayingRef.current = true;
    setResumed(true);
    chapterIndexRef.current = n;
    setChapterIndex(n);
  }, [chapterUrls.length]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => {
      setDuration(audio.duration);
      // Resume at the exact saved chapter + position.
      if (!resumed && chapterIndexRef.current === resumeChapterRef.current && resumePositionRef.current > 0 && resumePositionRef.current < audio.duration) {
        audio.currentTime = resumePositionRef.current;
        setResumed(true);
      }
    };
    const onPlaying = () => { setPlaying(true); setBuffering(false); };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onEnded = async () => {
      if (multiChapter && chapterIndexRef.current < chapterUrls.length - 1) {
        goChapter(chapterIndexRef.current + 1);
        return;
      }
      setPlaying(false);
      wasPlayingRef.current = false;
      if (progress) {
        try {
          await base44.entities.AudiobookProgress.update(progress.id, {
            completed: true,
            position_seconds: audio.duration || 0,
            duration_seconds: audio.duration || 0,
            chapter_index: chapterIndexRef.current,
            last_listened_at: new Date().toISOString(),
          });
        } catch {}
      }
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
    };
  }, [progress, resumed, multiChapter, chapterUrls, goChapter]);

  // Save progress periodically while playing
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(async () => {
      const audio = audioRef.current;
      if (!audio || audio.currentTime === 0) return;
      try {
        if (progress) {
          await base44.entities.AudiobookProgress.update(progress.id, {
            position_seconds: audio.currentTime,
            duration_seconds: audio.duration || 0,
            chapter_index: chapterIndexRef.current,
            last_listened_at: new Date().toISOString(),
          });
        } else {
          const created = await base44.entities.AudiobookProgress.create({
            audiobook_id: book.id,
            audiobook_title: book.title,
            position_seconds: audio.currentTime,
            duration_seconds: audio.duration || 0,
            chapter_index: chapterIndexRef.current,
            completed: false,
            last_listened_at: new Date().toISOString(),
          });
          setProgress(created);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [playing, progress, book.id, book.title]);

  // Save on unmount/close
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio && progress && audio.currentTime > 0) {
        base44.entities.AudiobookProgress.update(progress.id, {
          position_seconds: audio.currentTime,
          duration_seconds: audio.duration || 0,
          chapter_index: chapterIndexRef.current,
          last_listened_at: new Date().toISOString(),
        }).catch(() => {});
      }
    };
  }, [progress]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setupAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    resumeChapterRef.current = 0;
    resumePositionRef.current = 0;
    chapterIndexRef.current = 0;
    setChapterIndex(0);
    setResumed(true);
    wasPlayingRef.current = true;
    setTimeout(() => { const a = audioRef.current; if (a) { a.currentTime = 0; a.play().catch(() => {}); } }, 200);
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(duration, pct * duration));
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasProgress = progress && progress.position_seconds > 0 && !progress.completed;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(5,7,10,0.95)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-md"
        style={{ background: "rgba(16,20,29,0.9)", border: "0.5px solid rgba(209,255,38,0.3)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
          <div className="flex items-center gap-2">
            <Headphones size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// NOW PLAYING</p>
            {multiChapter && (
              <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>
                CH {chapterIndex + 1}/{chapterUrls.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Cover */}
          <div className="flex gap-4 mb-5">
            <div className="w-16 h-16 flex-shrink-0 overflow-hidden" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              {book.cover_art_url ? (
                <img src={proxyMediaUrl(book.cover_art_url)} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Headphones size={20} style={{ color: "rgba(209,255,38,0.3)" }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{book.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8A8F98" }}>{book.author}</p>
              {book.narrator && <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>Narrated by {book.narrator}</p>}
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>{book.genre.toUpperCase()}</span>
                <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(5,7,10,0.6)", color: book.maturity_rating === "R" ? "#ef4444" : "#8A8F98" }}>{book.maturity_rating}</span>
                {book.chapter_count > 1 && <span className="font-mono text-[7px]" style={{ color: "#8A8F98" }}>{book.chapter_count} CHAPTERS</span>}
              </div>
            </div>
          </div>

          {/* Continue / Resume indicator */}
          {hasProgress && !resumed && loadingProgress && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <Loader2 size={12} className="animate-spin" style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>RESUMING FROM {formatTime(progress.position_seconds)}…</p>
            </div>
          )}
          {hasProgress && resumed && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <Check size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>RESUMED FROM {formatTime(progress.position_seconds)}</p>
            </div>
          )}

          {/* Seek bar */}
          <div className="mb-4">
            <div className="relative h-2 cursor-pointer" onClick={seek} style={{ background: "rgba(138,143,152,0.15)" }}>
              <div className="absolute top-0 left-0 h-full" style={{ width: `${pct}%`, background: "#D1FF26" }} />
              {hasProgress && progress.position_seconds > 0 && (
                <div className="absolute top-0 h-full w-0.5" style={{ left: `${(progress.position_seconds / (duration || 1)) * 100}%`, background: "rgba(209,255,38,0.4)" }} />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{formatTime(currentTime)}</span>
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={restart}
              className="flex items-center justify-center w-10 h-10 transition-all hover:scale-105"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", borderRadius: "50%", color: "#8A8F98" }}
              title="Restart from beginning"
            >
              <RotateCcw size={16} />
            </button>

            {multiChapter ? (
              <button
                onClick={() => goChapter(chapterIndexRef.current - 1)}
                disabled={chapterIndex === 0}
                className="flex items-center justify-center w-10 h-10 transition-all hover:scale-105 disabled:opacity-30"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", borderRadius: "50%", color: "#8A8F98" }}
                title="Previous chapter"
              >
                <SkipBack size={16} />
              </button>
            ) : null}

            <button
              onClick={togglePlay}
              disabled={buffering}
              className="flex items-center justify-center w-14 h-14 transition-all hover:scale-105"
              style={{ background: "#D1FF26", borderRadius: "50%" }}
            >
              {buffering ? <Loader2 size={22} className="animate-spin" style={{ color: "#05070A" }} /> :
                playing ? <Pause size={22} style={{ color: "#05070A" }} /> : <Play size={22} style={{ color: "#05070A" }} />}
            </button>

            {multiChapter ? (
              <button
                onClick={() => goChapter(chapterIndexRef.current + 1)}
                disabled={chapterIndex >= chapterUrls.length - 1}
                className="flex items-center justify-center w-10 h-10 transition-all hover:scale-105 disabled:opacity-30"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", borderRadius: "50%", color: "#8A8F98" }}
                title="Next chapter"
              >
                <SkipForward size={16} />
              </button>
            ) : (
              <button
                onClick={() => { setMuted(!muted); }}
                className="flex items-center justify-center w-10 h-10 transition-all hover:scale-105"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", borderRadius: "50%", color: muted ? "#ef4444" : "#8A8F98" }}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}

            <a
              href={`/functions/download-audiobook?id=${book.id}`}
              download={`${fileSafe(book.title)}.mp3`}
              className="flex items-center justify-center w-10 h-10 transition-all hover:scale-105"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", borderRadius: "50%", color: "#D1FF26" }}
              title="Download MP3"
            >
              <Download size={16} />
            </a>
          </div>

          {/* Speed + Settings */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Gauge size={11} style={{ color: "#8A8F98" }} />
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSpeed(s); if (audioRef.current) audioRef.current.playbackRate = s; }}
                  className="px-2 py-1 font-mono text-[8px] tracking-wider transition-all"
                  style={{
                    background: speed === s ? "rgba(209,255,38,0.15)" : "transparent",
                    color: speed === s ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1 px-2 py-1 transition-all"
              style={{
                background: showSettings ? "rgba(209,255,38,0.1)" : "transparent",
                color: showSettings ? "#D1FF26" : "#8A8F98",
              }}
            >
              <Sliders size={12} /> EQ
            </button>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// STUDIO SOUND SETTINGS</p>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>BASS BOOST</span>
                      <span className="font-mono text-[8px]" style={{ color: bassGain > 0 ? "#D1FF26" : "#8A8F98" }}>{bassGain > 0 ? `+${bassGain}dB` : "OFF"}</span>
                    </div>
                    <input type="range" min={0} max={12} step={1} value={bassGain} onChange={(e) => setBassGain(Number(e.target.value))} className="w-full" style={{ accentColor: "#D1FF26" }} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>TREBLE BOOST</span>
                      <span className="font-mono text-[8px]" style={{ color: trebleGain > 0 ? "#D1FF26" : "#8A8F98" }}>{trebleGain > 0 ? `+${trebleGain}dB` : "OFF"}</span>
                    </div>
                    <input type="range" min={0} max={12} step={1} value={trebleGain} onChange={(e) => setTrebleGain(Number(e.target.value))} className="w-full" style={{ accentColor: "#D1FF26" }} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>VOLUME</span>
                      <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{Math.round(volume * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1.5} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" style={{ accentColor: "#D1FF26" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setMuted(!muted); }}
                      className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[8px] tracking-widest"
                      style={{ background: muted ? "rgba(239,68,68,0.12)" : "transparent", color: muted ? "#ef4444" : "#8A8F98" }}
                    >
                      {muted ? <VolumeX size={12} /> : <Volume2 size={12} />} {muted ? "MUTED" : "MUTE"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quality note */}
        <div className="px-4 pb-4 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(209,255,38,0.05)" }}>
          <Radio size={10} style={{ color: "rgba(209,255,38,0.4)" }} />
          <p className="font-mono text-[7px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>HUMAN NARRATION · STUDIO QUALITY AUDIO</p>
        </div>
      </motion.div>

      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </motion.div>
  );
}