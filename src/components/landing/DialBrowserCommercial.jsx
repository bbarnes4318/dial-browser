import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronRight, Sparkles } from "lucide-react";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";
import { Link } from "react-router-dom";

const VOICEOVER_URL = "https://media.base44.com/files/public/6a422320311efd575ae6536c/e300e3501_speech.mp3";

const SCENES = [
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/e10e60c73_generated_image.png",
    kicker: "INTRO",
    title: "Call. Connect. Browse.",
    caption: "No WiFi required. Any phone becomes a command center.",
    cta: null,
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/f9e8502c4_generated_image.png",
    kicker: "SERVICES",
    title: "Find Help Fast",
    caption: "Plumbers, electricians, contractors — booked by voice in seconds.",
    cta: { label: "Browse Services", to: "/directory" },
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/6f8409d9a_generated_image.png",
    kicker: "SAFETY",
    title: "One-Call SOS",
    caption: "Emergency help is one call away — 24/7.",
    cta: { label: "Emergency Tools", to: "/emergency-broadcast" },
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/a8480f80c_generated_image.png",
    kicker: "DATING",
    title: "1 Call Dating",
    caption: "Hear real voices. Find your real connection.",
    cta: { label: "Enter Dating", to: "/dating" },
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/ecfc58996_generated_image.png",
    kicker: "GAMES",
    title: "Games by SMS",
    caption: "Blockbuster titles delivered to your phone — instantly.",
    cta: { label: "Play Now", to: "/games" },
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/4b5bf897d_generated_image.png",
    kicker: "CONNECT",
    title: "Stay Connected.",
    caption: "Social, radio & TV in one network. Dial Browser — 1 Call Away.",
    cta: null,
  },
];

