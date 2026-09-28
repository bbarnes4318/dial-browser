import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Activity, Zap, Signal, MapPin, Gauge, Crosshair } from "lucide-react";

// Reuse the same network nodes from ActiveMap so estimates reflect real coverage data
const networkNodes = [
  { id: "us-east", name: "New York, USA", lat: 40.71, lon: -74.01, station_id: "NYC-01", speed: 10, bandwidth: "847 Mbps", baseLatency: 12, uptime: "99.98%", carrier: "1CALL Backbone" },
  { id: "us-west", name: "Los Angeles, USA", lat: 34.05, lon: -118.24, station_id: "LAX-02", speed: 10, bandwidth: "623 Mbps", baseLatency: 18, uptime: "99.97%", carrier: "1CALL Backbone" },
  { id: "uk", name: "London, UK", lat: 51.51, lon: -0.13, station_id: "LDN-01", speed: 10, bandwidth: "412 Mbps", baseLatency: 24, uptime: "99.99%", carrier: "BT Wholesale" },
  { id: "lagos", name: "Lagos, Nigeria", lat: 6.52, lon: 3.38, station_id: "LOS-01", speed: 5, bandwidth: "1.2 Gbps", baseLatency: 47, uptime: "99.82%", carrier: "MainOne" },
  { id: "nairobi", name: "Nairobi, Kenya", lat: -1.29, lon: 36.82, station_id: "NBO-01", speed: 5, bandwidth: "687 Mbps", baseLatency: 52, uptime: "99.79%", carrier: "Safaricom" },
  { id: "mumbai", name: "Mumbai, India", lat: 19.08, lon: 72.88, station_id: "BOM-01", speed: 10, bandwidth: "1.8 Gbps", baseLatency: 31, uptime: "99.95%", carrier: "Tata Communications" },
  { id: "jakarta", name: "Jakarta, Indonesia", lat: -6.21, lon: 106.85, station_id: "CGK-01", speed: 5, bandwidth: "298 Mbps", baseLatency: 58, uptime: "99.76%", carrier: "Telkomsel" },
  { id: "saopaulo", name: "São Paulo, Brazil", lat: -23.55, lon: -46.63, station_id: "GRU-01", speed: 5, bandwidth: "431 Mbps", baseLatency: 41, uptime: "99.88%", carrier: "Vivo Fibra" },
  { id: "tokyo", name: "Tokyo, Japan", lat: 35.68, lon: 139.69, station_id: "NRT-01", speed: 10, bandwidth: "356 Mbps", baseLatency: 22, uptime: "99.99%", carrier: "NTT Communications" },
  { id: "sydney", name: "Sydney, Australia", lat: -33.87, lon: 151.21, station_id: "SYD-01", speed: 5, bandwidth: "198 Mbps", baseLatency: 64, uptime: "99.91%", carrier: "Telstra" },
  { id: "cairo", name: "Cairo, Egypt", lat: 30.04, lon: 31.24, station_id: "CAI-01", speed: 5, bandwidth: "384 Mbps", baseLatency: 44, uptime: "99.85%", carrier: "TE Data" },
  { id: "mexico", name: "Mexico City, Mexico", lat: 19.43, lon: -99.13, station_id: "MEX-01", speed: 5, bandwidth: "312 Mbps", baseLatency: 33, uptime: "99.90%", carrier: "Telmex" },
];

