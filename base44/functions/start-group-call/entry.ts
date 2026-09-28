import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { resolveTier, ensureEntitlement, normalizeE164, resolveOutboundNumber, remainingMinutes } from "../../shared/phoneMetering.ts";
import { normalizePhone } from "../../shared/smsAuth.ts";
import { twimlEscape } from "../../shared/twilioVoice.ts";

// Per-leg minute allocation billed against the member's monthly cap when a
// group call is placed. Group-call legs don't flow through phone-call-status,
// so we meter an estimated allocation here to keep the cap meaningful. The
// remaining-minutes check uses the same estimate so an exhausted member can't
// dial an unlimited number of legs.
const PER_LEG_MINUTES = 5;
const MAX_RECIPIENTS = 25;
// Recipients must be existing contacts (age-gated) so this can't dial arbitrary
// attacker-chosen numbers — mirrors the shareVoiceNoteSms relay guard.
const MIN_CONTACT_AGE_MS = 30 * 1000;

/**
 * start-group-call — PAID-only group calling. Dials every member phone in the
 * supplied list into a named Twilio <Conference> bridge from the member's own
 * Dial number (or the shared line), each leg announced with "You are joining a
 * group call." Returns the conference name and how many legs were placed.
 *
 * Metering: every recipient must be one of the caller's own pre-existing
 * contacts, the recipient count is capped, and PER_LEG_MINUTES per leg is
 * billed against the member's monthly call-minute cap (with a remaining
 * balance check first) — so an exhausted member cannot bypass the cap.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!me || !me.id) return Response.json({ error: "Authentication required." }, { status: 401 });

    const body = await req.json();
    const rawPhones = Array.isArray(body.phones) ? body.phones : [];
    const groupName = String(body.group_name || "Group").slice(0, 40);
    if (rawPhones.length === 0) {
      return Response.json({ error: "Select at least one contact to start a group call." }, { status: 400 });
    }

    const tier = await resolveTier(base44, me.id);
    if (tier === "free") {
      return Response.json({
        error: "Group calling is a paid-member feature. Upgrade to dial everyone at once.",
        needsUpgrade: true,
      }, { status: 402 });
    }

    const entitlement = await ensureEntitlement(base44, me.id, tier);
    if (!entitlement.disclaimer_acknowledged) {
      return Response.json({ error: "Please accept the non-emergency disclaimer before starting a group call.", needsDisclaimer: true }, { status: 403 });
    }
    const fromRecord = await resolveOutboundNumber(base44, me.id, entitlement);
    if (!fromRecord || !fromRecord.number) {
      return Response.json({ error: "No outbound number is available yet. Paid members can provision a number first." }, { status: 503 });
    }

    // Recipients must be the caller's own contacts (RLS-scoped) and must have
    // existed before this request — blocks dialing arbitrary numbers.
    let myContacts = [];
    try { myContacts = await base44.entities.Contact.list("-created_date", 500); } catch { /* none */ }
    const now = Date.now();
    const allowedPhones = new Set();
    for (const c of (myContacts || [])) {
      const ph = normalizePhone(c.phone);
      if (!ph) continue;
      const created = c.created_date ? new Date(c.created_date).getTime() : 0;
      if (now - created < MIN_CONTACT_AGE_MS) continue;
      allowedPhones.add(ph);
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return Response.json({ error: "Twilio is not configured, so group calls can't be placed right now." }, { status: 503 });
    }

    // De-dupe + normalize recipient numbers, keeping only the caller's own
    // pre-existing contacts.
    const phones = [];
    const seen = new Set();
    for (const p of rawPhones) {
      const n = normalizeE164(p);
      if (!n || n.length < 7 || seen.has(n)) continue;
      if (!allowedPhones.has(n)) continue;
      seen.add(n);
      phones.push(n);
    }
    if (phones.length === 0) {
      return Response.json({ error: "Recipients must come from your own contact list (added before this call)." }, { status: 403 });
    }
    if (phones.length > MAX_RECIPIENTS) {
      return Response.json({ error: `You can dial at most ${MAX_RECIPIENTS} contacts in one group call.` }, { status: 400 });
    }

    // Cap check — the member must have enough remaining monthly minutes to
    // cover the estimated allocation for every leg.
    const estimatedMinutes = phones.length * PER_LEG_MINUTES;
    if (remainingMinutes(entitlement) < estimatedMinutes) {
      return Response.json({
        error: "You don't have enough monthly call minutes for this group call. Upgrade or buy a top-up.",
        needsUpgrade: true,
      }, { status: 402 });
    }

    const confName = `grp_${me.id}_${Date.now()}`;
    const auth = btoa(`${accountSid}:${authToken}`);
    const placed = [];

    for (const to of phones) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">You are joining a group call.</Say>
  <Dial>
    <Conference beep="true" waitUrl="" startConferenceOnEnter="true" endConferenceOnExit="false">${twimlEscape(confName)}</Conference>
  </Dial>
</Response>`;
      const params = new URLSearchParams();
      params.set("From", fromRecord.number);
      params.set("To", to);
      params.set("Twiml", twiml);
      params.set("Timeout", "30");

      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
          { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() }
        );
        const data = await res.json();
        placed.push({ to, ok: !!res.ok, sid: data.sid || "" });
        if (!res.ok) console.error("start-group-call leg failed:", to, data.message || data);
      } catch (e) {
        console.error("start-group-call leg error:", to, e.message);
        placed.push({ to, ok: false });
      }
    }

    // Meter the estimated allocation against the monthly cap for every leg we
    // actually attempted to place.
    const billedLegs = placed.length;
    if (billedLegs > 0) {
      const billedMinutes = billedLegs * PER_LEG_MINUTES;
      try {
        await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, {
          minutes_used: (entitlement.minutes_used || 0) + billedMinutes,
        });
      } catch (e) {
        console.error("start-group-call: failed to meter minutes:", e.message);
      }
    }

    return Response.json({
      ok: true,
      conference: confName,
      group_name: groupName,
      dialed: phones.length,
      billed_minutes: billedLegs * PER_LEG_MINUTES,
      placed,
    });
  } catch (error) {
    console.error("start-group-call error:", error.message);
    return Response.json({ error: "Unable to start the group call right now. Please try again." }, { status: 500 });
  }
}