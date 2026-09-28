import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff, Grid3x3, X } from "lucide-react";

export default function SoftphoneCallView({ status, muted, onMute, onHangup, onDigit, remoteNumber, incoming }) {
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

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ background: status === "incoming" ? "rgba(66,225,246,0.12)" : "rgba(209,255,38,0.12)", border: `0.5px solid ${status === "incoming" ? "rgba(66,225,246,0.5)" : "rgba(209,255,38,0.5)"}` }}>
        <Phone size={30} style={{ color: status === "incoming" ? "#42E1F6" : "#D1FF26" }} />
      </div>
      <p className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{remoteNumber || "Unknown"}</p>
      <p className="font-mono text-xs tracking-widest mt-1" style={{ color: status === "incoming" ? "#42E1F6" : "#D1FF26" }}>// {label}</p>

      {keypad && status === "in-call" && (
        <div className="grid grid-cols-3 gap-2 mt-5 max-w-[240px]">
          {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
            <button key={k} onClick={() => onDigit(k)}
              className="aspect-square flex items-center justify-center font-heading font-bold text-lg"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}>
              {k}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-7">
        {status === "in-call" && (
          <>
            <button onClick={onMute} className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
              style={{ background: muted ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.7)", border: "0.5px solid rgba(138,143,152,0.25)", color: muted ? "#D1FF26" : "#F5F5F7" }}>
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button onClick={() => setKeypad((v) => !v)} className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
              style={{ background: keypad ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.7)", border: "0.5px solid rgba(138,143,152,0.25)", color: keypad ? "#D1FF26" : "#F5F5F7" }}>
              <Grid3x3 size={20} />
            </button>
          </>
        )}
        <button onClick={onHangup} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:shadow-[0_0_24px_rgba(239,68,68,0.4)]"
          style={{ background: "#ef4444", color: "#fff" }}>
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}