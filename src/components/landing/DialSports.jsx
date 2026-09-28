import React, { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Play, Loader2, Radio, Globe2, Mic2, Headphones,
  AlertCircle,
} from "lucide-react";
import TuningKnob from "@/components/landing/TuningKnob";
import LiveGameCoverage from "@/components/landing/LiveGameCoverage";
import SportsAlerts from "@/components/landing/SportsAlerts";
import SportsHighlights from "@/components/landing/SportsHighlights";
import SportsLiveChat from "@/components/landing/SportsLiveChat";

// Dial Sports — analog-luxury car infotainment unit. Real free sports talk
// streams played directly in the browser on a plain <audio> element (non-CORS
// live MP3 feeds, no crossOrigin / no Web Audio graph — the proven pattern this
// app uses for BBC + Powerhitz). Visual presentation only: state, filtering,
// playback, mute and stop logic are unchanged from the original section.

const LIME = "#D4FF00";
const CARBON = "#1a1a1a";

// Visual sport quick-pick tiles (five metallic pill buttons). Each filters the
// channel cards by the sports that channel regularly covers.
const SPORTS = [
  { id: "soccer", label: "Soccer", glyph: "⚽" },
  { id: "football", label: "Football", glyph: "🏈" },
  { id: "baseball", label: "Baseball", glyph: "⚾" },
  { id: "basketball", label: "Basketball", glyph: "🏀" },
  { id: "motorsport", label: "Motorsport", glyph: "🏎️" },
];

// Real, free, currently-live sports talk streams — all verified globally
// reachable (audio/mpeg, https) via the open radio-browser directory.
const STREAMS = [
  // ── English (default language) ──────────────────────────────────────
  {
    id: "ched630",
    language: "en",
    sports: ["hockey", "football", "baseball", "basketball"],
    streamUrl: "https://corus.leanstream.co/CHEDAM-MP3",
    accent: "#39FF14",
    station: { name: "630 CHED", region: "Canada · English · Edmonton Oilers hockey" },
    network: { name: "Sportsnet Oilers", tagline: "Live NHL hockey & Edmonton sports" },
    show: { name: "Oilers Live", host: "Live game & talk" },
    podcast: { name: "630 CHED Pods", desc: "Sports talk replays" },
  },
  {
    id: "knbr680",
    language: "en",
    sports: ["baseball", "basketball", "football"],
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/KNBRAM",
    accent: "#FF8C42",
    station: { name: "KNBR 680", region: "USA · English · San Francisco sports" },
    network: { name: "Giants & Warriors", tagline: "SF Giants, Warriors & 49ers talk" },
    show: { name: "Murph & Mac", host: "Morning sports talk" },
    podcast: { name: "KNBR Pods", desc: "Bay Area sports replays" },
  },
  {
    id: "foxsports640",
    language: "en",
    sports: ["football", "baseball", "basketball", "motorsport"],
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/WMENAMAAC.aac",
    accent: "#5A8FE0",
    station: { name: "Fox Sports 640", region: "USA · English · Florida sports talk" },
    network: { name: "Fox Sports Radio", tagline: "National sports talk lineup" },
    show: { name: "Fox Sports Daily", host: "Live talk & takes" },
    podcast: { name: "Fox Sports Pods", desc: "Talk show replays" },
  },
  {
    id: "foxsportsvegas",
    language: "en",
    sports: ["football", "basketball", "motorsport", "baseball"],
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/KKGKAMAAC.aac",
    accent: "#E0C45A",
    station: { name: "Fox Sports 98.9", region: "USA · English · Las Vegas sports" },
    network: { name: "LV Sports Network", tagline: "Vegas sports talk & live games" },
    show: { name: "Vegas Sports", host: "Live talk day & night" },
    podcast: { name: "LV Sports Pods", desc: "Best-of sports talk" },
  },
  {
    id: "foxsportstx",
    language: "en",
    sports: ["football", "basketball", "baseball"],
    streamUrl: "https://ais-sa1.streamon.fm/7852_128k.aac",
    accent: "#5AE0C8",
    station: { name: "Fox Sports Central Texas", region: "USA · English · Texas sports" },
    network: { name: "Central Texas Sports", tagline: "Texas football & hoops talk" },
    show: { name: "Central Texas Talk", host: "Live sports talk" },
    podcast: { name: "CTX Sports Pods", desc: "Talk replays" },
  },
  // ── Other languages (selectable via the language filter) ────────────
  {
    id: "marcamadrid",
    language: "es",
    sports: ["soccer", "football", "basketball", "motorsport", "baseball"],
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOMARCA_NACIONAL_SC",
    accent: "#39FF14",
    station: { name: "Radio Marca", region: "Spain · Spanish · 24/7 sports" },
    network: { name: "Marca Sport Network", tagline: "Spain's all-sports station" },
    show: { name: "Marca Deportivo", host: "Live talk day & night" },
    podcast: { name: "Marca Podcasts", desc: "Best-of sports talk & replays" },
  },
  {
    id: "rairadio1",
    language: "it",
    sports: ["football", "soccer", "motorsport", "baseball"],
    streamUrl: "https://icestreaming.rai.it/1.mp3",
    accent: "#5AC8E0",
    station: { name: "RAI Radio 1", region: "Italy · Italian · sport & talk" },
    network: { name: "RAI Sport Network", tagline: "Italian sport & live coverage" },
    show: { name: "RAI Sport", host: "Live sport & talk" },
    podcast: { name: "RAI Sport Replays", desc: "Catch-up highlights" },
  },
  {
    id: "rmc",
    language: "fr",
    sports: ["soccer", "football", "basketball", "motorsport"],
    streamUrl: "https://audio.bfmtv.com/rmcradio_128.mp3",
    accent: "#FF8C42",
    station: { name: "RMC Sport", region: "France · French" },
    network: { name: "RMC Sport Network", tagline: "French sports talk" },
    show: { name: "RMC Sport", host: "Talk & live coverage" },
    podcast: { name: "RMC Sport Replay", desc: "Talk show replays" },
  },
  {
    id: "rac1",
    language: "ca",
    sports: ["soccer", "basketball"],
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RAC_1.mp3",
    accent: "#E0C45A",
    station: { name: "RAC1", region: "Spain · Catalan" },
    network: { name: "RAC1 Network", tagline: "Catalan sports talk" },
    show: { name: "Tu Dirás", host: "Sports talk daily" },
    podcast: { name: "RAC1 Podcasts", desc: "Show replays" },
  },
  {
    id: "rac1mes",
    language: "ca",
    sports: ["soccer", "basketball"],
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/RAC_MES_1.mp3",
    accent: "#C8A0FF",
    station: { name: "RAC1+1", region: "Spain · Catalan" },
    network: { name: "RAC1+ Network", tagline: "Live sports" },
    show: { name: "RAC1 Esports", host: "Live sports" },
    podcast: { name: "RAC1+ Replays", desc: "Catch-up shows" },
  },
  {
    id: "cadenaSER",
    language: "es",
    sports: ["soccer", "football", "basketball"],
    streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3",
    accent: "#5AE0C8",
    station: { name: "Cadena SER", region: "Spain · Spanish" },
    network: { name: "SER Deportes", tagline: "Spanish sports news" },
    show: { name: "SER Deportivos", host: "Sports news & talk" },
    podcast: { name: "SER Deportes Pod", desc: "Sports news replays" },
  },
];

