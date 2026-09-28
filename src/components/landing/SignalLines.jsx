import React from "react";

export default function SignalLines() {
  // Reduced from 12 to 6 lines, single packet per line — cuts GPU load by ~75%
  const lines = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {lines.map((i) => {
        const direction = i % 2 === 0;
        const duration = 4 + (i % 5) * 1.2;
        const delay = i * 0.45;
        const packetDuration = 3 + (i % 4) * 0.8;
        const packetDelay = (i * 0.7) % 3;

        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${((i + 1) / 7) * 100}%`,
              background: 'linear-gradient(180deg, transparent 0%, #D1FF26 30%, #D1FF26 70%, transparent 100%)',
              opacity: 0.04,
              animation: `signalFlicker ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[2px] h-10 rounded-full"
              style={{
                background: 'linear-gradient(180deg, transparent, #D1FF26, transparent)',
                boxShadow: '0 0 8px #D1FF26, 0 0 16px rgba(209,255,38,0.5)',
                animation: `${direction ? 'dataTransmit' : 'dataTransmitReverse'} ${packetDuration}s linear infinite`,
                animationDelay: `${packetDelay}s`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}