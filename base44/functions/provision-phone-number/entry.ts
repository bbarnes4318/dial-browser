import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { resolveTier, ensureEntitlement } from "../../shared/phoneMetering.ts";
import { normPhone } from "../../shared/twilioVoice.ts";

/**
 * provision-phone-number — buys a personal Twilio DID for a PAID member and
 * wires its voice / SMS / status webhooks to the softphone functions. Free
 * members are rejected (they use the shared line). Idempotent: returns the
 * existing active number if the member already has one.
 *
 * Requires the existing Twilio Account SID + Auth Token secrets (used for the
 * REST API). Costs real money on the Twilio account when a number is bought.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!me || !me.id) return Response.json({ error: "Authentication required." }, { status: 401 });

    const tier = await resolveTier(base44, me.id);
    if (tier === "free") {
      return Response.json({
        error: "A paid plan is required for a personal Dial number. Upgrade to get your own number.",
        needsUpgrade: true,
      }, { status: 402 });
    }

    const entitlement = await ensureEntitlement(base44, me.id, tier);

    // Idempotent: return existing active personal number if present.
    const existing = await base44.asServiceRole.entities.PhoneNumber.filter(
      { owner_user_id: me.id, assignment_type: "personal", status: "active" }, "-created_date", 1
    );
    if (existing && existing.length > 0) {
      return Response.json({ number: existing[0], provisioned: false });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return Response.json({ error: "Twilio not configured (missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)." }, { status: 500 });
    }

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const voiceUrl = `${base}/functions/inbound-phone-voice`;
    const smsUrl = `${base}/functions/inbound-phone-sms`;
    const statusUrl = `${base}/functions/phone-call-status`;
    const auth = btoa(`${accountSid}:${authToken}`);

    // 1. Find an available local number with voice + SMS enabled.
    const searchRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/US/Local.json?SmsEnabled=true&VoiceEnabled=true&Limit=1`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const searchData = await searchRes.json();
    if (!searchRes.ok || !searchData.available_phone_numbers || !searchData.available_phone_numbers.length) {
      console.error("provision-phone-number: no available numbers:", searchData.message || searchData);
      return Response.json({ error: "No available phone numbers to provision right now. Try again later." }, { status: 503 });
    }
    const candidate = searchData.available_phone_numbers[0].phone_number;

    // 2. Buy it and point its webhooks at the softphone functions.
    const buyParams = new URLSearchParams();
    buyParams.set("PhoneNumber", candidate);
    buyParams.set("FriendlyName", `Dial ${me.full_name || me.email || "member"}`);
    buyParams.set("VoiceUrl", voiceUrl);
    buyParams.set("VoiceMethod", "POST");
    buyParams.set("SmsUrl", smsUrl);
    buyParams.set("SmsMethod", "POST");
    buyParams.set("StatusCallback", statusUrl);

    const buyRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: buyParams.toString(),
      }
    );
    const buyData = await buyRes.json();
    if (!buyRes.ok) {
      console.error("provision-phone-number: buy failed:", buyData.message || buyData);
      return Response.json({ error: buyData.message || "Failed to purchase number." }, { status: 502 });
    }

    // 3. Persist the number record and flip the entitlement flag.
    const record = await base44.asServiceRole.entities.PhoneNumber.create({
      owner_user_id: me.id,
      owner_name: me.full_name || me.email || "member",
      number: buyData.phone_number,
      friendly_name: buyData.friendly_name || `Dial ${me.full_name || "member"}`,
      twilio_sid: buyData.sid,
      assignment_type: "personal",
      status: "active",
      region: "US",
      provisioned_at: new Date().toISOString(),
      created_by_id: me.id,
    });

    if (!entitlement.has_personal_number) {
      await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, { has_personal_number: true });
    }

    return Response.json({ number: record, provisioned: true });
  } catch (error) {
    console.error("provision-phone-number error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}