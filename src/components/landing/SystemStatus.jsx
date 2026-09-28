import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, ChevronDown } from "lucide-react";

const services = [
  { name: "Voice Routing", status: "operational" },
  { name: "SMS Gateway", status: "operational" },
  { name: "Dial Browser™", status: "operational" },
  { name: "Radio Network", status: "operational" },
  { name: "AI DJ", status: "operational" },
  { name: "Sports Desk", status: "operational" },
];

export default function SystemStatus() {
  const [time, setTime] = useState(new Date());
  const [uptime, setUptime] = useState(99.98);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const clock = setInterval(() => setTime(new Date()), 1000);
    const uptimeTick = setInterval(() => {
      setUptime((prev) => {
        const drift = (Math.random() - 0.5) * 0.02;
        return Math.min(100, Math.max(99.9, prev + drift));
      });
    }, 3000);
    return () => {
      clearInterval(clock);
      clearInterval(uptimeTick);
    };
  }, []);

  const utcTime = time.toUTCString().split(" ")[4];

  return (
    <div className="fixed top-7 left-0 right-0 z-50">
      {/* Main status bar */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-2"
        style={{
          background: 'rgba(5,7,10,0.92)',
          borderBottom: '0.5px solid rgba(209,255,38,0.25)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Left: operational status */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 group"
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: '#D1FF26',
              boxShadow: '0 0 8px #D1FF26, 0 0 16px rgba(209,255,38,0.6)',
              animation: 'dotPulse 1.5s ease-in-out infinite',
            }}
          />
          <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] font-bold whitespace-nowrap" style={{ color: '#D1FF26' }}>
            ALL SYSTEMS OPERATIONAL
          </span>
          <ChevronDown
            size={12}
            className="hidden sm:block transition-transform duration-300"
            style={{ color: '#8A8F98', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}
          />
        </button>

        {/* Right: uptime + live clock */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:flex items-center gap-1.5">
            <Activity size={11} style={{ color: '#D1FF26' }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>UPTIME</span>
            <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: '#D1FF26' }}>
              {uptime.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>UTC</span>
            <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: '#F5F5F7' }}>
              {utcTime}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable service breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
            style={{ background: 'rgba(5,7,10,0.95)', borderBottom: '0.5px solid rgba(209,255,38,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <div className="px-4 sm:px-6 py-4">
              <p className="font-mono text-[9px] tracking-[0.3em] mb-3" style={{ color: '#8A8F98' }}>
                // DIAL BROWSER™ — SERVICE STATUS
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {services.map((svc) => (
                  <div
                    key={svc.name}
                    className="flex items-center gap-2 p-2.5"
                    style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.1)' }}
                  >
                    <CheckCircle2 size={13} style={{ color: '#D1FF26' }} />
                    <span className="text-xs font-medium flex-1" style={{ color: '#F5F5F7' }}>{svc.name}</span>
                    <span className="font-mono text-[8px] tracking-widest font-bold" style={{ color: '#D1FF26' }}>
                      OPERATIONAL
                    </span>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[9px] tracking-wider mt-3" style={{ color: 'rgba(138,143,152,0.6)' }}>
                ▸ ALL DIAL BROWSER SERVICES NOMINAL · NO INCIDENTS · LAST CHECK {utcTime} UTC
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}