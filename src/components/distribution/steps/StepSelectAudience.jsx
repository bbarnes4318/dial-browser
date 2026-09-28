import React from "react";
import { TextInput, TextArea, StepHeader } from "../Field";

export default function StepSelectAudience({ data, update }) {
  return (
    <div>
      <StepHeader step="04" title="Select Target Audience" subtitle="Define the listeners you want to reach." />
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Age Range" value={data.audience_age_range} onChange={(v) => update("audience_age_range", v)} placeholder="e.g. 18–34" />
        <TextInput label="Geographic Location" value={data.audience_location} onChange={(v) => update("audience_location", v)} />
        <TextInput label="Music Genre Preference" value={data.audience_genre} onChange={(v) => update("audience_genre", v)} />
        <TextInput label="Musical Interests" value={data.audience_interests} onChange={(v) => update("audience_interests", v)} />
      </div>
      <div className="mt-4">
        <TextInput label="Fan Demographics" value={data.fan_demographics} onChange={(v) => update("fan_demographics", v)} placeholder="Existing fans, new listeners, segments…" />
      </div>
      <div className="mt-4">
        <TextArea label="Distribution Goals" value={data.distribution_goals} onChange={(v) => update("distribution_goals", v)} placeholder="What does success look like for this campaign?" rows={3} />
      </div>
    </div>
  );
}