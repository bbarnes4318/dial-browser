import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import {
  ArrowLeft, MapPin, Radio, Camera, Users, AlertTriangle, ArrowRight, ArrowLeft as ArrowLeftIcon,
  Check, X, Loader2, Clock, Navigation, Shield, Inbox, Send,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import RecipientPicker from "@/components/location/RecipientPicker";
import LocationShareControls from "@/components/location/LocationShareControls";
import LocationInbox from "@/components/location/LocationInbox";
import RecipientAcceptView from "@/components/location/RecipientAcceptView";
import LocationHeader from "@/components/location/LocationHeader";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const DURATIONS = [
  { mins: 15, label: "15 min" },
  { mins: 30, label: "30 min" },
  { mins: 60, label: "60 min" },
];

function addMinutes(mins) {
  return new Date(Date.now() + mins * 60000).toISOString();
}

export default function ShareMyLocation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const acceptToken = params.get("accept");

  // Public recipient (magic-link) view — no login required.
  if (acceptToken) return <RecipientAcceptView token={acceptToken} />;

  // Sender view requires auth.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#05070A" }}>
        <div className="text-center max-w-sm">
          <MapPin size={28} className="mx-auto mb-4" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// SIGN IN REQUIRED</p>
          <p className="text-sm mb-5" style={{ color: "#8A8F98" }}>You need to be signed in to share your location.</p>
          <button onClick={() => navigate("/login")} className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>Sign in</button>
        </div>
      </div>
    );
  }

  return <SenderView user={user} />;
}

