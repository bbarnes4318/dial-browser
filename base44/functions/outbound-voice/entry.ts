import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { twimlEscape } from "../../shared/twilioVoice.ts";
import { normalizeE164 } from "../../shared/phoneMetering.ts";

/**
 * outbound-voice — Twilio TwiML App voice webhook. Hit when a browser softphone
 * client (identity member_<userId>) initiates an outbound call via the Voice SDK.
 * Validates the Twilio signature, records an outbound PhoneCall log row, and
 * returns TwiML that <Dial>s the requested `To` number with the member's own
 * Dial number as the callerId so the callee sees it.
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const from = params.get("From") || "";        // client identity member_<userId>
    const to = normalizeE164(params.get("To"));
    const callSid = params.get("CallSid") || "";
    const owner = (from || "").replace(/^member_/, "");
    const record = (params.get("Record") || "").toLowerCase() === "true";

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const statusUrl = `${base}/functions/phone-call-status`;
    const recordingUrl = `${base}/functions/phone-recording-status`;

    const base44 = createClientFromRequest(req);
    let fromNumber = "";
    if (owner) {
      const nums = await base44.asServiceRole.entities.PhoneNumber.filter(
        { owner_user_id: owner, assignment_type: "personal", status: "active" }, "-created_date", 1
      );
      if (nums && nums.length) fromNumber = nums[0].number;
    }

    if (owner && to) {
      await base44.asServiceRole.entities.PhoneCall.create({
        owner_user_id: owner,
        direction: "outbound",
        from_number: fromNumber,
        to_number: to,
        remote_number: to,
        status: "connecting",
        call_sid: callSid,
        started_at: new Date().toISOString(),
        created_by_id: owner,
        recorded: record,
      });
    }

    const callerIdAttr = fromNumber ? ` callerId="${twimlEscape(fromNumber)}"` : "";
    const recordAttr = record ? ` record="record-from-answer-dual" recordingStatusCallback="${twimlEscape(recordingUrl)}"` : "";
    const announce = record ? `<Say voice="Polly.Joanna">This call is being recorded.</Say>` : "";
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${announce}
  <Dial${callerIdAttr} answerOnBridge="true"${recordAttr} statusCallbackEvent="completed" statusCallback="${twimlEscape(statusUrl)}" statusCallbackMethod="POST">
    <Number>${twimlEscape(to)}</Number>
  </Dial>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  } catch (error) {
    console.error("outbound-voice error:", error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="Polly.Joanna">Sorry, your call could not be placed.</Say></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  }
}