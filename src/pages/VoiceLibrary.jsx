import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Library, Radio, Play, BadgeCheck, Headphones, Globe } from "lucide-react";
import { dialServices } from "@/data/dialServices";
import LanguageSelector from "@/components/voice/LanguageSelector";
import LanguageRecognizer from "@/components/voice/LanguageRecognizer";
import VoiceGuidedToggle from "@/components/voice/VoiceGuidedToggle";
import VoiceDemoCard from "@/components/voice/VoiceDemoCard";
import HlsStreamOverlay from "@/components/voice/HlsStreamOverlay";

// Public, web-based HLS streams for the live directory. Titles link straight
// to the stream; "Watch Now" opens the branded overlay.
const STREAMS = [
  { title: "Big Buck Bunny", category: "Movies", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
  { title: "Tears of Steel", category: "Movies", url: "https://test-streams.mux.dev/tos_ismc/main.m3u8" },
  { title: "Apple BipBop Sample", category: "Tech Demo", url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8" },
  { title: "Mux Test Stream", category: "Tech Demo", url: "https://stream.mux.com/v69RSHpFelSk4gQBSelhJKgCBhLkuUjkfFjEffTPMItTOc.m3u8" },
];
const STREAM_CATS = ["All", "Movies", "Tech Demo"];

export default function VoiceLibrary() {
  const [cat, setCat] = useState("All");
  const [streamCat, setStreamCat] = useState("All");
  const [activeStream, setActiveStream] = useState(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(dialServices.map((s) => s.category)))],
    []
  );
  const filtered = cat === "All" ? dialServices : dialServices.filter((s) => s.category === cat);
  const streams = streamCat === "All" ? STREAMS : STREAMS.filter((s) => s.category === streamCat);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-12 lg:py-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Library size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE LIBRARY</p>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Browse. Listen. <span style={{ color: "#D1FF26" }}>Dial.</span>
          </h1>
          <p className="text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            A central library of every service voice demo, sorted by category. Press play to hear how each service works — narrated in a real, human-recorded voice — in your language.
          </p>
        </motion.div>

        {/* Real human voices banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3 p-4 mb-8"
          style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <BadgeCheck size={16} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#F5F5F7" }}>100% REAL HUMAN-RECORDED VOICES — NO ROBOTIC SPEECH</p>
        </motion.div>

        {/* Controls */}
        <div className="grid lg:grid-cols-3 gap-3 mb-10">
          <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LANGUAGE</p>
            </div>
            <LanguageSelector compact />
            <div className="mt-3">
              <LanguageRecognizer />
            </div>
          </div>
          <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Headphones size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// GUIDED MODE</p>
            </div>
            <VoiceGuidedToggle steps={[
              "Voice-only guided mode is on. I'll narrate each step in a real, human-recorded voice.",
              "Step one. Choose your language using the selector above.",
              "Step two. Filter by category to find the service you need.",
              "Step three. Press play on any card to hear the demo in a real human voice.",
              "Step four. Scroll to the live streams section and tap Watch Now to play a channel.",
            ]} />
          </div>
          <div className="p-4 flex flex-col justify-center" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// {dialServices.length} SERVICE DEMOS</p>
            <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
              Filter by category to find the exact service you need to hear about, then press play.
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: cat === c ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${cat === c ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                color: cat === c ? "#D1FF26" : "#8A8F98",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Voice demos grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
          {filtered.map((s, i) => (
            <VoiceDemoCard key={s.id} service={s} index={i} />
          ))}
        </div>

        {/* Live Streams directory */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Radio size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// LIVE STREAMS — WEB HLS DIRECTORY</p>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl mb-2" style={{ color: "#F5F5F7" }}>
            Watch Now. <span style={{ color: "#D1FF26" }}>Branded Overlay.</span>
          </h2>
          <p className="text-sm max-w-2xl mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Channel titles link straight to their web-based HLS streams. Tap Watch Now to play in a clean overlay — no broken embeds, no errors.
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {STREAM_CATS.map((c) => (
              <button
                key={c}
                onClick={() => setStreamCat(c)}
                className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{
                  background: streamCat === c ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${streamCat === c ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                  color: streamCat === c ? "#D1FF26" : "#8A8F98",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="overflow-hidden" style={{ border: "0.5px solid rgba(138,143,152,0.12)" }}>
            {streams.map((s, i) => (
              <div
                key={s.title}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[rgba(209,255,38,0.04)]"
                style={{
                  background: i % 2 === 0 ? "rgba(5,7,10,0.4)" : "rgba(16,20,29,0.4)",
                  borderBottom: "0.5px solid rgba(138,143,152,0.06)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[9px] tracking-widest px-2 py-1 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>{s.category}</span>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{s.title}</p>
                    <p className="font-mono text-[8px] truncate" style={{ color: "rgba(138,143,152,0.5)" }}>{s.url}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStream(s)}
                  className="flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase flex-shrink-0"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  <Play size={11} /> Watch Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <HlsStreamOverlay stream={activeStream} onClose={() => setActiveStream(null)} />
    </div>
  );
}