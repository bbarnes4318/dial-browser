import React, { useState, useEffect } from "react";
import { Radio, Gamepad2, Mic2, Calendar, Trophy } from "lucide-react";
import RadioStation, { radioStations } from "@/components/landing/RadioStation";
import RadioPhoneGames from "@/components/landing/RadioPhoneGames";
import MusicStudio from "@/components/landing/MusicStudio";
import RadioScheduleBoard from "@/components/landing/RadioScheduleBoard";
import ArtistLeaderboard from "@/components/music/ArtistLeaderboard";

// Dial FM Tablet — one clean dark-glass touchscreen that unifies the live
// radio player (which already carries the Listen-by-Phone bridge + dial-in
// code box) with the phone games, music studio, radio schedule, and artist
// charts as flat tabs. The hosted components are unchanged; only the shell
// is new.
const TABS = [
  { id: "radio", label: "Live Radio", Icon: Radio, anchor: "dial-fm-stations" },
  { id: "games", label: "Phone Games", Icon: Gamepad2, anchor: "dial-fm-games" },
  { id: "studio", label: "Studio", Icon: Mic2, anchor: "dial-fm-studio" },
  { id: "schedule", label: "Schedule", Icon: Calendar, anchor: "dial-fm-schedule" },
  { id: "charts", label: "Charts", Icon: Trophy, anchor: "dial-fm-artists" },
];

export default function DialFMTablet() {
  const [tab, setTab] = useState("radio");

  // Activate the tab matching the URL hash so existing in-page anchors still land.
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace("#", "");
      const match = TABS.find((t) => t.anchor === h);
      if (match) setTab(match.id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const activeAnchor = TABS.find((t) => t.id === tab)?.anchor;

  return (
    <section id="dial-fm" className="relative py-8 lg:py-12" style={{ background: "#05070A" }}>
      <div className="px-3 lg:px-6 max-w-6xl mx-auto w-full">
        {/* Tablet frame — clean dark glass, Tesla-style */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 20,
            background: "linear-gradient(180deg, rgba(18,20,28,0.85), rgba(10,12,18,0.94))",
            border: "0.5px solid rgba(255,255,255,0.07)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.6), transparent)" }} />

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", animation: "dotPulse 2s ease-in-out infinite" }} />
              <span className="font-mono text-[9px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>DIAL FM</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{radioStations.length} STATIONS</span>
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#FF3838" }}>● LIVE</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-stretch gap-1 px-2 sm:px-3 overflow-x-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-3 flex-shrink-0 transition-colors"
                  style={{ borderBottom: active ? "2px solid #D1FF26" : "2px solid transparent" }}
                >
                  <Icon size={13} style={{ color: active ? "#D1FF26" : "#6A6F7A" }} />
                  <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] uppercase whitespace-nowrap" style={{ color: active ? "#D1FF26" : "#9AA0AA" }}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Screen — active tab content (each hosted component renders its own header/UI) */}
          <div id={activeAnchor} className="relative" style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
            {tab === "radio" && <RadioStation />}
            {tab === "games" && <RadioPhoneGames />}
            {tab === "studio" && <MusicStudio />}
            {tab === "schedule" && <RadioScheduleBoard />}
            {tab === "charts" && <ArtistLeaderboard />}
          </div>
        </div>
      </div>
    </section>
  );
}