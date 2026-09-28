import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { resolveTier, ensureEntitlement, remainingMinutes, normalizeE164 } from "../../shared/phoneMetering.ts";
import { normalizePhone } from "../../shared/smsAuth.ts";
import { twimlEscape } from "../../shared/twilioVoice.ts";
import { resolveRadioStream } from "../../shared/radioStations.ts";

// Per-call minute allocation reserved at placement to bound telephony spend.
// The call's Twilio TimeLimit is set to reserve*60 so a single request can
// never hold a line open beyond what was billed, and minutes_used is
// incremented immediately so an exhausted member can't sidestep the cap with
// concurrent calls before the completion callback bills.
const RADIO_BRIDGE_MAX_MINUTES = 10;
// Recipients must be existing contacts (age-gated) so this can't dial arbitrary
// attacker-chosen numbers — mirrors the start-group-call relay guard.
const MIN_CONTACT_AGE_MS = 30 * 1000;

/**
 * bridge-radio-call — bridges the web radio player to a real phone call.
 * Places an outbound Twilio call to the member's phone that <Play>s the
 * selected station's live stream URL, so they can listen over any phone
 * line (no app, no data plan).
 *
 * Security: only an allowlisted radio station may be streamed (never
 * attacker-chosen audio), the dialed number must be one of the member's own
 * pre-existing contacts (never an arbitrary victim), and a fixed minute
 * allocation is reserved against the member's cap at placement.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized", code: "auth_required" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const phone = normalizeE164(body.phone);

    // The stream is resolved from the vetted radio-station allowlist only —
    // never from a raw attacker-supplied URL. Accepts a station id or an
    // exact allowlisted stream URL.
    const station = resolveRadioStream(body.stationId || body.streamUrl);
    if (!station) {
      return Response.json({ error: "That station isn't available for phone streaming.", code: "invalid_station" }, { status: 400 });
    }
    if (!phone) return Response.json({ error: "A valid phone number is required.", code: "invalid_phone" }, { status: 400 });

    // Entitlement + disclaimer + minute cap
    const tier = await resolveTier(base44, user.id);
    const ent = await ensureEntitlement(base44, user.id, tier);
    if (!ent || !ent.disclaimer_acknowledged) {
      return Response.json({
        error: "Please accept the one-time non-emergency (no 911) disclaimer before placing a call.",
        code: "disclaimer_required",
      }, { status: 403 });
    }
    const rem = remainingMinutes(ent);
    if (rem <= 0) {
      return Response.json({
        error: "You're out of call minutes for this cycle. Upgrade your plan or add a top-up to continue.",
        code: "no_minutes",
      }, { status: 403 });
    }

    // Recipient must be the caller's own pre-existing contact (age-gated) —
    // blocks dialing arbitrary numbers for harassment / voice phishing.
    let myContacts = [];
    try { myContacts = await base44.entities.Contact.list("-created_date", 500); } catch { /* none */ }
    const now = Date.now();
    let allowed = false;
    for (const c of (myContacts || [])) {
      const ph = normalizePhone(c.phone);
      if (!ph) continue;
      const created = c.created_date ? new Date(c.created_date).getTime() : 0;
      if (now - created < MIN_CONTACT_AGE_MS) continue;
      if (ph === phone) { allowed = true; break; }
    }
    if (!allowed) {
      return Response.json({
        error: "You can only bridge radio to a number saved in your contacts. Add the number to your contacts first.",
        code: "recipient_not_contact",
      }, { status: 403 });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_VOICE_NUMBER || process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !fromNumber) {
      return Response.json({ error: "Telephony is not configured.", code: "telephony_unavailable" }, { status: 503 });
    }

    // Reserve a fixed allocation (capped to remaining minutes) and bound the
    // call duration to it so a single request can't run up unbounded spend.
    const reserve = Math.min(RADIO_BRIDGE_MAX_MINUTES, rem);

    // Build TwiML from the vetted station only — no user-controlled URL or
    // station name reaches <Play> / <Say>.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Connecting you to ${twimlEscape(station.name)} on Dial Browser Radio.</Say>
  <Play loop="0">${twimlEscape(station.streamUrl)}</Play>
</Response>`;

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const statusCallback = `${base}/functions/phone-call-status`;

    const auth = btoa(`${sid}:${token}`);
    const params = new URLSearchParams();
    params.set("From", fromNumber);
    params.set("To", phone);
    params.set("Twiml", twiml);
    params.set("TimeLimit", String(reserve * 60));
    params.set("StatusCallback", statusCallback);
    params.set("StatusCallbackEvent", "completed");
    params.set("StatusCallbackMethod", "POST");

    const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const twData = await twRes.json();

    if (!twRes.ok || !twData.sid) {
      console.error("bridge-radio-call Twilio error:", twData.message || twRes.status);
      return Response.json({
        error: twData.message || `Twilio error ${twRes.status}`,
        code: "twilio_error",
      }, { status: 502 });
    }

    // Reserve the minutes immediately so the cap can't be sidestepped with
    // concurrent calls before the completion callback bills. minutes_billed is
    // set on the PhoneCall row so phone-call-status treats this call as already
    // metered and doesn't double-bill it.
    try {
      await base44.asServiceRole.entities.PhoneEntitlement.update(ent.id, {
        minutes_used: (ent.minutes_used || 0) + reserve,
      });
    } catch (e) { console.error("bridge-radio-call: failed to reserve minutes:", e.message); }

    await base44.asServiceRole.entities.PhoneCall.create({
      owner_user_id: user.id,
      direction: "outbound",
      from_number: fromNumber,
      to_number: phone,
      remote_number: phone,
      remote_label: `${station.name} (radio bridge)`,
      status: "connecting",
      call_sid: twData.sid,
      started_at: new Date().toISOString(),
      created_by_id: user.id,
      recorded: false,
      minutes_billed: reserve,
    });

    return Response.json({ ok: true, callSid: twData.sid, stationName: station.name, reserved_minutes: reserve });
  } catch (error) {
    console.error("bridge-radio-call error:", error.message);
    return Response.json({ error: error.message || "Failed to place call." }, { status: 500 });
  }
}