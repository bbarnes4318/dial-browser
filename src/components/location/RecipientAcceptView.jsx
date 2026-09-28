import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import {
  MapPin, Radio, Navigation, Clock, Check, X, Loader2, AlertTriangle,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// Public magic-link view (?accept=<recipientId>). No login required —
// the recipient id is the unguessable token. Recipient must accept before
// coordinates are revealed; live shares poll for updates every 10s.
export default function RecipientAcceptView({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [declined, setDeclined] = useState(false);
  const pollRef = useRef(null);

  const fetchShare = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("accept-location-share", { recipient_id: token, action: "poll" });
      setData(res.data);
    } catch (e) {
      setData({ error: e.message });
    } finally {
      setLoading(false);
    }
  }, [token]);

  const accept = async () => {
    setDeciding(true);
    try {
      const res = await base44.functions.invoke("accept-location-share", { recipient_id: token, action: "accept" });
      setData(res.data);
    } finally { setDeciding(false); }
  };
  const decline = async () => {
    setDeciding(true);
    try {
      await base44.functions.invoke("accept-location-share", { recipient_id: token, action: "decline" });
      setDeclined(true);
    } finally { setDeciding(false); }
  };

  useEffect(() => { fetchShare(); }, [fetchShare]);

  useEffect(() => {
    if (data?.accepted && data?.mode === "live" && !declined && !data?.error && !data?.expired && !data?.revoked) {
      pollRef.current = setInterval(fetchShare, 10000);
      return () => clearInterval(pollRef.current);
    }
  }, [data?.accepted, data?.mode, declined, data?.error, data?.expired, data?.revoked, fetchShare]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#05070A" }}>
        <div className="text-center max-w-sm">
          <X size={28} className="mx-auto mb-4" style={{ color: "#8A8F98" }} />
          <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>// SHARE DECLINED</p>
          <p className="text-sm" style={{ color: "#8A8F98" }}>You won't see {data?.owner_name || "this member"}'s location.</p>
        </div>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#05070A" }}>
        <div className="text-center max-w-sm">
          <AlertTriangle size={28} className="mx-auto mb-4" style={{ color: "#fb923c" }} />
          <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#fb923c" }}>// LINK INVALID</p>
          <p className="text-sm" style={{ color: "#8A8F98" }}>This location share link is no longer valid.</p>
        </div>
      </div>
    );
  }

  if (data?.expired || data?.revoked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#05070A" }}>
        <div className="text-center max-w-sm">
          <Clock size={28} className="mx-auto mb-4" style={{ color: "#8A8F98" }} />
          <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>// SHARE ENDED</p>
          <p className="text-sm" style={{ color: "#8A8F98" }}>{data?.revoked ? "The sender stopped sharing." : "This share has expired."}</p>
        </div>
      </div>
    );
  }

  if (!data?.accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#05070A" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LOCATION INVITE</p>
          </div>
          <h1 className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>
            {data?.owner_name || "A member"} wants to share their {data?.mode === "live" ? "live" : "current"} location with you.
          </h1>
          <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            {data?.mode === "live" ? "They'll broadcast their real-time position while sharing is active." : "You'll see where they are right now, for up to 1 hour."}
          </p>
          <div className="flex gap-3">
            <button onClick={accept} disabled={deciding} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.25)] disabled:opacity-50" style={{ background: "#D1FF26", color: "#05070A" }}>
              {deciding ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Accept
            </button>
            <button onClick={decline} disabled={deciding} className="flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-50" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <X size={14} /> Decline
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation size={16} style={{ color: data?.mode === "live" ? "#D1FF26" : "#42E1F6" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: data?.mode === "live" ? "#D1FF26" : "#42E1F6" }}>
              // {data?.owner_name?.toUpperCase()} · {data?.mode === "live" ? "LIVE" : "SNAPSHOT"}
            </p>
          </div>
          {data?.expires_at && (
            <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
              <Clock size={10} /> until {new Date(data.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        <div style={{ height: 380, background: "#05070A", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {data?.latitude != null ? (
            <MapContainer key={`${data.latitude.toFixed(4)}-${data.longitude.toFixed(4)}`} center={[data.latitude, data.longitude]} zoom={15} scrollWheelZoom={false} className="region-map" style={{ height: "100%", width: "100%" }}>
              <TileLayer url={DARK_TILES} />
              <CircleMarker center={[data.latitude, data.longitude]} radius={11} pathOptions={{ color: "#D1FF26", fillColor: "#D1FF26", fillOpacity: 0.45, weight: 2 }}>
                <Tooltip permanent direction="top" offset={[0, -8]}>{(data?.owner_name || "SENDER").toUpperCase()}</Tooltip>
              </CircleMarker>
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full"><span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>AWAITING FIRST FIX…</span></div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <MapPin size={13} style={{ color: "#D1FF26" }} />
          {data?.latitude != null ? (
            <p className="font-mono text-[11px] break-all" style={{ color: "#D1FF26" }}>{data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}</p>
          ) : <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>NO FIX YET</p>}
          {data?.mode === "live" && <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#D1FF26" }}><Radio size={10} className="animate-pulse" /> UPDATING</span>}
        </div>
      </div>
    </div>
  );
}