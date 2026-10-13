import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Home, Loader2, MessageSquare, Power, Grid3x3, Clock, ChevronRight, Signal, Wifi, BatteryFull, User, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useHoppwhistleVoice, useCallSurface } from "@/telephony/hoppwhistle/HoppwhistleVoiceProvider";
import { PhoneStatus } from "@/telephony/hoppwhistle";
import PhoneHeader from "@/components/phone/PhoneHeader";
import EmergencyDisclaimerBanner from "@/components/phone/EmergencyDisclaimerBanner";
import EmergencyDisclaimerModal from "@/components/phone/EmergencyDisclaimerModal";
import PhoneUsageWidget from "@/components/phone/PhoneUsageWidget";
import ModernDialer from "@/components/phone/ModernDialer";
import ContactsPanel from "@/components/phone/ContactsPanel";
import CallForwarding from "@/components/phone/CallForwarding";
import ModernCallView from "@/components/phone/ModernCallView";
import PostCallRatingDialog from "@/components/phone/PostCallRatingDialog";
import VoiceStatusNotice from "@/components/phone/VoiceStatusNotice";
import CallerIdSelect from "@/components/phone/CallerIdSelect";
import { callViewProps } from "@/components/phone/voiceCallViewProps";


export default function PhonePage() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ackBusy, setAckBusy] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratedCall, setRatedCall] = useState({ remoteNumber: "", direction: "outbound" });
  const [showContacts, setShowContacts] = useState(false);
  const [params] = useSearchParams();
  const dialParam = params.get("dial");

  const voice = useHoppwhistleVoice();
  useCallSurface();
  const autoConnected = useRef(false);
  const autoDialed = useRef(false);

  const loadAccount = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("phone-account", {});
      setAccount(res?.data || res);
    } catch (e) {
      console.error("phone-account load failed", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAccount(); }, [loadAccount]);

  const entitlement = account?.entitlement;
  const needsDisclaimer = entitlement && !entitlement.disclaimer_acknowledged;
  const isPaid = account?.tier && account.tier !== "free";

  // Bring the phone online on arrival, once, after the non-emergency disclaimer
  // is accepted and a Hoppwhistle session is linked. A deliberate "go offline"
  // is respected for the rest of the visit.
  useEffect(() => {
    if (loading || needsDisclaimer || voice.authRequired || autoConnected.current) return;
    if (voice.phoneStatus !== PhoneStatus.OFFLINE) return;
    autoConnected.current = true;
    void voice.connect();
  }, [loading, needsDisclaimer, voice.authRequired, voice.phoneStatus, voice.connect]);

  // Auto-dial when arriving from the address book (?dial=<number>) once the phone is registered.
  useEffect(() => {
    if (dialParam && voice.isRegistered && !autoDialed.current) {
      autoDialed.current = true;
      void voice.makeCall(dialParam);
    }
  }, [dialParam, voice.isRegistered, voice.makeCall]);

  // Post-call rating: once per ended call.
  useEffect(() => voice.onCallEnded((ended) => {
    setRatedCall({ remoteNumber: ended.phoneNumber || "", direction: ended.direction });
    setRatingOpen(true);
  }), [voice.onCallEnded]);

  const ackDisclaimer = async () => {
    setAckBusy(true);
    try {
      await base44.functions.invoke("phone-account", { acknowledge_disclaimer: true });
      await loadAccount();
    } catch (e) { console.error(e); }
    setAckBusy(false);
  };

  const provision = async () => {
    setProvisioning(true);
    try {
      const res = await base44.functions.invoke("provision-phone-number", {});
      if ((res?.data || res)?.provisioned || (res?.data || res)?.number) {
        await loadAccount();
      }
    } catch (e) { console.error("provision failed", e); }
    setProvisioning(false);
  };

  // Every dial path on this page -- keypad, contacts -- goes through the voice
  // client. Recording is Hoppwhistle's policy, so there is no browser record flag.
  const placeCall = (to) => voice.makeCall(to);

  const online = voice.phoneStatus === PhoneStatus.REGISTERED;
  const togglePhone = () => {
    if (online) return voice.disconnect();
    if (voice.phoneStatus === PhoneStatus.STANDBY) return voice.takeOver();
    return voice.reconnect();
  };
  const phoneLabel =
    online ? "Online" :
    voice.isConnecting && !voice.dialing ? "Connecting" :
    voice.phoneStatus === PhoneStatus.STANDBY ? "Other tab" : "Go online";

  const buyMore = () => { window.location.href = "/#pricing"; };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  const inCall = Boolean(voice.callViewStatus);

  return (
    <div className="min-h-screen pb-24" style={{ background: "#05070A" }}>
      {needsDisclaimer && <EmergencyDisclaimerModal onAck={ackDisclaimer} acknowledging={ackBusy} />}

      <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between"
        style={{ background: "rgba(5,7,10,0.9)", borderBottom: "0.5px solid rgba(209,255,38,0.15)", backdropFilter: "blur(12px)" }}>
        <Link to="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
          <Home size={12} /> Home
        </Link>
        <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DIAL PHONE</p>
        <button
          onClick={togglePhone}
          disabled={voice.authRequired || voice.phoneStatus === PhoneStatus.DISABLED}
          title={online ? "Go offline" : undefined}
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase disabled:opacity-50"
          style={{ border: `0.5px solid ${online ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.25)"}`, color: online ? "#D1FF26" : "#8A8F98" }}>
          <Power size={12} /> {phoneLabel}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6">
        <PhoneHeader />

        <EmergencyDisclaimerBanner />

        <VoiceStatusNotice />

        {/* Phone device frame */}
        <div className="flex justify-center">
          <div
            className="relative w-full max-w-[340px]"
            style={{
              background: "linear-gradient(180deg, #1d2024 0%, #0c0e11 100%)",
              border: "1px solid rgba(209,255,38,0.25)",
              borderRadius: 36,
              padding: 10,
              boxShadow: "0 18px 60px rgba(0,0,0,0.6), 0 0 30px rgba(209,255,38,0.08)",
            }}
          >
            {/* Side buttons */}
            <div className="absolute -left-[3px] top-24 w-[3px] h-10 rounded-l" style={{ background: "#2a2d31" }} />
            <div className="absolute -right-[3px] top-20 w-[3px] h-16 rounded-r" style={{ background: "#2a2d31" }} />

            {/* Screen */}
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
                  <ModernCallView {...callViewProps(voice)} />
                ) : showContacts ? (
                  <ContactsPanel onCall={placeCall} onClose={() => setShowContacts(false)} />
                ) : (
                  <>
                    <CallerIdSelect className="mb-3" />
                    <ModernDialer onCall={placeCall} busy={voice.isConnecting} onOpenContacts={() => setShowContacts(true)} canRecord={false} />
                  </>
                )}
              </div>

              {/* Bottom tab bar (hidden during call) */}
              {!inCall && (
                <div className="absolute bottom-0 inset-x-0 flex items-center justify-around py-3" style={{ background: "rgba(5,7,10,0.95)", borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <Link to="/phone" className="flex flex-col items-center gap-1" style={{ color: "#D1FF26" }}>
                    <Grid3x3 size={18} />
                    <span className="font-mono text-[8px] tracking-widest">KEYPAD</span>
                  </Link>
                  <Link to="/messages" className="flex flex-col items-center gap-1" style={{ color: "#8A8F98" }}>
                    <MessageSquare size={18} />
                    <span className="font-mono text-[8px] tracking-widest">MESSAGES</span>
                  </Link>
                  <Link to="/call-history" className="flex flex-col items-center gap-1" style={{ color: "#8A8F98" }}>
                    <Clock size={18} />
                    <span className="font-mono text-[8px] tracking-widest">RECENTS</span>
                  </Link>
                  <button onClick={() => setShowContacts(true)} className="flex flex-col items-center gap-1" style={{ color: showContacts ? "#D1FF26" : "#8A8F98" }}>
                    <User size={18} />
                    <span className="font-mono text-[8px] tracking-widest">CONTACTS</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage widget + quick links */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <PhoneUsageWidget
            entitlement={entitlement}
            tier={account?.tier}
            hasNumber={account?.number?.number}
            onProvision={provision}
            provisioning={provisioning}
            onBuyMore={buyMore}
            onUpdated={loadAccount}
          />
          <div className="flex flex-col gap-3">
            <QuickLink to="/messages" icon={MessageSquare} title="SMS Inbox" desc="View and reply to text threads" />
            <QuickLink to="/call-history" icon={Clock} title="Call History" desc="Recent inbound & outbound calls" />
            <QuickLink to="/address-book" icon={User} title="Address Book" desc="Saved contacts — tap to call" />
            <QuickLink to="/groups" icon={Users} title="Groups" desc="Broadcast texts & group calls" />
          </div>
        </div>

        <div className="mt-4">
          <CallForwarding entitlement={entitlement} isPaid={isPaid} onUpdated={loadAccount} />
        </div>
      </div>

      <PostCallRatingDialog
        open={ratingOpen}
        remoteNumber={ratedCall.remoteNumber}
        direction={ratedCall.direction}
        userId={user?.id}
        onClose={() => setRatingOpen(false)}
      />
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-4 transition-all hover:bg-[rgba(209,255,38,0.06)]"
      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", borderRadius: 10 }}>
      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.12)", borderRadius: 8 }}>
        <Icon size={18} style={{ color: "#D1FF26" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{title}</p>
        <p className="text-[11px]" style={{ color: "#8A8F98" }}>{desc}</p>
      </div>
      <ChevronRight size={16} style={{ color: "#8A8F98" }} />
    </Link>
  );
}