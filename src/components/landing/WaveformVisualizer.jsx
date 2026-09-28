import React, { useEffect, useRef } from "react";

const BAR_COUNT = 28;

export default function WaveformVisualizer({ analyser, active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!analyser || !active) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / BAR_COUNT;
      const gap = 2;
      const actualBarWidth = Math.max(1, barWidth - gap);

      for (let i = 0; i < BAR_COUNT; i++) {
        // Sample logarithmically for better voice frequency distribution
        const ratio = i / BAR_COUNT;
        const dataIndex = Math.min(bufferLength - 1, Math.floor(Math.pow(ratio, 1.5) * bufferLength));
        const value = dataArray[dataIndex] || 0;
        const intensity = value / 255;
        const barHeight = Math.max(2, intensity * canvas.height);

        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;

        if (intensity > 0.6) {
          ctx.fillStyle = "#D1FF26";
        } else if (intensity > 0.2) {
          ctx.fillStyle = `rgba(209,255,38,${0.4 + intensity * 0.6})`;
        } else {
          ctx.fillStyle = "rgba(209,255,38,0.15)";
        }
        ctx.fillRect(x, y, actualBarWidth, barHeight);
      }
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, active]);

  if (!analyser || !active) {
    // Render idle flatline
    return (
      <canvas ref={canvasRef} width={240} height={36} className="w-full" style={{ height: 36 }} />
    );
  }

  return (
    <canvas ref={canvasRef} width={240} height={36} className="w-full" style={{ height: 36 }} />
  );
}