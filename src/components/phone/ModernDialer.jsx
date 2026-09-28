import React, { useState } from "react";
import { Phone, Delete, Loader2, User } from "lucide-react";

const KEYS = [
  { d: "1", s: "" },
  { d: "2", s: "ABC" },
  { d: "3", s: "DEF" },
  { d: "4", s: "GHI" },
  { d: "5", s: "JKL" },
  { d: "6", s: "MNO" },
  { d: "7", s: "PQRS" },
  { d: "8", s: "TUV" },
  { d: "9", s: "WXYZ" },
  { d: "*", s: "" },
  { d: "0", s: "+" },
  { d: "#", s: "" },
];

export default function ModernDialer({ onCall, busy, onOpenContacts, canRecord }) {
  const [num, setNum] = useState("");
  const [record, setRecord] = useState(false);

  const press = (k) => setNum((n) => (n.length < 18 ? n + k : n));
  const del = () => setNum((n) => n.slice(0, -1));
  const submit = () => { if (num.trim().length >= 4) onCall(num.trim(), record); };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Display */}
      <div className="w-full text-center mb-5 min-h-[64px] flex flex-col items-center justify-center">
        <p className="font-mono text-[9px] tracking-[0.4em] mb-1" style={{ color: "#8A8F98" }}>// ENTER NUMBER</p>
        <p className="font-heading font-black text-3xl tracking-wide break-all px-2" style={{ color: num ? "#F5F5F7" : "rgba(245,245,247,0.25)" }}>
          {num || "— — —"}
        </p>
        {num && (
          <button onClick={del} className="mt-1 p-1.5" style={{ color: "#8A8F98" }}>
            <Delete size={16} />
          </button>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {KEYS.map((k) => (
          <button
            key={k.d}
            onClick={() => press(k.d)}
            className="aspect-square flex flex-col items-center justify-center transition-all active:scale-95 hover:bg-[rgba(209,255,38,0.08)]"
            style={{
              background: "radial-gradient(circle at 35% 30%, rgba(40,44,50,0.7) 0%, rgba(16,20,29,0.7) 70%)",
              border: "0.5px solid rgba(138,143,152,0.2)",
              borderRadius: "9999px",
              color: "#F5F5F7",
            }}
          >
            <span className="font-heading font-bold text-2xl leading-none">{k.d}</span>
            {k.s && <span className="font-mono text-[7px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>{k.s}</span>}
          </button>
        ))}
      </div>

      {/* Contacts quick access */}
      {onOpenContacts && (
        <button onClick={onOpenContacts} className="mb-4 flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}>
          <User size={12} /> Contacts
        </button>
      )}

      {/* Record toggle (paid members) */}
      {canRecord && (
        <button onClick={() => setRecord((r) => !r)} className="mb-4 flex items-center gap-2 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: record ? "rgba(239,68,68,0.12)" : "transparent", border: `0.5px solid ${record ? "rgba(239,68,68,0.5)" : "rgba(138,143,152,0.25)"}`, color: record ? "#ef4444" : "#8A8F98" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: record ? "#ef4444" : "#8A8F98", animation: record ? "eqBar 1s infinite" : "none" }} />
          {record ? "REC ON" : "Record"}
        </button>
      )}

      {/* Call button */}
      <button
        onClick={submit}
        disabled={busy || num.trim().length < 4}
        className="mt-6 w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all hover:shadow-[0_0_28px_rgba(209,255,38,0.4)] disabled:opacity-40 active:scale-95"
        style={{ background: "#D1FF26", color: "#05070A" }}
      >
        {busy ? <Loader2 size={26} className="animate-spin" /> : <Phone size={26} />}
      </button>
      <p className="font-mono text-[9px] tracking-widest mt-2" style={{ color: "#8A8F98" }}>CALL</p>
    </div>
  );
}