import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { ensureEntitlement, resolveTier, remainingMinutes } from "../../shared/phoneMetering.ts";

/**
 * mint-voice-token — mints a per-member Twilio Voice access token (JWT) the
 * browser @twilio/voice-sdk uses to register as a softphone client and place
 * real outbound PSTN calls. The token is signed with the Twilio API Key
 * secret (NOT the account auth token) and scoped to the member's identity.
 *
 * Requires these secrets (configure them in dashboard → Secrets when ready):
 *   TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_VOICE_APP_SID
 * Until they are set the function returns a clear "voice not configured"
 * payload so the UI can show the setup state instead of crashing.
 *
 * Also enforces the monthly call-minute cap before minting.
 */
function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!me || !me.id) return Response.json({ error: "Authentication required." }, { status: 401 });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const appSid = process.env.TWILIO_VOICE_APP_SID;

    if (!accountSid || !apiKeySid || !apiKeySecret || !appSid) {
      return Response.json({
        error: "Twilio Voice is not configured. Ask the app owner to set TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_VOICE_APP_SID.",
        voiceConfigured: false,
      }, { status: 503 });
    }

    const tier = await resolveTier(base44, me.id);
    const entitlement = await ensureEntitlement(base44, me.id, tier);

    if (!entitlement.disclaimer_acknowledged) {
      return Response.json({ error: "Please accept the non-emergency disclaimer before placing a call.", needsDisclaimer: true }, { status: 403 });
    }
    if (remainingMinutes(entitlement) <= 0) {
      return Response.json({ error: "You've used your free monthly call minutes. Upgrade or buy a top-up to keep calling.", needsUpgrade: true }, { status: 402 });
    }

    const clientIdentity = `member_${me.id}`;
    const now = Math.floor(Date.now() / 1000);
    const header = { typ: "JWT", alg: "HS256", cty: "twilio-fpa;v=1.1" };
    const payload = {
      jti: crypto.randomUUID(),
      iss: apiKeySid,
      sub: accountSid,
      iat: now,
      exp: now + 3600,
      grants: {
        identity: clientIdentity,
        voice: { incoming: { allow: true }, outgoing: { application_sid: appSid } },
      },
    };

    const enc = new TextEncoder();
    const headerB = b64url(JSON.stringify(header));
    const payloadB = b64url(JSON.stringify(payload));
    const signingInput = `${headerB}.${payloadB}`;
    const key = await crypto.subtle.importKey("raw", enc.encode(apiKeySecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
    const token = `${signingInput}.${b64url(new Uint8Array(sig))}`;

    return Response.json({
      token,
      clientIdentity,
      voiceConfigured: true,
      remainingMinutes: remainingMinutes(entitlement),
    });
  } catch (error) {
    console.error("mint-voice-token error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}