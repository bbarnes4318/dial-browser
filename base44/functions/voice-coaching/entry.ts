import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

const SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    feedback: { type: "string" },
    tip: { type: "string" },
    passed: { type: "boolean" },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.llm);
    if (auth.error) return auth.error;
    const body = await req.json();
    const target = (body.target || "").slice(0, 500);
    const spoken = (body.spoken || "").slice(0, 500);
    const accuracy = Number(body.accuracy) || 0;
    if (!target || !spoken) return Response.json({ error: "Missing target or spoken" }, { status: 400 });

    const prompt = `You are a voice coaching system for a phone-based service platform called 1 Call Away. A user practiced saying the phrase: "${target}". The speech recognition captured: "${spoken}". Word match accuracy: ${accuracy}%. Give brief, encouraging feedback on their pronunciation and clarity (under 2 sentences). If they missed or garbled words, note what to improve. Set a clarity score 0-100, whether they passed (70+), and a specific improvement tip if needed.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA,
    });
    return Response.json(res);
  } catch (error) {
    console.error("voice-coaching error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});