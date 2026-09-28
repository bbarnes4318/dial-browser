import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, X, Star, Search, Plus, ChevronRight,
  Radio, Users, Zap, Crown, Sparkles, TrendingUp, Phone, Globe,
} from "lucide-react";
import { dialServices, getServiceStats, getServiceStatus } from "@/data/dialServices";

// Deterministic rating + review count per service ID
function getRating(id) {
  const seed = parseInt(id, 10) * 9301 + 49297;
  const rand = (offset) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };
  const rating = Math.round((3.8 + rand(10) * 1.2) * 10) / 10;
  const reviews = Math.floor(120 + rand(11) * 4800);
  const uptime = Math.round((96 + rand(12) * 3.9) * 10) / 10;
  const cost = Math.round((0.25 + rand(13) * 1.75) * 100) / 100;
  return { rating, reviews, uptime, cost };
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

const CATEGORIES = ["All", "Travel", "Food", "Transport", "Housing", "Entertainment", "Productivity", "Local", "Health", "Shopping"];

export default function VoiceServiceComparison() {
  const [selected, setSelected] = useState(["03", "06", "09"]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return dialServices.filter((s) => {
      const matchesQ = !q || (s.name + " " + s.desc + " " + s.tags.join(" ")).toLowerCase().includes(q);
      const matchesCat = category === "All" || s.category === category;
      return matchesQ && matchesCat;
    });
  }, [query, category]);

  const compareServices = selected.map((id) => dialServices.find((s) => s.id === id)).filter(Boolean);
  const maxSlots = 3;

  const toggleSelect = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxSlots) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between" style={{ background: "rgba(5,7,10,0.9)", borderBottom: "0.5px solid rgba(209,255,38,0.15)", backdropFilter: "blur(12px)" }}>
        <Link to="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
          <ArrowLeft size={12} /> Home
        </Link>
        <p className="font-heading font-black text-lg hidden sm:block" style={{ color: "#F5F5F7" }}>
          1 CALL <span style={{ color: "#D1FF26" }}>COMPARE</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{selected.length}/{maxSlots} SELECTED</span>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={12} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE SERVICE COMPARISON</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Compare Voice Services <span style={{ color: "#D1FF26" }}>Side by Side</span>
          </h1>
          <p className="text-sm lg:text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Pick up to 3 services to compare categories, availability, user ratings, and key details — so you can choose the right one for your needs.
          </p>
        </motion.div>

        {/* Search + category filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <Search size={14} style={{ color: "#8A8F98" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services by name or keyword…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2.5 text-sm bg-transparent" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}>
            {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: "#10141D" }}>{c}</option>)}
          </select>
        </div>

        {/* Service picker grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {filtered.map((svc) => {
            const isSelected = selected.includes(svc.id);
            const status = getServiceStatus(svc.id);
            const { rating } = getRating(svc.id);
            return (
              <button key={svc.id} onClick={() => toggleSelect(svc.id)} className="text-left p-3 transition-all" style={{ background: isSelected ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.5)", border: `0.5px solid ${isSelected ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}` }}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{svc.icon}</span>
                  {isSelected ? (
                    <div className="flex items-center justify-center w-5 h-5" style={{ background: "#D1FF26", borderRadius: "50%" }}><Check size={12} style={{ color: "#05070A" }} /></div>
                  ) : (
                    <div className="flex items-center justify-center w-5 h-5" style={{ background: "transparent", border: "1px solid rgba(138,143,152,0.3)", borderRadius: "50%" }}><Plus size={12} style={{ color: "#8A8F98" }} /></div>
                  )}
                </div>
                <p className="font-heading font-semibold text-xs mb-1" style={{ color: "#F5F5F7" }}>{svc.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{svc.category.toUpperCase()}</span>
                  <span className="flex items-center gap-0.5 font-mono text-[8px]" style={{ color: status === "active" ? "#D1FF26" : "#FBBF24" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: status === "active" ? "#D1FF26" : "#FBBF24" }} />{status === "active" ? "Live" : "Maint"}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Star size={9} style={{ color: "#D1FF26", fill: "#D1FF26" }} />
                  <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{rating}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Comparison table */}
        <AnimatePresence mode="wait">
          {compareServices.length > 0 ? (
            <motion.div key={compareServices.map((s) => s.id).join("-")} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Service header cards */}
              <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(${compareServices.length}, 1fr)` }}>
                {compareServices.map((svc) => {
                  const status = getServiceStatus(svc.id);
                  const { rating, reviews } = getRating(svc.id);
                  return (
                    <div key={svc.id} className="p-4 text-center relative" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                      <button onClick={() => toggleSelect(svc.id)} className="absolute top-2 right-2 p-1 transition-colors hover:bg-[rgba(239,68,68,0.1)]"><X size={12} style={{ color: "#8A8F98" }} /></button>
                      <div className="text-3xl mb-2">{svc.icon}</div>
                      <h3 className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{svc.name}</h3>
                      <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>DIAL {svc.dial}</p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} size={10} style={{ color: n <= Math.round(rating) ? "#D1FF26" : "rgba(138,143,152,0.2)", fill: n <= Math.round(rating) ? "#D1FF26" : "transparent" }} />
                        ))}
                        <span className="font-mono text-[9px] ml-1" style={{ color: "#8A8F98" }}>{rating} ({reviews})</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail rows */}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    {[
                      { label: "Category", icon: Sparkles, getValue: (s) => s.category, isBadge: true },
                      { label: "Availability", icon: Radio, getValue: (s) => {
                        const st = getServiceStatus(s.id);
                        return st === "active" ? "Available Now" : "Maintenance";
                      }, getStatus: (s) => getServiceStatus(s.id) },
                      { label: "User Rating", icon: Star, getValue: (s) => {
                        const { rating } = getRating(s.id);
                        return `${rating} / 5.0`;
                      }},
                      { label: "Total Reviews", icon: Users, getValue: (s) => {
                        const { reviews } = getRating(s.id);
                        return reviews.toLocaleString();
                      }},
                      { label: "Uptime (30 days)", icon: TrendingUp, getValue: (s) => {
                        const { uptime } = getRating(s.id);
                        return `${uptime}%`;
                      }},
                      { label: "Cost per Call", icon: Zap, getValue: (s) => {
                        const { cost } = getRating(s.id);
                        return `$${cost.toFixed(2)}`;
                      }, isMono: true },
                      { label: "Avg Call Duration", icon: Phone, getValue: (s) => {
                        const stats = getServiceStats(s.id);
                        return formatDuration(stats.avgDuration);
                      }},
                      { label: "Dial Code", icon: Phone, getValue: (s) => s.dial, isMono: true },
                      { label: "Works on Any Phone", icon: Globe, getValue: () => "Yes", isCheck: true },
                      { label: "App Required", icon: X, getValue: () => "No", isCheck: true },
                      { label: "Description", icon: ChevronRight, getValue: (s) => s.desc, isText: true },
                    ].map((row, ri) => {
                      const RowIcon = row.icon;
                      return (
                        <tr key={row.label} style={{ borderTop: ri === 0 ? "none" : "0.5px solid rgba(138,143,152,0.08)" }}>
                          <td className="py-3 pr-4 whitespace-nowrap" style={{ width: "160px" }}>
                            <div className="flex items-center gap-2">
                              <RowIcon size={12} style={{ color: "#8A8F98" }} />
                              <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>{row.label}</span>
                            </div>
                          </td>
                          {compareServices.map((svc) => {
                            const val = row.getValue(svc);
                            return (
                              <td key={svc.id} className="py-3 px-3 align-top">
                                {row.isText && <p className="text-[11px]" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{val}</p>}
                                {row.isBadge && <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>{val.toUpperCase()}</span>}
                                {row.isMono && <span className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>{val}</span>}
                                {row.isCheck && <span className="flex items-center gap-1 text-[11px]" style={{ color: "#F5F5F7" }}><Check size={12} style={{ color: "#D1FF26" }} /> {val}</span>}
                                {row.getStatus && (
                                  <span className="flex items-center gap-1.5 text-[11px]" style={{ color: row.getStatus(svc) === "active" ? "#D1FF26" : "#FBBF24" }}>
                                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: row.getStatus(svc) === "active" ? "#D1FF26" : "#FBBF24" }} />
                                    {val}
                                  </span>
                                )}
                                {!row.isText && !row.isBadge && !row.isMono && !row.isCheck && !row.getStatus && (
                                  <span className="text-[11px]" style={{ color: "#F5F5F7" }}>{val}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* CTA */}
              <div className="mt-6 p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <div>
                  <p className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>Ready to try a service?</p>
                  <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>All services work on any phone — no app download required</p>
                </div>
                <Link to="/directory" className="flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                  <ChevronRight size={12} /> Browse Directory
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-16" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
              <Plus size={36} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SELECT SERVICES TO COMPARE</p>
              <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Pick up to 3 from the grid above</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}