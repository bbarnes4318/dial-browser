import React, { useState } from "react";
import { Phone, Delete, Loader2 } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export default function SoftphoneDialer({ onCall, busy }) {
  const [num, setNum] = useState("");

  const press = (k) => setNum((n) => (n.length < 18 ? n + k : n));
  const del = () => setNum((n) => n.slice(0, -1));
  const submit = () => { if (num.trim().length >= 4) onCall(num.trim()); };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full mb-4">
        <div className="flex items-center justify-between px-1 mb-2">
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>// ENTER NUMBER TO DIAL</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-3" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <input
            value={num}
            onChange={(e) => setNum(e.target.value.replace(/[^0-9+*#]/g, "").slice(0, 18))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="+1 555 000 0000"
            className="flex-1 bg-transparent outline-none font-heading font-black text-2xl text-center tracking-wide"
            style={{ color: "#F5F5F7" }}
          />
          {num && <button onClick={del} className="p-1.5" style={{ color: "#8A8F98" }}><Delete size={16} /></button>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="aspect-square flex items-center justify-center font-heading font-bold text-xl transition-all hover:bg-[rgba(209,255,38,0.08)]"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
          >
            {k}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={busy || num.trim().length < 4}
        className="mt-5 w-full max-w-[260px] flex items-center justify-center gap-2 py-3.5 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.35)] disabled:opacity-40"
        style={{ background: "#D1FF26", color: "#05070A" }}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Phone size={15} />} Call
      </button>
    </div>
  );
}