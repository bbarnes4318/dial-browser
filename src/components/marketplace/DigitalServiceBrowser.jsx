import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Phone, ChevronRight, Boxes, Trophy, Newspaper, Heart, Music, Clapperboard, Users, UtensilsCrossed, Plane, Car, Home, HeartPulse, DollarSign, ShoppingBag, Bot, ShieldAlert, MapPin } from "lucide-react";
import { dialServices } from "@/data/dialServices";

// Premium platform services not in the dial services data
const platformServices = [
  { id: "ps-radio", name: "Radio Phone Network", category: "Music", icon: "📻", dial: "*535#", desc: "50+ radio stations broadcasting every genre, 24/7. Dial in and listen instantly — no apps, no data plans." },
  { id: "ps-dating", name: "1 Call Dating", category: "Dating", icon: "💕", dial: "*565#", desc: "Voice-first dating — match, chat, and meet through simple phone calls. No swiping, no apps." },
  { id: "ps-news", name: "1 Call News", category: "News", icon: "📰", dial: "*575#", desc: "Breaking news, headlines, and personalized news digests delivered by voice or SMS." },
  { id: "ps-marketplace", name: "Marketplace", category: "Shopping", icon: "🏷️", dial: "*106#", desc: "Browse and post classified listings for buying, selling, and trading with other members." },
  { id: "ps-emergency", name: "Emergency Alert", category: "Safety", icon: "🚨", dial: "*911#", desc: "Send GPS-based distress SMS to your emergency contacts instantly." },
  { id: "ps-video", name: "Video Meetings", category: "Collaboration", icon: "📹", dial: "*545#", desc: "Free video conferencing — create a room, share the code, and meet with up to 12 participants." },
  { id: "ps-voicemail", name: "Voicemail Box", category: "Productivity", icon: "📬", dial: "*500#", desc: "Personal voicemail with auto-transcription. Never miss a message — read or listen anytime." },
];

const allServices = [...dialServices, ...platformServices];

const CATEGORIES = [
  { id: "all", label: "All Services", icon: Boxes },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "News", label: "News", icon: Newspaper },
  { id: "Dating", label: "Dating", icon: Heart },
  { id: "Music", label: "Music", icon: Music },
  { id: "Entertainment", label: "Entertainment", icon: Clapperboard },
  { id: "Collaboration", label: "Collaboration", icon: Users },
  { id: "Food", label: "Food", icon: UtensilsCrossed },
  { id: "Travel", label: "Travel", icon: Plane },
  { id: "Transport", label: "Transport", icon: Car },
  { id: "Housing", label: "Housing", icon: Home },
  { id: "Health", label: "Health", icon: HeartPulse },
  { id: "Finance", label: "Finance", icon: DollarSign },
  { id: "Shopping", label: "Shopping", icon: ShoppingBag },
  { id: "Productivity", label: "Productivity", icon: Bot },
  { id: "Safety", label: "Safety", icon: ShieldAlert },
  { id: "Local", label: "Local", icon: MapPin },
];

export default function DigitalServiceBrowser() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return allServices
      .filter((s) => activeCategory === "all" || s.category === activeCategory)
      .filter((s) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          (s.name || "").toLowerCase().includes(q) ||
          (s.desc || "").toLowerCase().includes(q) ||
          (s.category || "").toLowerCase().includes(q) ||
          (s.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [activeCategory, query]);

  // Get count per category for the filter badges
  const categoryCount = useMemo(() => {
    const counts = {};
    allServices.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Boxes size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DIGITAL SERVICES BROWSER</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{filtered.length} OF {allServices.length} SERVICES</span>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
        <Search size={14} style={{ color: "#8A8F98" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search digital services by name, keyword, or category…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#F5F5F7" }}
        />
      </div>

      {/* Category filter bar */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = cat.id === "all" ? allServices.length : (categoryCount[cat.id] || 0);
          // Hide categories with no services
          if (cat.id !== "all" && count === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all whitespace-nowrap"
              style={{
                background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                color: isActive ? "#D1FF26" : "#8A8F98",
              }}
            >
              <cat.icon size={11} /> {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Services grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Search size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO SERVICES FOUND</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((svc, idx) => (
              <motion.div
                key={svc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.15) }}
                className="p-4 flex flex-col gap-3"
                style={{
                  background: "#10141D",
                  border: "0.5px solid rgba(209,255,38,0.12)",
                }}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-11 h-11 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <span className="text-xl">{svc.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{svc.name}</p>
                    <span className="inline-block font-mono text-[7px] tracking-widest px-1.5 py-0.5 mt-1" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>
                      {svc.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#8A8F98" }}>{svc.desc}</p>

                {/* Action */}
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: "0.5px solid rgba(209,255,38,0.08)" }}>
                  <a
                    href={`tel:${svc.dial}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    <Phone size={11} /> Dial {svc.dial}
                  </a>
                  <ChevronRight size={14} style={{ color: "#8A8F98" }} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}