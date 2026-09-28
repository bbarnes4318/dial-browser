import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radio, ArrowRight, Calendar, Tag, ChevronRight } from "lucide-react";

const newsItems = [
  {
    id: "n1",
    category: "Development",
    title: "AppNet Micro-Plug Pilot Launches in 3 Cities",
    summary: "Neighborhood-scale data delivery nodes are now live in New York, Lagos, and Mumbai, cutting last-mile mobile data costs by up to 40% during peak congestion.",
    date: "2026-06-28",
    status: "live",
    tag: "AppNet",
  },
  {
    id: "n2",
    category: "Milestone",
    title: "8.4 Million Dial Services Accessed",
    summary: "Community members have now placed over 8.4 million voice and SMS dials across the global network since launch — with rural regions showing the fastest month-over-month growth.",
    date: "2026-06-24",
    status: "live",
    tag: "Growth",
  },
  {
    id: "n3",
    category: "Announcement",
    title: "1 CALL Dating Expands to 12 New US Metro Areas",
    summary: "Voice-first matchmaking rolls out across Atlanta, Houston, Phoenix, and nine additional metros, bringing verified voice profiles to over 4 million new members.",
    date: "2026-06-20",
    status: "live",
    tag: "Dating",
  },
  {
    id: "n4",
    category: "Development",
    title: "Submarine Route Optimization Reduces Latency 18%",
    summary: "New dynamic routing across SEA-ME-WE 6 and Equiano cables drops average intercontinental dial latency from 38ms to 31ms for trans-Atlantic traffic.",
    date: "2026-06-15",
    status: "live",
    tag: "Network",
  },
  {
    id: "n5",
    category: "Milestone",
    title: "Marketplace Crosses 50,000 Active Listings",
    summary: "The voice-accessible classifieds marketplace now hosts over 50,000 verified listings across real estate, vehicles, and local services — all reachable by dial code.",
    date: "2026-06-10",
    status: "live",
    tag: "Marketplace",
  },
  {
    id: "n6",
    category: "Announcement",
    title: "Community Service Request Portal Goes Live",
    summary: "Members can now propose and upvote new dial services directly through the directory. Four community-requested services are already under development.",
    date: "2026-06-05",
    status: "live",
    tag: "Community",
  },
];

const categories = ["All", "Development", "Milestone", "Announcement"];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysAgo(dateStr) {
  const diff = Math.floor((new Date("2026-07-02") - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export default function NewsAnnouncements() {
  const [inView, setInView] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedNews, setSelectedNews] = useState(null);
  const [tick, setTick] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(interval);
  }, [inView]);

  const filteredNews =
    activeCategory === "All"
      ? newsItems
      : newsItems.filter((n) => n.category === activeCategory);

  return (
    <section
      ref={sectionRef}
      id="news"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      {/* Decorative signal nodes */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 14 }, (_, col) => (
            <div
              key={`${row}-${col}`}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${(col + 0.5) * (100 / 14)}%`,
                top: `${10 + row * 18}%`,
                background: (row + col) % 4 === 0 ? "#D1FF26" : "#8A8F98",
                opacity: 0.1 + ((row * 5 + col * 3) % 6) * 0.06,
              }}
            />
          ))
        )}
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-10 lg:mb-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }} />
                <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: "rgba(209,255,38,0.6)" }} />
              </div>
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>TRANSMISSION FEED</span>
            </div>
          </div>
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// NEWS &amp; ANNOUNCEMENTS</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Latest <span style={{ color: "#D1FF26" }}>Transmissions</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            Development milestones, platform updates, and network announcements — broadcast straight from the source.
          </p>
        </motion.div>

        {/* Category filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{
                  background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.5)",
                  border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}`,
                  color: isActive ? "#D1FF26" : "#8A8F98",
                  boxShadow: isActive ? "0 0 15px rgba(209,255,38,0.08)" : "none",
                }}
              >
                {cat}
              </button>
            );
          })}
        </motion.div>

        {/* News feed grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
              onClick={() => setSelectedNews(selectedNews === item.id ? null : item.id)}
              className="group text-left p-6 transition-all hover:scale-[1.02] flex flex-col"
              style={{
                background: selectedNews === item.id ? "rgba(209,255,38,0.05)" : "rgba(16,20,29,0.4)",
                border: `0.5px solid ${selectedNews === item.id ? "rgba(209,255,38,0.35)" : "rgba(138,143,152,0.12)"}`,
                boxShadow: selectedNews === item.id ? "0 0 24px rgba(209,255,38,0.06)" : "none",
              }}
            >
              {/* Top row: category + live indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <Tag size={9} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>{item.category.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: `dotPulse ${1.5 + (i % 3) * 0.3}s ease-in-out infinite` }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>{item.status.toUpperCase()}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-heading font-bold text-base mb-2 transition-colors" style={{ color: "#F5F5F7" }}>
                {item.title}
              </h3>

              {/* Summary */}
              <p className="text-xs leading-relaxed mb-5 flex-1" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
                {item.summary}
              </p>

              {/* Footer: date + tag + read more */}
              <div className="flex items-center justify-between pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.12)" }}>
                <div className="flex items-center gap-2">
                  <Calendar size={10} style={{ color: "#8A8F98" }} />
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{formatDate(item.date)}</span>
                  <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>· {daysAgo(item.date)}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">READ</span>
                  <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Expanded detail panel */}
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="mt-6 overflow-hidden"
          >
            {(() => {
              const item = newsItems.find((n) => n.id === selectedNews);
              if (!item) return null;
              return (
                <div className="p-6 lg:p-8" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <Radio size={16} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// FULL TRANSMISSION</p>
                  </div>
                  <h4 className="font-heading font-black text-2xl lg:text-3xl mb-3" style={{ color: "#F5F5F7" }}>{item.title}</h4>
                  <div className="flex items-center gap-4 mb-5">
                    <span className="font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                      {item.tag.toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{formatDate(item.date)} · {daysAgo(item.date)}</span>
                  </div>
                  <p className="text-sm lg:text-base" style={{ color: "#F5F5F7", lineHeight: "1.7" }}>{item.summary}</p>
                  <p className="text-sm mt-4" style={{ color: "#8A8F98", lineHeight: "1.7" }}>
                    This update is part of our continuous effort to extend reliable, low-cost digital access to communities worldwide. Stay tuned to this feed for future transmissions as the network expands.
                  </p>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Bottom ticker bar */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.4 }} className="mt-10 flex items-center gap-4 px-5 py-3 overflow-hidden" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>LATEST</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-8 whitespace-nowrap" style={{ animation: "tickerScroll 40s linear infinite" }}>
              {[...newsItems, ...newsItems].map((item, i) => (
                <span key={i} className="font-mono text-[9px] flex items-center gap-2" style={{ color: "#8A8F98" }}>
                  <span style={{ color: "#D1FF26" }}>◆</span>
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}