// ═══════════════════════════════════════════════════════════════════════
// SENDER VIEW
// ═══════════════════════════════════════════════════════════════════════
function SenderView({ user }) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState("snap");
  const [duration, setDuration] = useState(60);
  const [audience, setAudience] = useState("friend");
  const [recipients, setRecipients] = useState([]);
  const [share, setShare] = useState(null);
  const [recipientRows, setRecipientRows] = useState([]);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState("share");
  const tickRef = useRef(null);

  const toggleRecipient = (opt) => {
    setRecipients((prev) => prev.some((r) => r.id === opt.id) ? prev.filter((r) => r.id !== opt.id) : [...prev, opt]);
  };

  // Called by LocationShareControls on the first GPS fix — creates the share.
  const startShare = async (location) => {
    if (creating || share) return;
    setCreating(true);
    try {
      const expires_at = addMinutes(mode === "live" ? duration : 60);
      const nowIso = new Date().toISOString();
      const ownerName = user.full_name || user.email || "Member";
      const base = {
        owner_user_id: user.id,
        owner_name: ownerName,
        owner_avatar: "",
        mode,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        last_updated: nowIso,
        expires_at,
        duration_minutes: mode === "live" ? duration : 60,
        status: "active",
        recipient_type: audience,
        recipient_count: recipients.length,
      };
      const rec = await base44.entities.SharedLocation.create(base);
      setShare(rec);

      const recipRows = recipients.map((r) => ({
        shared_location_id: rec.id,
        owner_user_id: user.id,
        owner_name: ownerName,
        owner_avatar: "",
        recipient_user_id: r.userId || "",
        recipient_name: r.name,
        recipient_contact_id: audience === "emergency" ? r.id : "",
        recipient_phone: r.phone || "",
        recipient_type: audience,
        mode,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        last_updated: nowIso,
        expires_at,
        status: "active",
        accepted: false,
        declined: false,
      }));
      const created = await base44.entities.SharedLocationRecipient.bulkCreate(recipRows);
      const rows = Array.isArray(created) ? created : [];
      setRecipientRows(rows);

      // Emergency contacts get an SMS magic-link invite (best-effort).
      if (audience === "emergency") {
        sendEmergencyInvites(rows, mode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const sendEmergencyInvites = async (rows, md) => {
    const appUrl = window.location.origin;
    for (const row of rows) {
      if (!row.recipient_phone) continue;
      const link = `${appUrl}/share-location?accept=${row.id}`;
      const msg = `${user.full_name || "A member"} is sharing their ${md === "live" ? "live" : "current"} location with you on 1 Call Away. Accept to view: ${link}`;
      try {
        await base44.functions.invoke("sendSmsNotification", {
          notification_type: "emergency_alert",
          recipient_name: row.recipient_name,
          recipient_phone: row.recipient_phone,
          title: "Location Share Invite",
          message_body: msg,
          related_name: user.full_name || "Member",
          status: "pending",
        });
      } catch { /* best effort */ }
    }
  };

  // Live tick: update share + recipient rows with fresh coords.
  const onCoords = useCallback(async (loc) => {
    if (!share) {
      await startShare(loc);
      return;
    }
    if (mode !== "live") return;
    if (tickRef.current) return;
    tickRef.current = setTimeout(async () => {
      tickRef.current = null;
      const nowIso = new Date().toISOString();
      try {
        await base44.entities.SharedLocation.update(share.id, {
          latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy || 0, last_updated: nowIso,
        });
        if (recipientRows.length > 0) {
          await base44.entities.SharedLocationRecipient.bulkUpdate(
            recipientRows.map((r) => ({ id: r.id, latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy || 0, last_updated: nowIso }))
          );
        }
      } catch { /* best effort */ }
    }, 8000);
  }, [share, mode, recipientRows, creating]);

  const stopShare = async () => {
    try {
      if (share) await base44.entities.SharedLocation.update(share.id, { status: "revoked" });
      if (recipientRows.length > 0) {
        await base44.entities.SharedLocationRecipient.bulkUpdate(recipientRows.map((r) => ({ id: r.id, status: "revoked" })));
      }
    } catch { /* best effort */ }
    setStep(1); setShare(null); setRecipientRows([]); setRecipients([]);
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 pt-8 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <LocationHeader />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// SHARE MY LOCATION</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl" style={{ color: "#F5F5F7" }}>
            Share your <span style={{ color: "#D1FF26" }}>whereabouts</span>
          </h1>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "#8A8F98" }}>
            Live-track or send a one-time snapshot to selected friends or emergency contacts. Recipients must accept before your location is revealed.
          </p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          <TabButton active={tab === "share"} onClick={() => setTab("share")} icon={MapPin} label="Share" />
          <TabButton active={tab === "inbox"} onClick={() => setTab("inbox")} icon={Inbox} label="Invites" />
        </div>

        {tab === "inbox" ? (
          <LocationInbox />
        ) : step === 1 ? (
          <Step1Mode mode={mode} setMode={setMode} duration={duration} setDuration={setDuration} onNext={() => setStep(2)} />
        ) : step === 2 ? (
          <Step2Audience audience={audience} setAudience={setAudience} recipients={recipients} toggleRecipient={toggleRecipient} onBack={() => setStep(1)} onConfirm={() => setStep(3)} />
        ) : (
          <Step3Sharing mode={mode} share={share} recipients={recipientRows} onCoords={onCoords} onStop={stopShare} live={mode === "live"} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all"
      style={{ background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`, color: active ? "#D1FF26" : "#8A8F98" }}>
      <Icon size={12} /> {label}
    </button>
  );
}

function Step1Mode({ mode, setMode, duration, setDuration, onNext }) {
  return (
    <div className="p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>1. CHOOSE A MODE</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <ModeCard active={mode === "live"} onClick={() => setMode("live")} icon={Radio} color="#D1FF26" title="Live" desc="Continuously update your position while this page stays open." />
        <ModeCard active={mode === "snap"} onClick={() => setMode("snap")} icon={Camera} color="#42E1F6" title="Snapshot" desc="Share your current position once. Visible for 1 hour." />
      </div>

      {mode === "live" && (
        <div className="mb-6">
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>LIVE DURATION</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button key={d.mins} onClick={() => setDuration(d.mins)}
                className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{ background: duration === d.mins ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.6)", border: `0.5px solid ${duration === d.mins ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`, color: duration === d.mins ? "#D1FF26" : "#8A8F98" }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 mb-6" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <Shield size={13} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>Recipients must accept your invite before any location is revealed.</p>
      </div>

      <button onClick={onNext} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.25)]" style={{ background: "#D1FF26", color: "#05070A" }}>
        Continue <ArrowRight size={14} />
      </button>
    </div>
  );
}

function ModeCard({ active, onClick, icon: Icon, color, title, desc }) {
  return (
    <button onClick={onClick} className="text-left p-4 transition-all"
      style={{ background: active ? `${color}12` : "rgba(5,7,10,0.6)", border: `0.5px solid ${active ? color + "88" : "rgba(138,143,152,0.12)"}` }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} />
        <span className="font-heading font-bold text-sm" style={{ color: active ? color : "#F5F5F7" }}>{title}</span>
      </div>
      <p className="text-[11px]" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{desc}</p>
    </button>
  );
}

function Step2Audience({ audience, setAudience, recipients, toggleRecipient, onBack, onConfirm }) {
  return (
    <div className="p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>2. CHOOSE AUDIENCE</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <AudienceCard active={audience === "friend"} onClick={() => setAudience("friend")} icon={Users} color="#D1FF26" title="Friends" desc="People you follow on Dial Social" />
        <AudienceCard active={audience === "emergency"} onClick={() => setAudience("emergency")} icon={AlertTriangle} color="#fb923c" title="Emergency Contacts" desc="Invited via SMS with an accept link" />
      </div>

      <RecipientPicker audience={audience} selected={recipients} onToggle={toggleRecipient} />

      <p className="font-mono text-[9px] mt-3" style={{ color: "#8A8F98" }}>
        {recipients.length} recipient{recipients.length === 1 ? "" : "s"} selected.
      </p>

      <div className="flex gap-2 mt-5">
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.25)", color: "#8A8F98" }}>
          <ArrowLeftIcon size={14} /> Back
        </button>
        <button onClick={onConfirm} disabled={recipients.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.25)] disabled:opacity-40"
          style={{ background: "#D1FF26", color: "#05070A" }}>
          {recipients.length === 0 ? "Select recipients" : "Start sharing"} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function AudienceCard({ active, onClick, icon: Icon, color, title, desc }) {
  return (
    <button onClick={onClick} className="text-left p-4 transition-all"
      style={{ background: active ? `${color}12` : "rgba(5,7,10,0.6)", border: `0.5px solid ${active ? color + "88" : "rgba(138,143,152,0.12)"}` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={15} style={{ color }} />
        <span className="font-heading font-bold text-[13px]" style={{ color: active ? color : "#F5F5F7" }}>{title}</span>
      </div>
      <p className="text-[10px]" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{desc}</p>
    </button>
  );
}

function Step3Sharing({ mode, share, recipients, onCoords, onStop, live }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <LocationShareControls share={share} onCoords={onCoords} onStop={onStop} live={live} />
      <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
        <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>RECIPIENT STATUS</p>
        {recipients.length === 0 ? (
          <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>Sending invites…</p>
        ) : (
          <div className="space-y-2">
            {recipients.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: r.accepted ? "rgba(209,255,38,0.12)" : "rgba(138,143,152,0.1)" }}>
                  {r.declined ? <X size={12} style={{ color: "#ef4444" }} /> : r.accepted ? <Check size={12} style={{ color: "#D1FF26" }} /> : <Clock size={12} style={{ color: "#8A8F98" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] truncate" style={{ color: "#F5F5F7" }}>{r.recipient_name}</p>
                  <p className="font-mono text-[9px]" style={{ color: r.accepted ? "#D1FF26" : r.declined ? "#ef4444" : "#8A8F98" }}>
                    {r.accepted ? "VIEWING" : r.declined ? "DECLINED" : r.recipient_type === "emergency" ? "SMS SENT — AWAITING ACCEPT" : "PENDING ACCEPT"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="font-mono text-[9px] mt-4" style={{ color: "#8A8F98" }}>
          {live ? "Keep this page open while live tracking." : "Snapshot shared — recipients can accept within the hour."}
        </p>
      </div>
    </div>
  );
}