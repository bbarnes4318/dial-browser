import React from "react";
import { TextInput, StepHeader } from "../Field";

const REGIONS = [
  "Worldwide", "North America", "United States", "Canada",
  "Latin America", "Caribbean", "Europe", "Africa", "Asia", "Australia & Oceania",
];

export default function StepSelectRegions({ data, update }) {
  const list = data.target_regions || [];
  const toggle = (r) =>
    update("target_regions", list.includes(r) ? list.filter((x) => x !== r) : [...list, r]);

  return (
    <div>
      <StepHeader step="03" title="Select Target Region" subtitle="Choose where your campaign should be distributed." />
      <div className="flex flex-wrap gap-2 mb-5">
        {REGIONS.map((r) => {
          const on = list.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => toggle(r)}
              className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all"
              style={{
                background: on ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.6)",
                border: `0.5px solid ${on ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                color: on ? "#D1FF26" : "#8A8F98",
              }}
            >
              {r}
            </button>
          );
        })}
      </div>
      <TextInput
        label="Specific Countries / Markets"
        value={data.target_countries}
        onChange={(v) => update("target_countries", v)}
        placeholder="e.g. United States, Jamaica, United Kingdom, Nigeria, Canada"
      />
    </div>
  );
}