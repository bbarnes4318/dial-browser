import React from "react";

// Renders a 32-dim spectral voiceprint as a bar chart. When `compare` is
// provided, overlays the second vector (cyan) against the enrolled vector
// (lime) to visualize the cosine-similarity match.
export default function FingerprintChart({ vector, compare, label, compareLabel }) {
  if (!vector || !vector.length) return null;
  const maxVal = Math.max(...vector, ...(compare || []), 0.0001);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-[2px] h-20 w-full">
        {vector.map((val, i) => {
          const h = Math.max(3, (val / maxVal) * 100);
          const ch = compare ? Math.max(3, (compare[i] / maxVal) * 100) : 0;
          return (
            <div key={i} className="relative flex-1 flex flex-col justify-end h-full">
              {compare && (
                <div
                  style={{
                    height: `${ch}%`,
                    background: "rgba(77,200,224,0.55)",
                    width: "100%",
                    position: "absolute",
                    bottom: 0,
                  }}
                />
              )}
              <div
                style={{
                  height: `${h}%`,
                  background: compare ? "#D1FF26" : "rgba(209,255,38,0.7)",
                  boxShadow: compare ? "0 0 5px rgba(209,255,38,0.5)" : "none",
                  width: "100%",
                }}
              />
            </div>
          );
        })}
      </div>
      {(label || compareLabel) && (
        <div className="flex items-center justify-between mt-2 font-mono text-[8px] tracking-widest uppercase">
          <span style={{ color: "#D1FF26" }}>{label || "ENROLLED"}</span>
          {compareLabel && <span style={{ color: "#4dc8e0" }}>{compareLabel}</span>}
        </div>
      )}
    </div>
  );
}