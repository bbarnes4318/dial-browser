import React, { useState, useEffect, useMemo, useId } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Activity, Stethoscope, ShoppingCart, Building2, Receipt, Loader2, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";

const CITY_COORDS = {
  "new york": [40.7128, -74.0060], "nyc": [40.7128, -74.0060],
  "los angeles": [34.0522, -118.2437], "la": [34.0522, -118.2437],
  "chicago": [41.8781, -87.6298], "houston": [29.7604, -95.3698],
  "atlanta": [33.7490, -84.3880], "miami": [25.7617, -80.1918],
  "dallas": [32.7767, -96.7970], "seattle": [47.6062, -122.3321],
  "denver": [39.7392, -104.9903], "boston": [42.3601, -71.0589],
  "phoenix": [33.4484, -112.0740], "philadelphia": [39.9526, -75.1652],
  "san francisco": [37.7749, -122.4194], "sf": [37.7749, -122.4194],
  "washington": [38.9072, -77.0369], "dc": [38.9072, -77.0369],
  "detroit": [42.3314, -83.0458], "memphis": [35.1495, -90.0490],
  "nashville": [36.1627, -86.7816], "charlotte": [35.2271, -80.8431],
  "london": [51.5074, -0.1278], "lagos": [6.5244, 3.3792],
  "nairobi": [-1.2864, 36.8172], "mumbai": [19.0760, 72.8777],
  "tokyo": [35.6762, 139.6503], "sydney": [-33.8688, 151.2093],
  "toronto": [43.6532, -79.3832], "paris": [48.8566, 2.3522],
  "berlin": [52.5200, 13.4050], "cairo": [30.0444, 31.2357],
  "johannesburg": [-26.2041, 28.0473], "dubai": [25.2048, 55.2708],
};

const SERVICE_META = {
  medical: { color: "#ef4444", label: "Medical", icon: Stethoscope },
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function geocode(locationStr, seed) {
  if (locationStr) {
    const lower = locationStr.toLowerCase();
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      if (lower.includes(city)) return coords;
    }
  }
  const h = hashStr(seed || "default");
  return [39.8283 + ((h % 100) - 50) * 0.4, -98.5795 + (((h >> 8) % 100) - 50) * 0.5];
}

function fmtTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityServiceMap() {
  const mapKey = useId();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const requests = await base44.entities.ServiceRequest.list("-created_date", 50).catch(() => []);

        const mapped = [];
        (requests || []).forEach((r) => {
          mapped.push({
            id: r.id,
            type: "medical",
            title: r.requester_name ? `${r.requester_name} — medical` : "medical request",
            details: (r.details || "").slice(0, 120),
            location: r.location || "Unknown",
            status: r.status,
            urgency: r.ai_urgency,
            coords: geocode(r.location, r.id),
            created_date: r.created_date,
          });
        });

        mapped.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
        setActivities(mapped);
      } catch (e) {
        setActivities([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return activities;
    return activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  const counts = useMemo(() => {
    const c = { medical: 0 };
    activities.forEach((a) => { c[a.type] = (c[a.type] || 0) + 1; });
    return c;
  }, [activities]);

  const filterTypes = ["all", "medical"];

  return (
    <section id="community-map" className="snap-section relative py-20 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.4), transparent)" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Radio size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// LIVE COMMUNITY MAP</span>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Real-Time <span style={{ color: "#D1FF26" }}>Service Activity</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            See where members are engaging with medical services across the network.
          </p>
        </motion.div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          {Object.entries(SERVICE_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={key} className="p-3 text-center" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${filter === key ? meta.color + "60" : "rgba(138,143,152,0.12)"}` }}>
                <Icon size={14} className="mx-auto mb-1" style={{ color: meta.color }} />
                <p className="font-heading font-black text-xl" style={{ color: meta.color }}>{counts[key] || 0}</p>
                <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>{meta.label.toUpperCase()}</p>
              </div>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {filterTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-4 py-2 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap transition-all"
              style={{
                background: filter === t ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${filter === t ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                color: filter === t ? "#D1FF26" : "#8A8F98",
              }}
            >
              {t === "all" ? "ALL ACTIVITY" : SERVICE_META[t]?.label || t}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)", height: "440px" }}>
              {loading ? (
                <div className="flex items-center justify-center h-full" style={{ background: "#0a0d14" }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
                </div>
              ) : (
                <MapContainer
                  key={mapKey}
                  center={[39.8283, -98.5795]}
                  zoom={3}
                  style={{ height: "100%", width: "100%", background: "#0a0d14" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap & CartoDB'
                  />
                  {filtered.map((act) => {
                    const meta = SERVICE_META[act.type] || SERVICE_META.medical;
                    return (
                      <CircleMarker
                        key={act.id}
                        center={act.coords}
                        radius={8}
                        pathOptions={{
                          color: meta.color,
                          fillColor: meta.color,
                          fillOpacity: 0.6,
                          weight: 1.5,
                        }}
                      >
                        <Popup>
                          <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
                            <strong style={{ color: meta.color }}>{meta.label}</strong>
                            <br />
                            <span>{act.title}</span>
                            <br />
                            <span style={{ opacity: 0.7 }}>{act.details}</span>
                            <br />
                            <span style={{ opacity: 0.5 }}>📍 {act.location} · {fmtTime(act.created_date)}</span>
                            {act.urgency && <><br /><span style={{ color: "#ef4444" }}>⚠ {act.urgency}</span></>}
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              )}
              {/* HUD overlay */}
              <div className="absolute top-3 left-3 z-[400] font-mono text-[9px] tracking-widest pointer-events-none" style={{ color: "rgba(209,255,38,0.6)" }}>
                ◆ COMMUNITY ACTIVITY MAP
              </div>
              <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] tracking-widest pointer-events-none" style={{ color: "#D1FF26", background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26" }} /> {filtered.length} ACTIVE
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Activity size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE ACTIVITY FEED</p>
            </div>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "400px", WebkitOverflowScrolling: "touch" }}>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <Activity size={28} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.2)" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO ACTIVITY YET</p>
                </div>
              ) : (
                filtered.slice(0, 30).map((act) => {
                  const meta = SERVICE_META[act.type] || SERVICE_META.medical;
                  const Icon = meta.icon;
                  return (
                    <div key={act.id} className="p-3 flex items-start gap-2.5" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid rgba(138,143,152,0.1)` }}>
                      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: meta.color + "15", border: `0.5px solid ${meta.color}40` }}>
                        <Icon size={12} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#F5F5F7" }}>{act.title}</p>
                        <p className="text-[10px] truncate" style={{ color: "#8A8F98" }}>{act.details}</p>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>
                          <span>📍 {act.location}</span>
                          <span>· {fmtTime(act.created_date)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}