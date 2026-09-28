import React, { useState, useEffect, useMemo, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Radar, Loader2, MapPin, Activity, Signal } from "lucide-react";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";

// US regional centroids for coverage markers
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

// Status thresholds derived from recent call volume
// operational (teal): calls in last hour OR 5+ total
// active (lime): some recent activity
// standby (grey): no recent calls
function statusFor(count, lastMs) {
  const hourAgo = Date.now() - 3600 * 1000;
  const recent = lastMs && lastMs > hourAgo;
  if (recent || count >= 5) return { key: "operational", color: "#5AE0C8", label: "OPERATIONAL" };
  if (count > 0) return { key: "active", color: "#D1FF26", label: "ACTIVE" };
  return { key: "standby", color: "#8A8F98", label: "STANDBY" };
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

// Keep the US in view
function FixedView() {
  const map = useMap();
  useEffect(() => {
    map.setView([39.8283, -98.5795], 4);
  }, [map]);
  return null;
}

export default function LiveCoverageMap() {
  const mapKey = useId();
  const [commands, setCommands] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveTick, setLiveTick] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [cmds, reqs] = await Promise.all([
          base44.entities.VoiceCommand.list("-created_date", 200).catch(() => []),
          base44.entities.ServiceRequest.list("-created_date", 100).catch(() => []),
        ]);
        setCommands(cmds || []);
        setRequests(reqs || []);
      } catch {
        // empty state
      } finally {
        setLoading(false);
      }
    })();

    // Realtime: new voice commands update coverage live
    const unsub = base44.entities.VoiceCommand.subscribe((event) => {
      if (event.type === "create" && event.data) {
        setCommands((prev) => [event.data, ...prev].slice(0, 200));
        setLiveTick((t) => t + 1);
      }
    });
    return unsub;
  }, []);

  // Aggregate per region
  const regions = useMemo(() => {
    const map = {};
    Object.keys(REGION_CENTROIDS).forEach((r) => {
      map[r] = { region: r, label: REGION_LABELS[r], calls: 0, requests: 0, lastMs: 0, categories: {} };
    });

    (commands || []).forEach((c) => {
      let region = (c.region || "").toLowerCase().trim();
      if (!REGION_CENTROIDS[region]) region = "national";
      map[region].calls += 1;
      const d = c.created_date ? new Date(c.created_date).getTime() : 0;
      if (d > map[region].lastMs) map[region].lastMs = d;
      const cat = c.service_category || "General";
      map[region].categories[cat] = (map[region].categories[cat] || 0) + 1;
    });

    (requests || []).forEach((r) => {
      let region = (r.region || "").toLowerCase().trim();
      if (!REGION_CENTROIDS[region]) region = "national";
      map[region].requests += 1;
      const d = r.created_date ? new Date(r.created_date).getTime() : 0;
      if (d > map[region].lastMs) map[region].lastMs = d;
    });

    return Object.values(map).map((r) => {
      const st = statusFor(r.calls, r.lastMs);
      return { ...r, status: st };
    });
  }, [commands, requests]);

  const totalCalls = regions.reduce((s, r) => s + r.calls, 0);
  const operationalCount = regions.filter((r) => r.status.key === "operational").length;
  const maxCalls = Math.max(1, ...regions.map((r) => r.calls));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Radar size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LIVE COVERAGE & SERVICE STATUS</p>
          {!loading && (
            <span className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.4s ease-in-out infinite" }} />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
          <span>{totalCalls} CALLS</span>
          <span style={{ color: "#5AE0C8" }}>{operationalCount}/{regions.length} OPERATIONAL</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : totalCalls === 0 && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <Radar size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO COVERAGE DATA YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Regional call coverage will appear as members engage with voice services</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)", height: "440px" }}>
              <MapContainer
                key={mapKey}
                center={[39.8283, -98.5795]}
                zoom={4}
                style={{ height: "100%", width: "100%", background: "#0a0d14" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap & CartoDB'
                />
                <FixedView />
                {regions.map((r) => {
                  const radius = 6 + (r.calls / maxCalls) * 16;
                  return (
                    <CircleMarker
                      key={r.region}
                      center={REGION_CENTROIDS[r.region]}
                      radius={radius}
                      pathOptions={{
                        color: r.status.color,
                        fillColor: r.status.color,
                        fillOpacity: 0.35,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "monospace", fontSize: "11px", minWidth: "170px" }}>
                          <strong style={{ color: r.status.color }}>{r.label.toUpperCase()}</strong>
                          <br />
                          <span style={{ color: r.status.color }}>● {r.status.label}</span>
                          <br />
                          <span>📞 {r.calls} calls</span>
                          <br />
                          <span>🛠 {r.requests} service requests</span>
                          <br />
                          <span style={{ opacity: 0.5 }}>⏱ Last: {fmtTime(r.lastMs ? new Date(r.lastMs).toISOString() : null)}</span>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
              {/* HUD overlay */}
              <div className="absolute top-3 left-3 z-[400] font-mono text-[9px] tracking-widest pointer-events-none" style={{ color: "rgba(209,255,38,0.6)" }}>
                ◆ COVERAGE MAP · {regions.length} REGIONS
              </div>
            </div>
          </div>

          {/* Region status panel */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Signal size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// REGIONAL STATUS</p>
            </div>
            <div className="space-y-2 overflow-y-auto overscroll-contain" style={{ maxHeight: "400px", WebkitOverflowScrolling: "touch" }}>
              <AnimatePresence mode="popLayout">
                {regions.map((r) => (
                  <motion.div
                    key={r.region}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 flex items-center gap-3"
                    style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${r.status.color}33` }}
                  >
                    <span
                      className="rounded-full flex-shrink-0"
                      style={{
                        width: 12,
                        height: 12,
                        background: r.status.color,
                        boxShadow: `0 0 10px ${r.status.color}`,
                        animation: r.status.key === "standby" ? "none" : `dotPulse ${1.3 + (r.calls % 4) * 0.15}s ease-in-out infinite`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#F5F5F7" }}>{r.label}</p>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.7)" }}>
                        <span className="flex items-center gap-0.5"><Activity size={7} /> {r.calls} calls</span>
                        <span>· {fmtTime(r.lastMs ? new Date(r.lastMs).toISOString() : null)}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 flex-shrink-0" style={{ color: r.status.color, background: r.status.color + "12", border: `0.5px solid ${r.status.color}40` }}>
                      {r.status.label}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}