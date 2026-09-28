import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Power, AlertCircle, Signal, Wifi, BatteryFull, Grid3x3, MessageSquare, Clock, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useTwilioVoice } from "@/hooks/useTwilioVoice";
import EmergencyDisclaimerModal from "@/components/phone/EmergencyDisclaimerModal";
import ModernDialer from "@/components/phone/ModernDialer";
import ModernCallView from "@/components/phone/ModernCallView";

const CALL_STATES = ["connecting", "ringing", "in-call", "incoming"];

// Compact, self-contained functional Dial Phone for the homepage.
// Reuses the real telephony stack (Twilio softphone + entitlements) so a
// logged-in member can place a call without leaving the landing page.
export default function HomeDialer() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ackBusy, setAckBusy] = useState(false);
  const [callTarget, setCallTarget] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const voice = useTwilioVoice();

  const loadAccount = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("phone-account", {});
      setAccount(res?.data || res);
    } catch (e) { console.error("phone-account load failed", e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAccount(); }, [loadAccount]);

  const entitlement = account?.entitlement;
  const needsDisclaimer = entitlement && !entitlement.disclaimer_acknowledged;
  const isPaid = account?.tier && account.tier !== "free";
  const inCall = CALL_STATES.includes(voice.status);

  const ackDisclaimer = async () => {
    setAckBusy(true);
    try {
      await base44.functions.invoke("phone-account", { acknowledge_disclaimer: true });
      await loadAccount();
    } catch (e) { console.error(e); }
    setAckBusy(false);
  };

  const placeCall = async (to, record) => {
    setCallTarget(to);
    await voice.placeCall(to, { record });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {needsDisclaimer && <EmergencyDisclaimerModal onAck={ackDisclaimer} acknowledging={ackBusy} />}

      {/* Header strip */}
      <div className="flex items-center justify-between w-full max-w-[340px] mb-3 px-1">
        <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// LIVE DIAL PHONE</p>
        <button
          onClick={voice.register}
          className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
          style={{ border: `0.5px solid ${voice.ready ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.25)"}`, color: voice.ready ? "#D1FF26" : "#8A8F98" }}
        >
          <Power size={11} /> {voice.ready ? "Online" : "Go online"}
        </button>
      </div>

      {/* Not-signed-in nudge */}
      {!user && (
        <div className="w-full max-w-[340px] mb-3 p-3 flex items-center gap-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
          <AlertCircle size={14} className="flex-shrink-0" style={{ color: "#D1FF26" }} />
          <p className="text-[11px] leading-snug" style={{ color: "#F5F5F7" }}>
            <Link to="/login" className="underline" style={{ color: "#D1FF26" }}>Sign in</Link> to place a real call from your browser.
          </p>
        </div>
      )}

      {voice.error && (
        <div className="w-full max-w-[340px] mb-3 p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
          <p className="text-[11px]" style={{ color: "#F5F5F7" }}>{voice.error}</p>
        </div>
      )}

      {/* Phone device frame */}
      <div className="relative w-full max-w-[340px]" style={{ background: "linear-gradient(180deg, #1d2024 0%, #0c0e11 100%)", border: "1px solid rgba(209,255,38,0.25)", borderRadius: 36, padding: 10, boxShadow: "0 18px 60px rgba(0,0,0,0.6), 0 0 30px rgba(209,255,38,0.08)" }}>
        <div className="absolute -left-[3px] top-24 w-[3px] h-10 rounded-l" style={{ background: "#2a2d31" }} />
        <div className="absolute -right-[3px] top-20 w-[3px] h-16 rounded-r" style={{ background: "#2a2d31" }} />

        <div className="relative overflow-hidden" style={{ background: "#070a0e", borderRadius: 28, minHeight: 420 }}>
          {/* Notch + status bar */}
          <div className="relative h-9 flex items-center justify-between px-5" style={{ background: "#05070A" }}>
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2" style={{ width: 90, height: 18, borderRadius: 12, background: "#000" }} />
            <span className="font-mono text-[10px] font-bold" style={{ color: "#D1FF26" }}>
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
            <div className="flex items-center gap-1.5">
              <Signal size={11} style={{ color: "#D1FF26" }} />
              <Wifi size={11} style={{ color: "#42E1F6" }} />
              <BatteryFull size={13} style={{ color: "#D1FF26" }} />
            </div>
          </div>

          {/* Screen content */}
          <div className="px-5 py-5">
            {inCall ? (
              <ModernCallView
                status={voice.status}
                muted={voice.muted}
                onMute={voice.toggleMute}
                onHangup={voice.hangup}
                onDigit={voice.sendDigits}
                remoteNumber={callTarget}
                incoming={voice.status === "incoming"}
                onAccept={voice.accept}
                onReject={voice.reject}
              />
            ) : showContacts ? (
              <ContactsQuickPanel onCall={placeCall} onClose={() => setShowContacts(false)} />
            ) : (
              <ModernDialer onCall={placeCall} busy={voice.status === "connecting" || voice.status === "registering"} onOpenContacts={() => setShowContacts(true)} canRecord={isPaid} />
            )}
          </div>

          {/* Bottom tab bar */}
          {!inCall && (
            <div className="absolute bottom-0 inset-x-0 flex items-center justify-around py-3" style={{ background: "rgba(5,7,10,0.95)", borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
              <div className="flex flex-col items-center gap-1" style={{ color: "#D1FF26" }}>
                <Grid3x3 size={18} />
                <span className="font-mono text-[8px] tracking-widest">KEYPAD</span>
              </div>
              <Link to="/messages" className="flex flex-col items-center gap-1" style={{ color: "#8A8F98" }}>
                <MessageSquare size={18} />
                <span className="font-mono text-[8px] tracking-widest">SMS</span>
              </Link>
              <Link to="/call-history" className="flex flex-col items-center gap-1" style={{ color: "#8A8F98" }}>
                <Clock size={18} />
                <span className="font-mono text-[8px] tracking-widest">RECENT</span>
              </Link>
              <button onClick={() => setShowContacts(true)} className="flex flex-col items-center gap-1" style={{ color: showContacts ? "#D1FF26" : "#8A8F98" }}>
                <User size={18} />
                <span className="font-mono text-[8px] tracking-widest">CONTACTS</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full phone link */}
      <Link to="/phone" className="mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase px-4 py-2 transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
        Open Full Dial Phone <Grid3x3 size={11} />
      </Link>
    </div>
  );
}

// Lightweight contacts quick-pick — loads saved contacts and dials on tap.
function ContactsQuickPanel({ onCall, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Contact.list("name", 50);
        setContacts(Array.isArray(list) ? list : []);
      } catch { setContacts([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[9px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// CONTACTS</p>
        <button onClick={onClose} className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>← KEYPAD</button>
      </div>
      {loading ? (
        <p className="text-center font-mono text-[10px]" style={{ color: "#8A8F98" }}>LOADING…</p>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-mono text-[10px] mb-2" style={{ color: "#8A8F98" }}>NO SAVED CONTACTS</p>
          <Link to="/address-book" className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>Add Contacts</Link>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
          {contacts.map((c) => (
            <button key={c.id} onClick={() => onCall(c.phone_number || c.number || "")} className="w-full flex items-center gap-2 p-2 text-left transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(138,143,152,0.15)" }}>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.12)", borderRadius: 9999 }}>
                <User size={14} style={{ color: "#D1FF26" }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "#F5F5F7" }}>{c.name || "Unknown"}</p>
                <p className="font-mono text-[10px] truncate" style={{ color: "#8A8F98" }}>{c.phone_number || c.number || "—"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}