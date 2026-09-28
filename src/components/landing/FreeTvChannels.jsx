import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tv, ExternalLink, Compass } from "lucide-react";

/**
 * Free TV channel directory — branded channel cards that link into
 * FreeCast's own player. Each card carries a live status indicator
 * (HUD electric-lime glow) reflecting that these are 24/7 linear FAST
 * channels (always-on by nature). FreeCast exposes no per-channel
 * liveness API, so the indicator marks always-on channels as LIVE.
 */
const CHANNELS = [
  { name: "Curiosity Now", category: "Documentary", slug: "curiosity-now", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/ab2984bb-de51-4f40-a529-22bf280324c7-1717011435.112132.256x256.jpg" },
  { name: "Stadium", category: "Sports", slug: "stadium", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/bec19c7b-0450-44d2-a397-16e94406f6d7-1742570223.64413.256x256.jpg" },
  { name: "Newsmax2", category: "News", slug: "newsmax2", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/cc1b89bf-3800-4ef6-97ce-7d18ac8c8bd1-1698870962.114219.256x256.png" },
  { name: "Yahoo Finance", category: "Finance", slug: "yahoo-finance", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/082f535b-acad-4ec1-977e-da205f4d901b-1741634783.243562.256x256.png" },
  { name: "SportsGrid", category: "Sports", slug: "sportsgrid", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/ed7a0737-de26-49be-b28f-83361fbcc516-1676409891.89913.256x256.jpg" },
  { name: "World Poker Tour", category: "Sports", slug: "world-poker-tour", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/08337255-069a-40e1-a4b5-ac27960f0b43-1690828342.502595.256x256.png" },
  { name: "HBCU GO", category: "Sports", slug: "hbcu-go", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/2127e761-3c18-4e8d-b58b-c463a836e3a5-1678922579.493643.256x256.jpg" },
  { name: "ACL Cornhole TV", category: "Sports", slug: "acl-cornhole-tv", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/8d5dbd52-cbf6-4bbd-818f-14d62c218636-1684848006.22944.256x256.jpg" },
  { name: "Nosey", category: "Entertainment", slug: "nosey", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/277c03d2-5039-4ac4-8e33-bcfbfe0f0428-1679330509.743254.256x256.jpg" },
  { name: "Western Bound", category: "Movies", slug: "western-bound", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/cb0184b5-a040-4ae7-a0a5-9a0e34a70789-1725469024.77614.256x256.png" },
  { name: "Heartland", category: "Movies", slug: "heartland", logo: "https://d3e3bui7xn67l.cloudfront.net/cms_media/media/live/channel/30d55ea3-078c-47c3-84a2-c2ab80c0dc49-1772222087.283743.256x256.png" },
];

const CATEGORIES = ["All", "Sports", "News", "Movies", "Entertainment", "Documentary", "Finance"];

export default function FreeTvChannels() {
  const [activeCat, setActiveCat] = useState("All");
  const filtered = activeCat === "All" ? CHANNELS : CHANNELS.filter((c) => c.category === activeCat);

  return (
    <section className="relative py-16 px-4" style={{ background: "#05070A" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Tv size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// FREE TV — 500+ LIVE CHANNELS</p>
        </div>
        <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
          Watch Free TV. <span style={{ color: "#D1FF26" }}>No Subscriptions.</span>
        </h2>
        <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Browse live news, sports, movies, and entertainment channels. Tap a channel to watch on FreeCast's player — the live indicator glows when a channel is on air.
        </p>
      </div>

      {/* Category filter */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
            style={{
              background: activeCat === cat ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${activeCat === cat ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
              color: activeCat === cat ? "#D1FF26" : "#8A8F98",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Channel grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((ch, i) => (
          <ChannelCard key={ch.slug} channel={ch} index={i} />
        ))}
      </div>

      {/* Footer note */}
      <div className="max-w-6xl mx-auto mt-6 flex items-center gap-2">
        <Compass size={11} style={{ color: "rgba(138,143,152,0.5)" }} />
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
          STREAMS PLAY IN FREECAST'S PLAYER · LIVE BADGE = ALWAYS-ON LINEAR CHANNEL
        </p>
      </div>
    </section>
  );
}

function ChannelCard({ channel, index }) {
  return (
    <motion.a
      href={`https://freecast.com/channels/${channel.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="relative flex flex-col overflow-hidden group transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.15)]"
      style={{ background: "rgba(16,20,29,0.7)", border: "0.5px solid rgba(138,143,152,0.12)" }}
    >
      {/* Signal line accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
      </div>

      {/* Logo + live badge */}
      <div className="relative p-4 flex items-center justify-center" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
        <div className="w-16 h-16 flex items-center justify-center overflow-hidden" style={{ background: "rgba(5,7,10,0.5)" }}>
          <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain" loading="lazy" />
        </div>
        {/* Live status indicator */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1.5 px-1.5 py-1"
          style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.45)", boxShadow: "0 0 10px rgba(209,255,38,0.25)" }}
          title="Live — always-on linear channel"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#D1FF26" }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#D1FF26" }} />
          </span>
          <span className="font-mono text-[7px] tracking-widest font-bold" style={{ color: "#D1FF26" }}>LIVE</span>
        </div>
      </div>

      {/* Channel info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="font-heading font-bold text-[12px] leading-tight truncate" style={{ color: "#F5F5F7" }}>{channel.name}</p>
        <p className="font-mono text-[8px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>{channel.category}</p>
      </div>

      {/* Watch action */}
      <div className="flex items-center justify-center gap-1.5 py-2 font-mono text-[8px] tracking-widest uppercase transition-colors group-hover:bg-[rgba(209,255,38,0.1)]" style={{ borderTop: "0.5px solid rgba(138,143,152,0.08)", color: "#D1FF26" }}>
        <ExternalLink size={10} /> Watch
      </div>
    </motion.a>
  );
}