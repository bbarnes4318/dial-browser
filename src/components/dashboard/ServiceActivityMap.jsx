import React, { useState, useEffect, useMemo, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import {
  Activity, Stethoscope, ShoppingCart, Building2, Receipt, Loader2,
  Radio, Mic, MapPin, Zap, Globe,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";

const CITY_COORDS = {
  "new york": [40.7128, -74.006], "nyc": [40.7128, -74.006],
  "los angeles": [34.0522, -118.2437], "la": [34.0522, -118.2437],
  "chicago": [41.8781, -87.6298], "houston": [29.7604, -95.3698],
  "atlanta": [33.749, -84.388], "miami": [25.7617, -80.1918],
  "dallas": [32.7767, -96.797], "seattle": [47.6062, -122.3321],
  "denver": [39.7392, -104.9903], "boston": [42.3601, -71.0589],
  "phoenix": [33.4484, -112.074], "philadelphia": [39.9526, -75.1652],
  "san francisco": [37.7749, -122.4194], "sf": [37.7749, -122.4194],
  "washington": [38.9072, -77.0369], "dc": [38.9072, -77.0369],
  "detroit": [42.3314, -83.0458], "memphis": [35.1495, -90.049],
  "nashville": [36.1627, -86.7816], "charlotte": [35.2271, -80.8431],
  "london": [51.5074, -0.1278], "lagos": [6.5244, 3.3792],
  "nairobi": [-1.2864, 36.8172], "mumbai": [19.076, 72.8777],
  "tokyo": [35.6762, 139.6503], "sydney": [-33.8688, 151.2093],
  "toronto": [43.6532, -79.3832], "paris": [48.8566, 2.3522],
  "berlin": [52.52, 13.405], "cairo": [30.0444, 31.2357],
  "johannesburg": [-26.2041, 28.0473], "dubai": [25.2048, 55.2708],
};

const SERVICE_META = {
  medical: { color: "#ef4444", label: "Medical", icon: Stethoscope },
  dental: { color: "#22d3ee", label: "Dental", icon: Stethoscope },
  real_estate: { color: "#3b82f6", label: "Real Estate", icon: Building2 },
  grocery: { color: "#f59e0b", label: "Grocery", icon: ShoppingCart },
  bill: { color: "#a855f7", label: "Bill Pay", icon: Receipt },
  voice: { color: "#D1FF26", label: "Voice Cmd", icon: Mic },
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

// Auto-fit map to markers
function FitBounds({ activities }) {
  const map = useMap();
  useEffect(() => {
    if (activities.length === 0) return;
    if (activities.length === 1) {
      map.setView(activities[0].coords, 5);
      return;
    }
    const lats = activities.map((a) => a.coords[0]);
    const lngs = activities.map((a) => a.coords[1]);
    const bounds = [
      [Math.min(...lats) - 2, Math.min(...lngs) - 2],
      [Math.max(...lats) + 2, Math.max(...lngs) + 2],
    ];
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [activities, map]);
  return null;
}

export default function ServiceActivityMap() {
  const mapKey = useId();
  const containerRef = useRef(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [requests, groceries, bills, voiceCmds] = await Promise.all([
          base44.entities.ServiceRequest.list("-created_date", 50).catch(() => []),
          base44.entities.GroceryOrder.list("-created_date", 50).catch(() => []),
          base44.entities.BillPayment.list("-created_date", 50).catch(() => []),
          base44.entities.VoiceCommand.list("-created_date", 50).catch(() => []),
        ]);

        const mapped = [];
        (requests || []).forEach((r) => {
          mapped.push({
            id: r.id,
            type: r.service_type || "medical",
            title: r.requester_name ? `${r.requester_name} — ${r.service_type || "medical"}` : `${r.service_type || "medical"} request`,
            details: (r.details || "").slice(0, 120),
            location: r.location || "Unknown",
            status: r.status,
            urgency: r.ai_urgency,
            coords: geocode(r.location, r.id),
            created_date: r.created_date,
          });
        });
        (groceries || []).forEach((g) => {
          mapped.push({
            id: g.id,
            type: "grocery",
            title: g.customer_name ? `Grocery — ${g.customer_name}` : "Grocery order",
            details: (g.raw_list || "").slice(0, 120),
            location: g.store_assigned || "Unknown",
            status: g.status,
            coords: geocode(g.store_assigned, g.id),
            created_date: g.created_date,
          });
        });
        (bills || []).forEach((b) => {
          mapped.push({
            id: b.id,
            type: "bill",
            title: b.customer_name ? `${b.bill_type || "Bill"} — ${b.customer_name}` : `${b.bill_type || "Bill"} payment`,
            details: `$${b.amount || 0} to ${b.biller_name || "provider"}`,
            location: "Online",
            status: b.status,
            coords: geocode(null, b.id),
            created_date: b.created_date,
          });
        });
        (voiceCmds || []).forEach((v) => {
          mapped.push({
            id: v.id,
            type: "voice",
            title: v.command_text ? `"${v.command_text.slice(0, 50)}"` : "Voice command",
            details: `Intent: ${v.intent || "search"} · ${v.service_category || "General"}`,
            location: v.region || "National",
            status: "active",
            coords: geocode(v.region, v.id),
            created_date: v.created_date,
          });
        });

        mapped.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
        setActivities(mapped);
      } catch {
        setActivities([]);
      }
      setLoading(false);
    };
    load();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (filter === "all") return activities;
    return activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  const counts = useMemo(() => {
    const c = {};
    activities.forEach((a) => { c[a.type] = (c[a.type] || 0) + 1; });
    return c;
  }, [activities]);

  const filterTypes = ["all", "medical", "dental", "real_estate", "grocery", "bill", "voice"];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Globe size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE SERVICE ACTIVITY MAP</p>
          {!loading && (
            <span className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
              {filtered.length} ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40"
          style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          <Zap size={11} /> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {Object.entries(SERVICE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "all" : key)}
              className="p-2.5 text-center transition-all"
              style={{
                background: filter === key ? meta.color + "15" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${filter === key ? meta.color + "60" : "rgba(138,143,152,0.12)"}`,
              }}
            >
              <Icon size={12} className="mx-auto mb-0.5" style={{ color: meta.color }} />
              <p className="font-heading font-black text-lg leading-none" style={{ color: meta.color }}>{counts[key] || 0}</p>
              <p className="font-mono text-[7px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>{meta.label.toUpperCase()}</p>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filterTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-3 py-2 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap transition-all"
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

      {/* Map + Feed */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)", height: "420px" }}>
            {loading ? (
              <div className="flex items-center justify-center h-full" style={{ background: "#0a0d14" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ background: "#0a0d14" }}>
                <Radio size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
                <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO ACTIVE REQUESTS</p>
                <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Activity will appear here as members engage</p>
              </div>
            ) : (
              <MapContainer
                key={mapKey + refreshKey}
                center={[39.8283, -98.5795]}
                zoom={3}
                style={{ height: "100%", width: "100%", background: "#0a0d14" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap & CartoDB'
                />
                <FitBounds activities={filtered} />
                {filtered.map((act) => {
                  const meta = SERVICE_META[act.type] || SERVICE_META.medical;
                  const isSelected = selected?.id === act.id;
                  return (
                    <CircleMarker
                      key={act.id}
                      center={act.coords}
                      radius={isSelected ? 12 : 8}
                      pathOptions={{
                        color: meta.color,
                        fillColor: meta.color,
                        fillOpacity: isSelected ? 0.8 : 0.5,
                        weight: isSelected ? 2.5 : 1.5,
                      }}
                      eventHandlers={{ click: () => setSelected(act) }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "monospace", fontSize: "11px", minWidth: "160px" }}>
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
            {/* HUD overlays */}
            <div className="absolute top-3 left-3 z-[400] font-mono text-[9px] tracking-widest pointer-events-none" style={{ color: "rgba(209,255,38,0.6)" }}>
              ◆ SERVICE ACTIVITY MAP
            </div>
            <div className="absolute bottom-3 left-3 z-[400] font-mono text-[8px] tracking-widest pointer-events-none" style={{ color: "rgba(138,143,152,0.5)" }}>
              {filtered.length} DATA POINTS · {filter === "all" ? "ALL CATEGORIES" : (SERVICE_META[filter]?.label || filter).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Activity size={12} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE FEED</p>
          </div>
          <div className="space-y-2 overflow-y-auto overscroll-contain" style={{ maxHeight: "380px", WebkitOverflowScrolling: "touch" }}>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={24} className="mx-auto mb-2" style={{ color: "rgba(209,255,38,0.2)" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO ACTIVITY</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.slice(0, 25).map((act) => {
                  const meta = SERVICE_META[act.type] || SERVICE_META.medical;
                  const Icon = meta.icon;
                  const isSelected = selected?.id === act.id;
                  return (
                    <motion.button
                      key={act.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelected(isSelected ? null : act)}
                      className="w-full text-left p-3 flex items-start gap-2.5 transition-all"
                      style={{
                        background: isSelected ? meta.color + "12" : "rgba(16,20,29,0.6)",
                        border: `0.5px solid ${isSelected ? meta.color + "50" : "rgba(138,143,152,0.1)"}`,
                      }}
                    >
                      <div className="relative w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: meta.color + "15", border: `0.5px solid ${meta.color}40` }}>
                        <Icon size={12} style={{ color: meta.color }} />
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: meta.color, boxShadow: `0 0 4px ${meta.color}` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#F5F5F7" }}>{act.title}</p>
                        <p className="text-[10px] truncate" style={{ color: "#8A8F98" }}>{act.details}</p>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>
                          <span className="flex items-center gap-0.5"><MapPin size={7} /> {act.location}</span>
                          <span>· {fmtTime(act.created_date)}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}