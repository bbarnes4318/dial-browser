import React, { useState, useEffect, useRef } from "react";

const messages = [
  "SERVER LATENCY: LOW",
  "SIGNAL STRENGTH: OPTIMAL",
  "UPLINK: STABLE",
  "NODES ACTIVE: 1,247",
  "PACKET LOSS: 0.00%",
  "BANDWIDTH: 1.8 GHz",
  "GEO SYNC: NOMINAL",
  "ENCRYPTION: AES-256",
  "VOICE CHANNELS: 312 OPEN",
  "SMS QUEUE: CLEAR",
  "DIAL BROWSER™: ONLINE",
  "GLOBAL RELAYS: 42",
  "UPTIME: 99.998%",
  "ROUTING: OPTIMAL",
  "HANDSHAKE: VERIFIED",
  "CARRIER SYNC: ACTIVE",
];

export default function NetworkTicker() {
  const [offset, setOffset] = useState(0);
  const [pulse, setPulse] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    let lastTime = performance.now();
    const speed = 0.04; // px per ms

    const animate = (time) => {
      const delta = time - lastTime;
      lastTime = time;
      setOffset((prev) => {
        const next = prev + speed * delta;
        // Loop after one full set width
        return next >= 50 ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Periodic pulse to simulate live status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Duplicate messages for seamless loop
  const display = [...messages, ...messages];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none overflow-hidden"
      style={{
        background: 'rgba(5,7,10,0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '0.5px solid rgba(209,255,38,0.2)',
      }}
    >
      <div className="flex items-center">
        {/* Live status badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
          style={{
            background: 'rgba(209,255,38,0.08)',
            borderRight: '0.5px solid rgba(209,255,38,0.2)',
            transition: 'background 0.3s ease',
            background: pulse ? 'rgba(209,255,38,0.18)' : 'rgba(209,255,38,0.08)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#D1FF26',
              boxShadow: '0 0 6px #D1FF26',
              animation: 'dotPulse 1.2s ease-in-out infinite',
            }}
          />
          <span
            className="font-mono text-[9px] tracking-[0.25em] font-bold"
            style={{ color: '#D1FF26' }}
          >
            LIVE
          </span>
        </div>

        {/* Scrolling messages */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex items-center whitespace-nowrap"
            style={{ transform: `translateX(-${offset}%)` }}
          >
            {display.map((msg, i) => (
              <span key={i} className="flex items-center flex-shrink-0">
                <span
                  className="font-mono text-[10px] tracking-[0.15em] px-6 py-2"
                  style={{ color: i % 3 === 0 ? '#D1FF26' : '#8A8F98' }}
                >
                  {msg}
                </span>
                <span style={{ color: 'rgba(138,143,152,0.3)' }}>·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}