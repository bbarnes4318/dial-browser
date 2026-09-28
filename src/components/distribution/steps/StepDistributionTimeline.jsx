import React from "react";
import { TextInput, StepHeader } from "../Field";

const OPTIONS = [
  { key: "ready_now", label: "Ready Now", desc: "Launch as soon as approved" },
  { key: "30_90_days", label: "30–90 Days", desc: "Planning a release window" },
  { key: "just_price_checking", label: "Just Price Checking", desc: "Exploring options & costs" },
];

export default function StepDistributionTimeline({ data, update }) {
  return (
    <div>
      <StepHeader step="06" title="Distribution Timeline" subtitle="When should your campaign run?" />
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {OPTIONS.map((o) => {
          const on = data.campaign_timeline === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => update("campaign_timeline", o.key)}
              className="p-4 text-left transition-all"
              style={{
                background: on ? "rgba(209,255,38,0.1)" : "rgba(5,7,10,0.6)",
                border: `0.5px solid ${on ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
              }}
            >
              <p className="font-heading font-bold text-sm" style={{ color: on ? "#D1FF26" : "#F5F5F7" }}>{o.label}</p>
              <p className="text-[11px] mt-1" style={{ color: "#8A8F98" }}>{o.desc}</p>
            </button>
          );
        })}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Campaign Start Date" type="date" value={data.campaign_start_date} onChange={(v) => update("campaign_start_date", v)} />
        <TextInput label="Campaign End Date" type="date" value={data.campaign_end_date} onChange={(v) => update("campaign_end_date", v)} />
      </div>
    </div>
  );
}