// Language filter — English by default; other languages are an option.
const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "all", label: "All Languages" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "it", label: "Italian" },
  { id: "ca", label: "Catalan" },
];

const TABS = [
  { id: "stations", label: "Talk Stations", sub: "Free sports talk stations", Icon: Radio },
  { id: "networks", label: "Talk Networks", sub: "Free sports talk networks", Icon: Globe2 },
  { id: "podcasts", label: "Podcasts", sub: "Free sports podcasts & replays", Icon: Mic2 },
  { id: "shows", label: "Shows", sub: "Free sports shows", Icon: Headphones },
];

function cardMeta(tab, s) {
  switch (tab) {
    case "networks": return { title: s.network.name, sub: s.network.tagline, tag: "NETWORK · LIVE" };
    case "shows": return { title: s.show.name, sub: s.show.host, tag: "SHOW · LIVE NOW" };
    case "podcasts": return { title: s.podcast.name, sub: s.podcast.desc, tag: "PODCAST · LIVE & REPLAY" };
    default: return { title: s.station.name, sub: s.station.region, tag: "LIVE STATION" };
  }
}

// Decorative CSS equalizer — pulses while playing (these non-CORS streams
// can't feed a real AnalyserNode, so we animate bars instead of sampling them).
function Eq({ active, color }) {
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      {bars.map((i) => (
        <div
          key={i}
          className="w-0.5 rounded-full"
          style={{
            background: color,
            height: active ? "100%" : "20%",
            animation: active ? `eqBar ${0.6 + (i % 3) * 0.25}s ease-in-out infinite` : "none",
            animationDelay: `${i * 0.1}s`,
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

// ── Skeuomorphic primitives ──────────────────────────────────────────────
function HexBolt() {
  return (
    <span
      className="rounded-full flex items-center justify-center"
      style={{
        width: 13,
        height: 13,
        background: "radial-gradient(circle at 35% 30%, #7a7a7a, #2a2a2a 70%, #111)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.6)",
      }}
    >
      <span style={{ width: 7, height: 1.5, background: "#0d0d0d", borderRadius: 1, transform: "rotate(35deg)" }} />
    </span>
  );
}

function KnurledKnob({ side }) {
  return (
    <span
      className="absolute top-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: 10,
        height: 10,
        [side]: -5,
        background: "repeating-conic-gradient(#7a7a7a 0deg 6deg, #3a3a3a 6deg 12deg)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.7)",
      }}
    />
  );
}

function BrushedBezel({ children }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        height: 26,
        background: "linear-gradient(180deg, #a4a4a4, #6e6e6e 50%, #8c8c8c)",
        backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, rgba(0,0,0,0.06) 1px 2px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.5)",
      }}
    >
      <span className="absolute left-3"><HexBolt /></span>
      <span className="absolute right-3"><HexBolt /></span>
      {children}
    </div>
  );
}

