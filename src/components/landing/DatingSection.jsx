import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Phone, Mic, Volume2, Check, X, MessageCircle, Star, Shield, Zap, MessageSquare } from "lucide-react";
import VerifiedBadge from "@/components/landing/VerifiedBadge";
import VoiceGreetingRecorder from "@/components/landing/VoiceGreetingRecorder";
import MatchChatDialog from "@/components/landing/MatchChatDialog";
import DatingMilestoneGallery from "@/components/landing/DatingMilestoneGallery";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const demoProfiles = [
  { id: "d1", name: "Amara", age: 28, location: "Atlanta, GA", voiceMsg: "Hey! I love cooking and live music. Looking for someone genuine to share adventures with.", gradient: "from-rose-900/50 to-pink-800/10", liked: false, verified: false },
  { id: "d2", name: "Marcus", age: 31, location: "Atlanta, GA", voiceMsg: "Tech entrepreneur who loves hiking and jazz. Let's grab coffee and see where it goes.", gradient: "from-cyan-900/50 to-blue-800/10", liked: false, verified: false },
  { id: "d3", name: "Zoe", age: 26, location: "Atlanta, GA", voiceMsg: "Bookworm and coffee addict. I believe in deep conversations and spontaneous road trips.", gradient: "from-violet-900/50 to-purple-800/10", liked: false, verified: false },
  { id: "d4", name: "Trey", age: 29, location: "Atlanta, GA", voiceMsg: "Fitness enthusiast and foodie. Looking for my workout partner and life partner.", gradient: "from-amber-900/50 to-orange-800/10", liked: false, verified: false },
];

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function DatingSection() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState(demoProfiles);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordedMsg, setRecordedMsg] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showMatch, setShowMatch] = useState(null);
  const [isPremium, setIsPremium] = useState(true); // Demo mode: premium enabled
  const [matchGreetingPlaying, setMatchGreetingPlaying] = useState(false);
  const [matchGreetingProgress, setMatchGreetingProgress] = useState(0);
  const [chatMatch, setChatMatch] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Voice message playback — uses TTS to actually speak the profile's voice message
  useEffect(() => {
    if (!isPlaying) {
      stopSpeaking();
      return;
    }
    const profile = profiles[currentIndex];
    if (!profile) return;
    speak(profile.voiceMsg, {
      rate: 0.95,
      pitch: profile.id === "d2" ? 0.8 : profile.id === "d4" ? 0.85 : 1.1,
      onEnd: () => { setIsPlaying(false); setPlayProgress(100); },
      onError: () => setIsPlaying(false),
    });
    const t = setInterval(() => {
      setPlayProgress((p) => {
        if (p >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return p + 2;
      });
    }, 100);
    return () => { clearInterval(t); stopSpeaking(); };
  }, [isPlaying, currentIndex]);

  // Recording timer
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      setRecordTime((t) => Math.min(t + 1, 30)); // Max 30s
    }, 1000);
    return () => clearInterval(t);
  }, [recording]);

  // Auto-play matched profile's voice greeting when match popup appears
  useEffect(() => {
    if (!showMatch) {
      setMatchGreetingPlaying(false);
      setMatchGreetingProgress(0);
      return;
    }
    setMatchGreetingPlaying(true);
    setMatchGreetingProgress(0);
  }, [showMatch]);

  // Match greeting playback — uses TTS to speak the matched profile's voice message
  useEffect(() => {
    if (!matchGreetingPlaying) {
      stopSpeaking();
      return;
    }
    if (showMatch) {
      speak(showMatch.voiceMsg, {
        rate: 0.95,
        pitch: showMatch.id === "d2" ? 0.8 : showMatch.id === "d4" ? 0.85 : 1.1,
        onEnd: () => { setMatchGreetingPlaying(false); setMatchGreetingProgress(100); },
        onError: () => setMatchGreetingPlaying(false),
      });
    }
    const t = setInterval(() => {
      setMatchGreetingProgress((p) => {
        if (p >= 100) {
          setMatchGreetingPlaying(false);
          return 100;
        }
        return p + 2;
      });
    }, 100);
    return () => { clearInterval(t); stopSpeaking(); };
  }, [matchGreetingPlaying, showMatch]);

  const currentProfile = profiles[currentIndex];

  const handleLike = () => {
    if (!isPremium) return;
    // Simulate match (50% chance for demo)
    if (Math.random() > 0.5) {
      const compatibility = 78 + Math.floor(Math.random() * 20); // 78–97%
      const newMatch = { ...currentProfile, matchedAt: new Date(), compatibility };
      setMatches((m) => [...m, newMatch]);
      setShowMatch(newMatch);
    }
    nextProfile();
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    setCurrentIndex((i) => (i + 1) % profiles.length);
    setIsPlaying(false);
    setPlayProgress(0);
    setRecordedMsg(null);
    setRecordTime(0);
  };

  const startRecording = () => {
    setRecording(true);
    setRecordTime(0);
  };

  const stopRecording = () => {
    setRecording(false);
    setRecordedMsg({ duration: recordTime, text: "Voice message recorded" });
  };

  const sendVoiceMessage = () => {
    if (!recordedMsg) return;
    // Simulate sending
    setTimeout(() => {
      setRecordedMsg(null);
      // Auto-like when sending message
      const compatibility = 78 + Math.floor(Math.random() * 20);
      const newMatch = { ...currentProfile, matchedAt: new Date(), compatibility };
      setMatches((m) => [...m, newMatch]);
      setShowMatch(newMatch);
      nextProfile();
    }, 1000);
  };

  const closeMatch = () => {
    setShowMatch(null);
    nextProfile();
  };

  return (
    <section ref={sectionRef} className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-10 lg:mb-14">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// 1 CALL DATING™</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Find Your Match <span style={{ color: "#D1FF26" }}>Through Voice.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Listen to voice messages from potential matches. Leave your own voice note. When both parties like each other, get connected via SMS and chat safely — your phone number stays private.
          </p>

          {/* Step-by-step instructions */}
          <div className="mt-6 grid sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { step: 1, title: "Listen", desc: "Tap Listen to hear a potential match's voice message." },
              { step: 2, title: "Record", desc: "Leave your own voice note so they can hear you too." },
              { step: 3, title: "Like", desc: "Tap Like if you're interested. If they like you back, it's a match!" },
              { step: 4, title: "Chat", desc: "Open the match popup and start chatting securely — your number stays private." },
            ].map((item) => (
              <div key={item.step} className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: "#D1FF26", color: "#05070A" }}>{item.step}</span>
                  <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>{item.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "#8A8F98" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Date milestone gallery — from first call to forever */}
        <DatingMilestoneGallery inView={inView} />

        {/* Enter the real in-app dating portal (auth-gated) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
          style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.35)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Heart size={16} className="flex-shrink-0" style={{ color: "#D1FF26" }} />
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// REAL IN-APP DATING</p>
              <p className="text-sm mt-0.5" style={{ color: "#F5F5F7" }}>Create your real profile, browse members, and get matched profiles via SMS.</p>
            </div>
          </div>
          <a
            href="/dating"
            className="flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.35)]"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            Enter 1 Call Dating →
          </a>
        </motion.div>

        {/* External dating partner — FreeMeet deep link (no public API / embedding blocked) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Heart size={16} className="flex-shrink-0" style={{ color: "#D1FF26" }} />
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// EXTERNAL DATING PARTNER</p>
              <p className="text-sm mt-0.5" style={{ color: "#F5F5F7" }}>Browse more singles on FreeMeet — a free dating site. Opens in a new tab.</p>
            </div>
          </div>
          <a
            href="https://en.freemeet.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            Open FreeMeet →
          </a>
        </motion.div>

        {/* Premium badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Star size={14} style={{ color: isPremium ? "#D1FF26" : "#8A8F98" }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: isPremium ? "#D1FF26" : "#8A8F98" }}>
              {isPremium ? "PREMIUM MEMBER" : "PREMIUM REQUIRED"}
            </span>
          </div>
          {!isPremium && (
            <button className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
              Upgrade to Premium
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Profile cards */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentProfile && (
                <motion.div
                  key={currentProfile.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className={`relative h-96 overflow-hidden rounded-lg bg-gradient-to-br ${currentProfile.gradient}`}
                  style={{ border: "0.5px solid rgba(209,255,38,0.2)" }}
                >
                  {/* Signal line animation */}
                  <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                    <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
                  </div>

                  {/* Profile info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6" style={{ background: "linear-gradient(to top, rgba(5,7,10,0.95), transparent)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold text-3xl" style={{ color: "#F5F5F7" }}>
                        {currentProfile.name}, {currentProfile.age}
                      </h3>
                      {currentProfile.verified && <VerifiedBadge size={18} />}
                    </div>
                    <p className="font-mono text-sm mb-4" style={{ color: "#D1FF26" }}>
                      📍 {currentProfile.location}
                    </p>

                    {/* Voice message player */}
                    <div className="p-4 mb-4" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                      <div className="flex items-center gap-3 mb-3">
                        <Volume2 size={18} style={{ color: "#D1FF26" }} />
                        <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>VOICE MESSAGE</span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>
                        "{currentProfile.voiceMsg}"
                      </p>
                      {/* Progress bar */}
                      <div className="h-1 w-full mb-2 overflow-hidden" style={{ background: "rgba(138,143,152,0.2)" }}>
                        <div className="h-full" style={{ width: `${playProgress}%`, background: "#D1FF26", transition: "width 0.1s linear" }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{fmtTime(Math.floor((playProgress / 100) * 15))} / 0:15</span>
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
                          style={{ background: "#D1FF26", color: "#05070A" }}
                        >
                          {isPlaying ? <><Check size={12} /> Playing</> : <><Phone size={12} /> Listen</>}
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isPremium && !recordedMsg && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handlePass}
                          className="flex-1 flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase transition-all"
                          style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                        >
                          <X size={14} /> Pass
                        </button>
                        <button
                          onClick={handleLike}
                          className="flex-1 flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
                          style={{ background: "#D1FF26", color: "#05070A" }}
                        >
                          <Heart size={14} /> Like
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recording interface */}
            {isPremium && (
              <div className="mt-4 p-4" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Mic size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LEAVE A VOICE MESSAGE</p>
                </div>
                {!recordedMsg ? (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase transition-all ${
                        recording ? "animate-pulse" : ""
                      }`}
                      style={{
                        background: recording ? "rgba(209,255,38,0.25)" : "#D1FF26",
                        color: "#05070A",
                        boxShadow: recording ? "0 0 20px rgba(209,255,38,0.4)" : "none",
                      }}
                    >
                      {recording ? <><Check size={14} /> Stop Recording ({recordTime}s)</> : <><Mic size={14} /> Record Message</>}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <p className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>Message ready: {recordedMsg.duration}s</p>
                    </div>
                    <button
                      onClick={() => setRecordedMsg(null)}
                      className="px-4 py-3 font-mono text-[10px] tracking-widest uppercase"
                      style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                    >
                      Discard
                    </button>
                    <button
                      onClick={sendVoiceMessage}
                      className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Matches sidebar */}
          <div className="p-5 h-fit" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// YOUR MATCHES</p>
            </div>

            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Heart size={28} style={{ color: "rgba(209,255,38,0.3)" }} />
                <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>No matches yet</p>
                <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Like profiles to find your match</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{match.name}</h4>
                        {match.verified && <VerifiedBadge size={12} />}
                      </div>
                      <Shield size={12} style={{ color: "#D1FF26" }} />
                    </div>
                    <p className="font-mono text-[9px] mb-2" style={{ color: "#8A8F98" }}>📍 {match.location}</p>
                    <button
                      onClick={() => setChatMatch(match)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.2)]"
                      style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                    >
                      <MessageSquare size={11} /> Chat Securely
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Privacy info */}
            <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>PRIVATE & SAFE</p>
              </div>
              <ul className="space-y-1.5">
                {[
                  "Phone numbers never shared",
                  "SMS notifications only",
                  "Chat via 1 Call Network",
                  "Report & block anytime",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 font-mono text-[8px]">
                    <Check size={10} style={{ color: "#D1FF26" }} />
                    <span style={{ color: "#8A8F98" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="font-mono text-[8px] mt-4" style={{ color: "#8A8F98" }}>
              Dial *520# to access 1 Call Dating
            </p>
          </div>
        </div>

        {/* Personal voice greeting recorder */}
        <VoiceGreetingRecorder />

        {/* Match popup */}
        <AnimatePresence>
          {showMatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
              style={{ background: "rgba(5,7,10,0.85)" }}
              onClick={closeMatch}
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="p-8 max-w-md w-full text-center"
                style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Heart size={32} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>IT'S A MATCH!</span>
                  <Heart size={32} style={{ color: "#D1FF26" }} />
                </div>
                <h3 className="font-heading font-black text-3xl mb-2" style={{ color: "#F5F5F7" }}>
                  You & {showMatch.name}
                </h3>
                <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                  Both of you liked each other! You'll each receive an SMS with the other's profile. Start chatting safely via the 1 Call Network — your phone numbers stay private.
                </p>
                {/* Matched profile's voice greeting — auto-plays */}
                <div className="mb-6 p-4 text-left" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 size={14} style={{ color: "#D1FF26" }} />
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>{showMatch.name.toUpperCase()}'S VOICE GREETING</span>
                    {matchGreetingPlaying && (
                      <span className="ml-auto flex items-center gap-1 font-mono text-[8px]" style={{ color: "#D1FF26" }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#D1FF26" }} /> NOW PLAYING
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-3" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>"{showMatch.voiceMsg}"</p>
                  <div className="h-1 w-full mb-2 overflow-hidden" style={{ background: "rgba(138,143,152,0.2)" }}>
                    <div className="h-full" style={{ width: `${matchGreetingProgress}%`, background: "#D1FF26", transition: "width 0.1s linear" }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                      {fmtTime(Math.floor((matchGreetingProgress / 100) * 15))} / 0:15
                    </span>
                    <button
                      onClick={() => {
                        if (matchGreetingProgress >= 100) setMatchGreetingProgress(0);
                        setMatchGreetingPlaying(!matchGreetingPlaying);
                      }}
                      className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      {matchGreetingPlaying ? <><Check size={12} /> Playing</> : <><Volume2 size={12} /> Replay</>}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Shield size={14} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>SECURE CONNECTION ACTIVATED</span>
                </div>
                <button
                  onClick={() => {
                    setChatMatch(showMatch);
                    closeMatch();
                  }}
                  className="w-full mb-3 py-4 flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  <MessageSquare size={14} /> Start Chatting
                </button>
                <button
                  onClick={closeMatch}
                  className="w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
                  style={{ background: "transparent", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                >
                  Continue Exploring
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MatchChatDialog match={chatMatch} onClose={() => setChatMatch(null)} />
    </section>
  );
}