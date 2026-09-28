import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

const SCHEMA = {
  type: "object",
  properties: {
    is_match: { type: "boolean" },
    confidence: { type: "number" },
    reasoning: { type: "string" },
  },
};

// Voice biometric verification for sensitive-action guards.
//
// The enrolled voice sample and passphrase are resolved SERVER-SIDE from the
// caller's own VoiceVerification record — the client may only supply the fresh
// attempt recording. This prevents a caller from passing someone else's (or
// the same) audio as the "enrolled" sample to force a match.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.vision_llm);
    if (auth.error) return auth.error;
    const me = auth.user;

    // Resolve the caller's enrolled voiceprint from their own record.
    let enrollment = null;
    try {
      const rows = await base44.asServiceRole.entities.VoiceVerification.filter(
        { created_by_id: me.id, enrolled: true }, "-created_date", 1
      );
      if (rows && rows.length > 0) enrollment = rows[0];
    } catch (e) {
      console.error("voice-biometric-verify: enrollment lookup failed:", e.message);
    }
    if (!enrollment || !enrollment.voice_sample_url) {
      return Response.json({ error: "Voice enrollment not found. Enroll your voiceprint first." }, { status: 403 });
    }

    const body = await req.json();
    const attemptUrl = (body.attemptUrl || "").slice(0, 500);
    const action = (body.action || "").slice(0, 200);
    if (!attemptUrl) return Response.json({ error: "Missing attempt audio" }, { status: 400 });

    // Use the server-stored enrolled sample + passphrase; ignore any
    // client-supplied enrolledSampleUrl / passphrase.
    const enrolledSampleUrl = enrollment.voice_sample_url;
    const passphrase = enrollment.passphrase || "";

    const prompt = action
      ? `You are a voice biometrics security system. Compare these two audio recordings. The first is the user's enrolled voice sample. The second is a verification attempt for a sensitive action: "${action}". The passphrase is: "${passphrase}". Determine if both recordings are from the same person speaking the same passphrase.`
      : `You are a voice biometrics security system. Compare these two audio recordings. The first is the user's enrolled voice sample. The second is a new verification attempt. The user's passphrase is: "${passphrase}". Determine if both recordings appear to be from the same person speaking the same passphrase. Respond with whether it's a match and your confidence level.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [enrolledSampleUrl, attemptUrl],
      response_json_schema: SCHEMA,
    });

    // Persist last-verified timestamp on a successful match.
    if (res && res.is_match) {
      try {
        await base44.asServiceRole.entities.VoiceVerification.update(enrollment.id, {
          last_verified_at: new Date().toISOString(),
          verification_count: (enrollment.verification_count || 0) + 1,
        });
      } catch { /* non-blocking */ }
    }

    return Response.json(res);
  } catch (error) {
    console.error("voice-biometric-verify error:", error.message);
    return Response.json({ error: "Voice verification could not be completed. Please try again." }, { status: 500 });
  }
});