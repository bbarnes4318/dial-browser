import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, MapPin, Loader2, CheckCircle2, Wifi, Building2, Trees, Mountain } from "lucide-react";

// Subset of US zip prefixes with coordinates and area type
const zipData = [
  { prefix: "100", lat: 40.78, lon: -73.97, area: "Manhattan, NY", type: "urban" },
  { prefix: "112", lat: 40.65, lon: -73.95, area: "Brooklyn, NY", type: "urban" },
  { prefix: "606", lat: 41.88, lon: -87.63, area: "Chicago, IL", type: "urban" },
  { prefix: "900", lat: 34.05, lon: -118.24, area: "Los Angeles, CA", type: "urban" },
  { prefix: "981", lat: 47.61, lon: -122.33, area: "Seattle, WA", type: "urban" },
  { prefix: "021", lat: 42.36, lon: -71.06, area: "Boston, MA", type: "urban" },
  { prefix: "752", lat: 32.78, lon: -96.8, area: "Dallas, TX", type: "urban" },
  { prefix: "770", lat: 29.76, lon: -95.37, area: "Houston, TX", type: "urban" },
  { prefix: "850", lat: 33.45, lon: -112.07, area: "Phoenix, AZ", type: "urban" },
  { prefix: "303", lat: 33.75, lon: -84.39, area: "Atlanta, GA", type: "urban" },
  { prefix: "328", lat: 28.54, lon: -81.37, area: "Orlando, FL", type: "urban" },
  { prefix: "802", lat: 39.74, lon: -104.99, area: "Denver, CO", type: "urban" },
  { prefix: "200", lat: 38.9, lon: -77.03, area: "Washington, DC", type: "urban" },
  { prefix: "941", lat: 37.78, lon: -122.42, area: "San Francisco, CA", type: "urban" },
  { prefix: "430", lat: 40.04, lon: -82.4, area: "Newark, OH", type: "suburban" },
  { prefix: "460", lat: 40.27, lon: -86.13, area: "Indianapolis, IN", type: "suburban" },
  { prefix: "275", lat: 35.78, lon: -78.64, area: "Raleigh, NC", type: "suburban" },
  { prefix: "300", lat: 33.77, lon: -84.4, area: "Atlanta Metro, GA", type: "suburban" },
  { prefix: "750", lat: 32.78, lon: -96.8, area: "Dallas Metro, TX", type: "suburban" },
  { prefix: "220", lat: 38.85, lon: -77.2, area: "Arlington, VA", type: "suburban" },
  { prefix: "190", lat: 40.0, lon: -75.15, area: "Philadelphia, PA", type: "suburban" },
  { prefix: "970", lat: 45.52, lon: -122.68, area: "Portland, OR", type: "suburban" },
  { prefix: "550", lat: 45.01, lon: -93.0, area: "Minneapolis, MN", type: "suburban" },
  { prefix: "641", lat: 39.1, lon: -94.58, area: "Kansas City, MO", type: "suburban" },
  { prefix: "577", lat: 44.08, lon: -103.23, area: "Rapid City, SD", type: "rural" },
  { prefix: "590", lat: 45.78, lon: -108.5, area: "Billings, MT", type: "rural" },
  { prefix: "820", lat: 41.14, lon: -104.82, area: "Cheyenne, WY", type: "rural" },
  { prefix: "832", lat: 42.03, lon: -112.52, area: "Pocatello, ID", type: "rural" },
  { prefix: "691", lat: 40.86, lon: -100.8, area: "North Platte, NE", type: "rural" },
  { prefix: "889", lat: 36.03, lon: -114.99, area: "Las Vegas outskirts, NV", type: "rural" },
  { prefix: "955", lat: 40.86, lon: -124.17, area: "Eureka, CA", type: "rural" },
  { prefix: "995", lat: 61.22, lon: -149.9, area: "Anchorage, AK", type: "remote" },
  { prefix: "997", lat: 64.84, lon: -147.72, area: "Fairbanks, AK", type: "remote" },
  { prefix: "967", lat: 19.73, lon: -155.09, area: "Hilo, HI", type: "remote" },
  { prefix: "598", lat: 46.87, lon: -113.99, area: "Missoula, MT", type: "remote" },
  { prefix: "829", lat: 41.51, lon: -109.28, area: "Rock Springs, WY", type: "remote" },
];

