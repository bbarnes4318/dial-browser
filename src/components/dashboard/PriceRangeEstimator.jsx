import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, DollarSign, Zap, Layers, ChevronRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const CATEGORIES = [
  { id: "medical", label: "Medical Visit", icon: "🩺", base: 80, dial: "*301#" },
  { id: "weather", label: "Weather Alert", icon: "🌤️", base: 2, dial: "*200#" },
  { id: "jobs", label: "Job Matching", icon: "💼", base: 10, dial: "*800#" },
];

const COMPLEXITY_LABELS = ["Basic", "Standard", "Advanced", "Premium"];
const URGENCY_LABELS = ["Flexible", "This Week", "Same Day", "Emergency"];

export default function PriceRangeEstimator() {
  const [categoryId, setCategoryId] = useState("medical");
  const [complexity, setComplexity] = useState(1);
  const [urgency, setUrgency] = useState(1);

  const category = CATEGORIES.find((c) => c.id === categoryId);

  const estimate = useMemo(() => {
    const base = category.base;
    const complexityMult = [0.7, 1, 1.6, 2.5][complexity];
    const urgencyMult = [0.9, 1.1, 1.5, 2.2][urgency];
    const low = Math.round((base * complexityMult * urgencyMult * 0.85) * 100) / 100;
    const high = Math.round((base * complexityMult * urgencyMult * 1.25) * 100) / 100;
    return { low, high };
  }, [category, complexity, urgency]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 p-5 lg:p-6"
      style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 0 30px rgba(209,255,38,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div style={{ animation: "phosphorPulse 2.5s ease-in-out infinite" }}>
          <Calculator size={15} style={{ color: "#D1FF26" }} />
        </div>
        <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// PRICE RANGE ESTIMATOR</p>
      </div>
      <h2 className="font-heading font-black text-2xl lg:text-3xl mb-2" style={{ color: "#F5F5F7" }}>
        Instant <span style={{ color: "#D1FF26" }}>Cost Preview</span>
      </h2>
      <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Select a service category and adjust the sliders to get an estimated price range before you call.
      </p>

      {/* Category selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        {CATEGORIES.map((cat) => {
          const isActive = categoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className="flex items-center gap-1.5 px-3 py-2.5 font-mono text-[8px] tracking-widest uppercase whitespace-nowrap transition-all"
              style={{
                background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                color: isActive ? "#D1FF26" : "#8A8F98",
              }}
            >
              <span className="text-sm">{cat.icon}</span> {cat.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6">
          {/* Complexity slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>COMPLEXITY</p>
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: "#D1FF26" }}>{COMPLEXITY_LABELS[complexity]}</span>
            </div>
            <div className="px-1">
              <Slider
                value={[complexity]}
                onValueChange={(v) => setComplexity(v[0])}
                min={0}
                max={3}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between mt-2">
              {COMPLEXITY_LABELS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setComplexity(i)}
                  className="font-mono text-[7px] tracking-widest transition-all"
                  style={{ color: complexity === i ? "#D1FF26" : "rgba(138,143,152,0.4)" }}
                >
                  {label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>URGENCY</p>
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: "#D1FF26" }}>{URGENCY_LABELS[urgency]}</span>
            </div>
            <div className="px-1">
              <Slider
                value={[urgency]}
                onValueChange={(v) => setUrgency(v[0])}
                min={0}
                max={3}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between mt-2">
              {URGENCY_LABELS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setUrgency(i)}
                  className="font-mono text-[7px] tracking-widest transition-all"
                  style={{ color: urgency === i ? "#D1FF26" : "rgba(138,143,152,0.4)" }}
                >
                  {label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output panel */}
        <motion.div
          key={`${categoryId}-${complexity}-${urgency}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="p-5 flex flex-col justify-center"
          style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.2)", boxShadow: "inset 0 0 30px rgba(209,255,38,0.04)" }}
        >
          <p className="font-mono text-[8px] tracking-widest mb-3 text-center" style={{ color: "#8A8F98" }}>
            ESTIMATED RANGE · {category.label.toUpperCase()}
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <DollarSign size={20} style={{ color: "#D1FF26" }} />
            <motion.span
              key={estimate.low}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading font-black text-3xl"
              style={{ color: "#D1FF26", textShadow: "0 0 20px rgba(209,255,38,0.3)" }}
            >
              ${estimate.low.toFixed(2)}
            </motion.span>
            <span className="font-mono text-lg mx-1" style={{ color: "#8A8F98" }}>—</span>
            <motion.span
              key={estimate.high}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading font-black text-3xl"
              style={{ color: "#D1FF26", textShadow: "0 0 20px rgba(209,255,38,0.3)" }}
            >
              ${estimate.high.toFixed(2)}
            </motion.span>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#8A8F98" }}>
              {COMPLEXITY_LABELS[complexity].toUpperCase()}
            </span>
            <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#8A8F98" }}>
              {URGENCY_LABELS[urgency].toUpperCase()}
            </span>
          </div>
          <a
            href={`tel:${category.dial}`}
            className="mt-5 flex items-center justify-center gap-2 py-3 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            Dial {category.dial} <ChevronRight size={12} />
          </a>
          <p className="font-mono text-[7px] tracking-widest text-center mt-2" style={{ color: "rgba(138,143,152,0.5)" }}>
            ESTIMATE ONLY · ACTUAL PRICING MAY VARY
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}