export default function DialBrowserCommercial() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  const sceneCount = SCENES.length;
  const sceneDuration = duration > 0 ? duration / sceneCount : 5;
  const activeScene = duration > 0 ? Math.min(sceneCount - 1, Math.floor(currentTime / sceneDuration)) : 0;
  const isFinished = duration > 0 && currentTime >= duration - 0.25;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.25 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Keep audio element muted state in sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !duration) setDuration(audioRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current?.duration) setDuration(audioRef.current.duration);
  };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (isFinished) { audio.currentTime = 0; setCurrentTime(0); }
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
      setHasStarted(true);
    }
  }, [isPlaying, isFinished]);

  const replay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().then(() => { setIsPlaying(true); setHasStarted(true); }).catch(() => {});
  }, []);

  const seekToScene = (i) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = i * sceneDuration + 0.01;
    setCurrentTime(audio.currentTime);
    if (!isPlaying) {
      audio.play().then(() => { setIsPlaying(true); setHasStarted(true); }).catch(() => {});
    }
  };

  return (
    <section
      ref={sectionRef}
      id="commercial"
      className="snap-section relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      {/* Ambient scanline backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg, #D1FF26 0px, transparent 1px, transparent 3px)" }} />

      <div className="relative z-10 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Sparkles size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.35em]" style={{ color: "#D1FF26" }}>// THE 30-SECOND COMMERCIAL</span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Dial Browser <span style={{ color: "#D1FF26" }}>in 30 Seconds</span>
          </h2>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Press play. Hear it in a real voice. Tap any scene to jump — your interactive storyboard tour of the platform.
          </p>
        </motion.div>

        {/* Main stage */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "16 / 9",
            border: "0.5px solid rgba(209,255,38,0.25)",
            boxShadow: "0 0 60px rgba(209,255,38,0.08)",
            background: "#000",
          }}
        >
          {/* Scene images with Ken Burns + crossfade */}
          <AnimatePresence mode="sync">
            {SCENES.map((scene, i) =>
              i === activeScene ? (
                <motion.div
                  key={scene.img}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.img
                    src={scene.img}
                    alt={scene.title}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: Math.max(4, sceneDuration), ease: "easeOut" }}
                    draggable={false}
                  />
                  {/* Cinematic dark scrim */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,7,10,0.25) 0%, transparent 35%, rgba(5,7,10,0.85) 100%)" }} />
                  {/* Letterbox bars */}
                  <div className="absolute top-0 left-0 right-0 h-[5%] bg-black" />
                  <div className="absolute bottom-0 left-0 right-0 h-[5%] bg-black" />
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {/* Scene caption overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 lg:p-12 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScene}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                <p className="font-mono text-[10px] sm:text-xs tracking-[0.35em] mb-2" style={{ color: "#D1FF26" }}>
                  {SCENES[activeScene].kicker} <span style={{ color: "rgba(138,143,152,0.6)" }}>· {String(activeScene + 1).padStart(2, "0")} / {String(sceneCount).padStart(2, "0")}</span>
                </p>
                <h3 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl tracking-tight mb-2" style={{ color: "#F5F5F7", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                  {SCENES[activeScene].title}
                </h3>
                <p className="text-sm sm:text-base max-w-xl" style={{ color: "rgba(245,245,247,0.85)", textShadow: "0 1px 10px rgba(0,0,0,0.8)" }}>
                  {SCENES[activeScene].caption}
                </p>
                {SCENES[activeScene].cta && (
                  <Link
                    to={SCENES[activeScene].cta.to}
                    className="pointer-events-auto inline-flex items-center gap-2 mt-5 px-6 py-3 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.4)]"
                    style={{ background: "#D1FF26", color: "#05070A", alignSelf: "flex-start" }}
                  >
                    {SCENES[activeScene].cta.label} <ChevronRight size={14} />
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pre-start overlay */}
          <AnimatePresence>
            {!hasStarted && (
              <motion.button
                onClick={togglePlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-20"
                style={{ background: "rgba(5,7,10,0.55)", backdropFilter: "blur(2px)" }}
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "#D1FF26", boxShadow: "0 0 50px rgba(209,255,38,0.5)" }}
                >
                  <Play size={36} fill="#05070A" style={{ color: "#05070A", marginLeft: 4 }} />
                </motion.div>
                <p className="font-mono text-[10px] tracking-[0.35em]" style={{ color: "#D1FF26" }}>// PRESS PLAY — 30 SECOND TOUR</p>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Finished CTA overlay */}
          <AnimatePresence>
            {isFinished && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6"
                style={{ background: "rgba(5,7,10,0.82)", backdropFilter: "blur(4px)" }}
              >
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="text-center">
                  <p className="font-mono text-[10px] tracking-[0.35em] mb-3" style={{ color: "#D1FF26" }}>// JOIN THE NETWORK</p>
                  <h3 className="font-heading font-black text-3xl sm:text-5xl mb-4" style={{ color: "#F5F5F7" }}>
                    1 Call <span style={{ color: "#D1FF26" }}>Away.</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => openRegistrationModal()}
                      className="px-8 py-3.5 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_30px_rgba(209,255,38,0.35)]"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      Join Now
                    </button>
                    <button
                      onClick={replay}
                      className="px-8 py-3.5 font-mono text-[11px] tracking-widest uppercase transition-all flex items-center gap-2"
                      style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                    >
                      <RotateCcw size={13} /> Replay
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <div className="absolute bottom-[5%] left-0 right-0 h-[3px] z-30" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full" style={{ background: "linear-gradient(90deg, #D1FF26, #22d3ee)" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
          </div>
        </motion.div>

        {/* Controls bar */}
        <div className="flex items-center gap-3 sm:gap-4 mt-4 px-1">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} fill="#D1FF26" />} {isPlaying ? "Pause" : isFinished ? "Replay" : "Play"}
          </button>
          <button
            onClick={replay}
            className="flex items-center gap-2 px-3 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{ background: "rgba(138,143,152,0.08)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
          >
            <RotateCcw size={13} /> Restart
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="flex items-center gap-2 px-3 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{ background: "rgba(138,143,152,0.08)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />} {muted ? "Muted" : "Sound"}
          </button>
          <div className="hidden sm:block ml-auto font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Interactive storyboard thumbnails */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// STORYBOARD — TAP A SCENE TO JUMP</span>
            <div className="flex-1 h-px" style={{ background: "rgba(209,255,38,0.15)" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SCENES.map((scene, i) => {
              const isActive = i === activeScene;
              const sceneStart = i * sceneDuration;
              const sceneEnd = (i + 1) * sceneDuration;
              const sceneProgress =
                currentTime >= sceneEnd ? 100 :
                currentTime <= sceneStart ? 0 :
                ((currentTime - sceneStart) / sceneDuration) * 100;
              return (
                <button
                  key={scene.img}
                  onClick={() => seekToScene(i)}
                  className="group relative text-left overflow-hidden transition-all duration-300"
                  style={{
                    border: `0.5px solid ${isActive ? "#D1FF26" : "rgba(138,143,152,0.2)"}`,
                    boxShadow: isActive ? "0 0 20px rgba(209,255,38,0.2)" : "none",
                    transform: isActive ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img src={scene.img} alt={scene.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" draggable={false} />
                    <div className="absolute inset-0" style={{ background: isActive ? "transparent" : "rgba(5,7,10,0.55)" }} />
                    <div className="absolute top-1.5 left-1.5 font-mono text-[9px] font-bold px-1.5 py-0.5" style={{ background: "rgba(5,7,10,0.85)", color: isActive ? "#D1FF26" : "#8A8F98", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.2)"}` }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <div className="h-full" style={{ width: `${sceneProgress}%`, background: "#D1FF26", transition: "width 0.1s linear" }} />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5" style={{ background: "rgba(16,20,29,0.6)" }}>
                    <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: isActive ? "#D1FF26" : "#8A8F98" }}>{scene.kicker}</p>
                    <p className="font-heading font-bold text-[11px] leading-tight" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>{scene.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Highlighted services footer */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {[
            { label: "Voice Services", to: "/directory" },
            { label: "Emergency SOS", to: "/emergency-broadcast" },
            { label: "1 Call Dating", to: "/dating" },
            { label: "Games by SMS", to: "/games" },
            { label: "Social Hub", to: "/social" },
          ].map((s) => (
            <a
              key={s.label}
              href={s.to}
              className="flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.2)]"
              style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
            >
              {s.label} <ChevronRight size={11} style={{ color: "#D1FF26" }} />
            </a>
          ))}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={VOICEOVER_URL}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
    </section>
  );
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}