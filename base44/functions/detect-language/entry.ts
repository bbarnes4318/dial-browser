import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from '../../shared/credits.ts';

// detect-language — AI language identification from a spoken transcript.
// The recognizer captures speech in the browser, sends the transcript here,
// and the LLM returns the ISO 639-1 code + names so the client can speak a
// confirmation in the detected language before applying it.

const SCHEMA = {
  type: "object",
  properties: {
    code: { type: "string", description: "ISO 639-1 two-letter language code (lowercase), e.g. 'en', 'es', 'fr', 'zh', 'ar'. 'und' if it cannot be determined." },
    name: { type: "string", description: "English name of the detected language, e.g. 'English', 'Spanish', 'Chinese'." },
    native: { type: "string", description: "Native name of the detected language in its own script, e.g. 'English', 'Español', '中文', 'العربية'." },
    confidence: { type: "number", description: "Confidence score from 0 to 1." },
  },
  required: ["code", "name", "native"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const transcript = (body?.transcript || "").toString().trim().slice(0, 200);

    if (!transcript || transcript.length < 2) {
      return Response.json({ error: "Transcript too short to identify" }, { status: 400 });
    }

    const prompt = `Identify the spoken language of this voice transcription. The transcript may be rough or partial — identify the MOST LIKELY language anyway from word shapes, accents, and characters. Return its ISO 639-1 two-letter code (lowercase), its English name, and its native name in its own script. Transcription: "${transcript}"`;

    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.llm);
    if ("error" in auth) return auth.error;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA,
    });

    return Response.json(res);
  } catch (error) {
    console.error("detect-language error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});