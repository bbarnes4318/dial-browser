import React, { useState, useEffect } from "react";
import { PhoneForwarded, Loader2, Lock, Check, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * CallForwarding — paid-member control to route inbound calls to their Dial
 * number on to a secondary phone. Toggles call_forwarding_enabled and stores
 * forward_to_number on the entitlement via the set-call-forwarding function.
 * Free members see a locked upgrade prompt.
 */
export default function CallForwarding({ entitlement, isPaid, onUpdated }) {
  const [enabled, setEnabled] = useState(!!entitlement?.call_forwarding_enabled);
  const [number, setNumber] = useState(entitlement?.forward_to_number || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setEnabled(!!entitlement?.call_forwarding_enabled);
    setNumber(entitlement?.forward_to_number || "");
  }, [entitlement]);

  const save = async (nextEnabled, nextNumber) => {
    setSaving(true); setMsg(null);
    try {
      const res = await base44.functions.invoke("set-call-forwarding", { enable: nextEnabled, forward_to: nextNumber });
      const d = res?.data || res;
      if (d?.error) { setMsg({ type: "error", text: d.error }); }
      else {
        setEnabled(!!d.call_forwarding_enabled);
        setNumber(d.forward_to_number || "");
        setMsg({ type: "ok", text: d.call_forwarding_enabled ? "Forwarding enabled." : "Forwarding off." });
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.error || e?.message || "Could not save." });
    }
    setSaving(false);
  };

  const toggle = () => {
    if (!isPaid) return;
    if (!enabled && !number.trim()) { setMsg({ type: "error", text: "Enter a number to forward to first." }); return; }
    save(!enabled, number);
  };

  return (
    <div className="p-4" style={{ background: "linear-gradient(180deg, rgba(22,25,30,0.9) 0%, rgba(12,14,17,0.9) 100%)", border: "0.5px solid rgba(66,225,246,0.25)", borderRadius: 10 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center" style={{ background: "rgba(66,225,246,0.12)", borderRadius: 4 }}>
            <PhoneForwarded size={12} style={{ color: "#42E1F6" }} />
          </div>
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#42E1F6" }}>// CALL FORWARDING</span>
        </div>
        {!isPaid && (
          <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>
            <Lock size={9} /> PAID
          </span>
        )}
      </div>

      {isPaid ? (
        <>
          <p className="text-[11px] mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            Route incoming calls to your Dial number on to any other phone. Calls forward instead of ringing the in-app softphone.
          </p>
          <div className="flex gap-2 mb-3">
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+1 555 000 1234" disabled={saving} className="flex-1 bg-transparent text-sm outline-none px-3 py-2.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }} />
            <button onClick={() => save(true, number)} disabled={saving || !number.trim()} className="px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold" style={{ background: "#42E1F6", color: "#05070A", borderRadius: 6 }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : "Save"}
            </button>
          </div>
          <button onClick={toggle} disabled={saving} className="w-full flex items-center justify-between px-3 py-2.5" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${enabled ? "rgba(66,225,246,0.5)" : "rgba(138,143,152,0.2)"}`, borderRadius: 6 }}>
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: enabled ? "#42E1F6" : "#8A8F98" }}>{enabled ? "FORWARDING ON" : "FORWARDING OFF"}</span>
            <span className="w-10 h-5 rounded-full relative transition-all" style={{ background: enabled ? "#42E1F6" : "rgba(138,143,152,0.3)" }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: enabled ? 22 : 2 }} />
            </span>
          </button>
          {msg && (
            <div className="flex items-center gap-1.5 mt-2">
              {msg.type === "ok" ? <Check size={12} style={{ color: "#D1FF26" }} /> : <AlertCircle size={12} style={{ color: "#ef4444" }} />}
              <p className="font-mono text-[9px]" style={{ color: msg.type === "ok" ? "#D1FF26" : "#ef4444" }}>{msg.text}</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-[11px]" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
          Call forwarding is a paid-member feature. <a href="/#pricing" className="underline font-bold" style={{ color: "#D1FF26" }}>Upgrade</a> to route incoming calls to another number.
        </p>
      )}
    </div>
  );
}