import React, { useState, useEffect, useId } from "react";
import { motion } from "framer-motion";
import { MapPin, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";

const RELATIONSHIP_COLORS = {
  Family: "#ef4444",
  Spouse: "#ef4444",
  Friend: "#D1FF26",
  Doctor: "#60A5FA",
  Neighbor: "#FBBF24",
  Caregiver: "#A78BFA",
  Other: "#8A8F98",
};

export default function EmergencyContactsMap() {
  const mapKey = useId();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await base44.entities.EmergencyContact.filter({}, "-created_date", 50);
        setContacts(data || []);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    loadContacts();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const locatedContacts = contacts.filter((c) => c.location_lat != null && c.location_lng != null);
  const unlocatedContacts = contacts.filter((c) => c.location_lat == null || c.location_lng == null);

  const center = locatedContacts.length > 0
    ? [locatedContacts[0].location_lat, locatedContacts[0].location_lng]
    : userLocation
      ? [userLocation.lat, userLocation.lng]
      : [39.8283, -98.5795];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={14} style={{ color: "#ef4444" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>// EMERGENCY CONTACTS MAP (FREE)</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{locatedContacts.length} LOCATED · {unlocatedContacts.length} WITHOUT ADDRESS</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(239,68,68,0.1)" }}>
          <Loader2 size={24} className="animate-spin" style={{ color: "#ef4444" }} />
        </div>
      ) : locatedContacts.length === 0 ? (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(239,68,68,0.2)" }}>
          <MapPin size={32} style={{ color: "rgba(239,68,68,0.3)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO LOCATIONS SAVED</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Add addresses to your emergency contacts to see them on the map</p>
        </div>
      ) : (
        <>
          <div className="relative" style={{ height: "400px", border: "0.5px solid rgba(239,68,68,0.2)" }}>
            <MapContainer key={mapKey} center={center} zoom={11} style={{ height: "100%", width: "100%", background: "#05070A" }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap & CartoDB'
              />
              {userLocation && (
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={10}
                  pathOptions={{ color: "#D1FF26", fillColor: "#D1FF26", fillOpacity: 0.3 }}
                >
                  <Popup><div style={{ color: "#05070A" }}><strong>Your Location</strong></div></Popup>
                </CircleMarker>
              )}
              {locatedContacts.map((contact) => {
                const color = RELATIONSHIP_COLORS[contact.relationship] || "#8A8F98";
                return (
                  <CircleMarker
                    key={contact.id}
                    center={[contact.location_lat, contact.location_lng]}
                    radius={8}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
                  >
                    <Popup>
                      <div style={{ color: "#05070A", minWidth: "150px" }}>
                        <strong style={{ fontSize: "14px" }}>{contact.name}</strong><br />
                        <span style={{ fontSize: "12px" }}>{contact.relationship}</span><br />
                        <a href={`tel:${contact.phone}`} style={{ fontSize: "12px", color: "#2563eb" }}>📞 {contact.phone}</a>
                        {contact.address && (<><br /><span style={{ fontSize: "11px", color: "#666" }}>📍 {contact.address}</span></>)}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {Object.entries(RELATIONSHIP_COLORS).filter(([k]) => locatedContacts.some((c) => c.relationship === k)).map(([rel, color]) => (
              <span key={rel} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} /> {rel.toUpperCase()}
              </span>
            ))}
            {userLocation && (
              <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#D1FF26" }} /> YOU
              </span>
            )}
          </div>

          {unlocatedContacts.length > 0 && (
            <div className="mt-3 p-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>CONTACTS WITHOUT LOCATION:</p>
              <div className="flex flex-wrap gap-2">
                {unlocatedContacts.map((c) => (
                  <span key={c.id} className="font-mono text-[9px] px-2 py-1" style={{ background: "rgba(138,143,152,0.08)", color: "#8A8F98" }}>{c.name}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}