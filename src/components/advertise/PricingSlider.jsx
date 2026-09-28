import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Radio, Users, Volume2, Check } from "lucide-react";

const LIME = "#A4FF00";
const PURPLE = "#BC00FF";

// Slider maps 0..100 to a logarithmic listener reach from 1,000 to 1,000,000.
const MIN_LISTENERS = 1000;
const MAX_LISTENERS = 1000000;
const SLIDER_MIN = 0;
const SLIDER_MAX = 100;

const listenersFromSlider = (v) => {
  const t = (v - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
  // logarithmic so the low end has usable resolution
  const log = Math.log10(MIN_LISTENERS) + t * (Math.log10(MAX_LISTENERS) - Math.log10(MIN_LISTENERS));
  return Math.round(Math.pow(10, log));
};

const TIERS = [
  {
    name: "Launch",
    min: 0,
    max: 25000,
    rate: 0.08,
    color: LIME,
    blurb: "First voice broadcast — validate your script and reach early listeners.",
    includes: ["1 voice broadcast drop", "SMS receipt to opt-in contacts", "Live radio spot (1 station)"],
  },
  {
    name: "Growth",
    min: 25000,
    max: 150000,
    rate: 0.05,
    color: PURPLE,
    blurb: "Scale a proven message across regions with a volume discount.",
    includes: ["Multi-station radio rotation", "SMS broadcast (up to 50K)", "Audiobook pre-roll + social feed"],
  },
  {
    name: "Scale",
    min: 150000,
    max: Infinity,
    rate: 0.03,
    color: LIME,
    blurb: "Maximum reach — full inventory, dedicated campaign manager.",
    includes: ["All channels unlocked", "Unlimited SMS broadcast", "Premium station primetime + dating sponsor"],
  },
];

const tierFor = (listeners) => TIERS.find((t) => listeners >= t.min && listeners < t.max) || TIERS[TIERS.length - 1];

const fmt = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `${n}`;
};
const fmtMoney = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function PricingSlider() {
  const [val, setVal] = useState(38); // ~ mid slider
  const listeners = useMemo(() => listenersFromSlider(val), [val]);
  const tier = useMemo(() => tierFor(listeners), [listeners]);
  const total = useMemo(() => Math.round(listeners * tier.rate), [listeners, tier]);
  const perListener = tier.rate;

  const scrollToForm = () => {
    document.getElementById("advertise-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-14 lg:py-20 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${PURPLE}10 0%, transparent 55%)` }} />
      <div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <SlidersHorizontal size={16} style={{ color: LIME }} />
            <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: LIME }}>// VOICE BROADCAST ESTIMATOR</p>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-4xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
            Price your <span style={{ color: PURPLE }}>reach.</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#8A8F98" }}>
            Slide to set how many listeners your voice broadcast reaches. The per-listener rate drops automatically as you scale.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {TIERS.map((t) => {
            const active = tier.name === t.name;
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="p-4 transition-all"
                style={{
                  background: active ? `${t.color}12` : "rgba(16,20,29,0.5)",
                  border: `0.5px solid ${active ? `${t.color}66` : "rgba(138,143,152,0.12)"}`,
                  boxShadow: active ? `0 0 22px ${t.color}22` : "none",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-heading font-black text-lg" style={{ color: active ? t.color : "#F5F5F7" }}>{t.name}</p>
                  {active && <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: `${t.color}1a`, color: t.color, border: `0.5px solid ${t.color}66` }}>SELECTED</span>}
                </div>
                <p className="font-mono text-2xl font-black mb-1" style={{ color: t.color }}>{fmtMoney(t.rate * 1000)}<span className="text-[10px]" style={{ color: "#8A8F98" }}> /1K</span></p>
                <p className="text-[11px] mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{t.blurb}</p>
                <ul className="space-y-1.5">
                  {t.includes.map((inc) => (
                    <li key={inc} className="flex items-start gap-1.5">
                      <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: t.color }} />
                      <span className="text-[10px]" style={{ color: "#B5BAC3" }}>{inc}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Slider card */}
        <div className="p-5 lg:p-7" style={{ background: "rgba(10,13,20,0.7)", border: `0.5px solid ${LIME}25`, boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users size={13} style={{ color: LIME }} />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LISTENERS REACHED</span>
            </div>
            <span className="font-heading font-black text-xl" style={{ color: LIME }}>{fmt(listeners)}</span>
          </div>

          {/* Range slider */}
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            value={val}
            onChange={(e) => setVal(Number(e.target.value))}
            className="w-full mt-2 mb-1 accent-[#A4FF00]"
            style={{ accentColor: LIME }}
            aria-label="Listeners reached"
          />
          <div className="flex items-center justify-between font-mono text-[8px] tracking-wider" style={{ color: "#8A8F98" }}>
            <span>{fmt(MIN_LISTENERS)}</span>
            <span>{fmt(MAX_LISTENERS)}</span>
          </div>

          {/* Computed estimate */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <Stat label="ACTIVE TIER" value={tier.name} color={tier.color} />
            <Stat label="RATE / LISTENER" value={`${Math.round(perListener * 100)}¢`} color={PURPLE} />
            <Stat label="EST. CAMPAIGN TOTAL" value={fmtMoney(total)} color={LIME} highlight />
          </div>

          <div className="flex items-center justify-between gap-3 mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.12)" }}>
            <p className="text-[10px] flex items-center gap-1.5" style={{ color: "#8A8F98" }}>
              <Volume2 size={11} style={{ color: LIME }} />
              Includes voice broadcast drop + live radio spot. Final quote confirmed on application review.
            </p>
            <button onClick={scrollToForm} className="flex-shrink-0 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(164,255,0,0.3)]" style={{ background: LIME, color: "#05070A" }}>
              <Radio size={12} className="inline mr-1.5" /> Get This Rate
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, color, highlight }) {
  return (
    <div className="p-3" style={{ background: highlight ? `${color}10` : "rgba(16,20,29,0.5)", border: `0.5px solid ${color}30` }}>
      <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>{label}</p>
      <p className="font-heading font-black text-base sm:text-lg" style={{ color }}>{value}</p>
    </div>
  );
}