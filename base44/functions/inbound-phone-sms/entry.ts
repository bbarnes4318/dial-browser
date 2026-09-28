import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { normPhone } from "../../shared/twilioVoice.ts";
import { normalizeE164 } from "../../shared/phoneMetering.ts";

/**
 * inbound-phone-sms — Twilio SMS webhook for inbound SMS to a member's
 * personal Dial number. Validates the Twilio signature, resolves the owner
 * from `To`, and threads the message into their PhoneMessage history so the
 * SMS tab shows it. Returns an empty TwiML response (no auto-reply).
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const to = normPhone(params.get("To"));
    const from = normalizeE164(params.get("From"));
    const body = params.get("Body") || "";
    const messageSid = params.get("MessageSid") || "";

    const base44 = createClientFromRequest(req);
    const numbers = await base44.asServiceRole.entities.PhoneNumber.filter(
      { assignment_type: "personal", status: "active" }, "-created_date", 200
    );
    const matched = (numbers || []).find((n) => normPhone(n.number) === to);

    if (matched && matched.owner_user_id) {
      const threadId = [normalizeE164(matched.number), from].sort().join("|");
      await base44.asServiceRole.entities.PhoneMessage.create({
        owner_user_id: matched.owner_user_id,
        direction: "inbound",
        from_number: from,
        remote_number: from,
        body,
        message_sid: messageSid,
        status: "received",
        read: false,
        thread_id: threadId,
        created_by_id: matched.owner_user_id,
      });
    }

    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response/>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  } catch (error) {
    console.error("inbound-phone-sms error:", error.message);
    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response/>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  }
}