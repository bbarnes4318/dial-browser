import React, { useState, useEffect, useRef } from "react";
import { Loader2, Check, AlertCircle, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * GroupCallStatus — polls the group-call-status backend function and renders
 * a real-time indicator: connection-quality signal bars, a joined/total
 * progress bar, and a confirmation when every participant has joined the
 * conference bridge.
 */
export default function GroupCallStatus({ conference, expected }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!conference) return;
    let cancelled = false;
    let intervalId = null;
    let maxTimer = null;

    const stop = () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      if (maxTimer) { clearTimeout(maxTimer); maxTimer = null; }
    };

    const poll = async () => {
      try {
        const res = await base44.functions.invoke("group-call-status", { conference, expected });
        if (cancelled) return;
        const d = res?.data || res;
        if (d?.error) { setError(d.error); stop(); return; }
        setStatus(d);
        if (d.allJoined) { setDone(true); stop(); }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || e?.message || "Status unavailable");
      }
    };

    poll();
    intervalId = setInterval(poll, 3000);
    maxTimer = setTimeout(stop, 120000);

    return () => { cancelled = true; stop(); };
  }, [conference, expected]);

  if (!conference) return null;

  const total = status?.totalDialed || expected || 0;
  const joined = status?.joined || 0;
  const ringing = status?.ringing || 0;
  const failed = status?.failed || 0;
  const quality = status?.quality || (joined > 0 ? "fair" : "poor");

  const qualityBars = { excellent: 4, good: 3, fair: 2, poor: 1 }[quality] || 1;
  const qualityColor = { excellent: "#D1FF26", good: "#D1FF26", fair: "#fb923c", poor: "#ef4444" }[quality] || "#8A8F98";
  const pct = total > 0 ? Math.min(100, Math.round((joined / total) * 100)) : 0;

  return (
    <div className="mt-3 p-3" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${done ? "rgba(209,255,38,0.5)" : "rgba(66,225,246,0.3)"}`, borderRadius: 8 }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Users size={12} style={{ color: "#42E1F6" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#42E1F6" }}>// CONFERENCE STATUS</span>
        </div>
        <div className="flex items-end gap-0.5">
          {[1, 2, 3, 4].map((b) => (
            <span key={b} className="w-1 rounded-sm transition-all" style={{ height: 5 + b * 3, background: b <= qualityBars ? qualityColor : "rgba(138,143,152,0.2)" }} />
          ))}
          <span className="font-mono text-[8px] tracking-widest ml-1.5" style={{ color: qualityColor }}>{quality.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading font-bold text-lg leading-none" style={{ color: done ? "#D1FF26" : "#F5F5F7" }}>{joined}</span>
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>/ {total} joined</span>
        </div>
        {ringing > 0 && <span className="font-mono text-[8px] tracking-widest" style={{ color: "#42E1F6" }}>{ringing} RINGING</span>}
        {failed > 0 && <span className="font-mono text-[8px] tracking-widest" style={{ color: "#ef4444" }}>{failed} NO ANSWER</span>}
      </div>

      <div className="w-full h-1.5 rounded-full mb-2.5" style={{ background: "rgba(138,143,152,0.15)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: qualityColor }} />
      </div>

      {done ? (
        <div className="flex items-center gap-1.5">
          <Check size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>All {total} participants joined — conference active.</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-1.5">
          <AlertCircle size={12} style={{ color: "#ef4444" }} />
          <p className="font-mono text-[9px]" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Loader2 size={12} className="animate-spin" style={{ color: "#42E1F6" }} />
          <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>Waiting for participants to join…</p>
        </div>
      )}
    </div>
  );
}