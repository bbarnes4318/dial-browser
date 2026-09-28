import React, { useState, useEffect, useId } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Radio, Loader2, Activity, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";

const CATEGORY_COLORS = {
  Weather: "#60A5FA",
  Health: "#ef4444",
  Medical: "#ef4444",
  Grocery: "#FBBF24",
  Food: "#FBBF24",
  Construction: "#D1FF26",
  Finance: "#a855f7",
  Travel: "#3b82f6",
  Transport: "#3b82f6",
  Housing: "#3b82f6",
  Entertainment: "#ec4899",
  Shopping: "#FBBF24",
  Productivity: "#D1FF26",
  Local: "#D1FF26",
  General: "#8A8F98",
};

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

export default function VoiceCommandGeoMap() {
  const mapKey = useId();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke("getVoiceCommandStats", {});
        setStats(res.data);
      } catch {
        setStats(null);
      }
      setLoading(false);
    };
    load();
  }, []);

  const points = stats?.geo_points || [];

  // Aggregate points by approximate location to determine "high-activity" zones
  const hotspots = {};
  points.forEach((p) => {
    const key = `${p.coords[0].toFixed(1)},${p.coords[1].toFixed(1)}`;
    if (!hotspots[key]) hotspots[key] = { ...p, count: 0 };
    hotspots[key].count++;
  });
  const hotspotList = Object.values(hotspots).sort((a, b) => b.count - a.count);
  const maxCount = hotspotList.length > 0 ? hotspotList[0].count : 1;

  return (
    <div className="relative overflow-hidden" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden z-[500]">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      <div className="p-5 lg:p-6 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div style={{ animation: "phosphorPulse 2.5s ease-in-out infinite" }}>
              <Radio size={16} style={{ color: "#D1FF26" }} />
            </div>
            <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE COMMAND ORIGINS</p>
          </div>
          {stats && (
            <span className="font-mono text-[9px] tracking-widest flex items-center gap-1 px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} /> {points.length} SIGNALS
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : points.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin size={32} style={{ color: "rgba(209,255,38,0.2)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO LOCATION DATA YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Voice command origins will populate this map</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-0">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="relative" style={{ height: "360px" }}>
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
                {hotspotList.map((hp, i) => {
                  const color = CATEGORY_COLORS[hp.service_category] || "#D1FF26";
                  const ratio = hp.count / maxCount;
                  const radius = 6 + ratio * 12;
                  return (
                    <CircleMarker
                      key={i}
                      center={hp.coords}
                      radius={radius}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.5 + ratio * 0.3,
                        weight: 1.5,
                      }}
                      eventHandlers={{ click: () => setSelected(hp) }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
                          <strong style={{ color: color }}>{hp.service_category}</strong>
                          <br />
                          <span>{hp.count} command{hp.count !== 1 ? "s" : ""}</span>
                          {hp.region && <><br /><span style={{ opacity: 0.7 }}>📍 {hp.region}</span></>}
                          <br />
                          <span style={{ opacity: 0.5 }}>{fmtTime(hp.created_date)}</span>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
              <div className="absolute top-3 left-3 z-[400] font-mono text-[9px] tracking-widest pointer-events-none" style={{ color: "rgba(209,255,38,0.6)" }}>
                ◆ LIVE SIGNAL MAP
              </div>
            </div>
          </div>

          {/* Activity sidebar */}
          <div className="lg:col-span-1 p-4" style={{ borderLeft: "0.5px solid rgba(138,143,152,0.1)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// TOP HOTSPOTS</p>
            </div>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "300px", WebkitOverflowScrolling: "touch" }}>
              {hotspotList.slice(0, 12).map((hp, i) => {
                const color = CATEGORY_COLORS[hp.service_category] || "#D1FF26";
                const ratio = hp.count / maxCount;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(hp)}
                    className="w-full p-2.5 flex items-center gap-2.5 text-left transition-all"
                    style={{
                      background: selected === hp ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.6)",
                      border: `0.5px solid ${selected === hp ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}`,
                    }}
                  >
                    <div
                      className="flex-shrink-0"
                      style={{
                        width: 10 + ratio * 14,
                        height: 10 + ratio * 14,
                        borderRadius: "50%",
                        background: color,
                        opacity: 0.6 + ratio * 0.4,
                        boxShadow: ratio > 0.6 ? `0 0 ${8 + ratio * 8}px ${color}` : "none",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#F5F5F7" }}>{hp.service_category}</p>
                      <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                        {hp.region || "Unknown region"} · {fmtTime(hp.created_date)}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] font-bold flex-shrink-0" style={{ color: "#D1FF26" }}>{hp.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}