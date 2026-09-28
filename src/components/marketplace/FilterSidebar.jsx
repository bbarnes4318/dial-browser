import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, MapPin } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All", icon: "▦" },
  { id: "realestate", label: "Real Estate", icon: "🏠" },
  { id: "vehicles", label: "Vehicles", icon: "🚗" },
  { id: "electronics", label: "Electronics", icon: "📱" },
  { id: "jobs", label: "Jobs", icon: "💼" },
  { id: "services", label: "Services", icon: "🔧" },
  { id: "other", label: "Other", icon: "📦" },
];

const PRICE_PRESETS = [
  { id: "all", label: "Any Price", min: 0, max: Infinity },
  { id: "under50", label: "Under $50", min: 0, max: 50 },
  { id: "50to200", label: "$50 – $200", min: 50, max: 200 },
  { id: "200to1000", label: "$200 – $1K", min: 200, max: 1000 },
  { id: "1000plus", label: "$1K+", min: 1000, max: Infinity },
];

export default function FilterSidebar({ listings, filters, onFilterChange, onReset }) {
  // Derive unique locations from listings
  const locations = useMemo(() => {
    const set = new Set();
    listings.forEach((l) => {
      if (l.location) set.add(l.location.trim());
    });
    return Array.from(set).sort();
  }, [listings]);

  const activeCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.priceRange !== "all" ? 1 : 0) +
    (filters.location !== "all" ? 1 : 0);

  const update = (patch) => onFilterChange({ ...filters, ...patch });

  return (
    <div className="p-5 lg:p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// FILTERS</p>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 font-mono text-[9px] font-bold rounded-full" style={{ background: "#D1FF26", color: "#05070A" }}>
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]"
            style={{ color: "#8A8F98" }}
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>

      {/* Category */}
      <div className="mb-6">
        <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>CATEGORY</p>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => {
            const count = cat.id === "all" ? listings.length : listings.filter((l) => l.category === cat.id).length;
            const active = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => update({ category: cat.id })}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all"
                style={{
                  background: active ? "rgba(209,255,38,0.12)" : "transparent",
                  border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.1)"}`,
                  color: active ? "#D1FF26" : "#F5F5F7",
                }}
              >
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </span>
                <span className="font-mono text-[9px]" style={{ color: active ? "#D1FF26" : "#8A8F98" }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>PRICE RANGE</p>
        <div className="space-y-1.5">
          {PRICE_PRESETS.map((preset) => {
            const active = filters.priceRange === preset.id;
            const count = preset.id === "all"
              ? listings.length
              : listings.filter((l) => {
                  if (l.price == null) return false;
                  return l.price >= preset.min && l.price <= preset.max;
                }).length;
            return (
              <button
                key={preset.id}
                onClick={() => update({ priceRange: preset.id })}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all"
                style={{
                  background: active ? "rgba(209,255,38,0.12)" : "transparent",
                  border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.1)"}`,
                  color: active ? "#D1FF26" : "#F5F5F7",
                }}
              >
                <span className="font-medium">{preset.label}</span>
                <span className="font-mono text-[9px]" style={{ color: active ? "#D1FF26" : "#8A8F98" }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={11} style={{ color: "#8A8F98" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOCATION</p>
        </div>
        {locations.length === 0 ? (
          <p className="font-mono text-[9px] py-3" style={{ color: "rgba(138,143,152,0.5)" }}>No locations yet</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            <button
              onClick={() => update({ location: "all" })}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all"
              style={{
                background: filters.location === "all" ? "rgba(209,255,38,0.12)" : "transparent",
                border: `0.5px solid ${filters.location === "all" ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.1)"}`,
                color: filters.location === "all" ? "#D1FF26" : "#F5F5F7",
              }}
            >
              <span className="font-medium">All Locations</span>
              <span className="font-mono text-[9px]" style={{ color: filters.location === "all" ? "#D1FF26" : "#8A8F98" }}>{listings.length}</span>
            </button>
            {locations.map((loc) => {
              const count = listings.filter((l) => (l.location || "").trim() === loc).length;
              const active = filters.location === loc;
              return (
                <button
                  key={loc}
                  onClick={() => update({ location: loc })}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all"
                  style={{
                    background: active ? "rgba(209,255,38,0.12)" : "transparent",
                    border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.1)"}`,
                    color: active ? "#D1FF26" : "#F5F5F7",
                  }}
                >
                  <span className="font-medium truncate pr-2">{loc}</span>
                  <span className="font-mono text-[9px] shrink-0" style={{ color: active ? "#D1FF26" : "#8A8F98" }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}