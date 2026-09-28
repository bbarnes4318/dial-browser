import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { radioStations as stations } from "@/components/landing/RadioStation";
import { proxyRadioStreamUrl } from "@/lib/mediaProxy";
import RadioPlaylistPanel from "@/components/landing/RadioPlaylistPanel";

/**
 * Self-contained radio playlist showcase for the landing page.
 * Styled to match the Phosphor Pulse aesthetic — immediately visible
 * to visitors without scrolling into the Creators & Broadcasting tabs.
 */
export default function RadioPlaylistShowcase() {
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      const station = stations.find((s) => s.id === playing);
      if (!station) return;
      setLoading(true);
      audio.crossOrigin = "anonymous";
      audio.src = proxyRadioStreamUrl(station.streamUrl);
      audio.volume = 1;
      audio.play()
        .then(() => setLoading(false))
        .catch(() => {
          setLoading(false);
          setPlaying(null);
        });
    } else {
      audio.pause();
      audio.src = "";
    }
  }, [playing]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const playStationById = (stationId) => setPlaying(stationId);

  return (
    <section className="relative py-16 lg:py-20 overflow-hidden" style={{ background: "#05070A" }}>
      {/* Phosphor pulse background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${280 + i * 140}px`,
              height: `${280 + i * 140}px`,
              border: "0.5px solid rgba(209,255,38,0.06)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.04, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-6">
        {/* Section header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4" style={{ border: "0.5px solid rgba(209,255,38,0.3)", background: "rgba(209,255,38,0.05)" }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }}
            />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
              1 CALL RADIO™ · YOUR PLAYLISTS
            </span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold mb-2" style={{ color: "#F5F5F7" }}>
            Build Your <span style={{ color: "#D1FF26" }}>On-Air Queue</span>
          </h2>
          <p className="text-sm" style={{ color: "#8A8F98" }}>
            Save your favorite stations into custom playlists and listen in sequence — 100% free, royalty-paid music.
          </p>
        </div>

        {/* Quick-play station bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {stations.slice(0, 5).map((s) => {
            const Icon = s.icon;
            const isActive = playing === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setPlaying(isActive ? null : s.id)}
                className="flex items-center gap-1.5 px-3 py-2 transition-all"
                style={{
                  background: isActive ? s.accent : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${isActive ? s.border : "rgba(138,143,152,0.15)"}`,
                }}
              >
                <Icon size={12} style={{ color: isActive ? s.color : "#8A8F98" }} />
                <span className="font-mono text-[9px] tracking-wider uppercase" style={{ color: isActive ? s.color : "#8A8F98" }}>
                  {s.name}
                </span>
                {isActive && loading && <Loader2 size={10} className="animate-spin" style={{ color: s.color }} />}
              </button>
            );
          })}
        </div>

        {/* Playlist panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <RadioPlaylistPanel
            stations={stations}
            playing={playing}
            onPlayStation={playStationById}
          />
        </motion.div>
      </div>

      {/* Hidden audio element for stream playback */}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
    </section>
  );
}