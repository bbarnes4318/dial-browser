import React, { useState, useEffect, useRef } from "react";
import { PhoneCall, CheckCircle2, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PORTAL } from "./portalTheme";

// Live network data counter for the social portal right rail. Polls the
// voice-network-stats backend function (service-role aggregate across all
// PhoneCall rows) and renders two neon-cyberpunk stat tiles: live active
// calls and successful voice connections.
const ACTIVE_STATUSES = new Set(["connecting", "ringing", "in_progress"]);
const POLL_MS = 20000;

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatTile({ icon: Icon, label, value, accent, pulse }) {
  const display = useCountUp(value);
  const isCyan = accent === "cyan";
  const color = isCyan ? PORTAL.cyan : PORTAL.magenta;
  return (
    <div
      className="relative flex-1 px-3 py-2.5 overflow-hidden"
      style={{
        background: isCyan
          ? "linear-gradient(135deg, rgba(0,240,255,0.08), rgba(10,10,30,0.5))"
          : "linear-gradient(135deg, rgba(255,0,255,0.08), rgba(10,10,30,0.5))",
        border: `0.5px solid ${isCyan ? "rgba(0,240,255,0.28)" : "rgba(255,0,255,0.28)"}`,
        borderRadius: 8,
        boxShadow: `inset 0 0 18px ${isCyan ? "rgba(0,240,255,0.06)" : "rgba(255,0,255,0.06)"}`,
      }}
    >
      {/* scanline shimmer */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, animation: "tickerScroll 4s linear infinite", opacity: 0.5 }}
      />
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} style={{ color }} />
        <span className="font-mono text-[7px] tracking-[0.25em] uppercase" style={{ color: "#c8d8e8" }}>{label}</span>
        {pulse && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: color, animation: "dotPulse 1.4s ease-in-out infinite" }} />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-heading font-black text-2xl leading-none tabular-nums" style={{ color: "#fff", textShadow: `0 0 12px ${color}66` }}>
          {display.toLocaleString()}
        </span>
        {value >= 500 && (
          <span className="font-mono text-[8px]" style={{ color: PORTAL.muted }}>+</span>
        )}
      </div>
    </div>
  );
}

export default function PortalDataCounter() {
  const [stats, setStats] = useState({ activeCalls: 0, successfulConnections: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await base44.functions.invoke("voice-network-stats", {});
        if (!cancelled && res?.data) {
          setStats({
            activeCalls: Number(res.data.activeCalls) || 0,
            successfulConnections: Number(res.data.successfulConnections) || 0,
          });
        }
      } catch {
        /* keep last known values on error */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="p-2.5" style={{ background: "rgba(12,12,32,0.6)", border: "0.5px solid rgba(0,240,255,0.18)", borderRadius: 10 }}>
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <Activity size={10} style={{ color: PORTAL.cyan }} />
        <p className="font-mono text-[8px] tracking-[0.3em]" style={{ color: PORTAL.cyan }}>// NETWORK LIVE</p>
        <span className="ml-auto font-mono text-[7px] tracking-widest" style={{ color: PORTAL.muted }}>
          {loading ? "SYNC…" : "LIVE"}
        </span>
      </div>
      <div className="flex gap-2">
        <StatTile icon={PhoneCall} label="Active Calls" value={stats.activeCalls} accent="cyan" pulse={stats.activeCalls > 0} />
        <StatTile icon={CheckCircle2} label="Connections" value={stats.successfulConnections} accent="magenta" />
      </div>
    </div>
  );
}