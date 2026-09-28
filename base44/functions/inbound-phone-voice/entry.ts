import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { normPhone, twimlEscape } from "../../shared/twilioVoice.ts";

/**
 * inbound-phone-voice — Twilio voice webhook for inbound calls to a member's
 * personal Dial number (or the shared line). Validates the Twilio signature,
 * resolves the owning member from the dialed `To` number, and:
 *   - personal number → rings the member's in-app softphone client for ~25s,
 *     then falls through to voicemail (<Record>) if they don't answer.
 *   - shared line    → routes to the existing 1 Call Away concierge (voice-answer).
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const to = normPhone(params.get("To"));
    const from = params.get("From") || "";
    const callSid = params.get("CallSid") || "";

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const statusUrl = `${base}/functions/phone-call-status`;
    const conciergeUrl = `${base}/functions/voice-answer`;

    const base44 = createClientFromRequest(req);

    const numbers = await base44.asServiceRole.entities.PhoneNumber.filter(
      { assignment_type: "personal", status: "active" }, "-created_date", 200
    );
    const matched = (numbers || []).find((n) => normPhone(n.number) === to);

    // Shared line → existing concierge flow.
    if (!matched || matched.assignment_type === "shared") {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${twimlEscape(conciergeUrl)}</Redirect>
</Response>`;
      return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    const owner = matched.owner_user_id;
    const clientIdentity = `member_${owner}`;

    // Call forwarding — paid members can route inbound calls to a secondary number.
    let entitlement = null;
    try {
      const ents = await base44.asServiceRole.entities.PhoneEntitlement.filter(
        { owner_user_id: owner }, "-created_date", 1
      );
      if (ents && ents.length) entitlement = ents[0];
    } catch { /* ignore */ }

    if (entitlement && entitlement.call_forwarding_enabled && entitlement.forward_to_number) {
      await base44.asServiceRole.entities.PhoneCall.create({
        owner_user_id: owner,
        direction: "inbound",
        from_number: from,
        to_number: matched.number,
        remote_number: from,
        status: "in_progress",
        call_sid: callSid,
        started_at: new Date().toISOString(),
        created_by_id: owner,
      });
      const fwdTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${twimlEscape(matched.number)}" answerOnBridge="true" statusCallbackEvent="completed" statusCallback="${twimlEscape(statusUrl)}" statusCallbackMethod="POST">
    <Number>${twimlEscape(entitlement.forward_to_number)}</Number>
  </Dial>
</Response>`;
      return new Response(fwdTwiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Record an inbound call log row.
    await base44.asServiceRole.entities.PhoneCall.create({
      owner_user_id: owner,
      direction: "inbound",
      from_number: from,
      to_number: matched.number,
      remote_number: from,
      status: "ringing",
      call_sid: callSid,
      started_at: new Date().toISOString(),
      created_by_id: owner,
    });

    const voicemailUrl = `${base}/functions/voice-status`;

    // Ring the softphone client for 25s, then voicemail if unanswered.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="25" answerOnBridge="true" statusCallbackEvent="completed" statusCallback="${twimlEscape(statusUrl)}" statusCallbackMethod="POST">
    <Client>${twimlEscape(clientIdentity)}</Client>
  </Dial>
  <Say voice="Polly.Joanna">No answer. Please leave a message after the beep.</Say>
  <Record action="${twimlEscape(voicemailUrl)}" method="POST" maxLength="60" playBeep="true" transcribe="true" transcribeCallback="${twimlEscape(voicemailUrl)}" />
  <Say voice="Polly.Joanna">Goodbye.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  } catch (error) {
    console.error("inbound-phone-voice error:", error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, we couldn't connect your call right now.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  }
}