import React, { useEffect, useState, useMemo, useId } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Flame, Loader2, AlertCircle, RefreshCw, MapPin, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";

// US regional centroids
const REGION_CENTROIDS = {
  northeast: [42.5, -72.0],
  southeast: [32.0, -84.5],
  midwest: [41.5, -93.0],
  southwest: [34.5, -106.0],
  west: [38.5, -120.0],
  national: [39.8283, -98.5795],
};

const REGION_LABELS = {
  northeast: "Northeast",
  southeast: "Southeast",
  midwest: "Midwest",
  southwest: "Southwest",
  west: "West",
  national: "National",
};

// Heat intensity color scale — lime (low) → amber → red (high)
function heatColor(pct) {
  if (pct > 0.75) return "#FF6B5A";
  if (pct > 0.5) return "#FF9F64";
  if (pct > 0.25) return "#E0C826";
  return "#5AE0C8";
}

function FixedView() {
  const map = useMap();
  useEffect(() => { map.setView([39.8283, -98.5795], 4); }, [map]);
  return null;
}

export default function RegionalHeatmap() {
  const mapKey = useId();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("getVoiceCommandStats", {});
        setStats(res.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load coverage data");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  // Aggregate geo_points into regional buckets
  const regions = useMemo(() => {
    const buckets = {};
    Object.keys(REGION_CENTROIDS).forEach((r) => {
      buckets[r] = { region: r, label: REGION_LABELS[r], count: 0, categories: {} };
    });
    const points = stats?.geo_points || [];
    points.forEach((p) => {
      let region = (p.region || "").toLowerCase().trim();
      if (!REGION_CENTROIDS[region]) region = "national";
      buckets[region].count += 1;
      const cat = p.service_category || "General";
      buckets[region].categories[cat] = (buckets[region].categories[cat] || 0) + 1;
    });
    return Object.values(buckets);
  }, [stats]);

  const totalCalls = regions.reduce((s, r) => s + r.count, 0);
  const maxCalls = Math.max(1, ...regions.map((r) => r.count));
  const ranked = [...regions].sort((a, b) => b.count - a.count);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Flame size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// REGIONAL HEAT MAP — CALL VOLUME ORIGINS</p>
          {!loading && !error && (
            <span className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.4s ease-in-out infinite" }} />
              {totalCalls} CALLS
            </span>
          )}
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40"
          style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={22} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : error ? (
        <div className="p-4 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={14} style={{ color: "#ef4444" }} />
          <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      ) : totalCalls === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Flame size={30} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO REGIONAL DATA YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Heat intensity will appear as members place voice calls across regions</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Heat map */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)", height: "380px" }}>
              <MapContainer
                key={mapKey + refreshKey}
                center={[39.8283, -98.5795]}
                zoom={4}
                style={{ height: "100%", width: "100%", background: "#0a0d14" }}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap & CartoDB' />
                <FixedView />
                {regions.map((r) => {
                  const pct = r.count / maxCalls;
                  const color = heatColor(pct);
                  const radius = 12 + pct * 38;
                  return (
                    <CircleMarker
                      key={r.region}
                      center={REGION_CENTROIDS[r.region]}
                      radius={radius}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.28, weight: 1.5 }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "monospace", fontSize: "11px", minWidth: "160px" }}>
                          <strong style={{ color }}>{r.label.toUpperCase()}</strong>
                          <br />
                          <span style={{ color }}>🔥 {r.count} calls</span>
                          <br />
                          {Object.entries(r.categories).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat, n]) => (
                            <span key={cat} style={{ display: "block", opacity: 0.7 }}>{cat}: {n}</span>
                          ))}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
              <div className="absolute top-3 left-3 z-[400] font-mono text-[9px] tracking-widest pointer-events-none" style={{ color: "rgba(209,255,38,0.6)" }}>
                ◆ HEAT MAP · {regions.length} REGIONS
              </div>
              {/* Legend */}
              <div className="absolute bottom-3 right-3 z-[400] flex items-center gap-2 px-2 py-1.5 pointer-events-none" style={{ background: "rgba(5,7,10,0.85)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>LOW</span>
                {["#5AE0C8", "#E0C826", "#FF9F64", "#FF6B5A"].map((c) => (
                  <span key={c} className="w-3 h-2" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
                ))}
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>HIGH</span>
              </div>
            </div>
          </div>

          {/* Ranked region list */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Activity size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// TOP ORIGINS</p>
            </div>
            <div className="space-y-2 overflow-y-auto overscroll-contain" style={{ maxHeight: "340px", WebkitOverflowScrolling: "touch" }}>
              {ranked.map((r, i) => {
                const pct = r.count / maxCalls;
                const color = heatColor(pct);
                return (
                  <div key={r.region} className="p-3" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${color}33` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.6)" }}>#{i + 1}</span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#F5F5F7" }}>
                          <MapPin size={10} style={{ color }} /> {r.label}
                        </span>
                      </div>
                      <span className="font-heading font-black text-base" style={{ color }}>{r.count}</span>
                    </div>
                    <div className="h-1.5 relative overflow-hidden" style={{ background: "rgba(138,143,152,0.08)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full"
                        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}