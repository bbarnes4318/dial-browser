import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff, Grid3x3, Volume2, User } from "lucide-react";

export default function ModernCallView({ status, muted, onMute, onHangup, onDigit, remoteNumber, incoming, onAccept, onReject }) {
  const [secs, setSecs] = useState(0);
  const [keypad, setKeypad] = useState(false);

  useEffect(() => {
    if (status !== "in-call") { setSecs(0); return; }
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const label =
    status === "incoming" ? "Incoming call" :
    status === "connecting" ? "Connecting…" :
    status === "ringing" ? "Ringing…" :
    status === "in-call" ? `${mm}:${ss}` : "";

  const initials = (remoteNumber || "?").replace(/[^A-Za-z0-9]/g, "").slice(-2).toUpperCase();

  return (
    <div className="flex flex-col items-center text-center w-full py-2">
      {/* Avatar */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-4 relative"
        style={{
          background: status === "incoming" ? "rgba(66,225,246,0.12)" : "radial-gradient(circle at 35% 30%, rgba(209,255,38,0.18) 0%, rgba(16,20,29,0.8) 70%)",
          border: `1px solid ${status === "incoming" ? "rgba(66,225,246,0.5)" : "rgba(209,255,38,0.4)"}`,
          boxShadow: status === "incoming" ? "0 0 28px rgba(66,225,246,0.3)" : "0 0 28px rgba(209,255,38,0.25)",
        }}
      >
        <span className="font-heading font-black text-2xl" style={{ color: status === "incoming" ? "#42E1F6" : "#D1FF26" }}>{initials || <User size={32} />}</span>
        {status === "ringing" && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ border: "1px solid rgba(209,255,38,0.4)" }} />
        )}
      </div>

      <p className="font-heading font-black text-2xl break-all px-4" style={{ color: "#F5F5F7" }}>{remoteNumber || "Unknown"}</p>
      <p className="font-mono text-xs tracking-widest mt-1.5" style={{ color: status === "incoming" ? "#42E1F6" : "#D1FF26" }}>// {label}</p>

      {keypad && status === "in-call" && (
        <div className="grid grid-cols-3 gap-2 mt-5 max-w-[240px] w-full">
          {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
            <button key={k} onClick={() => onDigit(k)}
              className="aspect-square flex items-center justify-center font-heading font-bold text-lg"
              style={{ background: "rgba(16,20,29,0.7)", border: "0.5px solid rgba(138,143,152,0.2)", borderRadius: "9999px", color: "#F5F5F7" }}>
              {k}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4 mt-8">
        {status === "incoming" ? (
          <>
            <button onClick={onReject} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:shadow-[0_0_24px_rgba(239,68,68,0.5)] active:scale-95"
              style={{ background: "#ef4444", color: "#fff" }}>
              <PhoneOff size={24} />
            </button>
            <button onClick={onAccept} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.5)] active:scale-95"
              style={{ background: "#D1FF26", color: "#05070A" }}>
              <Phone size={24} />
            </button>
          </>
        ) : (
          <>
            {status === "in-call" && (
              <>
                <button onClick={onMute} className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: muted ? "rgba(209,255,38,0.18)" : "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.25)", color: muted ? "#D1FF26" : "#F5F5F7" }}>
                  {muted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button onClick={() => setKeypad((v) => !v)} className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: keypad ? "rgba(209,255,38,0.18)" : "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.25)", color: keypad ? "#D1FF26" : "#F5F5F7" }}>
                  <Grid3x3 size={20} />
                </button>
              </>
            )}
            <button onClick={onHangup} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:shadow-[0_0_24px_rgba(239,68,68,0.5)] active:scale-95"
              style={{ background: "#ef4444", color: "#fff" }}>
              <PhoneOff size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}