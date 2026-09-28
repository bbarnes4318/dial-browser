import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, X, Phone, Copy, Check, ArrowUpDown, ChevronDown, ArrowLeft, Grid3x3, Play, Pause, Volume2, Globe, MapPin, Flag } from "lucide-react";
import { dialServices as services, getServiceStatus } from "@/data/dialServices";
import ServiceRequestForm from "@/components/dial/ServiceRequestForm";
import VoiceFlowSimulator, { openVoiceFlowSimulator } from "@/components/dial/VoiceFlowSimulator";
import HostSearch from "@/components/dial/HostSearch";
import { base44 } from "@/api/base44Client";
import VoiceGuidedToggle from "@/components/voice/VoiceGuidedToggle";

const statusConfig = {
  active: {
    color: "#D1FF26",
    label: "ACTIVE",
    glow: "0 0 8px #D1FF26, 0 0 16px rgba(209,255,38,0.6)",
  },
  maintenance: {
    color: "#F5A623",
    label: "MAINTENANCE",
    glow: "0 0 8px #F5A623, 0 0 16px rgba(245,166,35,0.5)",
  },
};

function StatusDot({ status }) {
  const cfg = statusConfig[status];
  return (
    <div className="flex items-center gap-1.5 px-2 py-1" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${cfg.color}40` }} title={cfg.label}>
      <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: cfg.color, boxShadow: cfg.glow, animation: "dotPulse 1.5s ease-in-out infinite" }} />
      <span className="font-mono text-[8px] tracking-widest font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

const sortOptions = [
  { value: "name", label: "Name (A–Z)" },
  { value: "category", label: "Category" },
];

// Region metadata — drives the region filter bar and glowing badges
const regionMeta = {
  Global: { color: "#3b82f6", icon: Globe, glow: "0 0 8px #3b82f6, 0 0 16px rgba(59,130,246,0.5)" },
  National: { color: "#a855f7", icon: Flag, glow: "0 0 8px #a855f7, 0 0 16px rgba(168,85,247,0.5)" },
  Local: { color: "#D1FF26", icon: MapPin, glow: "0 0 8px #D1FF26, 0 0 16px rgba(209,255,38,0.5)" },
};

// High-level service collections — map to underlying categories & tags
const collections = [
  { id: "all", label: "All Services", match: () => true },
  { id: "media", label: "Media", match: (s) => s.category === "Entertainment" },
  { id: "sports", label: "Sports", match: (s) => s.tags.some((t) => ["event", "ticket", "concert", "sports"].includes(t)) },
  { id: "travel", label: "Travel", match: (s) => s.category === "Travel" || s.tags.some((t) => ["flight", "hotel", "car rental", "transport"].includes(t)) },
  { id: "collab", label: "Collaboration", match: (s) => s.category === "Productivity" || s.tags.some((t) => ["ai", "assistant", "job", "career", "marketplace"].includes(t)) },
  { id: "local", label: "Local Services", match: (s) => s.category === "Local" },
  { id: "health", label: "Health", match: (s) => s.category === "Health" },
];

function ServiceCard({ service, index }) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);

  const greetingText = `Welcome to ${service.name}. ${service.desc} Call the 1 Call Away number and ask for ${service.name} to get connected.`;

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!("speechSynthesis" in window)) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(greetingText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.2) }}
      onClick={() => setExpanded(!expanded)}
      className="group relative p-5 cursor-pointer transition-all duration-300"
      style={{
        background: expanded ? "#10141D" : "rgba(16,20,29,0.5)",
        border: `0.5px solid ${expanded ? "rgba(209,255,38,0.35)" : "rgba(209,255,38,0.08)"}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{service.icon}</span>
        <div className="flex flex-col items-end gap-1.5">
          <span className="font-mono text-[10px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
            {service.category}
          </span>
          {(() => {
            const rm = regionMeta[service.region] || regionMeta.Local;
            const RIcon = rm.icon;
            return (
              <div className="flex items-center gap-1.5 px-2 py-1" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${rm.color}40` }} title={service.region}>
                <span className="rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: rm.color, boxShadow: rm.glow, animation: "dotPulse 1.5s ease-in-out infinite" }} />
                <RIcon size={9} style={{ color: rm.color }} />
                <span className="font-mono text-[8px] tracking-widest font-bold" style={{ color: rm.color }}>{service.region.toUpperCase()}</span>
              </div>
            );
          })()}
          <StatusDot status={getServiceStatus(service.id)} />
        </div>
      </div>
      <h3 className="font-heading font-bold text-base mb-2" style={{ color: "#F5F5F7" }}>{service.name}</h3>
      <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: "#8A8F98" }}>{service.desc}</p>
      <div className="flex items-center justify-between pt-3" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
            style={{
              background: playing ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)",
              border: `0.5px solid ${playing ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.2)"}`,
              color: "#D1FF26",
              boxShadow: playing ? "0 0 12px rgba(209,255,38,0.2)" : "none",
            }}
            title={playing ? "Stop greeting" : "Play voice greeting"}
          >
            {playing ? <Pause size={11} /> : <Play size={11} />}
            <Volume2 size={10} style={{ opacity: 0.7 }} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{service.id}</span>
          <ChevronDown size={12} className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} style={{ color: "#8A8F98" }} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="pt-4 mt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>EXAMPLE</p>
              <p className="font-mono text-[11px]" style={{ color: "#F5F5F7" }}>{service.example}</p>
              <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                {service.tags.map((tag) => (
                  <span key={tag} className="font-mono text-[8px] tracking-widest uppercase px-2 py-1" style={{ background: "rgba(138,143,152,0.08)", color: "#8A8F98" }}>#{tag}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`/directory/${service.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
                  style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                >
                  View Stats →
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); openVoiceFlowSimulator(service); }}
                  className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
                  style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}
                >
                  <Play size={11} /> Try Flow
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DialDirectory() {
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("all");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRegion, setActiveRegion] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [sortOpen, setSortOpen] = useState(false);

  const collectionFn = collections.find((c) => c.id === activeCollection).match;

  // Categories scoped to the active collection + region so chips stay relevant
  const categories = useMemo(() => {
    const counts = {};
    services.filter((s) => collectionFn(s) && (activeRegion === "All" || s.region === activeRegion)).forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return ["All", ...Object.keys(counts).sort()];
  }, [activeCollection, activeRegion]);

  const categoryCounts = useMemo(() => {
    const scoped = services.filter((s) => collectionFn(s) && (activeRegion === "All" || s.region === activeRegion));
    const counts = { All: scoped.length };
    scoped.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return counts;
  }, [activeCollection, activeRegion]);

  // Regions scoped to the active collection so the region bar stays relevant
  const regions = useMemo(() => {
    const counts = {};
    services.filter(collectionFn).forEach((s) => { counts[s.region] = (counts[s.region] || 0) + 1; });
    return ["All", ...Object.keys(counts).sort()];
  }, [activeCollection]);

  const regionCounts = useMemo(() => {
    const scoped = services.filter(collectionFn);
    const counts = { All: scoped.length };
    scoped.forEach((s) => { counts[s.region] = (counts[s.region] || 0) + 1; });
    return counts;
  }, [activeCollection]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const results = services.filter((service) => {
      const matchesCollection = collectionFn(service);
      const matchesCategory = activeCategory === "All" || service.category === activeCategory;
      const matchesRegion = activeRegion === "All" || service.region === activeRegion;
      const matchesQuery = !q ||
        service.name.toLowerCase().includes(q) ||
        service.desc.toLowerCase().includes(q) ||
        service.tags.some((t) => t.includes(q)) ||
        service.category.toLowerCase().includes(q) ||
        (service.region || "").toLowerCase().includes(q);
      return matchesCollection && matchesCategory && matchesRegion && matchesQuery;
    });

    return results.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      return 0;
    });
  }, [query, activeCategory, activeRegion, activeCollection, sortBy]);

  // Securely log what users are searching for (PII stripped server-side).
  // Debounced so we log intent, not every keystroke; only for meaningful queries.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(() => {
      base44.functions.invoke("logServiceSearch", {
        query,
        category: activeCategory,
        region: activeRegion,
        collection: activeCollection,
        result_count: filtered.length,
        source: "directory",
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [query, activeCategory, activeRegion, activeCollection, filtered.length]);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      {/* Global sticky search bar */}
      <div className="sticky top-0 z-50" style={{ background: "rgba(5,7,10,0.92)", backdropFilter: "blur(12px)", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: query.trim() ? "#D1FF26" : "#8A8F98" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services by name or category..."
              className="w-full pl-11 pr-10 py-2.5 font-mono text-sm tracking-wide outline-none transition-all"
              style={{
                background: "#10141D",
                border: query.trim() ? "0.5px solid rgba(209,255,38,0.4)" : "0.5px solid rgba(209,255,38,0.12)",
                color: "#F5F5F7",
                boxShadow: query.trim() ? "0 0 16px rgba(209,255,38,0.1)" : "none",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-12 lg:py-20">
        {/* Back link + header */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10 lg:mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Grid3x3 size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DIAL SERVICE DIRECTORY</p>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Find Your <span style={{ color: "#D1FF26" }}>Service</span>
          </h1>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            Search and filter every service available on the 1 CALL AWAY network. Call the 1 Call Away number from any phone, say what you need, and get connected instantly.
          </p>
        </motion.div>

        {/* Voice-only guided mode toggle */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-8">
          <VoiceGuidedToggle steps={[
            "Voice-only guided mode is on. I'll walk you through the directory in a real, human-recorded voice.",
            "Step one. Use the search bar to find a service by name or keyword.",
            "Step two. Filter by collection, region, and category to narrow the results.",
            "Step three. Tap any service card to hear its voice greeting.",
            "Step four. Call the 1 Call Away number and say what you need to connect.",
          ]} />
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>TOTAL SERVICES</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{services.length}</p>
          </div>
          <div className="p-4 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>CATEGORIES</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{categories.length - 1}</p>
          </div>
          <div className="p-4 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>ACTIVE SERVICES</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>{services.filter((s) => getServiceStatus(s.id) === "active").length}</p>
          </div>
        </motion.div>

        {/* Voice Flow Simulator — try any service before you dial in */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-8 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎙️</span>
            <div>
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VOICE FLOW SIMULATOR</p>
              <p className="text-sm mt-0.5" style={{ color: "#F5F5F7" }}>Click through a mock voice-guided call for any service before you dial in.</p>
            </div>
          </div>
          <button onClick={() => openVoiceFlowSimulator()} className="flex items-center justify-center gap-2 px-5 py-3 font-mono text-[11px] tracking-widest uppercase whitespace-nowrap transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            <Play size={14} /> Try the Simulator
          </button>
        </motion.div>

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or keyword... e.g. 'restaurant', 'weather', 'jobs'"
              className="w-full pl-12 pr-12 py-4 font-mono text-sm tracking-wide outline-none transition-all"
              style={{
                background: "#10141D",
                border: query.trim() ? "0.5px solid rgba(209,255,38,0.35)" : "0.5px solid rgba(209,255,38,0.15)",
                color: "#F5F5F7",
                boxShadow: query.trim() ? "0 0 20px rgba(209,255,38,0.08)" : "none",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }}>
                <X size={18} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-4 py-4 font-mono text-[11px] tracking-widest uppercase whitespace-nowrap transition-all w-full sm:w-auto justify-center"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
            >
              <ArrowUpDown size={14} style={{ color: "#D1FF26" }} />
              {sortOptions.find((o) => o.value === sortBy)?.label}
              <ChevronDown size={12} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} style={{ color: "#8A8F98" }} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-full sm:w-56 z-20" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                      className="w-full text-left px-4 py-3 font-mono text-[11px] tracking-widest uppercase transition-colors"
                      style={{ color: sortBy === opt.value ? "#D1FF26" : "#8A8F98", background: sortBy === opt.value ? "rgba(209,255,38,0.06)" : "transparent" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Collection filter bar — high-level groups */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }} className="flex flex-wrap gap-2 mb-4 pb-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
          {collections.map((col) => {
            const isActive = activeCollection === col.id;
            const count = services.filter(col.match).length;
            return (
              <button
                key={col.id}
                onClick={() => { setActiveCollection(col.id); setActiveCategory("All"); setActiveRegion("All"); }}
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] tracking-widest uppercase transition-all duration-300"
                style={{
                  background: isActive ? "rgba(209,255,38,0.12)" : "transparent",
                  border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.15)"}`,
                  color: isActive ? "#D1FF26" : "#8A8F98",
                  boxShadow: isActive ? "0 0 16px rgba(209,255,38,0.1)" : "none",
                }}
              >
                {col.label}
                <span className="font-mono text-[9px]" style={{ opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Region filter bar — glowing data point chips */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.19 }} className="flex flex-wrap items-center gap-2 mb-4 pb-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
          <span className="font-mono text-[9px] tracking-widest mr-1" style={{ color: "#8A8F98" }}>REGION:</span>
          {regions.map((reg) => {
            const isActive = activeRegion === reg;
            const rm = reg !== "All" ? regionMeta[reg] : null;
            const dotColor = rm?.color || "#D1FF26";
            const dotGlow = rm?.glow || "0 0 8px #D1FF26, 0 0 16px rgba(209,255,38,0.5)";
            return (
              <button
                key={reg}
                onClick={() => { setActiveRegion(reg); setActiveCategory("All"); }}
                className="flex items-center gap-2 px-4 py-2 font-mono text-[11px] tracking-widest uppercase transition-all duration-300"
                style={{
                  background: isActive ? `${dotColor}18` : "transparent",
                  border: `0.5px solid ${isActive ? `${dotColor}80` : "rgba(209,255,38,0.15)"}`,
                  color: isActive ? dotColor : "#8A8F98",
                  boxShadow: isActive ? `0 0 16px ${dotColor}20` : "none",
                }}
              >
                <span className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: dotColor, boxShadow: isActive ? dotGlow : "none", animation: isActive ? "dotPulse 1.5s ease-in-out infinite" : "none" }} />
                {reg}
                <span className="font-mono text-[9px]" style={{ opacity: 0.6 }}>{regionCounts[reg]}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Category filter chips */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-2 px-4 py-2 font-mono text-[11px] tracking-widest uppercase transition-all duration-300"
              style={{
                background: activeCategory === cat ? "#D1FF26" : "transparent",
                border: `0.5px solid ${activeCategory === cat ? "#D1FF26" : "rgba(209,255,38,0.15)"}`,
                color: activeCategory === cat ? "#05070A" : "#8A8F98",
              }}
            >
              {cat}
              <span className="font-mono text-[9px]" style={{ opacity: 0.6 }}>{categoryCounts[cat]}</span>
            </button>
          ))}
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
            {filtered.length} SERVICE{filtered.length !== 1 ? "S" : ""} FOUND
          </p>
          {(query || activeCategory !== "All" || activeCollection !== "all" || activeRegion !== "All") && (
            <button
              onClick={() => { setQuery(""); setActiveCategory("All"); setActiveCollection("all"); setActiveRegion("All"); }}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors"
              style={{ color: "#D1FF26" }}
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* Service grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-24">
            <Phone size={40} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 16px" }} />
            <p className="font-mono text-sm tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO MATCHING SERVICES</p>
            <p className="text-sm mb-6" style={{ color: "#8A8F98" }}>Try a different search term or category.</p>
            <button
              onClick={() => { setQuery(""); setActiveCategory("All"); setActiveCollection("all"); setActiveRegion("All"); }}
              className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
            >
              Reset Directory
            </button>
          </div>
        )}

        {/* Voice Host Search */}
        <HostSearch />

        {/* Community Service Requests */}
        <ServiceRequestForm />
      </div>

      {/* Voice Flow Simulator — self-contained modal, opens via global event */}
      <VoiceFlowSimulator />
    </div>
  );
}