import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { Radio, Loader2, Activity, MapPin, TrendingUp, X, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";

const REGION_COORDS = {
  northeast: [42.5, -74.0], southeast: [32.0, -84.0], midwest: [41.5, -93.5],
  southwest: [34.5, -106.0], west: [38.5, -120.5], national: [39.5, -98.5],
  "new york": [40.71, -74.01], "los angeles": [34.05, -118.24], chicago: [41.88, -87.63],
  miami: [25.76, -80.19], houston: [29.76, -95.37], atlanta: [33.75, -84.39],
  dallas: [32.78, -96.80], seattle: [47.61, -122.33], denver: [39.74, -104.99],
  boston: [42.36, -71.06], phoenix: [33.45, -112.07], "san francisco": [37.77, -122.42],
  "washington": [38.90, -77.03], philadelphia: [39.95, -75.17], detroit: [42.33, -83.05],
  "minneapolis": [44.98, -93.27], "las vegas": [36.17, -115.14], portland: [45.52, -122.67],
  "san diego": [32.72, -117.16], orlando: [28.54, -81.38], "tampa": [27.95, -82.46],
  "salt lake city": [40.76, -111.89], nashville: [36.16, -86.78], "charlotte": [35.23, -80.84],
  "austin": [30.27, -97.74], "columbus": [39.96, -82.99], "kansas city": [39.10, -94.58],
};

const CATEGORY_COLORS = {
  Medical: "#ef4444", Health: "#ef4444", Dental: "#ef4444",
  Weather: "#60A5FA", Grocery: "#FBBF24", Food: "#FBBF24",
  Construction: "#D1FF26", Jobs: "#D1FF26", Music: "#a855f7",
  Entertainment: "#ec4899", RealEstate: "#3b82f6", Finance: "#a855f7",
  BillPay: "#a855f7", Emergency: "#ef4444", General: "#8A8F98",
};

function getColor(cat) {
  if (!cat) return "#D1FF26";
  return CATEGORY_COLORS[cat] || "#D1FF26";
}

function makeGlowIcon(color, count) {
  const size = Math.min(14 + count, 28);
  return L.divIcon({
    className: "demand-marker-wrapper",
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.25;animation:demandPulse 2s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:20%;border-radius:50%;background:${color};box-shadow:0 0 10px ${color},0 0 20px ${color}80;"></div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function fmtTime(d) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function ServiceDemandMap() {
  const mapKey = useId();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [totalCommands, setTotalCommands] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.VoiceCommand.list("-created_date", 500);
        setTotalCommands((data || []).length);
        const regionMap = new Map();
        (data || []).forEach((cmd) => {
          const reg = (cmd.region || "").trim();
          if (!reg) return;
          const key = reg.toLowerCase();
          const coords = REGION_COORDS[key];
          if (!coords) return;
          if (!regionMap.has(key)) {
            regionMap.set(key, { name: reg, coords, commands: [], categories: {} });
          }
          const entry = regionMap.get(key);
          entry.commands.push(cmd);
          const cat = cmd.service_category || "General";
          entry.categories[cat] = (entry.categories[cat] || 0) + 1;
        });
        const list = Array.from(regionMap.values()).map((r) => {
          const sorted = Object.entries(r.categories).sort((a, b) => b[1] - a[1]);
          return { ...r, topCategory: sorted[0]?.[0] || "General", topCount: sorted[0]?.[1] || 0, allCategories: sorted };
        }).sort((a, b) => b.commands.length - a.commands.length);
        setRegions(list);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="snap-section py-16 lg:py-24 px-4 lg:px-8" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Radio size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// LIVE DEMAND MAP</p>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            See Where <span style={{ color: "#D1FF26" }}>Service Demand</span> Is Live
          </h2>
          <p className="text-sm lg:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Glowing markers show the most-requested service categories across regions in real time. Click any marker to explore active demand in that area.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <Loader2 size={28} className="animate-spin mb-3" style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SCANNING REGIONAL DEMAND…</p>
          </div>
        ) : regions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
            <Activity size={36} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>DEMAND DATA ACCUMULATING</p>
            <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Voice commands with regional data will light up the map</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Map */}
            <div className="lg:col-span-2 relative overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)", height: "420px" }}>
              <MapContainer
                key={mapKey}
                center={[39.5, -98.5]}
                zoom={4}
                scrollWheelZoom={false}
                style={{ width: "100%", height: "100%", background: "#05070A" }}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {regions.map((r) => {
                  const color = getColor(r.topCategory);
                  return (
                    <Marker
                      key={r.name}
                      position={r.coords}
                      icon={makeGlowIcon(color, r.commands.length)}
                      eventHandlers={{ click: () => setSelected(r) }}
                    >
                      <Popup>
                        <div style={{ background: "#10141D", color: "#F5F5F7", padding: "12px", minWidth: "180px", fontFamily: "monospace" }}>
                          <p style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#D1FF26", marginBottom: "4px" }}>{r.name.toUpperCase()}</p>
                          <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "6px" }}>{r.topCategory}</p>
                          <p style={{ fontSize: "10px", color: "#8A8F98" }}>{r.commands.length} active requests</p>
                          <p style={{ fontSize: "9px", color: "rgba(138,143,152,0.6)", marginTop: "4px" }}>Click sidebar for details</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* HUD overlay frame */}
              <div className="absolute top-2 left-2 pointer-events-none" style={{ color: "#D1FF26" }}>
                <div className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(5,7,10,0.85)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  ● LIVE · {regions.length} REGIONS
                </div>
              </div>
            </div>

            {/* Sidebar — region list + detail */}
            <div className="lg:col-span-1 flex flex-col" style={{ maxHeight: "420px" }}>
              <div className="p-3 mb-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// TOP REGIONS BY DEMAND</p>
                <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>{totalCommands} TOTAL COMMANDS TRACKED</p>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain space-y-1.5" style={{ WebkitOverflowScrolling: "touch" }}>
                {regions.slice(0, 12).map((r, idx) => {
                  const color = getColor(r.topCategory);
                  const isSel = selected?.name === r.name;
                  return (
                    <button
                      key={r.name}
                      onClick={() => setSelected(r)}
                      className="w-full p-3 text-left transition-all"
                      style={{
                        background: isSel ? "rgba(209,255,38,0.08)" : "#10141D",
                        border: `0.5px solid ${isSel ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.12)"}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                        <span className="font-heading font-semibold text-xs flex-1 truncate" style={{ color: "#F5F5F7" }}>{r.name}</span>
                        <span className="font-mono text-[9px] font-bold" style={{ color: "#D1FF26" }}>{r.commands.length}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-4">
                        <Zap size={8} style={{ color: color }} />
                        <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
                          {r.topCategory.toUpperCase()} · {Math.round((r.topCount / r.commands.length) * 100)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Detail popup panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-5"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// {selected.name.toUpperCase()} DEMAND</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                  <X size={14} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>ACTIVE REQUESTS</p>
                  <p className="font-heading font-black text-3xl" style={{ color: "#D1FF26" }}>{selected.commands.length}</p>
                </div>
                <div>
                  <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>TOP CATEGORY</p>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: getColor(selected.topCategory), boxShadow: `0 0 8px ${getColor(selected.topCategory)}` }} />
                    <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{selected.topCategory}</p>
                  </div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="mt-4">
                <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>CATEGORY BREAKDOWN</p>
                <div className="space-y-1.5">
                  {selected.allCategories.slice(0, 5).map(([cat, count]) => {
                    const color = getColor(cat);
                    const pct = Math.round((count / selected.commands.length) * 100);
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="font-mono text-[9px] w-24 truncate" style={{ color: "#F5F5F7" }}>{cat}</span>
                        <div className="flex-1 h-1.5 overflow-hidden" style={{ background: "rgba(5,7,10,0.6)" }}>
                          <div className="h-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}80` }} />
                        </div>
                        <span className="font-mono text-[8px] w-8 text-right" style={{ color: "#8A8F98" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent commands */}
              <div className="mt-4">
                <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>RECENT ACTIVITY</p>
                <div className="space-y-1">
                  {selected.commands.slice(0, 4).map((cmd) => (
                    <div key={cmd.id} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[8px] flex-shrink-0" style={{ color: getColor(cmd.service_category) }}>●</span>
                      <span className="truncate flex-1" style={{ color: "#F5F5F7" }}>"{cmd.command_text}"</span>
                      <span className="font-mono text-[8px] flex-shrink-0" style={{ color: "rgba(138,143,152,0.5)" }}>{fmtTime(cmd.created_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        {regions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 justify-center">
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>CATEGORIES:</p>
            {Array.from(new Set(regions.map((r) => r.topCategory))).slice(0, 8).map((cat) => (
              <div key={cat} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: getColor(cat), boxShadow: `0 0 4px ${getColor(cat)}` }} />
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{cat.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}