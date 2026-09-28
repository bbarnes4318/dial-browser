import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { MapPin, Navigation, Loader2, Crosshair, Radio, Square, Clock } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// Sender-side live controls: shows the member's live map, refreshes the
// SharedLocation + recipient rows on each GPS update, and exposes stop.
export default function LocationShareControls({ share, recipients, onCoords, onStop, live }) {
  const { location, error, loading, capture, startWatch, stopWatch } = useGeolocation();
  const startedRef = useRef(false);

  // Kick off capture: one-shot for snap, continuous watch for live.
  useEffect(() => {
    if (live) {
      startWatch();
      return () => stopWatch();
    } else {
      capture();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  // Push coords up whenever they change.
  useEffect(() => {
    if (location && onCoords) onCoords(location);
  }, [location, onCoords]);

  const center = location ? [location.latitude, location.longitude] : [39.5, -98.35];

  return (
    <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Navigation size={12} style={{ color: live ? "#D1FF26" : "#42E1F6" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: live ? "#D1FF26" : "#42E1F6" }}>
            // {live ? "LIVE SHARING" : "SNAPSHOT SHARING"}
          </p>
          {live && <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>
            <Radio size={9} className="animate-pulse" /> BROADCASTING
          </span>}
        </div>
        <div className="flex items-center gap-2">
          {share?.expires_at && (
            <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
              <Clock size={10} /> until {new Date(share.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={capture}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-50"
            style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Crosshair size={11} />} REFRESH
          </button>
        </div>
      </div>

      <div style={{ height: 260, width: "100%", background: "#05070A", border: "0.5px solid rgba(138,143,152,0.15)" }}>
        {location ? (
          <MapContainer
            key={`${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`}
            center={center}
            zoom={15}
            scrollWheelZoom={false}
            className="region-map"
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url={DARK_TILES} />
            <CircleMarker
              center={[location.latitude, location.longitude]}
              radius={10}
              pathOptions={{ color: "#D1FF26", fillColor: "#D1FF26", fillOpacity: 0.45, weight: 2 }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>YOU · SHARING</Tooltip>
            </CircleMarker>
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: "#8A8F98" }}>
            <span className="font-mono text-[9px] tracking-widest">{loading ? "ACQUIRING SATELLITE FIX…" : "AWAITING GPS FIX"}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <MapPin size={12} style={{ color: location ? "#D1FF26" : "#8A8F98" }} />
        {location ? (
          <p className="font-mono text-[10px] break-all" style={{ color: "#D1FF26" }}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        ) : error ? (
          <p className="font-mono text-[10px]" style={{ color: "#ef4444" }}>{error}</p>
        ) : (
          <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>NO FIX YET</p>
        )}
      </div>

      {error && (
        <p className="mt-2 font-mono text-[9px]" style={{ color: "#fb923c" }}>
          Allow location access in your browser to share. Live tracking needs this page to stay open.
        </p>
      )}

      <button
        onClick={onStop}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:opacity-90"
        style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
      >
        <Square size={12} /> Stop sharing
      </button>
    </div>
  );
}