import React from "react";
import { Switch } from "@/components/ui/switch";
import { TextInput, StepHeader } from "../Field";

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div>
        <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#F5F5F7" }}>{label}</p>
        <p className="text-[11px]" style={{ color: "#8A8F98" }}>{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function StepSocialMedia({ data, update }) {
  return (
    <div>
      <StepHeader step="07" title="Social Media & Campaign Channels" subtitle="Connect your channels and finalize campaign options." />
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Instagram Handle" value={data.instagram_handle} onChange={(v) => update("instagram_handle", v)} placeholder="@yourhandle" />
        <TextInput label="Other Social Links" value={data.other_social_links} onChange={(v) => update("other_social_links", v)} placeholder="TikTok, X, YouTube…" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <ToggleRow label="SMS Campaign" desc="Music & video links via SMS" checked={!!data.sms_campaign} onChange={(v) => update("sms_campaign", v)} />
        <ToggleRow label="Email Campaign" desc="Promote to the email network" checked={!!data.email_campaign} onChange={(v) => update("email_campaign", v)} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <TextInput label="Concert Ticket URL" value={data.concert_ticket_url} onChange={(v) => update("concert_ticket_url", v)} />
        <TextInput label="Merchandise URL" value={data.merchandise_url} onChange={(v) => update("merchandise_url", v)} />
        <TextInput label="Live Stream URL" value={data.live_stream_url} onChange={(v) => update("live_stream_url", v)} />
      </div>
      <p className="font-mono text-[9px] mt-4" style={{ color: "#5a5f68" }}>
        Review everything, then submit — your application will be reviewed for distribution eligibility.
      </p>
    </div>
  );
}