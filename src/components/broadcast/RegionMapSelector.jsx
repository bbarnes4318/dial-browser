import React from "react";
import { MapContainer, TileLayer, Rectangle, Tooltip } from "react-leaflet";
import { REGION_BOUNDS, REGIONS } from "@/lib/regionMap";

// Interactive US map — click a region rectangle to toggle it in/out of the selection.
export default function RegionMapSelector({ selected, onToggle }) {
  const selectable = REGIONS.filter((r) => r.value !== "all" && r.value !== "national");

  return (
    <div className="region-map w-full h-full">
      <MapContainer
        center={[38, -97]}
        zoom={3.6}
        minZoom={3}
        maxZoom={5}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%", background: "#05070A" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        {selectable.map((r) => {
          const isSel = selected.includes(r.value);
          return (
            <Rectangle
              key={r.value}
              bounds={REGION_BOUNDS[r.value]}
              pathOptions={{
                color: isSel ? "#D1FF26" : "rgba(138,143,152,0.45)",
                weight: isSel ? 2 : 1,
                fillColor: isSel ? "#D1FF26" : "#0a0e14",
                fillOpacity: isSel ? 0.38 : 0.18,
              }}
            eventHandlers={{ click: () => onToggle(r.value) }}
          >
            <Tooltip permanent direction="center" opacity={1}>
              {r.label.toUpperCase()}{isSel ? " ✓" : ""}
            </Tooltip>
          </Rectangle>
          );
        })}
      </MapContainer>
    </div>
  );
}