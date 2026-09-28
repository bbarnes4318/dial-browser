import React, { useRef, useEffect } from "react";

/**
 * LiveEqualizer — frequency bars driven in real-time by a Web Audio
 * AnalyserNode. Updates bar heights directly via refs inside a rAF loop so
 * the parent component never re-renders at 60fps.
 *
 * When no analyser is available (idle / cross-origin tainted), bars rest at a
 * low idle height.
 *
 * @param {AnalyserNode|null} analyser
 * @param {string} color — bar color
 * @param {number} bars — number of bars (default 7)
 * @param {number} heightPx — bar container height in px (default 14)
 */
export default function LiveEqualizer({ analyser, color = "#D1FF26", bars = 7, heightPx = 14 }) {
  const barRefs = useRef([]);
  const idleRef = useRef(true);

  // Mark idle when there's no analyser; used to drop bars to rest height.
  useEffect(() => {
    idleRef.current = !analyser;
    if (!analyser) {
      for (let i = 0; i < bars; i++) {
        const el = barRefs.current[i];
        if (el) el.style.height = "18%";
      }
    }
  }, [analyser, bars]);

  useEffect(() => {
    if (!analyser) return;
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    let raf;
    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      const step = Math.floor(buffer.length / bars) || 1;
      for (let i = 0; i < bars; i++) {
        // average a small slice of bins per bar for a smoother shape
        let sum = 0;
        for (let j = 0; j < step; j++) sum += buffer[i * step + j] || 0;
        const v = sum / step;
        const el = barRefs.current[i];
        if (el) {
          const pct = Math.max(14, Math.min(100, (v / 255) * 100));
          el.style.height = `${pct}%`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [analyser, bars]);

  return (
    <div className="flex items-end gap-0.5" style={{ height: heightPx }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barRefs.current[i] = el; }}
          className="w-0.5 rounded-full"
          style={{
            background: color,
            height: "18%",
            transition: "height 0.08s linear",
            opacity: 0.95,
          }}
        />
      ))}
    </div>
  );
}