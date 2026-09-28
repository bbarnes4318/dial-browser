import React, { useEffect, useId } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { MapPin, Navigation, Loader2, Crosshair } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export default function VoiceGpsPanel({
  autoCapture = false,
  onLocation,
  title = "VOICE CALL GPS",
  compact = false,
}) {
  const { location, error, loading, capture } = useGeolocation();

  useEffect(() => {
    if (autoCapture) capture();
  }, [autoCapture, capture]);

  useEffect(() => {
    if (location && onLocation) onLocation(location);
  }, [location, onLocation]);

  const center = location ? [location.latitude, location.longitude] : [39.5, -98.35];

  return (
    <div className={compact ? "p-3" : "p-4"} style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// {title}</p>
        </div>
        <button
          onClick={capture}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-50"
          style={{ background: loading ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <Crosshair size={11} />} {loading ? "FIXING…" : "CAPTURE"}
        </button>
      </div>

      <div style={{ height: compact ? 160 : 240, width: "100%", background: "#05070A", border: "0.5px solid rgba(138,143,152,0.15)" }}>
        {location ? (
          <MapContainer
            key={`${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`}
            center={[location.latitude, location.longitude]}
            zoom={15}
            scrollWheelZoom={false}
            className="region-map"
            style={{ height: "100%", width: "100%" }}
            zoomControl={!compact}
          >
            <TileLayer url={DARK_TILES} />
            <CircleMarker
              center={[location.latitude, location.longitude]}
              radius={9}
              pathOptions={{ color: "#D1FF26", fillColor: "#D1FF26", fillOpacity: 0.45, weight: 2 }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>YOU ARE HERE</Tooltip>
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
          <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>NO FIX — TAP CAPTURE</p>
        )}
      </div>
      {location?.accuracy != null && (
        <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.7)" }}>
          ±{Math.round(location.accuracy)}m accuracy
        </p>
      )}
    </div>
  );
}