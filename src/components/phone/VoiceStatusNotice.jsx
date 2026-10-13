import React from "react";
import { AlertCircle, Info, X } from "lucide-react";
import { useHoppwhistleVoice } from "@/telephony/hoppwhistle/HoppwhistleVoiceProvider";
import { PhoneStatus, VoiceErrorCode } from "@/telephony/hoppwhistle";
import HoppwhistleConnectCard from "@/components/phone/HoppwhistleConnectCard";

const RECONNECTABLE = new Set([
  VoiceErrorCode.CONNECT_EXHAUSTED,
  VoiceErrorCode.REGISTRATION_REJECTED,
  VoiceErrorCode.REGISTRATION_TIMEOUT,
  VoiceErrorCode.TRANSPORT_FAILED,
  VoiceErrorCode.NETWORK_DISCONNECTED,
  VoiceErrorCode.SERVER_UNREACHABLE,
  VoiceErrorCode.CREDENTIALS_UNAVAILABLE,
]);

/**
 * What the phone needs from the person, if anything: sign in, reconnect,
 * allow audio, or take the phone over from another tab. Renders nothing when
 * the phone is fine.
 */
export default function VoiceStatusNotice({ compact = false }) {
  const voice = useHoppwhistleVoice();
  const width = compact ? "w-full max-w-[340px]" : "";

  if (voice.authRequired && voice.phoneStatus !== PhoneStatus.DISABLED) {
    return <HoppwhistleConnectCard compact={compact} />;
  }

  if (voice.phoneStatus === PhoneStatus.STANDBY) {
    const remote = voice.otherTab?.summary?.call;
    return (
      <div className={`${width} flex items-start gap-2 p-3 mb-4`} style={{ background: "rgba(66,225,246,0.06)", border: "0.5px solid rgba(66,225,246,0.3)", borderRadius: 8 }}>
        <Info size={15} style={{ color: "#42E1F6" }} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs" style={{ color: "#F5F5F7" }}>
            {remote ? "You are on a call in another Dial Browser tab." : "Your phone is active in another Dial Browser tab."}
          </p>
          {!remote && (
            <button onClick={voice.takeOver} className="mt-2 font-mono text-[9px] tracking-widest uppercase px-2.5 py-1.5"
              style={{ border: "0.5px solid rgba(66,225,246,0.4)", color: "#42E1F6" }}>
              Use phone here
            </button>
          )}
        </div>
      </div>
    );
  }

  const error = voice.error;
  if (!error) return null;
  const canReconnect = RECONNECTABLE.has(error.code);
  const audioBlocked = error.code === VoiceErrorCode.AUDIO_PLAYBACK_BLOCKED;

  return (
    <div className={`${width} flex items-start gap-2 p-3 mb-4`} style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", borderRadius: 8 }}>
      <AlertCircle size={15} style={{ color: "#ef4444" }} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs" style={{ color: "#F5F5F7" }}>{error.message}</p>
        {(canReconnect || audioBlocked) && (
          <button onClick={audioBlocked ? voice.resumeAudio : voice.reconnect}
            className="mt-2 font-mono text-[9px] tracking-widest uppercase px-2.5 py-1.5"
            style={{ border: "0.5px solid rgba(239,68,68,0.45)", color: "#F5F5F7" }}>
            {audioBlocked ? "Enable audio" : "Reconnect"}
          </button>
        )}
      </div>
      {!audioBlocked && (
        <button onClick={voice.clearError} title="Dismiss" className="p-0.5" style={{ color: "#8A8F98" }}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}
