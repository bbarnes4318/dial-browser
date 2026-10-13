import React from "react";
import { useHoppwhistleVoice } from "@/telephony/hoppwhistle/HoppwhistleVoiceProvider";
import { formatPhoneForDisplay } from "@/telephony/hoppwhistle";

/**
 * The caller ID to call from, among the numbers Hoppwhistle assigned this
 * agent. A preference: Hoppwhistle checks it on every call and has the final
 * say.
 */
export default function CallerIdSelect({ className = "" }) {
  const voice = useHoppwhistleVoice();
  if (!voice.isRegistered) return null;

  if (voice.callerIds.length === 0) {
    return (
      <p className={`font-mono text-[9px] tracking-widest text-center ${className}`} style={{ color: "#8A8F98" }}>
        CALLER ID · ASSIGNED BY HOPPWHISTLE
      </p>
    );
  }

  return (
    <label className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CALLER ID</span>
      <select
        value={voice.selectedCallerId || ""}
        onChange={(e) => voice.setSelectedCallerId(e.target.value)}
        disabled={Boolean(voice.currentCall)}
        className="font-mono text-[10px] px-2 py-1 outline-none"
        style={{ background: "#05070A", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}
      >
        {voice.callerIds.map((c) => (
          <option key={c.id} value={c.number}>{formatPhoneForDisplay(c.number)}</option>
        ))}
      </select>
    </label>
  );
}
