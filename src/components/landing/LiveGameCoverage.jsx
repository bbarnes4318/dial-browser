import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Play, Loader2, Tv, ShieldCheck, AlertCircle, ExternalLink, ChevronDown, Radio } from "lucide-react";

const LIME = "#D4FF00";

// Free, legally-streamable LIVE GAME coverage. Audio sources are the same
// royalty-paid / free-to-air sports radio networks already carried elsewhere
// in the app — re-surfaced here because they broadcast live match commentary.
const GAME_AUDIO = [
  // ── English (default) ──────────────────────────────────────────────
  { id: "ched-game", name: "630 CHED", covers: "Live Edmonton Oilers NHL hockey", region: "Canada · English", language: "en", accent: "#39FF14", streamUrl: "https://corus.leanstream.co/CHEDAM-MP3" },
  { id: "knbr-game", name: "KNBR 680", covers: "Live SF Giants & Warriors games", region: "USA · English", language: "en", accent: "#FF8C42", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/KNBRAM" },
  { id: "fox640-game", name: "Fox Sports 640", covers: "Live Florida pro & college games", region: "USA · English", language: "en", accent: "#5A8FE0", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/WMENAMAAC.aac" },
  // ── Other languages ───────────────────────────────────────────────
  { id: "marca-game", name: "Radio Marca", covers: "Live La Liga & match commentary", region: "Spain · Spanish", language: "es", accent: "#39FF14", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOMARCA_NACIONAL_SC" },
  { id: "rmc-game", name: "RMC Sport", covers: "Live Ligue 1 & PSG matches", region: "France · French", language: "fr", accent: "#FF8C42", streamUrl: "https://audio.bfmtv.com/rmcradio_128.mp3" },
  { id: "rai-game", name: "RAI Radio 1", covers: "Live Serie A & sports", region: "Italy · Italian", language: "it", accent: "#5AC8E0", streamUrl: "https://icestreaming.rai.it/1.mp3" },
  { id: "rac1-game", name: "RAC1", covers: "Live Barça matches · Tu Dirás", region: "Spain · Catalan", language: "ca", accent: "#E0C45A", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RAC_1.mp3" },
  { id: "ser-game", name: "Cadena SER", covers: "Live sports commentary", region: "Spain · Spanish", language: "es", accent: "#5AE0C8", streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3" },
];

// Broadcast-language switcher for live game audio. English by default so
// users land on English-language live game commentary; other languages are
// one tap away.
const GAME_LANGUAGES = [
  { id: "en", label: "English" },
  { id: "all", label: "All Languages" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "it", label: "Italian" },
  { id: "ca", label: "Catalan" },
];

// Official, free, legal sports video — opens each provider's own free player
// in a new tab. Linked (not embedded) because the providers' players are the
// legal distribution path.
const FREE_VIDEO = [
  { name: "CBS Sports HQ", desc: "24/7 free sports news, scores & highlights", url: "https://www.cbssports.com/watch/live", tag: "FREE · US" },
  { name: "Pluto TV Sports", desc: "Free live sports channels, ad-supported", url: "https://pluto.tv/us/watch/live-tv/category/sports-us/", tag: "FREE · US" },
  { name: "Red Bull TV", desc: "Free live extreme sports & events, worldwide", url: "https://www.redbull.tv/", tag: "FREE · GLOBAL" },
];

function Eq({ active, color }) {
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      {bars.map((i) => (
        <div key={i} className="w-0.5 rounded-full" style={{
          background: color,
          height: active ? "100%" : "20%",
          animation: active ? `eqBar ${0.6 + (i % 3) * 0.25}s ease-in-out infinite` : "none",
          animationDelay: `${i * 0.1}s`,
          opacity: active ? 1 : 0.3,
        }} />
      ))}
    </div>
  );
}

export default function LiveGameCoverage() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [lang, setLang] = useState("en");
  const audioRef = useRef(null);

  // Stop playback if the active channel is filtered out by the language switch.
  const filteredAudio = GAME_AUDIO.filter((s) => lang === "all" || s.language === lang);
  useEffect(() => {
    if (playing && !filteredAudio.some((s) => s.id === playing)) setPlaying(null);
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    let cancelled = false;
    if (playing) {
      const s = GAME_AUDIO.find((x) => x.id === playing);
      if (!s) return;
      setLoading(true);
      setError(null);
      a.src = s.streamUrl;
      a.muted = muted;
      a.play()
        .then(() => { if (!cancelled) setLoading(false); })
        .catch(async (err) => {
          if (cancelled) return;
          if (err && err.name === "NotAllowedError") {
            try {
              a.muted = true; setMuted(true);
              await a.play();
              if (cancelled) return;
              setLoading(false);
              setTimeout(() => { if (!cancelled) { a.muted = false; setMuted(false); } }, 350);
            } catch {
              if (cancelled) return;
              setError("Couldn't connect — try another channel.");
              setPlaying(null); setLoading(false);
            }
          } else {
            setError("Couldn't connect — try another channel.");
            setPlaying(null); setLoading(false);
          }
        });
    } else {
      a.pause();
      try { a.removeAttribute("src"); } catch {}
      setError(null);
    }
    return () => { cancelled = true; };
  }, [playing]);

  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);
  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; } }, []);

  const toggle = (id) => setPlaying((p) => (p === id ? null : id));

  return (
    <div className="mt-6">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 transition-all"
        style={{
          borderRadius: 10,
          background: open ? "rgba(212,255,0,0.10)" : "linear-gradient(180deg,#2a2a2a,#161616)",
          border: `0.5px solid ${open ? `${LIME}99` : "rgba(255,255,255,0.08)"}`,
          boxShadow: open ? `0 0 18px ${LIME}33` : "0 3px 8px rgba(0,0,0,0.5)",
        }}
      >
        <span className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9" style={{ background: `${LIME}1a`, border: `0.5px solid ${LIME}66`, borderRadius: 8 }}>
            <Tv size={16} style={{ color: LIME }} />
          </span>
          <span className="text-left">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF3838", animation: "dotPulse 1.6s ease-in-out infinite" }} />
              <span className="font-heading font-black text-sm tracking-tight" style={{ color: open ? LIME : "#EDEDED" }}>LIVE GAME COVERAGE</span>
            </span>
            <span className="block font-mono text-[8px] tracking-[0.2em] mt-0.5" style={{ color: "#9a9a9a" }}>FREE & LEGAL · IN-APP AUDIO + OFFICIAL VIDEO</span>
          </span>
        </span>
        <ChevronDown size={16} style={{ color: open ? LIME : "#8a8a8a", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
      </button>

      <AnimatePresence>
        {open && (
          <div
            className="overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="p-4 mt-3" style={{ borderRadius: 10, background: "linear-gradient(180deg,#0d0d0d,#141414)", border: "0.5px solid rgba(255,255,255,0.06)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7)" }}>
              {/* Disclaimer */}
              <div className="flex items-start gap-2 mb-4 p-2.5" style={{ background: "rgba(212,255,0,0.06)", border: `0.5px solid ${LIME}33`, borderRadius: 5 }}>
                <ShieldCheck size={12} className="flex-shrink-0 mt-0.5" style={{ color: LIME }} />
                <p className="text-[10px] leading-relaxed" style={{ color: "#bcbcbc" }}>
                  Free, legally-streamable live coverage. Audio plays in-app from royalty-paid sports radio that broadcasts live match commentary. Video opens each provider's official free player in a new tab.
                </p>
              </div>

              {/* Live game audio */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <Radio size={11} style={{ color: LIME }} />
                <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: LIME }}>LIVE GAME AUDIO · IN-APP</p>
              </div>

              {/* Broadcast-language switcher — pick the commentary language */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8a8a8a" }}>LANGUAGE:</span>
                {GAME_LANGUAGES.map((l) => {
                  const active = lang === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id)}
                      className="px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase transition-all"
                      style={{
                        borderRadius: 4,
                        background: active ? "rgba(212,255,0,0.14)" : "rgba(255,255,255,0.04)",
                        border: `0.5px solid ${active ? `${LIME}88` : "rgba(255,255,255,0.10)"}`,
                        color: active ? LIME : "#9a9a9a",
                      }}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                {filteredAudio.map((s) => {
                  const isPlaying = playing === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className="relative flex items-center gap-3 p-2.5 text-left transition-transform active:scale-[0.98] hover:scale-[1.01]"
                      style={{ borderRadius: 7, background: isPlaying ? `${s.accent}14` : "rgba(255,255,255,0.03)", border: `0.5px solid ${isPlaying ? `${s.accent}88` : "rgba(255,255,255,0.07)"}` }}
                    >
                      <span className="flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ background: `${s.accent}1a`, border: `0.5px solid ${s.accent}55`, borderRadius: 6 }}>
                        {isPlaying && loading ? <Loader2 size={13} className="animate-spin" style={{ color: s.accent }} /> : isPlaying ? <Eq active color={s.accent} /> : <Play size={13} style={{ color: s.accent }} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-[12px] truncate" style={{ color: "#F5F5F7" }}>{s.name}</span>
                          {isPlaying && <span className="font-mono text-[7px] tracking-widest" style={{ color: "#FF3838" }}>● LIVE</span>}
                        </span>
                        <span className="block text-[10px] truncate mt-0.5" style={{ color: "#8a8a8a" }}>{s.covers}</span>
                        <span className="block font-mono text-[8px] tracking-wider mt-0.5" style={{ color: "#5a5a5a" }}>{s.region.toUpperCase()}</span>
                      </span>
                      {isPlaying && (
                        <span onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }} className="flex items-center justify-center w-7 h-7 flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", borderRadius: 5 }}>
                          <span className="font-mono text-[8px]" style={{ color: muted ? "#8a8a8a" : s.accent }}>{muted ? "MUTE" : "ON"}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2" style={{ background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.45)", borderRadius: 5 }}>
                  <AlertCircle size={12} style={{ color: "#ef4444" }} />
                  <p className="text-[10px]" style={{ color: "#ef4444" }}>{error}</p>
                </div>
              )}

              {/* Watch free & legal video */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <Tv size={11} style={{ color: LIME }} />
                <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: LIME }}>WATCH FREE &amp; LEGAL · OFFICIAL PLAYER</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {FREE_VIDEO.map((v) => (
                  <a
                    key={v.name}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-3 transition-transform hover:scale-[1.02]"
                    style={{ borderRadius: 7, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-heading font-bold text-[12px]" style={{ color: "#F5F5F7" }}>{v.name}</span>
                      <ExternalLink size={11} style={{ color: "#8a8a8a" }} className="group-hover:opacity-100 opacity-50" />
                    </div>
                    <p className="text-[10px] leading-snug mb-2" style={{ color: "#8a8a8a" }}>{v.desc}</p>
                    <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5 inline-block" style={{ background: `${LIME}1a`, color: LIME, borderRadius: 2 }}>{v.tag}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} preload="none" />
    </div>
  );
}