// Haversine distance in km between two lat/lon points
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Common city lookup for quick entry without coordinates
const cityLookup = [
  { name: "Atlanta, USA", lat: 33.75, lon: -84.39 },
  { name: "Chicago, USA", lat: 41.88, lon: -87.63 },
  { name: "Houston, USA", lat: 29.76, lon: -95.37 },
  { name: "Miami, USA", lat: 25.76, lon: -80.19 },
  { name: "Seattle, USA", lat: 47.61, lon: -122.33 },
  { name: "Toronto, Canada", lat: 43.65, lon: -79.38 },
  { name: "Vancouver, Canada", lat: 49.28, lon: -123.12 },
  { name: "Paris, France", lat: 48.85, lon: 2.35 },
  { name: "Berlin, Germany", lat: 52.52, lon: 13.40 },
  { name: "Madrid, Spain", lat: 40.42, lon: -3.70 },
  { name: "Rome, Italy", lat: 41.90, lon: 12.50 },
  { name: "Amsterdam, Netherlands", lat: 52.37, lon: 4.90 },
  { name: "Dubai, UAE", lat: 25.20, lon: 55.27 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Seoul, South Korea", lat: 37.57, lon: 126.98 },
  { name: "Hong Kong", lat: 22.32, lon: 114.17 },
  { name: "Bangkok, Thailand", lat: 13.76, lon: 100.50 },
  { name: "Buenos Aires, Argentina", lat: -34.60, lon: -58.38 },
  { name: "Lima, Peru", lat: -12.05, lon: -77.04 },
  { name: "Bogotá, Colombia", lat: 4.71, lon: -74.07 },
  { name: "Johannesburg, South Africa", lat: -26.20, lon: 28.05 },
  { name: "Accra, Ghana", lat: 5.60, lon: -0.19 },
  { name: "Casablanca, Morocco", lat: 33.57, lon: -7.59 },
  { name: "Auckland, New Zealand", lat: -36.85, lon: 174.76 },
];

function estimateReading(input) {
  if (!input || !input.trim()) return null;

  const query = input.trim().toLowerCase();

  // Try matching against network nodes first
  let matchedNode = networkNodes.find(
    (n) =>
      n.name.toLowerCase().includes(query) ||
      n.station_id.toLowerCase().includes(query) ||
      n.id.toLowerCase().includes(query)
  );

  // Then try the extended city lookup
  let city = matchedNode || cityLookup.find((c) => c.name.toLowerCase().includes(query));

  // If nothing matched, treat as a raw coordinate entry "lat, lon"
  if (!matchedNode && !city) {
    const coords = query.split(",").map((s) => parseFloat(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      city = { name: `Custom (${coords[0].toFixed(2)}, ${coords[1].toFixed(2)})`, lat: coords[0], lon: coords[1] };
    }
  }

  if (!matchedNode && !city) return null;

  const lat = city.lat;
  const lon = city.lon;

  // Find the nearest network node
  let nearest = null;
  let nearestDist = Infinity;
  for (const node of networkNodes) {
    const dist = haversineKm(lat, lon, node.lat, node.lon);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = node;
    }
  }

  // Signal strength: decays with distance. Full strength within 500km, usable up to ~8000km.
  const maxRangeKm = 8000;
  const strengthRatio = Math.max(0, 1 - nearestDist / maxRangeKm);
  const signalStrength = Math.round(strengthRatio * 100);

  // Latency: base latency of nearest node + distance penalty (~0.01ms per km)
  const estimatedLatency = Math.round(nearest.baseLatency + nearestDist * 0.012);

  // Quality tier
  let quality;
  if (signalStrength >= 80) quality = { label: "Optimal", color: "#D1FF26" };
  else if (signalStrength >= 55) quality = { label: "Good", color: "#8A8F98" };
  else if (signalStrength >= 30) quality = { label: "Degraded", color: "#f59e0b" };
  else quality = { label: "Limited", color: "#ef4444" };

  return {
    locationName: city.name,
    nearestNode: nearest,
    distanceKm: Math.round(nearestDist),
    signalStrength,
    estimatedLatency,
    quality,
    coordinates: { lat, lon },
  };
}

function SignalBars({ strength }) {
  const bars = 5;
  const filled = Math.ceil((strength / 100) * bars);
  return (
    <div className="flex items-end gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const active = i < filled;
        const ratio = (i + 1) / bars;
        const color =
          strength >= 80 ? "#D1FF26" : strength >= 55 ? "#8A8F98" : strength >= 30 ? "#f59e0b" : "#ef4444";
        return (
          <div
            key={i}
            className="w-2.5 transition-all duration-500"
            style={{
              height: `${ratio * 100}%`,
              background: active ? color : "rgba(138,143,152,0.15)",
              boxShadow: active ? `0 0 8px ${color}80` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

export default function SignalSimulator() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [inView, setInView] = useState(true);
  const [scanning, setScanning] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const reading = useMemo(() => estimateReading(submitted), [submitted]);

  const suggestions = useMemo(() => {
    if (!input.trim()) return [];
    const q = input.trim().toLowerCase();
    return [...networkNodes, ...cityLookup]
      .filter((c) => c.name.toLowerCase().includes(q) || (c.station_id && c.station_id.toLowerCase().includes(q)))
      .slice(0, 5);
  }, [input]);

  const handleSimulate = (value) => {
    const query = value ?? input;
    if (!query.trim()) return;
    setScanning(true);
    setSubmitted("");
    setInput(query);
    setTimeout(() => {
      setSubmitted(query);
      setScanning(false);
    }, 1400);
  };

  const latencyGaugeWidth = reading ? Math.min((reading.estimatedLatency / 100) * 100, 100) : 0;

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-10 text-center">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>
            // SIGNAL SIMULATOR
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Check Your <span style={{ color: "#D1FF26" }}>Coverage</span>
          </h2>
          <p className="text-base font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            Enter your city or coordinates to get an estimated signal strength and latency reading based on our live network nodes.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="mb-8">
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSimulate()}
                  placeholder="Enter city, country, or lat, lon..."
                  className="w-full pl-12 pr-4 py-3.5 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(16,20,29,0.8)",
                    border: input.trim() ? "0.5px solid rgba(209,255,38,0.4)" : "0.5px solid rgba(138,143,152,0.15)",
                    color: "#F5F5F7",
                    boxShadow: input.trim() ? "0 0 20px rgba(209,255,38,0.08)" : "none",
                  }}
                />
                {/* Autocomplete suggestions */}
                {input.trim() && suggestions.length > 0 && !submitted && (
                  <div className="absolute z-20 w-full mt-1" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                    {suggestions.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => handleSimulate(s.name)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[rgba(209,255,38,0.06)]"
                      >
                        <MapPin size={12} style={{ color: "#D1FF26" }} />
                        <span className="text-sm" style={{ color: "#F5F5F7" }}>{s.name}</span>
                        {s.station_id && <span className="font-mono text-[9px] ml-auto" style={{ color: "#8A8F98" }}>{s.station_id}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleSimulate()}
                disabled={!input.trim() || scanning}
                className="flex items-center justify-center gap-2 px-6 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                style={{
                  background: "rgba(209,255,38,0.12)",
                  border: "0.5px solid rgba(209,255,38,0.4)",
                  color: "#D1FF26",
                  boxShadow: !scanning ? "0 0 20px rgba(209,255,38,0.15)" : "none",
                }}
              >
                <Crosshair size={14} /> {scanning ? "Scanning..." : "Simulate"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {scanning && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(209,255,38,0.15)" }} />
                  <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "2px solid transparent", borderTopColor: "#D1FF26", boxShadow: "0 0 12px rgba(209,255,38,0.4)" }} />
                  <Crosshair size={20} className="absolute inset-0 m-auto" style={{ color: "#D1FF26" }} />
                </div>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>PINGING NEAREST NODE...</p>
              </div>
            </motion.div>
          )}

          {!scanning && reading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Location header */}
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={14} style={{ color: "#D1FF26" }} />
                <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{reading.locationName}</p>
                <span className="font-mono text-[9px] tracking-widest px-2 py-1 ml-auto" style={{ background: `${reading.quality.color}1a`, color: reading.quality.color, border: `0.5px solid ${reading.quality.color}40` }}>
                  {reading.quality.label.toUpperCase()}
                </span>
              </div>

              {/* Main metrics grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {/* Signal Strength */}
                <div className="p-6" style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${reading.quality.color}40` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Signal size={14} style={{ color: reading.quality.color }} />
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SIGNAL STRENGTH</p>
                  </div>
                  <div className="flex items-end justify-between mb-4">
                    <p className="font-heading font-black text-5xl" style={{ color: reading.quality.color }}>
                      {reading.signalStrength}
                      <span className="text-lg ml-1" style={{ color: "#8A8F98" }}>%</span>
                    </p>
                    <SignalBars strength={reading.signalStrength} />
                  </div>
                  <div className="h-1.5" style={{ background: "rgba(138,143,152,0.15)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${reading.signalStrength}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full"
                      style={{ background: reading.quality.color, boxShadow: `0 0 10px ${reading.quality.color}80` }}
                    />
                  </div>
                </div>

                {/* Latency */}
                <div className="p-6" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Gauge size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ESTIMATED LATENCY</p>
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <p className="font-heading font-black text-5xl" style={{ color: "#D1FF26" }}>
                      {reading.estimatedLatency}
                      <span className="text-lg ml-1" style={{ color: "#8A8F98" }}>ms</span>
                    </p>
                  </div>
                  <div className="h-1.5" style={{ background: "rgba(138,143,152,0.15)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${latencyGaugeWidth}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      className="h-full"
                      style={{ background: "#D1FF26", boxShadow: "0 0 10px rgba(209,255,38,0.5)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Nearest node details */}
              <div className="p-5" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={12} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// NEAREST NETWORK NODE</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-heading font-bold text-base mb-0.5" style={{ color: "#F5F5F7" }}>{reading.nearestNode.name}</p>
                    <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                      {reading.nearestNode.station_id} · {reading.distanceKm.toLocaleString()} km away
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="text-right">
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>SPEED</p>
                      <p className="font-mono text-xs font-bold" style={{ color: "#D1FF26" }}>{reading.nearestNode.speed} Gbps</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>UPTIME</p>
                      <p className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>{reading.nearestNode.uptime}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>CARRIER</p>
                      <p className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>{reading.nearestNode.carrier}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="font-mono text-[8px] tracking-wider mt-4 text-center" style={{ color: "rgba(138,143,152,0.6)" }}>
                ▸ ESTIMATES BASED ON GEOGRAPHIC DISTANCE TO NEAREST NODE · ACTUAL PERFORMANCE MAY VARY
              </p>
            </motion.div>
          )}

          {!scanning && !reading && submitted && (
            <motion.div key="noresult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
              <p className="font-heading font-bold text-lg mb-2" style={{ color: "#F5F5F7" }}>Location not found</p>
              <p className="font-mono text-xs" style={{ color: "#8A8F98" }}>Try a major city name, or enter coordinates as "lat, lon".</p>
            </motion.div>
          )}

          {!scanning && !submitted && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
              <div className="inline-flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <Zap size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>AWAITING LOCATION INPUT</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}