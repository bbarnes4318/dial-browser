import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, ttsCost } from "../../shared/credits.ts";

const ALLOWED_VOICES = ["river", "honey", "sunny", "storm", "spark"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const text = (body.text || "").trim().slice(0, 1000);
    const voice = ALLOWED_VOICES.includes(body.voice) ? body.voice : "river";
    const language_code = (body.language_code || "en").slice(0, 5);
    if (!text) return Response.json({ error: "Missing text" }, { status: 400 });

    const auth = await requireAuthAndCredits(base44, ttsCost(text));
    if (auth.error) return auth.error;

    const res = await base44.asServiceRole.integrations.Core.GenerateSpeech({
      text,
      voice,
      language_code,
    });
    return Response.json({ url: res.url });
  } catch (error) {
    console.error("generate-voice-prompt error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});