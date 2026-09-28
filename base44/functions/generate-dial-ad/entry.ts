import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Auto-generate a "Dial Browser Audio Phone" voice ad: an LLM writes a tight
// ~25-30 second radio script, then GenerateSpeech (TTS) voices it. Returns
// the script text and a playable audio URL the advertiser can mix with a
// music bed and broadcast. User-initiated, bounded per call.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessName = String(body.businessName || "").slice(0, 80);
    const tone = String(body.tone || "energetic, confident").slice(0, 40);

    const prompt =
      `Write a punchy 25-30 second spoken radio ad script for the "Dial Browser Audio Phone" — ` +
      `a futuristic desktop communication device with a built-in touchscreen showing Voice Connect, Global Directory, ` +
      `and Dial Memory, a physical control knob with a glowing cyan-to-magenta LED ring, a docked wireless headset, ` +
      `and the "Dial Browser" brand embossed on the base. It lets anyone reach the world through a single voice call — ` +
      `no app, no Wi-Fi, no data plan needed.${businessName ? ` The sponsor is "${businessName}."` : ""} ` +
      `Tone: ${tone}. End with a short call-to-action. Output only the spoken script text (no sound-effect notes, no stage directions).`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          script: { type: "string", description: "The spoken ad script, ready for text-to-speech" }
        },
        required: ["script"]
      }
    });

    const script = (llm && typeof llm === "object" && llm.script) ? String(llm.script).slice(0, 1200) : String(llm || "").slice(0, 1200);

    const tts = await base44.asServiceRole.integrations.Core.GenerateSpeech({
      text: script,
      voice: "storm"
    });

    return Response.json({ script, audio_url: tts.url });
  } catch (error) {
    console.error('generate-dial-ad error:', error.message);
    return Response.json({ error: 'Could not generate your ad right now. Please try again.' }, { status: 500 });
  }
}