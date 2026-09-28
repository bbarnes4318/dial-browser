import React, { useState, useEffect, useMemo, useId } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { motion } from "framer-motion";
import { MapPin, LocateFixed, Loader2, Star, Navigation } from "lucide-react";
import L from "leaflet";

// Fix default marker icon for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Approximate coordinates for common US cities (seed provider locations)
const CITY_COORDS = {
  "Atlanta, GA": [33.749, -84.388],
  "Denver, CO": [39.739, -104.99],
  "Chicago, IL": [41.878, -87.63],
  "Boston, MA": [42.36, -71.059],
  "Austin, TX": [30.267, -97.743],
  "Seattle, WA": [47.606, -122.332],
  "New York, NY": [40.713, -74.006],
  "Houston, TX": [29.76, -95.37],
  "New Orleans, LA": [29.951, -90.071],
  "Portland, OR": [45.515, -122.679],
  "Pittsburgh, PA": [40.44, -79.996],
  "Phoenix, AZ": [33.448, -112.074],
};

// Custom neon marker icon
function makeIcon(color = "#D1FF26") {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;position:relative;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color}22;border:1px solid ${color};box-shadow:0 0 12px ${color}55;"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;position:relative;">
    <div style="position:absolute;inset:0;border-radius:50%;background:#3B82F622;border:2px solid #3B82F6;box-shadow:0 0 16px #3B82F666;animation:phosphorPulse 2s ease-in-out infinite;"></div>
    <div style="width:12px;height:12px;border-radius:50%;background:#3B82F6;box-shadow:0 0 10px #3B82F6;"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function getProviderCoords(p) {
  const key = `${p.city}, ${p.state}`;
  return CITY_COORDS[key] || null;
}

export default function ContractorMapView({ providers }) {
  const mapKey = useId();
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const mappableProviders = useMemo(() => {
    return providers.map((p) => ({ ...p, _coords: getProviderCoords(p) })).filter((p) => p._coords);
  }, [providers]);

  // Compute distances if user location is known
  const sortedByDistance = useMemo(() => {
    if (!userPos) return mappableProviders;
    return [...mappableProviders].map((p) => {
      const dist = haversine(userPos[0], userPos[1], p._coords[0], p._coords[1]);
      return { ...p, _distance: dist };
    }).sort((a, b) => a._distance - b._distance);
  }, [mappableProviders, userPos]);

  const center = userPos || (mappableProviders.length > 0 ? mappableProviders[0]._coords : [39.5, -98.35]);

  const requestLocation = () => {
    setLocating(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocationError("Unable to retrieve your location. Showing all providers nationwide.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CONTRACTOR MAP</p>
        </div>
        <button
          onClick={requestLocation}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
          style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          {locating ? <Loader2 size={11} className="animate-spin" /> : <LocateFixed size={11} />} {userPos ? "Re-center" : "Find Me"}
        </button>
      </div>

      {locationError && (
        <p className="font-mono text-[8px] mb-3" style={{ color: "rgba(138,143,152,0.6)" }}>{locationError}</p>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 h-[400px] overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.2)", background: "#0A0D14" }}>
          <MapContainer key={mapKey} center={center} zoom={userPos ? 8 : 4} scrollWheelZoom={false} style={{ height: "100%", width: "100%", background: "#0A0D14" }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />
            {userPos && (
              <>
                <Marker position={userPos} icon={userIcon}>
                  <Popup>
                    <div style={{ fontFamily: "monospace", fontSize: 11 }}>
                      <strong style={{ color: "#3B82F6" }}>Your Location</strong>
                    </div>
                  </Popup>
                </Marker>
                <Circle center={userPos} radius={50000} pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 0.05 }} />
              </>
            )}
            {mappableProviders.map((p, i) => (
              <Marker key={p.id || i} position={p._coords} icon={makeIcon(p.service_type === "commercial" ? "#60A5FA" : "#D1FF26")}>
                <Popup>
                  <div style={{ fontFamily: "monospace", fontSize: 11, minWidth: 160 }}>
                    <strong style={{ color: "#D1FF26" }}>{p.company_name}</strong>
                    <br />
                    <span style={{ color: "#888" }}>{p.city}, {p.state}</span>
                    <br />
                    {p.rating > 0 && <span>★ {p.rating} ({p.review_count || 0} reviews)</span>}
                    <br />
                    <span style={{ color: "#888" }}>{p.phone || "*700#"}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Nearby list */}
        <div className="lg:col-span-1 max-h-[400px] overflow-y-auto overscroll-contain" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
          <div className="p-3 sticky top-0" style={{ background: "rgba(10,13,20,0.95)", borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
              {userPos ? "NEAREST CONTRACTORS" : "ALL LOCATIONS"}
            </p>
          </div>
          {sortedByDistance.length === 0 ? (
            <p className="p-4 font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>No mappable providers found.</p>
          ) : (
            sortedByDistance.slice(0, 12).map((p, i) => (
              <div key={p.id || i} className="p-3 flex items-center gap-3 transition-colors hover:bg-[rgba(209,255,38,0.03)]" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.06)" }}>
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <MapPin size={12} style={{ color: "#D1FF26" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] font-bold truncate" style={{ color: "#F5F5F7" }}>{p.company_name}</p>
                  <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{p.city}, {p.state}</p>
                </div>
                {p._distance != null && (
                  <span className="font-mono text-[8px] flex items-center gap-1 flex-shrink-0" style={{ color: "#D1FF26" }}>
                    <Navigation size={8} /> {p._distance < 1 ? `${Math.round(p._distance * 10) / 10}mi` : `${Math.round(p._distance)}mi`}
                  </span>
                )}
                {p.rating > 0 && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Star size={8} fill="#D1FF26" style={{ color: "#D1FF26" }} />
                    <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{p.rating}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}