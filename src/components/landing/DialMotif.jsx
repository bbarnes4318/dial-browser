import React from "react";

export default function DialMotif({ position = "left", size = 600 }) {
  const isLeft = position === "left";
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        [isLeft ? 'left' : 'right']: `-${size / 2}px`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          border: '1px solid rgba(209, 255, 38, 0.08)',
        }}
      />
      <div
        className="absolute inset-8 rounded-full"
        style={{
          border: '0.5px solid rgba(209, 255, 38, 0.05)',
        }}
      />
      <div
        className="absolute inset-16 rounded-full"
        style={{
          border: '0.5px solid rgba(209, 255, 38, 0.03)',
        }}
      />
    </div>
  );
}