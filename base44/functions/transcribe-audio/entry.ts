import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.transcribe);
    if (auth.error) return auth.error;
    const body = await req.json();
    const audio_url = (body.audio_url || "").slice(0, 1000);
    if (!audio_url) return Response.json({ error: "Missing audio_url" }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url });
    const transcript = typeof result === "string"
      ? result
      : (result?.transcript || result?.text || "");
    return Response.json({ transcript });
  } catch (error) {
    console.error("transcribe-audio error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});