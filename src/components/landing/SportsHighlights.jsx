import React from "react";
import { ExternalLink, Film } from "lucide-react";

const LIME = "#D4FF00";

// Official, free, legal sports highlight playlists on YouTube. We link out
// (rather than embedding) because the playlists aren't cleared for third-party
// embeds, so an inline player only ever shows an error. No fake video player —
// each card opens the channel's own highlight feed in a new tab.

const HIGHLIGHTS = [
  {
    id: "espn-mlb",
    title: "MLB Highlights",
    channel: "ESPN MLB",
    tag: "BASEBALL · DAILY",
    accent: "#9AE05A",
    playlistId: "PLHeL6O-A-ASnVpvWsfGDY3e3e9AqbHnKX",
    desc: "Home runs, walk-offs & top plays from MLB, updated daily.",
  },
  {
    id: "nba-espn",
    title: "NBA Highlights",
    channel: "NBA on ESPN",
    tag: "BASKETBALL · DAILY",
    accent: "#FF8C42",
    playlistId: "PLn3nHXu50t5z6OZqn71AcqKu7rWX_nnOk",
    desc: "Dunks, buzzer-beaters & game recaps from the NBA.",
  },
  {
    id: "nfl-espn",
    title: "NFL Highlights",
    channel: "NFL on ESPN",
    tag: "FOOTBALL · WEEKLY",
    accent: "#5A8FE0",
    playlistId: "PL1H2IyN18L0Sig6TkkAqLaoJFVBnukx9X",
    desc: "Touchdowns, big hits & NFL Live breakdowns every week.",
  },
  {
    id: "nbc-mlb",
    title: "MLB on NBC",
    channel: "NBC Sports",
    tag: "BASEBALL · GAME RECAPS",
    accent: "#5AC8E0",
    playlistId: "PLXEMPXZ3PY1jiOOiTIh5JFEkr6WyVDVa5",
    desc: "Full game highlight recaps from MLB on NBC Sports.",
  },
  {
    id: "espn-top10",
    title: "SportsCenter Top 10",
    channel: "ESPN",
    tag: "ALL SPORTS · DAILY",
    accent: "#D4FF00",
    playlistId: "PLn3nHXu50t5zhKw_4DvY63VJwzJ9v9Se9",
    desc: "The day's top 10 plays across every sport — a daily catch-up.",
  },
  {
    id: "espn-tennis",
    title: "Tennis Highlights",
    channel: "Tennis on ESPN",
    tag: "TENNIS · SLAMS",
    accent: "#E0C45A",
    playlistId: "PLn3nHXu50t5wUqPIC95nL9sgChOzpC4ee",
    desc: "Match highlights & key moments from the tennis Grand Slams.",
  },
];

function playlistUrl(playlistId) {
  return `https://www.youtube.com/playlist?list=${playlistId}`;
}

export default function SportsHighlights() {
  return (
    <div className="mt-5 p-4" style={{ borderRadius: 10, background: "linear-gradient(180deg,#0d0d0d,#141414)", border: "0.5px solid rgba(255,255,255,0.06)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7)" }}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <Film size={11} style={{ color: LIME }} />
        <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: LIME }}>CATCH UP · GAME HIGHLIGHTS</p>
        <span className="font-mono text-[8px]" style={{ color: "#8a8a8a" }}>— OFFICIAL CLIPS ON YOUTUBE</span>
      </div>

      {/* Highlight cards — each opens the channel's official playlist */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {HIGHLIGHTS.map((h) => (
          <a
            key={h.id}
            href={playlistUrl(h.playlistId)}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col text-left p-2.5 transition-transform active:scale-[0.98] hover:scale-[1.02]"
            style={{
              borderRadius: 7,
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center justify-center w-7 h-7 flex-shrink-0" style={{ background: `${h.accent}1a`, border: `0.5px solid ${h.accent}55`, borderRadius: 5 }}>
                <Film size={12} style={{ color: h.accent }} />
              </span>
              <ExternalLink size={10} style={{ color: "#6a6a6a" }} className="opacity-0 group-hover:opacity-100" />
            </div>
            <p className="font-heading font-bold text-[11px] truncate" style={{ color: "#F5F5F7" }}>{h.title}</p>
            <p className="text-[9px] leading-snug mt-0.5 line-clamp-2" style={{ color: "#8a8a8a" }}>{h.desc}</p>
            <span className="font-mono text-[7px] tracking-widest mt-1.5 inline-block self-start px-1.5 py-0.5" style={{ background: `${h.accent}1a`, color: h.accent, borderRadius: 2 }}>{h.tag}</span>
          </a>
        ))}
      </div>

      <p className="text-center font-mono text-[8px] tracking-wider mt-3" style={{ color: "#6a6a6a" }}>
        ▸ OFFICIAL HIGHLIGHTS · AUTO-UPDATING · OPENS ESPN & NBC SPORTS YOUTUBE
      </p>
    </div>
  );
}