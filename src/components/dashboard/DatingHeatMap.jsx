import React, { useEffect, useState, useId } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { MapPin, Loader2, Flame, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { matchDatingCity } from "@/lib/datingMemberCoords";
import "leaflet/dist/leaflet.css";

function FixedView() {
  const map = useMap();
  useEffect(() => { map.setView([39.8283, -98.5795], 4); }, [map]);
  return null;
}

// Heat intensity color scale — teal (low) → lime → amber → red (high)
function heatColor(pct) {
  if (pct > 0.75) return "#FF6B5A";
  if (pct > 0.5) return "#FF9F64";
  if (pct > 0.25) return "#E0C826";
  return "#5AE0C8";
}

// Admin-only: plots every dating member on a US map by their free-text
// location (matched against a city dictionary), with circle markers sized
// and colored by local member density. Includes a top-cities sidebar.
export default function DatingHeatMap() {
  const mapKey = useId();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.DatingProfile.list("-created_date", 500);
        setProfiles(all || []);
      } catch {
        /* non-admins can't reach this route */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cityBuckets = {};
  let unmatched = 0;
  profiles.forEach((p) => {
    const m = matchDatingCity(p.location);
    if (!m) { unmatched += 1; return; }
    const key = m.city;
    if (!cityBuckets[key]) cityBuckets[key] = { city: m.city, lat: m.lat, lng: m.lng, count: 0 };
    cityBuckets[key].count += 1;
  });
  const cities = Object.values(cityBuckets).sort((a, b) => b.count - a.count);
  const maxCount = cities.length ? cities[0].count : 1;
  const total = profiles.length;

  return (
    <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Flame size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DATING MEMBER HEAT MAP</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-10">
          <Loader2 size={14} className="animate-spin" style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING MEMBER LOCATIONS…</span>
        </div>
      ) : total === 0 ? (
        <p className="font-mono text-[9px] tracking-widest py-6" style={{ color: "#8A8F98" }}>NO DATING PROFILES YET — MEMBERS APPEAR ON THE MAP AS THEY JOIN</p>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="region-map" style={{ height: 360, border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <MapContainer key={mapKey} center={[39.8283, -98.5795]} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
                <FixedView />
                {cities.map((c) => {
                  const pct = c.count / maxCount;
                  const radius = 6 + pct * 16;
                  const color = heatColor(pct);
                  return (
                    <CircleMarker
                      key={c.city}
                      center={[c.lat, c.lng]}
                      radius={radius}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.55, weight: 1 }}
                    >
                      <Popup>
                        <span style={{ fontWeight: 700 }}>{c.city}: {c.count} member{c.count > 1 ? "s" : ""}</span>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>{total} MEMBERS · {cities.length} CITIES</p>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-auto pr-1">
              {cities.slice(0, 12).map((c) => (
                <div key={c.city} className="flex items-center gap-2 p-2" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <MapPin size={11} style={{ color: heatColor(c.count / maxCount) }} />
                  <span className="text-xs flex-1 truncate" style={{ color: "#F5F5F7" }}>{c.city}</span>
                  <span className="font-mono text-[10px]" style={{ color: "#D1FF26" }}>{c.count}</span>
                </div>
              ))}
            </div>
            {unmatched > 0 && (
              <p className="font-mono text-[8px] tracking-wider mt-3" style={{ color: "rgba(138,143,152,0.6)" }}>
                +{unmatched} member(s) in unmapped cities
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}