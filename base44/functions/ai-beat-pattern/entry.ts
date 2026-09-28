import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

const SYNTHS = ["sine", "square", "sawtooth", "triangle"];

const SCHEMA = {
  type: "object",
  properties: {
    bpm: { type: "number", description: "Tempo in BPM (60-180)" },
    synth_type: { type: "string", enum: SYNTHS, description: "Synthesizer waveform for melody" },
    kick: { type: "array", items: { type: "number" } },
    snare: { type: "array", items: { type: "number" } },
    hihat: { type: "array", items: { type: "number" } },
    clap: { type: "array", items: { type: "number" } },
    tom: { type: "array", items: { type: "number" } },
    crash: { type: "array", items: { type: "number" } },
    bass: { type: "array", items: { type: "number" } },
    rim: { type: "array", items: { type: "number" } },
  },
  required: ["bpm", "synth_type"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.llm);
    if (auth.error) return auth.error;
    const body = await req.json();
    const description = (body.description || "").trim().slice(0, 500);
    if (!description) return Response.json({ error: "Missing description" }, { status: 400 });

    const prompt = `You are an AI beat producer. A user described the beat or song they want. Generate a step sequencer pattern that matches their description.

The sequencer has 16 steps (indices 0-15). Each drum pad is a separate field in the JSON — set it to an array of step indices where that drum should hit. Omit or leave empty arrays for pads that should not play.

Drum pads: kick, snare, hihat, clap, tom, crash, bass, rim.

User's description: "${description}"

Guidelines:
- Step 0 is the downbeat. Kick usually goes on 0, 4, 8, 12 for a four-on-the-floor.
- Snare typically on 4 and 12.
- Hi-hats can be on every step or every other step for fast patterns.
- Keep patterns musical — don't overcrowd. Usually 3-5 pads active.
- Match BPM and intensity to the user's description (e.g., trap = 140-160, lo-fi = 70-90, dance = 120-130).
- All step indices must be integers from 0 to 15.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA,
    });
    return Response.json(res);
  } catch (error) {
    console.error("ai-beat-pattern error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});