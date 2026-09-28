import React from "react";
import { TextInput, StepHeader } from "../Field";

const PRESETS = [500, 1000, 2500, 5000, 10000, 25000];

export default function StepCampaignBudget({ data, update }) {
  return (
    <div>
      <StepHeader step="05" title="Campaign Budget" subtitle="Set the budget for your distribution campaign." />
      <div className="flex flex-wrap gap-2 mb-5">
        {PRESETS.map((p) => {
          const on = Number(data.campaign_budget) === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => update("campaign_budget", p)}
              className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all"
              style={{
                background: on ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.6)",
                border: `0.5px solid ${on ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                color: on ? "#D1FF26" : "#8A8F98",
              }}
            >
              ${p.toLocaleString()}
            </button>
          );
        })}
      </div>
      <TextInput
        label="Custom Budget (USD)"
        type="number"
        value={data.campaign_budget || ""}
        onChange={(v) => update("campaign_budget", Number(v) || 0)}
        placeholder="Enter amount"
      />
      <p className="font-mono text-[9px] mt-3" style={{ color: "#5a5f68" }}>
        Final pricing depends on campaign scope, channels selected, and eligibility review.
      </p>
    </div>
  );
}