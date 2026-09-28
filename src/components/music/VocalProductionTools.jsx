import React from "react";
import { Sliders, Headphones, Zap } from "lucide-react";

/**
 * VocalProductionTools — UI panel for real-time vocal effects:
 * input gain, 3-band EQ, compressor, and reverb.
 * Parent manages the Web Audio API chain; this component just renders
 * sliders/toggles and calls back with parameter changes.
 */

const EffectSlider = ({ label, value, min, max, step, onChange, unit }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</span>
      <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>
        {value > 0 && unit === "dB" ? `+${value}` : value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 cursor-pointer"
      style={{ accentColor: "#D1FF26" }}
    />
  </div>
);

const PRESETS = [
  { label: "VOCAL", preset: { inputGain: 1.2, lowGain: -2, midGain: 3, highGain: 2, compThreshold: -24, compRatio: 4, reverbMix: 0.15 } },
  { label: "RAP", preset: { inputGain: 1.5, lowGain: 3, midGain: -1, highGain: 1, compThreshold: -20, compRatio: 6, reverbMix: 0.05 } },
  { label: "BALLAD", preset: { inputGain: 1.0, lowGain: -1, midGain: 2, highGain: 4, compThreshold: -28, compRatio: 3, reverbMix: 0.3 } },
  { label: "RESET", preset: { inputGain: 1.0, lowGain: 0, midGain: 0, highGain: 0, compThreshold: -24, compRatio: 4, reverbMix: 0 } },
];

export default function VocalProductionTools({ effects, onEffectChange, monitor, onMonitorToggle }) {
  return (
    <div className="mt-4 p-4" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={12} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>▸ VOCAL PRODUCTION TOOLS</span>
      </div>

      <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Shape your vocal sound in real time. Adjust gain, EQ, compression, and reverb for studio-quality recordings.
      </p>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        <EffectSlider label="INPUT GAIN" value={effects.inputGain} min={0} max={3} step={0.1} onChange={(v) => onEffectChange("inputGain", v)} unit="x" />
        <EffectSlider label="REVERB MIX" value={effects.reverbMix} min={0} max={1} step={0.05} onChange={(v) => onEffectChange("reverbMix", v)} unit="" />

        <EffectSlider label="LOW EQ (BASS)" value={effects.lowGain} min={-12} max={12} step={1} onChange={(v) => onEffectChange("lowGain", v)} unit="dB" />
        <EffectSlider label="MID EQ (PRESENCE)" value={effects.midGain} min={-12} max={12} step={1} onChange={(v) => onEffectChange("midGain", v)} unit="dB" />
        <EffectSlider label="HIGH EQ (AIR)" value={effects.highGain} min={-12} max={12} step={1} onChange={(v) => onEffectChange("highGain", v)} unit="dB" />

        <EffectSlider label="COMP THRESHOLD" value={effects.compThreshold} min={-60} max={0} step={1} onChange={(v) => onEffectChange("compThreshold", v)} unit="dB" />
        <EffectSlider label="COMP RATIO" value={effects.compRatio} min={1} max={20} step={1} onChange={(v) => onEffectChange("compRatio", v)} unit=":1" />
      </div>

      {/* Presets */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 mr-1">
          <Zap size={10} style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>PRESETS:</span>
        </div>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => Object.entries(p.preset).forEach(([k, v]) => onEffectChange(k, v))}
            className="px-3 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]"
            style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Monitor toggle */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={onMonitorToggle}
          className="flex items-center gap-2 px-3 py-2 font-mono text-[8px] tracking-widest uppercase transition-all"
          style={{
            background: monitor ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)",
            border: `0.5px solid ${monitor ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.2)"}`,
            color: monitor ? "#D1FF26" : "#8A8F98",
          }}
        >
          <Headphones size={10} /> MONITOR {monitor ? "ON" : "OFF"}
        </button>
        {monitor && (
          <span className="font-mono text-[8px]" style={{ color: "#F5A623" }}>⚠ Use headphones to avoid feedback</span>
        )}
      </div>
    </div>
  );
}