import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { motion } from "framer-motion";
import { MapPin, Check, X, Loader2, Clock, Navigation, Radio, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// In-app inbox for a member who has been invited to view someone's location
// (friends flow). Each pending share requires Accept / Decline consent before
// coordinates are revealed.
export default function LocationInbox() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.SharedLocationRecipient.filter(
        { recipient_type: "friend", status: "active" },
        "-created_date",
        50
      ).catch(() => []);
      setRows(Array.isArray(list) ? list : []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const accept = async (r) => {
    setBusy(r.id);
    try {
      await base44.entities.SharedLocationRecipient.update(r.id, { accepted: true, declined: false, accepted_at: new Date().toISOString() });
      await load();
    } finally { setBusy(""); }
  };
  const decline = async (r) => {
    setBusy(r.id);
    try {
      await base44.entities.SharedLocationRecipient.update(r.id, { declined: true, accepted: false });
      await load();
    } finally { setBusy(""); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin" style={{ color: "#8A8F98" }} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-10" style={{ border: "0.5px dashed rgba(138,143,152,0.15)" }}>
        <Inbox size={24} style={{ color: "rgba(209,255,38,0.3)" }} />
        <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO LOCATION INVITES</p>
        <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>When a friend shares their location, it appears here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const expired = r.expires_at && new Date(r.expires_at).getTime() < Date.now();
        const live = r.mode === "live";
        const accepted = r.accepted && !r.declined && !expired;
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4"
            style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${accepted ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.15)"}` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                {r.owner_avatar ? <img src={r.owner_avatar} alt="" className="w-full h-full object-cover" /> : <MapPin size={15} style={{ color: "#D1FF26" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-medium text-sm" style={{ color: "#F5F5F7" }}>{r.owner_name || "A member"}</p>
                <p className="font-mono text-[9px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "#8A8F98" }}>
                  <span className="flex items-center gap-1" style={{ color: live ? "#D1FF26" : "#42E1F6" }}>
                    {live ? <Radio size={9} /> : <Navigation size={9} />} {live ? "LIVE" : "SNAPSHOT"}
                  </span>
                  {r.expires_at && <span className="flex items-center gap-1"><Clock size={9} /> until {new Date(r.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                </p>
              </div>
            </div>

            {!accepted && !r.declined && !expired && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => accept(r)} disabled={busy === r.id} className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_14px_rgba(209,255,38,0.25)] disabled:opacity-50" style={{ background: "#D1FF26", color: "#05070A" }}>
                  <Check size={11} /> Accept
                </button>
                <button onClick={() => decline(r)} disabled={busy === r.id} className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-50" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  <X size={11} /> Decline
                </button>
              </div>
            )}

            {r.declined && <p className="font-mono text-[9px] mt-3" style={{ color: "#8A8F98" }}>You declined this share.</p>}
            {expired && <p className="font-mono text-[9px] mt-3" style={{ color: "#8A8F98" }}>This share has expired.</p>}

            {accepted && (
              <div className="mt-3">
                <div style={{ height: 200, background: "#05070A", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  {r.latitude != null ? (
                    <MapContainer
                      key={`${r.latitude.toFixed(4)}-${r.longitude.toFixed(4)}`}
                      center={[r.latitude, r.longitude]}
                      zoom={15}
                      scrollWheelZoom={false}
                      className="region-map"
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url={DARK_TILES} />
                      <CircleMarker center={[r.latitude, r.longitude]} radius={9} pathOptions={{ color: "#D1FF26", fillColor: "#D1FF26", fillOpacity: 0.45, weight: 2 }}>
                        <Tooltip permanent direction="top" offset={[0, -8]}>{(r.owner_name || "FRIEND").toUpperCase()}</Tooltip>
                      </CircleMarker>
                    </MapContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full"><span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>AWAITING FIRST FIX…</span></div>
                  )}
                </div>
                <p className="font-mono text-[9px] mt-2 break-all" style={{ color: "#D1FF26" }}>
                  {r.latitude?.toFixed(6)}, {r.longitude?.toFixed(6)}
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}