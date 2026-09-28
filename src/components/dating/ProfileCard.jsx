import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mic, Volume2, MapPin, Check, Loader2, Play, Pause, AudioLines, Music2, Flag } from "lucide-react";
import { LABELS, MUSIC_LABELS } from "@/components/dating/DatingQuestionnaire";
import ReportDialog from "@/components/dating/ReportDialog";

// Browse card for a verified dating profile: photo gallery, voice greeting,
// questionnaire chips, and the like action.
export default function ProfileCard({ profile, playing, onPlay, liked, liking, onLike, sharedInterests = [], sharedGenres = [], myProfile = null }) {
  const photos = profile.photos && profile.photos.length ? profile.photos : (profile.avatar_url ? [profile.avatar_url] : []);
  const [activePhoto, setActivePhoto] = useState(0);
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [reporting, setReporting] = useState(false);
  const hasClip = Boolean(profile.voice_intro_url);

  const toggleClip = () => {
    const a = audioRef.current;
    if (!a) return;
    if (audioPlaying) { a.pause(); setAudioPlaying(false); }
    else { a.play().then(() => setAudioPlaying(true)).catch(() => {}); }
  };

  const handlePlay = () => {
    if (hasClip) { toggleClip(); return; }
    onPlay();
  };

  const chips = [];
  ["height", "body_type", "education", "drinking", "smoking", "kids", "want_kids", "religion", "ethnicity", "zodiac"].forEach((k) => {
    const v = profile[k];
    if (v && v !== "prefer_not_to_say" && LABELS[k] && LABELS[k][v]) {
      chips.push(LABELS[k][v]);
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-4 p-4" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
      {/* Photo gallery */}
      <div className="flex-shrink-0 w-full sm:w-36">
        <div className="relative w-full sm:w-36 h-44 overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.25)" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={activePhoto}
              src={photos[activePhoto]}
              alt={profile.full_name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          {!photos.length && (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)" }}>
              <Heart size={22} style={{ color: "rgba(209,255,38,0.3)" }} />
            </div>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-1 mt-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className="flex-1 h-1 transition-all"
                style={{ background: i === activePhoto ? "#D1FF26" : "rgba(138,143,152,0.2)" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{profile.full_name}, {profile.age}</p>
          <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>{(profile.looking_for || "relationship").toUpperCase()}</span>
        </div>
        <p className="font-mono text-[10px] flex items-center gap-1 mb-2" style={{ color: "#D1FF26" }}><MapPin size={10} /> {profile.location}</p>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {chips.slice(0, 6).map((c, i) => (
              <span key={c + i} className="font-mono text-[8px] tracking-wide px-2 py-0.5" style={{ background: "rgba(138,143,152,0.08)", color: "#8A8F98" }}>{c}</span>
            ))}
          </div>
        )}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {profile.interests.map((it) => (
              <span key={it} className="font-mono text-[8px] tracking-wide px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>#{LABELS.interests[it] || it}</span>
            ))}
          </div>
        )}
        {profile.music_genres && profile.music_genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {profile.music_genres.map((g) => (
              <span key={g} className="font-mono text-[8px] tracking-wide px-2 py-0.5 flex items-center gap-1" style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee", border: "0.5px solid rgba(34,211,238,0.25)" }}><Music2 size={9} />{MUSIC_LABELS[g] || g}</span>
            ))}
          </div>
        )}
        <p className="text-xs mb-3 line-clamp-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>"{profile.voice_greeting}"</p>
        {hasClip && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.35)" }}>
              <AudioLines size={9} className="inline mr-1" />REAL VOICE
            </span>
            <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{profile.voice_intro_duration || 30}s clip</span>
          </div>
        )}
        {hasClip && <audio ref={audioRef} src={profile.voice_intro_url} onEnded={() => setAudioPlaying(false)} preload="none" />}
        {sharedInterests.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>SHARED:</span>
            {sharedInterests.map((it) => (
              <span key={it} className="font-mono text-[8px] tracking-wide px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.25)" }}>{LABELS.interests[it] || it}</span>
            ))}
          </div>
        )}
        {sharedGenres.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <span className="font-mono text-[8px] tracking-widest" style={{ color: "#22d3ee" }}>SHARED MUSIC:</span>
            {sharedGenres.map((g) => (
              <span key={g} className="font-mono text-[8px] tracking-wide px-1.5 py-0.5 flex items-center gap-1" style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "0.5px solid rgba(34,211,238,0.3)" }}><Music2 size={9} />{MUSIC_LABELS[g] || g}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={handlePlay} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: (audioPlaying || playing) ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: `0.5px solid ${(audioPlaying || playing) ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.2)"}`, color: "#D1FF26" }}>
            {(audioPlaying || playing) ? (hasClip ? <Pause size={11} /> : <Volume2 size={11} className="animate-pulse" />) : (hasClip ? <Play size={11} /> : <Mic size={11} />)} {(audioPlaying || playing) ? "Playing" : hasClip ? "Play Intro" : "Play Voice"}
          </button>
          <button onClick={onLike} disabled={liked || liking} className="flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-50" style={{ background: liked ? "rgba(209,255,38,0.08)" : "#D1FF26", border: liked ? "0.5px solid rgba(209,255,38,0.3)" : "0.5px solid #D1FF26", color: liked ? "#D1FF26" : "#05070A" }}>
            {liking ? <Loader2 size={11} className="animate-spin" /> : liked ? <Check size={11} /> : <Heart size={11} />} {liked ? "Liked" : "Like"}
          </button>
          <button onClick={() => setReporting(true)} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
            <Flag size={11} /> Report
          </button>
        </div>
      </div>
      {reporting && <ReportDialog profile={profile} myProfile={myProfile} onClose={() => setReporting(false)} />}
    </motion.div>
  );
}

export function Field({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <div>
      <label className="font-mono text-[8px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>{label.toUpperCase()}{required && " *"}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full p-2.5 text-sm outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
    </div>
  );
}