import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, Wrench, Info, Zap, Radio } from "lucide-react";

const alertPool = [
  { id: 1, type: "maintenance", icon: Wrench, text: "SCHEDULED MAINTENANCE — Voice routing upgrade tonight 9:00–11:00 PM EST. Brief intermittent dial tones expected." },
  { id: 2, type: "announcement", icon: Info, text: "NEW — 1 CALL ARTIST™ distribution now live in 14 additional countries. Creators can onboard via *107#." },
  { id: 3, type: "outage", icon: AlertTriangle, text: "RESOLVED — Brief SMS delivery delay in West Africa region cleared at 9:32 AM EST. All channels nominal." },
  { id: 4, type: "performance", icon: Zap, text: "PERFORMANCE — Average voice latency reduced to 118ms this week, a 12% improvement over last cycle." },
  { id: 5, type: "announcement", icon: Radio, text: "SYSTEM — New AI companion 'Kai' rolled out to 100% of users. Friendship companion now available 24/7." },
  { id: 6, type: "maintenance", icon: Wrench, text: "ADVISORY — Carrier interconnect maintenance Wed 10:00 PM EST. Redundant paths active, no user impact expected." },
  { id: 7, type: "outage", icon: AlertTriangle, text: "MONITORING — Elevated retry rate detected on Atlantic submarine route. Auto-failover engaged, investigating." },
  { id: 8, type: "performance", icon: Zap, text: "METRIC — Uptime holding at 99.98% over 30-day window. Zero critical incidents this quarter." },
];

const typeStyles = {
  maintenance: { color: '#F5A623', label: 'MAINTENANCE' },
  announcement: { color: '#D1FF26', label: 'ANNOUNCEMENT' },
  outage: { color: '#FF3838', label: 'ALERT' },
  performance: { color: '#5AE0C8', label: 'PERFORMANCE' },
};

export default function NetworkAlertFeed() {
  const [alerts, setAlerts] = useState(alertPool.slice(0, 4));
  const [tick, setTick] = useState(0);
  const poolIdx = useRef(4);

  // Rotate in a new alert periodically to simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) => {
        const next = alertPool[poolIdx.current % alertPool.length];
        poolIdx.current += 1;
        return [...prev.slice(-3), next];
      });
      setTick((t) => t + 1);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // Build the scrolling string — duplicate for seamless loop
  const scrollText = alerts.map((a) => {
    const style = typeStyles[a.type];
    return `${style.label} :: ${a.text}`;
  }).join("    ◆    ");

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] overflow-hidden"
      style={{
        background: 'rgba(5,7,10,0.95)',
        borderBottom: '0.5px solid rgba(255,56,56,0.25)',
        boxShadow: '0 0 20px rgba(255,56,56,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center h-7">
        {/* Urgent badge — fixed left */}
        <div
          className="flex items-center gap-1.5 px-3 h-full flex-shrink-0 z-10"
          style={{ background: '#FF3838' }}
        >
          <AlertTriangle size={11} style={{ color: '#05070A' }} />
          <span className="font-mono text-[9px] font-bold tracking-widest" style={{ color: '#05070A' }}>
            NET ALERTS
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full ml-0.5"
            style={{ background: '#05070A', animation: 'dotPulse 1s ease-in-out infinite' }}
          />
        </div>

        {/* Scrolling feed */}
        <div className="relative flex-1 overflow-hidden h-full">
          <div
            key={tick}
            className="absolute whitespace-nowrap flex items-center h-full"
            style={{
              animation: 'tickerScroll 40s linear infinite',
            }}
          >
            <span className="font-mono text-[10px] tracking-wider px-4" style={{ color: '#F5F5F7' }}>
              {scrollText}
              <span className="px-4" style={{ color: '#FF3838' }}>◆</span>
              {scrollText}
            </span>
          </div>
        </div>

        {/* Live indicator — fixed right */}
        <div
          className="flex items-center gap-1.5 px-3 h-full flex-shrink-0 z-10"
          style={{ background: 'rgba(16,20,29,0.9)', borderLeft: '0.5px solid rgba(255,56,56,0.2)' }}
        >
          <span className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>LIVE</span>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#FF3838', animation: 'dotPulse 1.2s ease-in-out infinite' }}
          />
        </div>
      </div>
    </div>
  );
}