const backboneNodes = [
  { name: "New York, NY", lat: 40.71, lon: -74.01 },
  { name: "Los Angeles, CA", lat: 34.05, lon: -118.24 },
  { name: "Chicago, IL", lat: 41.88, lon: -87.63 },
  { name: "Dallas, TX", lat: 32.78, lon: -96.8 },
  { name: "Atlanta, GA", lat: 33.75, lon: -84.39 },
  { name: "Denver, CO", lat: 39.74, lon: -104.99 },
  { name: "Seattle, WA", lat: 47.61, lon: -122.33 },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findZip(zip) {
  if (!zip || zip.length < 3) return null;
  return zipData.find((r) => r.prefix === zip.substring(0, 3)) || null;
}

function generateTips(zip) {
  const region = findZip(zip);
  if (!region) return null;

  let nearest = null;
  let nearestDist = Infinity;
  for (const node of backboneNodes) {
    const dist = haversineKm(region.lat, region.lon, node.lat, node.lon);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = node;
    }
  }

  const tips = [];
  let signalEstimate;

  if (region.type === "urban") {
    signalEstimate = "Strong";
    tips.push({ icon: Building2, title: "Move to Higher Floors", text: "In dense urban areas, signal can be blocked by tall buildings. Try making calls from upper floors or near windows facing the nearest tower." });
    tips.push({ icon: Wifi, title: "Avoid Concrete Walls", text: "Thick concrete and steel structures attenuate signal. Step outside or move to rooms with fewer interior walls between you and the exterior." });
    tips.push({ icon: MapPin, title: `Nearest Node: ${nearest.name}`, text: `You're approximately ${Math.round(nearestDist)} km from a backbone node. Urban congestion during peak hours (4–8 PM) may cause brief latency spikes.` });
  } else if (region.type === "suburban") {
    signalEstimate = "Good";
    tips.push({ icon: Wifi, title: "Use Window-Facing Rooms", text: "Suburban homes with brick or stone exteriors can reduce signal. Position yourself near windows facing the direction of your nearest tower." });
    tips.push({ icon: Trees, title: "Trim Tree Line", text: "Tall trees with dense foliage between your home and the nearest tower can degrade signal, especially when wet. Keep tree lines trimmed along the signal path." });
    tips.push({ icon: MapPin, title: `Nearest Node: ${nearest.name}`, text: `You're approximately ${Math.round(nearestDist)} km from a backbone node. Consider a signal booster if you experience dropped calls indoors.` });
  } else if (region.type === "rural") {
    signalEstimate = "Moderate";
    tips.push({ icon: Mountain, title: "Elevate Your Position", text: "Rural terrain with hills and valleys can block signal. Move to the highest available ground or an upper floor to improve line-of-sight to distant towers." });
    tips.push({ icon: Wifi, title: "Install a Signal Booster", text: "For rural locations, an external antenna + indoor repeater can significantly improve call quality. Place the external antenna on your roof facing the nearest tower." });
    tips.push({ icon: MapPin, title: `Nearest Node: ${nearest.name}`, text: `You're approximately ${Math.round(nearestDist)} km from a backbone node — a longer backhaul distance. Calls may have slightly higher latency but remain usable.` });
  } else {
    signalEstimate = "Limited";
    tips.push({ icon: Mountain, title: "Seek Elevated Open Areas", text: "Remote regions often lack nearby infrastructure. Find hilltops or clearings away from dense tree cover and terrain obstructions for the best available signal." });
    tips.push({ icon: Wifi, title: "Use SMS When Voice Fails", text: "Text messages require less bandwidth than voice calls and can often get through even when voice signal is too weak. Try SMS for critical communications." });
    tips.push({ icon: MapPin, title: `Nearest Node: ${nearest.name}`, text: `You're approximately ${Math.round(nearestDist)} km from a backbone node. Consider satellite connectivity as a backup for remote locations.` });
  }

  return { area: region.area, type: region.type, signalEstimate, nearestNode: nearest.name, distanceKm: Math.round(nearestDist), tips };
}

const typeLabels = {
  urban: "Urban Zone",
  suburban: "Suburban Zone",
  rural: "Rural Zone",
  remote: "Remote Zone",
};

const typeColors = {
  urban: "#D1FF26",
  suburban: "#8A8F98",
  rural: "#f59e0b",
  remote: "#ef4444",
};

export default function SignalTipsCard() {
  const [zip, setZip] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [scanning, setScanning] = useState(false);

  const result = useMemo(() => generateTips(submitted), [submitted]);

  const handleCheck = () => {
    if (zip.length < 5) return;
    setScanning(true);
    setSubmitted("");
    setTimeout(() => {
      setSubmitted(zip);
      setScanning(false);
    }, 1200);
  };

  return (
    <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SIGNAL STRENGTH TIPS</p>
      </div>
      <p className="font-heading font-bold text-sm mb-4" style={{ color: "#F5F5F7" }}>Personalized Advice for Your Area</p>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            onKeyDown={(e) => e.key === "Enter" && zip.length >= 5 && handleCheck()}
            placeholder="Your zip code..."
            inputMode="numeric"
            className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest outline-none transition-all"
            style={{
              background: "rgba(5,7,10,0.6)",
              border: zip.length >= 3 ? "0.5px solid rgba(209,255,38,0.4)" : "0.5px solid rgba(138,143,152,0.15)",
              color: "#F5F5F7",
            }}
          />
        </div>
        <button
          onClick={handleCheck}
          disabled={zip.length < 5 || scanning}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40"
          style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}
        >
          {scanning ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
          {scanning ? "..." : "Tips"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {scanning && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 text-center">
            <Loader2 size={20} className="animate-spin mx-auto mb-2" style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ANALYZING YOUR LOCATION...</p>
          </motion.div>
        )}

        {!scanning && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {/* Location badge */}
            <div className="flex items-center justify-between mb-4 p-3" style={{ background: "rgba(5,7,10,0.4)", border: `0.5px solid ${typeColors[result.type]}40` }}>
              <div>
                <p className="font-heading font-bold text-xs" style={{ color: "#F5F5F7" }}>{result.area}</p>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{typeLabels[result.type].toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>EST. SIGNAL</p>
                <p className="font-heading font-black text-sm" style={{ color: typeColors[result.type] }}>{result.signalEstimate}</p>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              {result.tips.map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * i }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                      <Icon size={12} style={{ color: "#D1FF26" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-xs mb-0.5" style={{ color: "#F5F5F7" }}>{tip.title}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: "#8A8F98" }}>{tip.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
              <CheckCircle2 size={10} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[8px] tracking-wider" style={{ color: "#8A8F98" }}>TIPS PERSONALIZED FOR {result.distanceKm} KM FROM {result.nearestNode.toUpperCase()}</p>
            </div>
          </motion.div>
        )}

        {!scanning && !result && submitted && (
          <motion.div key="noresult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 text-center">
            <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>No data for this zip code.</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Try another US zip code.</p>
          </motion.div>
        )}

        {!scanning && !submitted && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 text-center">
            <MapPin size={20} className="mx-auto mb-2" style={{ color: "rgba(138,143,152,0.3)" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ENTER YOUR ZIP CODE FOR TIPS</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}