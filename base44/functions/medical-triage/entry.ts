import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

const SCHEMA = {
  type: "object",
  properties: {
    urgency_level: { type: "string", enum: ["low", "moderate", "high", "emergency"] },
    possible_conditions: { type: "array", items: { type: "string" } },
    recommended_action: { type: "string" },
    home_remedies: { type: "array", items: { type: "string" } },
    see_doctor_within: { type: "string" },
    disclaimer: { type: "string" },
    audio_url: { type: "string" },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.llm);
    if (auth.error) return auth.error;
    const body = await req.json();
    const service_title = (body.service_title || "").slice(0, 100);
    const input = (body.input || "").trim().slice(0, 2000);
    if (!input) return Response.json({ error: "Missing input" }, { status: 400 });

    const prompt = `You are a general wellness information assistant for "1 Call Away". A member described: "${input}" under the service "${service_title}".

IMPORTANT: You are NOT a doctor. You must NOT diagnose, identify possible conditions, suggest treatments, or recommend home remedies.

Respond with ONLY the following:
- urgency_level: a general sense of how promptly the member might consider speaking with a licensed clinician (low / moderate / high / emergency). Use "emergency" only when the member may need immediate care — then instruct them to call their local emergency number (e.g. 911) right away.
- possible_conditions: ALWAYS an empty array. Never speculate on conditions.
- home_remedies: ALWAYS an empty array. Never suggest remedies or treatments.
- recommended_action: general, non-medical guidance — encourage the member to contact a licensed healthcare professional for any actual assessment. For anything urgent or serious, tell them to call their local emergency number (e.g. 911) immediately.
- see_doctor_within: a general, non-binding suggestion of how soon to consider speaking with a clinician (e.g. "Consider speaking with a clinician soon" or "For urgent symptoms, seek care immediately").
- disclaimer: state clearly that this is general information, not medical advice or a diagnosis, and not a substitute for a licensed clinician.

Never name specific diseases, conditions, or treatments.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA,
    });
    // Generate a natural, human-sounding voiceover of the general guidance
    let audio_url = "";
    if (res?.recommended_action) {
      try {
        const speech = await base44.asServiceRole.integrations.Core.GenerateSpeech({
          text: res.recommended_action.slice(0, 5000),
          voice: "honey",
        });
        audio_url = speech?.url || "";
      } catch (e) {
        console.error("medical-triage speech error:", e.message);
      }
    }
    return Response.json({ ...res, audio_url });
  } catch (error) {
    console.error("medical-triage error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});