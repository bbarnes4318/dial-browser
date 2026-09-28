import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

const SCHEMA = {
  type: "object",
  properties: {
    tips: { type: "array", items: { type: "string" } },
    encouragement: { type: "string" },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.llm);
    if (auth.error) return auth.error;

    const body = await req.json();
    const commands = Array.isArray(body.commands) ? body.commands.slice(0, 10).map((c: string) => String(c).slice(0, 200)) : [];
    const count = Number(body.count) || commands.length;
    if (commands.length === 0) return Response.json({ error: "Missing commands" }, { status: 400 });

    const prompt = `You are a voice coaching system for "1 Call Away", a phone-based digital service platform. A user has been training their voice by recording service commands. They have recorded ${count} practice commands total, including: "${commands.join('", "')}". Give them 3 personalized, encouraging tips to improve their voice recognition accuracy when using the Dial Browser. Keep each tip under 2 sentences. Focus on pronunciation, pacing, and microphone technique. Return as a JSON object with a "tips" array of strings and an "encouragement" string.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA,
    });
    return Response.json(res);
  } catch (error) {
    console.error("voice-training-tips error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});