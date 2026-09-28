import React, { useEffect, useRef } from "react";

// Live frequency-bar waveform driven by a Web Audio AnalyserNode.
// Renders an idle baseline when no analyser is attached.
export default function LiveWaveform({ analyser, active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const drawIdle = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(209,255,38,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      // faint center tick
      ctx.fillStyle = "rgba(209,255,38,0.25)";
      ctx.fillRect(W / 2 - 1, H / 2 - 3, 2, 6);
    };

    if (!analyser || !active) {
      drawIdle();
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    const bars = 56;
    const step = Math.max(1, Math.floor(data.length / bars));
    const bw = W / bars;

    const draw = () => {
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255;
        const bh = Math.max(2, v * H * 0.92);
        const x = i * bw;
        const y = (H - bh) / 2;
        const grad = ctx.createLinearGradient(0, y, 0, y + bh);
        grad.addColorStop(0, "rgba(209,255,38,0.95)");
        grad.addColorStop(1, "rgba(209,255,38,0.25)");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(209,255,38,0.6)";
        ctx.shadowBlur = 8;
        ctx.fillRect(x + 1, y, bw - 2, bh);
      }
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, active]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={120}
      className="w-full h-auto"
      style={{ display: "block" }}
    />
  );
}