const CARBON_FIBER =
  "repeating-linear-gradient(27deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 6px)," +
  "repeating-linear-gradient(-27deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 6px)," +
  "repeating-linear-gradient(27deg, rgba(0,0,0,0.5) 0 2px, transparent 2px 5px)," +
  "repeating-linear-gradient(-27deg, rgba(0,0,0,0.5) 0 2px, transparent 2px 5px)";

export default function DialSports() {
  const [tab, setTab] = useState("stations");
  const [sport, setSport] = useState("all");
  const [language, setLanguage] = useState("en");
  const [playingId, setPlayingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);

  const filtered = useMemo(
    () => STREAMS.filter((s) => {
      const matchLang = language === "all" || s.language === language;
      const matchSport = sport === "all" || s.sports.includes(sport);
      return matchLang && matchSport;
    }),
    [sport, language]
  );

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    let cancelled = false;
    if (playingId) {
      const s = STREAMS.find((x) => x.id === playingId);
      if (!s) return;
      setLoading(true);
      setError(null);
      a.src = s.streamUrl;
      a.muted = muted;
      // Try unmuted first (works when the user gesture is recognized). If the
      // browser blocks autoplay-with-sound (strict / automated contexts),
      // start muted — always allowed — then unmute a moment later so the
      // stream still connects and plays.
      a.play()
        .then(() => { if (!cancelled) setLoading(false); })
        .catch(async (err) => {
          if (cancelled) return;
          if (err && err.name === "NotAllowedError") {
            try {
              a.muted = true;
              setMuted(true);
              await a.play();
              if (cancelled) return;
              setLoading(false);
              setTimeout(() => { if (!cancelled) { a.muted = false; setMuted(false); } }, 350);
            } catch {
              if (cancelled) return;
              setError("Couldn't connect to that channel — try another.");
              setPlayingId(null);
              setLoading(false);
            }
          } else {
            setError("Couldn't connect to that channel — try another.");
            setPlayingId(null);
            setLoading(false);
          }
        });
    } else {
      a.pause();
      try { a.removeAttribute("src"); } catch {}
      setError(null);
    }
    return () => { cancelled = true; };
  }, [playingId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
  }, []);

  const toggle = (id) => setPlayingId((p) => (p === id ? null : id));
  const current = STREAMS.find((s) => s.id === playingId) || null;
  // Pointer angle on the central dial: idle points up; tuned rotates to the
  // active station's slot across a 240° sweep.
  const tuneAngle = current
    ? -120 + STREAMS.findIndex((s) => s.id === current.id) * (240 / Math.max(1, STREAMS.length - 1))
    : -120;

  const half = Math.ceil(filtered.length / 2);
  const leftCards = filtered.slice(0, half);
  const rightCards = filtered.slice(half);

  const StationCard = ({ s }) => {
    const isPlaying = playingId === s.id;
    const meta = cardMeta(tab, s);
    return (
      <button
        onClick={() => toggle(s.id)}
        className="relative block text-left w-full transition-transform duration-150 hover:scale-[1.015] active:scale-[0.98]"
        style={{
          padding: 2,
          borderRadius: 10,
          background: "linear-gradient(180deg,#c8c8c8,#7a7a7a 50%,#4a4a4a)",
          boxShadow: isPlaying
            ? `0 0 22px ${s.accent}55, 0 3px 8px rgba(0,0,0,0.6)`
            : "0 3px 8px rgba(0,0,0,0.55)",
        }}
      >
        <KnurledKnob side="left" />
        <KnurledKnob side="right" />
        <div
          style={{
            background: "linear-gradient(180deg,#1e1e1e,#121212)",
            borderRadius: 8,
            padding: "10px 14px",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.7)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center"
              style={{
                padding: 2,
                borderRadius: 7,
                background: "linear-gradient(180deg,#b8b8b8,#6e6e6e 55%,#3e3e3e)",
              }}
            >
              <div className="w-full h-full flex items-center justify-center" style={{ borderRadius: 5, background: `${s.accent}1a`, border: `0.5px solid ${s.accent}66` }}>
                {isPlaying ? <Eq active color={s.accent} /> : <Play size={13} style={{ color: s.accent }} />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-[13px] truncate" style={{ color: "#F5F5F7" }}>{meta.title}</p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: "#8a8a8a" }}>{meta.sub}</p>
            </div>
            {isPlaying && loading && <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: s.accent }} />}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
            <span className="font-mono text-[7px] tracking-[0.2em] px-1.5 py-0.5" style={{ background: `${s.accent}22`, color: s.accent, borderRadius: 2 }}>{meta.tag}</span>
            {isPlaying ? (
              <span className="font-mono text-[7px] tracking-[0.2em]" style={{ color: "#FF3838" }}>● LIVE</span>
            ) : (
              <span className="font-mono text-[7px] tracking-[0.2em]" style={{ color: "#8a8a8a" }}>FREE · TAP TO PLAY</span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <section id="dial-sports" className="relative py-12 lg:py-16" style={{ background: "#05070A" }}>
      <div className="px-3 lg:px-6 max-w-6xl mx-auto w-full">
        {/* ── Infotainment unit ── */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 14,
            boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          <BrushedBezel />

          {/* Carbon-fiber body */}
          <div
            className="relative px-4 sm:px-7 py-7 lg:py-9"
            style={{ backgroundColor: CARBON, backgroundImage: CARBON_FIBER }}
          >
            {/* Header — DS chrome logo */}
            <div className="relative flex flex-col items-center text-center mb-6">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="flex items-center justify-center w-11 h-11 font-heading font-black text-xl"
                  style={{
                    background: "linear-gradient(145deg,#e6e6e6,#8c8c8c 55%,#3e3e3e)",
                    color: "#1a1a1a",
                    borderRadius: 8,
                    border: "0.5px solid rgba(255,255,255,0.3)",
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6), 0 2px 6px rgba(0,0,0,0.6)",
                    textShadow: "0 1px 0 rgba(255,255,255,0.35)",
                  }}
                >DS</span>
                <div className="text-left">
                  <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight leading-none" style={{ color: "#EDEDED", textShadow: "0 1px 0 rgba(0,0,0,0.6)" }}>
                    DIAL SPORTS
                  </h2>
                  <p className="font-mono text-[9px] tracking-[0.35em] mt-1" style={{ color: LIME }}>YOUR CONNECTION TO THE GAME</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm max-w-xl mt-2" style={{ color: "#A0A0A0" }}>
                Free sports talk stations, networks, podcasts &amp; shows — live and on-demand. Tap any channel to listen instantly.
              </p>
              <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5" style={{ background: "rgba(212,255,0,0.08)", border: `0.5px solid ${LIME}55`, borderRadius: 4 }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIME, animation: "dotPulse 2s ease-in-out infinite" }} />
                <span className="font-mono text-[8px] tracking-widest" style={{ color: LIME }}>100% FREE · ROYALTY-PAID · NO LOGIN</span>
              </div>

              {/* Language filter — English by default, other languages optional */}
              <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8a8a8a" }}>LANGUAGE:</span>
                {LANGUAGES.map((l) => {
                  const active = language === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLanguage(l.id)}
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
            </div>

            {/* Category selector — five silver metallic pills */}
            <div className="relative grid grid-cols-5 gap-1.5 sm:gap-2.5 mb-6">
              {SPORTS.map((sp) => {
                const active = sport === sp.id;
                const count = STREAMS.filter((s) => (language === "all" || s.language === language) && s.sports.includes(sp.id)).length;
                return (
                  <button
                    key={sp.id}
                    onClick={() => setSport((p) => (p === sp.id ? "all" : sp.id))}
                    className="group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 transition-transform active:scale-95"
                    style={{
                      borderRadius: 999,
                      background: "linear-gradient(180deg,#eaeaea,#9a9a9a 45%,#6a6a6a)",
                      boxShadow: active
                        ? `inset 0 0 0 1.5px ${LIME}, 0 0 14px ${LIME}66, inset 0 1px 2px rgba(255,255,255,0.6)`
                        : "inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    <span className="text-base sm:text-lg leading-none mb-0.5" style={{ filter: active ? "none" : "grayscale(0.25)" }}>{sp.glyph}</span>
                    <span className="font-heading font-bold text-[8px] sm:text-[10px] tracking-wide" style={{ color: active ? LIME : "#2a2a2a" }}>{sp.label}</span>
                    <span className="font-mono text-[7px] tracking-widest mt-0.5" style={{ color: "#4a4a4a" }}>{count} CH</span>
                  </button>
                );
              })}
            </div>

            {/* Main interactive panel — dark inset */}
            <div
              className="relative p-3 sm:p-4"
              style={{
                borderRadius: 10,
                background: "linear-gradient(180deg,#0d0d0d,#141414)",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              {/* Tab strip */}
              <div className="flex items-stretch justify-center gap-1 sm:gap-1.5 mb-4">
                {TABS.map(({ id, label, sub, Icon }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      title={sub}
                      className="flex-1 max-w-[170px] flex items-center justify-center gap-1.5 px-2 py-2 transition-all"
                      style={{
                        borderRadius: 6,
                        background: active ? "rgba(212,255,0,0.12)" : "rgba(255,255,255,0.02)",
                        borderBottom: active ? `2px solid ${LIME}` : "2px solid transparent",
                      }}
                    >
                      <Icon size={12} style={{ color: active ? LIME : "#6a6a6a" }} />
                      <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.12em] uppercase whitespace-nowrap" style={{ color: active ? LIME : "#9a9a9a" }}>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cards arranged around the central tuning dial */}
              {filtered.length === 0 ? (
                <div className="text-center py-10">
                  <Radio size={26} className="mx-auto mb-2" style={{ color: "#4a4a4a" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#6a6a6a" }}>NO {language === "all" ? "" : language.toUpperCase() + " "}CHANNELS FOR THAT SPORT — TRY ANOTHER SPORT OR LANGUAGE</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_1fr] gap-3 items-center">
                  <div className="flex flex-col gap-3 order-2 lg:order-1">
                    {leftCards.map((s) => <StationCard key={s.id} s={s} />)}
                  </div>
                  <div className="order-1 lg:order-2 flex flex-col items-center justify-center py-1">
                    <TuningKnob
                      current={current}
                      loading={loading}
                      muted={muted}
                      onToggleMute={() => setMuted((m) => !m)}
                      onStop={() => setPlayingId(null)}
                      tuneAngle={tuneAngle}
                    />
                    <AnimatePresence>
                      {error && (
                        <div className="flex items-center gap-2 mt-3 px-3 py-2" style={{ background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.45)", borderRadius: 5 }}>
                          <AlertCircle size={12} style={{ color: "#ef4444" }} />
                          <p className="text-[10px]" style={{ color: "#ef4444" }}>{error}</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-col gap-3 order-3">
                    {rightCards.map((s) => <StationCard key={s.id} s={s} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Lower menu */}
            <div className="flex items-center justify-center gap-3 sm:gap-5 mt-5">
              {["LIVE SCORES", "NEWS", "STATS", "COMMUNITY"].map((n, i) => (
                <span key={n} className="flex items-center gap-3 sm:gap-5">
                  {i > 0 && <span className="font-mono text-[8px]" style={{ color: "#6a6a6a" }}>|</span>}
                  <span className="font-mono text-[8px] sm:text-[9px] tracking-widest" style={{ color: "#bcbcbc" }}>{n}</span>
                </span>
              ))}
            </div>

            {/* Live game coverage — free & legal streams */}
            <LiveGameCoverage />

            {/* Set alerts for live broadcasts */}
            <SportsAlerts />

            {/* Catch up on past games with short highlight clips */}
            <SportsHighlights />

            {/* Real-time chat — comment on live games as you listen */}
            <SportsLiveChat />
          </div>

          <BrushedBezel>
            <p className="font-mono text-[7px] sm:text-[8px] tracking-[0.18em]" style={{ color: "#3a3a3a", textShadow: "0 1px 0 rgba(255,255,255,0.25)" }}>
              ▶ {STREAMS.length} FREE SPORTS CHANNELS · 24/7 LIVE · ENGLISH DEFAULT · POWERED BY FOX SPORTS · KNBR · 630 CHED · MARCA · RMC · SER · RAI
            </p>
          </BrushedBezel>
        </div>
      </div>

      {/* Direct audio element — no crossOrigin, no Web Audio graph (non-CORS streams) */}
      <audio ref={audioRef} preload="none" />
    </section>
  );
}