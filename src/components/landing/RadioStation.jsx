import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Mic, Headphones, Loader2, AlertCircle, Search, Radio,
  Star, Newspaper, MessageCircle, Sparkles,
} from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";
import { proxyRadioStreamUrl } from "@/lib/mediaProxy";
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";
import LiveEqualizer from "@/components/landing/LiveEqualizer";
import RadioDialInBox from "@/components/landing/RadioDialInBox";
import RadioPlaylistPanel from "@/components/landing/RadioPlaylistPanel";
import RadioPhoneBridge from "@/components/landing/RadioPhoneBridge";
import VoiceSearchButton from "@/components/shared/VoiceSearchButton";

// Real, free, copyright-paid internet radio streams from SomaFM
export const radioStations = [
  { id: "groove", name: "Groove Salad", genre: "Electronic", tagline: "A nicely chilled plate of ambient/downtempo beats", icon: Headphones, color: '#D1FF26', accent: 'rgba(209,255,38,0.15)', border: 'rgba(209,255,38,0.3)', dialCode: "*SALAD", dj: "DJ Nova", type: "Music", streamUrl: "https://ice1.somafm.com/groovesalad-128-mp3", djIntro: "You're locked into Groove Salad with your AI DJ Nova. A nicely chilled plate of ambient beats, served up fresh. Sit back and let the grooves wash over you." },
  { id: "beatblender", name: "Beat Blender", genre: "Electronic", tagline: "A late night blend of downtempo & chill", icon: Headphones, color: '#5AE0C8', accent: 'rgba(90,224,200,0.15)', border: 'rgba(90,224,200,0.3)', dialCode: "*BLEND", dj: "DJ Volt", type: "Music", streamUrl: "https://ice1.somafm.com/beatblender-128-mp3", djIntro: "Beat Blender in the mix. DJ Volt here. Late night downtempo and chill vibes to keep the energy flowing. Drop a request and I'll set the mood." },
  { id: "lush", name: "Lush Radio", genre: "Electronic", tagline: "Sensuous and atmospheric female vocals", icon: Headphones, color: '#E085A8', accent: 'rgba(224,133,168,0.15)', border: 'rgba(224,133,168,0.3)', dialCode: "*LUSH", dj: "DJ Velvet", type: "Music", streamUrl: "https://ice1.somafm.com/lush-128-mp3", djIntro: "Welcome to Lush. DJ Velvet here, spinning sensuous vocals and atmospheric beats all night. Call in a dedication and I'll read it on air." },
  { id: "indiepop", name: "Indie Pop Rocks", genre: "Pop", tagline: "New and classic indie pop tracks", icon: Radio, color: '#E0A85A', accent: 'rgba(224,168,90,0.15)', border: 'rgba(224,168,90,0.3)', dialCode: "*INDIE", dj: "DJ Cipher", type: "Music", streamUrl: "https://ice1.somafm.com/indiepop-128-mp3", djIntro: "Indie Pop Rocks, where the culture lives. DJ Cipher on the mic. New and classic indie tracks — you call it, I spin it." },
  { id: "bootliquor", name: "Boot Liquor", genre: "Country", tagline: "Americana roots music for drinking and fighting", icon: Radio, color: '#FF6B5A', accent: 'rgba(255,107,90,0.15)', border: 'rgba(255,107,90,0.3)', dialCode: "*BOOTS", dj: "DJ Axe", type: "Music", streamUrl: "https://ice1.somafm.com/bootliquor-128-mp3", djIntro: "Boot Liquor, cranked to eleven. DJ Axe here. Classic country, Americana, and outlaw roots — request a track and let's rip." },
  { id: "sonicuniverse", name: "Sonic Universe", genre: "Jazz", tagline: "Transcending the world of jazz with eclectic mixes", icon: Radio, color: '#9AE05A', accent: 'rgba(154,224,90,0.15)', border: 'rgba(154,224,90,0.3)', dialCode: "*SONIC", dj: "Skip AI", type: "Music", streamUrl: "https://ice1.somafm.com/sonicuniverse-128-mp3", djIntro: "Sonic Universe, your jazz headquarters. Skip AI on the call. Transcending jazz with eclectic mixes — ring in and I'll take your request." },
  { id: "sevensoul", name: "Seven Inch Soul", genre: "R&B", tagline: "Vintage soul tracks from the 60s and 70s", icon: Radio, color: '#C8A0FF', accent: 'rgba(200,160,255,0.15)', border: 'rgba(200,160,255,0.3)', dialCode: "*SOUL", dj: "DJ Velvet", type: "Music", streamUrl: "https://ice1.somafm.com/7soul-128-mp3", djIntro: "Seven Inch Soul, spinning vintage 45s. DJ Velvet with classic R&B and soul from the golden era. Call in a dedication — I'll spin it." },
  { id: "defcon", name: "DEF CON Radio", genre: "Electronic", tagline: "Music for the hacker community", icon: Radio, color: '#5A8FE0', accent: 'rgba(90,143,224,0.15)', border: 'rgba(90,143,224,0.3)', dialCode: "*HACK", dj: "Coach AI", type: "Music", streamUrl: "https://ice1.somafm.com/defcon-128-mp3", djIntro: "DEF CON Radio, music for the hacker community. Coach AI breaking down the beats. Call in with your track requests — let's hack the playlist." },
  { id: "spacestation", name: "Space Station", genre: "Electronic", tagline: "Tune in, turn on, space out. Spacey ambient", icon: Radio, color: '#FF8C42', accent: 'rgba(255,140,66,0.15)', border: 'rgba(255,140,66,0.3)', dialCode: "*SPACE", dj: "Point AI", type: "Music", streamUrl: "https://ice1.somafm.com/spacestation-128-mp3", djIntro: "Space Station, tune in and space out. Point AI with your orbital beats. Ambient, spacey, and out of this world — call in, let's go." },
  { id: "missioncontrol", name: "Mission Control", genre: "Ambient", tagline: "Ambient music with NASA mission control audio", icon: Radio, color: '#5AC8E0', accent: 'rgba(90,200,224,0.15)', border: 'rgba(90,200,224,0.3)', dialCode: "*NASA", dj: "Anchor AI", type: "Music", streamUrl: "https://ice1.somafm.com/missioncontrol-128-mp3", djIntro: "Mission Control, where ambient meets space exploration. Anchor AI with real NASA mission control audio mixed into the music. Call in for the latest from orbit." },
  { id: "blackrock", name: "Black Rock FM", genre: "Rock", tagline: "Modern alternative and indie rock", icon: Radio, color: '#FF6B5A', accent: 'rgba(255,107,90,0.15)', border: 'rgba(255,107,90,0.3)', dialCode: "*ROCK", dj: "DJ Riff", type: "Music", streamUrl: "https://ice1.somafm.com/blackrock-128-mp3", djIntro: "Black Rock FM, cranking modern alternative rock. DJ Riff on the deck. Indie, alt, and guitar-driven anthems — call in your requests." },
  { id: "cliqhop", name: "cliqhop idm", genre: "Hip-Hop", tagline: "Intelligent hip-hop, IDM and abstract beats", icon: Radio, color: '#E0C45A', accent: 'rgba(224,196,90,0.15)', border: 'rgba(224,196,90,0.3)', dialCode: "*HIPHOP", dj: "DJ Cipher", type: "Music", streamUrl: "https://ice1.somafm.com/cliqhop-128-mp3", djIntro: "cliqhop idm, intelligent hip-hop and abstract beats. DJ Cipher slicing the mix. IDM, glitch, and head-nod grooves — request a track." },
  { id: "doomed", name: "Doomed", genre: "Metal", tagline: "Dark, doom, sludge and post-metal", icon: Radio, color: '#8A5AE0', accent: 'rgba(138,90,224,0.15)', border: 'rgba(138,90,224,0.3)', dialCode: "*DOOM", dj: "DJ Void", type: "Music", streamUrl: "https://ice1.somafm.com/doomed-128-mp3", djIntro: "Doomed. DJ Void here with dark, heavy, and doom-laden riffs. Sludge, post-metal, and atmospheric heaviness — turn it up." },
  { id: "reggae", name: "Heavyweight Reggae", genre: "Reggae", tagline: "Roots reggae, dub and dancehall", icon: Radio, color: '#5AE07A', accent: 'rgba(90,224,122,0.15)', border: 'rgba(90,224,122,0.3)', dialCode: "*REGGAE", dj: "DJ Marley", type: "Music", streamUrl: "https://ice1.somafm.com/reggae-128-mp3", djIntro: "Heavyweight Reggae, roots and dub straight from the island. DJ Marley on the controls. Dancehall, ska, and one-love vibes — call in a dedication." },
  { id: "secretagent", name: "Secret Agent", genre: "Lounge", tagline: "Soundtracks for stylish spies", icon: Radio, color: '#5AC8E0', accent: 'rgba(90,200,224,0.15)', border: 'rgba(90,200,224,0.3)', dialCode: "*SPY", dj: "DJ 007", type: "Music", streamUrl: "https://ice1.somafm.com/secretagent-128-mp3", djIntro: "Secret Agent, soundtracks for stylish spies. DJ 007 spinning lounge, exotica, and spy-jazz. Shaken, not stirred — call in your request." },
  { id: "thetrip", name: "The Trip", genre: "Progressive", tagline: "Progressive house, trance and techno", icon: Radio, color: '#5A8FE0', accent: 'rgba(90,143,224,0.15)', border: 'rgba(90,143,224,0.3)', dialCode: "*TRIP", dj: "DJ Pulse", type: "Music", streamUrl: "https://ice1.somafm.com/thetrip-128-mp3", djIntro: "The Trip, progressive house and trance for the journey. DJ Pulse on the decks. Driving, melodic, and euphoric — let's ride." },
  { id: "dronezone", name: "Drone Zone", genre: "Ambient", tagline: "Ambient atmospheres for deep listening", icon: Radio, color: '#A85AE0', accent: 'rgba(168,90,224,0.15)', border: 'rgba(168,90,224,0.3)', dialCode: "*DRONE", dj: "DJ Aether", type: "Music", streamUrl: "https://ice1.somafm.com/dronezone-128-mp3", djIntro: "Drone Zone, ambient atmospheres for deep listening. DJ Aether floating the textures. Minimal, sustained, and meditative — drift away." },
  { id: "suburbsofgoa", name: "Suburbs of Goa", genre: "World", tagline: "Global grooves and world music", icon: Radio, color: '#E0A85A', accent: 'rgba(224,168,90,0.15)', border: 'rgba(224,168,90,0.3)', dialCode: "*WORLD", dj: "DJ Ravi", type: "Music", streamUrl: "https://ice1.somafm.com/suburbsofgoa-128-mp3", djIntro: "Suburbs of Goa, global grooves and world music. DJ Ravi on the mix. Afrobeat, Latin, Asian, and cross-cultural rhythms — call in." },
  { id: "folkfwd", name: "Folk Forward", genre: "Folk", tagline: "Indie folk, alt-folk and Americana", icon: Radio, color: '#C8A0FF', accent: 'rgba(200,160,255,0.15)', border: 'rgba(200,160,255,0.3)', dialCode: "*FOLK", dj: "DJ Willow", type: "Music", streamUrl: "https://ice1.somafm.com/folkfwd-128-mp3", djIntro: "Folk Forward, indie and alt-folk for the open road. DJ Willow here. Acoustic, heartfelt, and story-driven — request a song." },
  { id: "poptron", name: "PopTron", genre: "Pop", tagline: "Electropop and future pop", icon: Radio, color: '#FF8C42', accent: 'rgba(255,140,66,0.15)', border: 'rgba(255,140,66,0.3)', dialCode: "*POP", dj: "DJ Spark", type: "Music", streamUrl: "https://ice1.somafm.com/poptron-128-mp3", djIntro: "PopTron, electropop and future pop on the wavelength. DJ Spark here. Synth-driven, catchy, and bright — call in your anthem." },
  { id: "bbcworld", name: "BBC World Service", genre: "News & Talk", tagline: "Global news and current affairs, 24/7", icon: Mic, color: '#B85A5A', accent: 'rgba(184,90,90,0.15)', border: 'rgba(184,90,90,0.3)', dialCode: "*NEWS", dj: "BBC News", type: "Talk", streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service", djIntro: "BBC World Service — global news, analysis, and current affairs, 24 hours a day. Stay informed on the hour, every hour.", phoneStream: false },
  { id: "bbcradio4", name: "BBC Radio 4", genre: "Talk & Drama", tagline: "News, drama, comedy and documentaries", icon: Mic, color: '#5A7AE0', accent: 'rgba(90,122,224,0.15)', border: 'rgba(90,122,224,0.3)', dialCode: "*TALK", dj: "BBC Radio 4", type: "Talk", streamUrl: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm", djIntro: "BBC Radio 4 — the home of intelligent speech. News, drama, comedy, and documentaries, live around the clock.", phoneStream: false },
  { id: "radioparadise", name: "Radio Paradise", genre: "Eclectic", tagline: "Eclectic commercial-free mix, curated by real humans", icon: Radio, color: '#FF8C42', accent: 'rgba(255,140,66,0.15)', border: 'rgba(255,140,66,0.3)', dialCode: "*PARA", dj: "Bill & Rebecca", type: "Music", streamUrl: "https://stream.radioparadise.com/aac-128", djIntro: "Radio Paradise — eclectic, commercial-free internet radio curated by real humans. An ever-changing blend of styles from all eras. No algorithms, no ads, just great music." },
  { id: "hot108", name: "Hot 108 Jamz", genre: "Hip-Hop", tagline: "Today's hottest hip-hop and R&B hits", icon: Radio, color: '#E0C45A', accent: 'rgba(224,196,90,0.15)', border: 'rgba(224,196,90,0.3)', dialCode: "*HOT108", dj: "DJ Heat", type: "Music", streamUrl: "https://live.powerhitz.com/hot108?aw_0_req.gdpr=true", djIntro: "Hot 108 Jamz, where the streets meet the studio. DJ Heat on the mix. The hottest hip-hop and R&B joints — call in your request and I'll drop it on the dial." },
  { id: "lit", name: "Lit Hip-Hop + R&B", genre: "Hip-Hop", tagline: "Hip-hop and R&B on fire — all the current hits", icon: Radio, color: '#FF6B5A', accent: 'rgba(255,107,90,0.15)', border: 'rgba(255,107,90,0.3)', dialCode: "*LIT", dj: "DJ Blaze", type: "Music", streamUrl: "https://live.powerhitz.com/lit?aw_0_req.gdpr=true", djIntro: "Lit, hip-hop and R&B on fire. DJ Blaze holding it down. Current hits, throwbacks, and the tracks the streets are talking about — request yours." },
  { id: "onepower", name: "1Power Hits", genre: "Hip-Hop", tagline: "Top 40 and hip-hop power hits", icon: Radio, color: '#5A8FE0', accent: 'rgba(90,143,224,0.15)', border: 'rgba(90,143,224,0.3)', dialCode: "*1POWER", dj: "DJ Pulse", type: "Music", streamUrl: "https://live.powerhitz.com/1power?aw_0_req.gdpr=true", djIntro: "1Power, where the hits live. DJ Pulse on the dial. Top 40 and hip-hop power plays back to back — call in and I'll queue your anthem." },
  { id: "realrnb", name: "Real R&B", genre: "R&B", tagline: "Real R&B — the biggest R&B hits, 24/7", icon: Radio, color: '#C8A0FF', accent: 'rgba(200,160,255,0.15)', border: 'rgba(200,160,255,0.3)', dialCode: "*RNB", dj: "DJ Sade", type: "Music", streamUrl: "https://live.powerhitz.com/realrnb?aw_0_req.gdpr=true", djIntro: "Real R&B, the biggest R&B joints all day. DJ Sade in the studio. Smooth, soulful, and on repeat — call in a dedication and I'll set the mood." },
  { id: "bumpin", name: "Bumpin Classic Soul", genre: "Soul", tagline: "Classic soul — the legends of soul and Motown", icon: Radio, color: '#9AE05A', accent: 'rgba(154,224,90,0.15)', border: 'rgba(154,224,90,0.3)', dialCode: "*SOUL2", dj: "DJ Aretha", type: "Music", streamUrl: "https://live.powerhitz.com/bumpin?aw_0_req.gdpr=true", djIntro: "Bumpin Classic Soul, where the legends live. DJ Aretha on the dial. Motown, Philly soul, and timeless classics — call in and let's bump it." },
  { id: "backbounce", name: "BackBounce Old School", genre: "R&B", tagline: "Old-school R&B and hip-hop throwbacks", icon: Radio, color: '#FF8C42', accent: 'rgba(255,140,66,0.15)', border: 'rgba(255,140,66,0.3)', dialCode: "*OLDSK", dj: "DJ Flashback", type: "Music", streamUrl: "https://live.powerhitz.com/backbounce?aw_0_req.gdpr=true", djIntro: "BackBounce, old-school R&B and hip-hop throwbacks. DJ Flashback taking you back. The joints you grew up on — call in your memory." },
  { id: "nprnewsnow", name: "NPR News Now", genre: "Podcast", tagline: "Hourly NPR news podcast — five minutes, every hour", icon: Mic, color: '#5AC8E0', accent: 'rgba(90,200,224,0.15)', border: 'rgba(90,200,224,0.3)', dialCode: "*NPR", dj: "NPR News", type: "Talk",     streamUrl: "https://pd.npr.org/anon.npr-mp3/npr/news/newscast.mp3", djIntro: "NPR News Now — the latest news in five minutes, updated hourly. Stay informed on the hour, every hour.", phoneStream: false },
];

const GENRE_ORDER = ["Electronic", "Pop", "Rock", "Jazz", "R&B", "Soul", "Hip-Hop", "Metal", "Reggae", "Country", "Folk", "Lounge", "Ambient", "Progressive", "World", "Eclectic", "Podcast", "News & Talk", "Talk & Drama"];
const genres = GENRE_ORDER.filter((g) => radioStations.some((s) => s.genre === g));

// Prominently featured at the top of the console — the new real-song
// hip-hop, R&B, soul, and podcast channels.
const FEATURED_IDS = ["hot108", "lit", "realrnb", "backbounce", "nprnewsnow"];

// Curated "main" stations shown by default in the grid — a diverse cross-genre
// subset. The full catalog is reachable via the search bar and the genre /
// category filters below. Featured channels (above) are separate from this set.
const MAIN_STATION_IDS = [
  "groove", "lush", "indiepop", "bootliquor", "sonicuniverse",
  "sevensoul", "bbcworld", "radioparadise", "poptron", "blackrock",
];

// localStorage key for saved station presets (lightweight, no auth needed)
const PRESETS_KEY = "dial_radio_presets";

// Coarse content category for the quick-select bar (News / Music / Talk)
const stationCategory = (s) => (s.genre === "News & Talk" ? "News" : s.genre === "Podcast" ? "Podcast" : s.type === "Talk" ? "Talk" : "Music");
const QUICK_CATEGORIES = [
  { id: "all", label: "All", Icon: Radio },
  { id: "Music", label: "Music", Icon: Headphones },
  { id: "Podcast", label: "Podcast", Icon: Mic },
  { id: "News", label: "News", Icon: Newspaper },
  { id: "Talk", label: "Talk", Icon: MessageCircle },
];

function Equalizer({ color, active }) {
  const bars = [0, 1, 2, 3, 4, 5, 6];
  return (
    <div className="flex items-end gap-0.5 h-3.5">
      {bars.map((i) => (
        <div
          key={i}
          className="w-0.5 rounded-full"
          style={{
            background: color,
            height: active ? '100%' : '20%',
            animation: active ? `eqBar ${0.6 + (i % 3) * 0.25}s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.1}s`,
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function RadioStation() {
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [activeGenre, setActiveGenre] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [djSpeaking, setDjSpeaking] = useState(false);
  const [djMessage, setDjMessage] = useState("");
  const [listenerCount, setListenerCount] = useState({});
  const audioRef = useRef(null);
  const [audioEl, setAudioEl] = useState(null);
  const setAudioRef = useCallback((node) => {
    audioRef.current = node;
    setAudioEl(node);
  }, []);
  // The active station decides whether the stream is served through the
  // CORS-clean radio-proxy (Web Audio visualizer enabled) or played directly
  // (no CORS — Web Audio would silence it, so the graph is skipped).
  const activeStationForCsp = radioStations.find((s) => s.id === playing);
  const isProxiedActive = activeStationForCsp
    ? proxyRadioStreamUrl(activeStationForCsp.streamUrl) !== activeStationForCsp.streamUrl
    : false;
  // Keying the <audio> element by stream category forces a fresh element — and
  // a fresh Web Audio graph — whenever playback switches between proxied and
  // direct. createMediaElementSource is a one-way operation that otherwise
  // permanently captures and silences non-CORS streams.
  const audioKey = isProxiedActive ? "cors" : "direct";
  // Real-time frequency analysis drives the live equalizer bars (proxied only).
  const { analyser } = useAudioAnalyser(audioEl, !!playing, isProxiedActive);

  useEffect(() => {
    const counts = {};
    radioStations.forEach((s) => { counts[s.id] = Math.floor(Math.random() * 9000) + 500; });
    setListenerCount(counts);
    const interval = setInterval(() => {
      setListenerCount((prev) => {
        const next = { ...prev };
        const id = radioStations[Math.floor(Math.random() * radioStations.length)].id;
        next[id] = Math.max(100, (next[id] || 1000) + Math.floor(Math.random() * 40) - 20);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load + persist favorited presets (localStorage — lightweight, no auth needed)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
      if (Array.isArray(saved)) setFavorites(saved.filter((id) => radioStations.some((s) => s.id === id)));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  // Sync audio element with playing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      const station = radioStations.find((s) => s.id === playing);
      if (!station) return;

      setLoading(true);
      setError(null);
      // Route through the radio-proxy so the response is CORS-clean — required
      // for the Web Audio AnalyserNode and reliable cross-origin playback.
      // Stations whose host isn't on the proxy allowlist (Powerhitz / NPR) play
      // directly — the proxy would reject them. For those we drop crossOrigin
      // so plain cross-origin media still plays (the equalizer just won't react
      // for those channels).
      const streamSrc = proxyRadioStreamUrl(station.streamUrl);
      const isProxied = streamSrc !== station.streamUrl;
      if (isProxied) {
        audio.crossOrigin = "anonymous";
      } else {
        try { audio.removeAttribute("crossorigin"); } catch {}
        audio.crossOrigin = null;
      }
      audio.src = streamSrc;
      audio.volume = muted ? 0 : 1;
      audio.play()
        .then(() => {
          setLoading(false);
          setDjMessage(station.djIntro);
          setDjSpeaking(true);
          speak(station.djIntro, {
            rate: 1.0,
            pitch: 1.0,
            onEnd: () => setDjSpeaking(false),
            onError: () => setDjSpeaking(false),
          });
        })
        .catch((e) => {
          console.warn("RadioStation: play() rejected", station.id, e && e.name);
          setLoading(false);
          setError("Unable to connect to this station. Try another.");
          setPlaying(null);
        });
    } else {
      audio.pause();
      // Clear the source without calling load() — calling load() with no src
      // makes the browser fetch the page URL itself ("Failed to load audio").
      try { audio.removeAttribute("src"); } catch {}
      setDjMessage("");
      setDjSpeaking(false);
      stopSpeaking();
    }
  }, [playing]);

  // Handle mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : 1;
    }
  }, [muted]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const handlePlay = (station) => {
    if (playing === station.id) {
      setPlaying(null);
    } else {
      setPlaying(station.id);
    }
  };

  const playStationById = (stationId) => setPlaying(stationId);

  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const presetStations = favorites.map((id) => radioStations.find((s) => s.id === id)).filter(Boolean);

  const activeStation = radioStations.find((s) => s.id === playing);

  const featuredStations = useMemo(
    () => FEATURED_IDS.map((id) => radioStations.find((s) => s.id === id)).filter(Boolean),
    []
  );

  const filteredStations = useMemo(() => {
    const q = query.toLowerCase();
    return radioStations.filter((s) => {
      const matchCategory = activeCategory === "all" || stationCategory(s) === activeCategory;
      const matchGenre = activeGenre === "all" || s.genre === activeGenre;
      const matchQuery = !q ||
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.dj.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q);
      return matchCategory && matchGenre && matchQuery;
    });
  }, [activeCategory, activeGenre, query]);

  // Show only the curated main stations by default; expand to the full filtered
  // catalog once the user actively searches or picks a genre / category filter.
  const isBrowsing = !!query || activeGenre !== "all" || activeCategory !== "all";
  const displayStations = useMemo(
    () => (isBrowsing ? filteredStations : filteredStations.filter((s) => MAIN_STATION_IDS.includes(s.id))),
    [isBrowsing, filteredStations]
  );

  return (
    <section id="radio" className="relative py-8 lg:py-10 overflow-hidden" style={{ background: '#05070A' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 55%)" }} />

      <div className="relative z-10 px-4 lg:px-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Radio size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// LIVE RADIO DIAL</p>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
            One Tap. <span style={{ color: "#D1FF26" }}>Tune In.</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            {radioStations.length} live stations, royalty-paid and 100% free. Tap any station to listen instantly — no searching, no signup.
          </p>
        </div>

        {/* Free music badge */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: 'rgba(209,255,38,0.08)', border: '0.5px solid rgba(209,255,38,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D1FF26', animation: 'dotPulse 2s ease-in-out infinite' }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: '#D1FF26' }}>100% FREE · ROYALTY-PAID</span>
          </div>
          <span className="font-mono text-[8px] tracking-wider" style={{ color: '#8A8F98' }}>POWERED BY SOMAFM · RADIO PARADISE · BBC · POWERHITZ · NPR</span>
        </div>

        {/* ▸ FEATURED CHANNELS — new real-song hip-hop, R&B, soul & podcasts, front and center */}
        {featuredStations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={11} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>FEATURED CHANNELS · HIP-HOP · R&B · PODCASTS</p>
              <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>— REAL SONGS, 100% FREE</span>
            </div>
            <div className="flex gap-3 overflow-x-auto overscroll-contain pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
              {featuredStations.map((station) => {
                const isPlaying = playing === station.id;
                const Icon = station.icon;
                return (
                  <button
                    key={station.id}
                    onClick={() => handlePlay(station)}
                    className="group relative flex-shrink-0 w-[230px] sm:w-[250px] text-left p-4 transition-all duration-200 overflow-hidden"
                    style={{
                      background: isPlaying ? station.accent : "rgba(16,20,29,0.72)",
                      border: `0.5px solid ${isPlaying ? station.border : "rgba(209,255,38,0.22)"}`,
                      boxShadow: isPlaying ? `0 0 28px ${station.accent}` : "none",
                    }}
                  >
                    <span className="absolute top-2 right-2 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "#D1FF26", color: "#05070A" }}>NEW</span>
                    <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full pointer-events-none" style={{ background: station.color, opacity: isPlaying ? 0.20 : 0.09, filter: "blur(42px)" }} />
                    <div className="relative flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 flex items-center justify-center" style={{ background: station.accent, border: `0.5px solid ${station.border}` }}>
                        <Icon size={22} style={{ color: station.color }} />
                      </div>
                      {isPlaying && <LiveEqualizer analyser={analyser} color={station.color} />}
                    </div>
                    <p className="relative font-heading font-bold text-sm mb-0.5 truncate" style={{ color: "#F5F5F7" }}>{station.name}</p>
                    <p className="relative text-[11px] leading-tight line-clamp-2 mb-2 h-8" style={{ color: "#8A8F98" }}>{station.tagline}</p>
                    <div className="relative flex items-center justify-between pt-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.15)" }}>
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: station.color }}>{station.genre.toUpperCase()}</span>
                      {isPlaying && loading ? (
                        <Loader2 size={12} className="animate-spin" style={{ color: station.color }} />
                      ) : isPlaying ? (
                        <span className="font-mono text-[7px] tracking-widest" style={{ color: "#FF3838" }}>● LIVE</span>
                      ) : (
                        <Play size={12} style={{ color: station.color }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick-select content categories — News / Music / Talk */}
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          {QUICK_CATEGORIES.map(({ id, label, Icon }) => {
            const active = activeCategory === id;
            const count = id === "all" ? radioStations.length : radioStations.filter((s) => stationCategory(s) === id).length;
            return (
              <button key={id} onClick={() => setActiveCategory(id)} className="flex items-center gap-1.5 px-3 py-1.5 transition-all" style={{ background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${active ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}` }}>
                <Icon size={12} style={{ color: active ? "#D1FF26" : "#8A8F98" }} />
                <span className="font-mono text-[9px] tracking-widest uppercase whitespace-nowrap" style={{ color: active ? "#D1FF26" : "#8A8F98" }}>{label}</span>
                <span className="font-mono text-[8px]" style={{ color: active ? "#D1FF26" : "#8A8F98" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Presets — favorited stations appear here for one-tap access */}
        {presetStations.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Star size={11} style={{ color: "#D1FF26" }} fill="#D1FF26" />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>YOUR PRESETS</p>
              <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{presetStations.length} SAVED</span>
            </div>
            <div className="flex gap-2 overflow-x-auto overscroll-contain pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
              {presetStations.map((station) => {
                const isPlaying = playing === station.id;
                const Icon = station.icon;
                return (
                  <button key={station.id} onClick={() => handlePlay(station)} className="flex items-center gap-2 px-3 py-2 flex-shrink-0 transition-all" style={{ background: isPlaying ? station.accent : "rgba(16,20,29,0.6)", border: `0.5px solid ${isPlaying ? station.border : "rgba(209,255,38,0.2)"}` }}>
                    <Icon size={14} style={{ color: station.color }} />
                    <div className="text-left">
                      <p className="text-[11px] font-bold whitespace-nowrap" style={{ color: "#F5F5F7" }}>{station.name}</p>
                      <p className="font-mono text-[7px] tracking-wider" style={{ color: "#8A8F98" }}>{station.genre.toUpperCase()}</p>
                    </div>
                    {isPlaying ? <Pause size={12} style={{ color: station.color }} /> : <Play size={12} style={{ color: station.color }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search + genre chips */}
        <div className="mb-5 space-y-3">
          <div className="relative max-w-md mx-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stations, DJs, or genres — or tap the mic and speak…"
              className="w-full pl-9 pr-14 py-2.5 text-sm outline-none"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            />
            <VoiceSearchButton onResult={setQuery} title="Speak a station name, DJ, or genre" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto overscroll-contain pb-1 justify-start lg:justify-center" style={{ WebkitOverflowScrolling: "touch" }}>
            <button
              onClick={() => setActiveGenre("all")}
              className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap"
              style={{ background: activeGenre === "all" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${activeGenre === "all" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: activeGenre === "all" ? "#D1FF26" : "#8A8F98" }}
            >
              All
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(g)}
                className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap"
                style={{ background: activeGenre === g ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${activeGenre === g ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: activeGenre === g ? "#D1FF26" : "#8A8F98" }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Browse hint */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="font-mono text-[9px] tracking-widest text-center" style={{ color: "#8A8F98" }}>
            {isBrowsing ? `SHOWING ${displayStations.length} OF ${radioStations.length}` : `MAIN STATIONS · SEARCH OR PICK A GENRE TO BROWSE ALL ${radioStations.length}`}
          </span>
        </div>

        {/* Station grid */}
        {displayStations.length === 0 ? (
          <div className="text-center py-16">
            <Radio size={32} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO STATIONS MATCH YOUR SEARCH</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {displayStations.map((station) => {
              const isPlaying = playing === station.id;
              const Icon = station.icon;
              return (
                <motion.button
                  key={station.id}
                  onClick={() => handlePlay(station)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative text-left p-3 transition-all duration-200"
                  style={{
                    background: isPlaying ? station.accent : "rgba(16,20,29,0.6)",
                    border: `0.5px solid ${isPlaying ? station.border : "rgba(138,143,152,0.12)"}`,
                    boxShadow: isPlaying ? `0 0 20px ${station.accent}` : "none",
                  }}
                >
                  {/* Top row: icon + live badge */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ background: station.accent, border: `0.5px solid ${station.border}` }}>
                      <Icon size={18} style={{ color: station.color }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isPlaying ? (
                        <LiveEqualizer analyser={analyser} color={station.color} />
                      ) : (
                        <span className="font-mono text-[7px] tracking-widest" style={{ color: station.color }}>{station.genre.toUpperCase()}</span>
                      )}
                      <button
                        onClick={(e) => toggleFavorite(station.id, e)}
                        className="transition-transform hover:scale-110"
                        aria-label={favorites.includes(station.id) ? "Remove from presets" : "Save to presets"}
                      >
                        <Star
                          size={12}
                          style={{ color: favorites.includes(station.id) ? "#D1FF26" : "#8A8F98" }}
                          fill={favorites.includes(station.id) ? "#D1FF26" : "none"}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Name + tagline */}
                  <p className="text-xs font-bold truncate mb-0.5" style={{ color: "#F5F5F7" }}>{station.name}</p>
                  <p className="text-[10px] leading-tight line-clamp-2 h-8 mb-2" style={{ color: "#8A8F98" }}>{station.tagline}</p>

                  {/* Bottom row: DJ + listeners / play state */}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                    <div className="flex items-center gap-1 min-w-0">
                      <Mic size={9} style={{ color: station.color }} />
                      <span className="font-mono text-[8px] truncate" style={{ color: "#8A8F98" }}>{station.dj}</span>
                    </div>
                    {isPlaying && loading ? (
                      <Loader2 size={11} className="animate-spin" style={{ color: station.color }} />
                    ) : isPlaying ? (
                      <span className="font-mono text-[7px] tracking-widest" style={{ color: "#FF3838" }}>● LIVE</span>
                    ) : (
                      <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{(listenerCount[station.id] || 0).toLocaleString()} ▸</span>
                    )}
                  </div>

                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center" style={{ background: "rgba(5,7,10,0.6)" }}>
                    <div className="flex items-center justify-center w-10 h-10" style={{ background: isPlaying ? "#FF3838" : "#D1FF26", borderRadius: "50%" }}>
                      {isPlaying ? <Pause size={16} style={{ color: "#F5F5F7" }} /> : <Play size={16} style={{ color: "#05070A" }} />}
                    </div>
                  </div>

                  {/* Error indicator */}
                  {error && isPlaying && (
                    <div className="absolute top-1.5 right-1.5">
                      <AlertCircle size={12} style={{ color: "#ef4444" }} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Dial-in instruction box for the active/first station */}
        <RadioDialInBox station={activeStation || filteredStations[0] || radioStations[0]} />

        {/* Bridge the web player to a real phone call */}
        <RadioPhoneBridge station={activeStation || filteredStations[0] || radioStations[0]} />

        {/* Personalized playlist panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <RadioPlaylistPanel stations={radioStations} playing={playing} onPlayStation={playStationById} />
        </motion.div>

        <p className="text-center font-mono text-[10px] tracking-wider mt-6" style={{ color: '#8A8F98' }}>
          ▸ {radioStations.length} STATIONS · 24/7 LIVE · 100% FREE · TAP TO LISTEN · VOICE: "PLAY [STATION NAME]"
        </p>
      </div>

      {/* Now playing bar */}
      <AnimatePresence>
        {activeStation && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
            style={{ background: 'rgba(16,20,29,0.98)', borderTop: `0.5px solid ${activeStation.border}`, backdropFilter: 'blur(10px)' }}
          >
            <div className="max-w-6xl mx-auto flex items-center gap-4">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center" style={{ background: activeStation.accent, border: `0.5px solid ${activeStation.border}` }}>
                <activeStation.icon size={18} style={{ color: activeStation.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <LiveEqualizer analyser={analyser} color={activeStation.color} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: '#FF3838' }}>LIVE NOW</span>
                </div>
                <p className="font-heading font-bold text-sm truncate" style={{ color: '#F5F5F7' }}>
                  {activeStation.name} <span style={{ color: '#8A8F98', fontWeight: 'normal' }}>· {activeStation.tagline}</span>
                </p>
              </div>
              <div className="hidden sm:block max-w-xs flex-1 min-w-0">
                <p className="font-mono text-[9px] tracking-wider mb-0.5" style={{ color: activeStation.color }}>{activeStation.dj.toUpperCase()}:</p>
                <p className="text-[11px] truncate" style={{ color: '#8A8F98' }}>{djSpeaking ? djMessage : "AI DJ on air"}</p>
              </div>
              <button onClick={() => setMuted(!muted)} className="w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-100 opacity-70" style={{ border: '0.5px solid rgba(138,143,152,0.2)' }} aria-label={muted ? "Unmute" : "Mute"}>
                {muted ? <VolumeX size={14} style={{ color: '#8A8F98' }} /> : <Volume2 size={14} style={{ color: activeStation.color }} />}
              </button>
              <button onClick={() => handlePlay(activeStation)} className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105" style={{ background: '#FF3838' }} aria-label="Stop">
                {loading ? <Loader2 size={14} className="animate-spin" style={{ color: "#F5F5F7" }} /> : <Pause size={14} style={{ color: '#F5F5F7' }} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden audio element for real stream playback. crossOrigin is set
          per-station in the effect above (only when the stream is proxied).
          The key remounts the element when switching between proxied (CORS) and
          direct streams so the Web Audio graph can't silence direct streams. */}
      <audio ref={setAudioRef} key={audioKey} preload="auto" />
    </section>
  );
}