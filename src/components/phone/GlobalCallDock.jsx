import React from "react";
import { Link } from "react-router-dom";
import { useHoppwhistleVoice } from "@/telephony/hoppwhistle/HoppwhistleVoiceProvider";
import ModernCallView from "@/components/phone/ModernCallView";
import { callViewProps } from "@/components/phone/voiceCallViewProps";

/**
 * The call, wherever the person is in the app.
 *
 * The phone stays registered across navigation, so an inbound call can ring
 * -- and a call in progress can need hanging up -- on a page with no phone on
 * it. When no on-page phone is showing the call, this does.
 */
export default function GlobalCallDock() {
  const voice = useHoppwhistleVoice();
  if (!voice.callViewStatus || voice.hasCallSurface) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] w-[300px] max-w-[calc(100vw-2rem)]"
      style={{ background: "linear-gradient(180deg, #1d2024 0%, #0c0e11 100%)", border: "1px solid rgba(209,255,38,0.25)", borderRadius: 24, padding: 8, boxShadow: "0 18px 60px rgba(0,0,0,0.6)" }}>
      <div className="px-4 py-4" style={{ background: "#070a0e", borderRadius: 18 }}>
        <ModernCallView {...callViewProps(voice)} />
        <Link to="/phone" className="block text-center mt-3 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
          Open Dial Phone
        </Link>
      </div>
    </div>
  );
}
