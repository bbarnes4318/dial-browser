import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { twimlEscape, normPhone } from "../../shared/twilioVoice.ts";

/**
 * voice-answer — Twilio's inbound-voice webhook. Answers the call, speaks a
 * welcome greeting and a spoken service directory, and opens a <Gather> for
 * speech + DTMF input. The caller's digit or keyword is POSTed to
 * /functions/voice-directory, which routes to the right service handler.
 */

export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const directoryUrl = `${base}/functions/voice-directory`;
    const merchantOrderUrl = `${base}/functions/merchant-order`;

    // Forwarded merchant call → hand off to the merchant order dispatch flow.
    const params = new URLSearchParams(bodyText);
    const forwardedFrom = (params.get("ForwardedFrom") || "").trim();
    if (forwardedFrom) {
      const ff = normPhone(forwardedFrom);
      try {
        const base44 = createClientFromRequest(req);
        const merchants = await base44.asServiceRole.entities.MerchantDispatch.filter(
          { active: true },
          "-created_date",
          50
        );
        const merchant = merchants.find((m) => normPhone(m.public_phone) === ff);
        if (merchant) {
          const redirect = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${twimlEscape(merchantOrderUrl)}</Redirect>
</Response>`;
          return new Response(redirect, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
        }
      } catch (e) {
        console.error("voice-answer merchant lookup failed:", e.message);
      }
    }

    // Voice greeting + spoken service directory. Callers can say a keyword or
    // press the matching digit. "0" repeats the menu. Free-form speech that
    // doesn't match an option falls through to the open-ended concierge gather.
    const greeting =
      "Welcome to 1 Call Away. Your call, your way. " +
      "For an emergency, hang up and call your local emergency number. " +
      "To get started, say or press one of the following: " +
      "1 for Weather. 2 for Food. 3 for a Ride. 4 for a Doctor or Pharmacy. " +
      "5 for Jobs. 6 for Radio. 7 for Courses. 8 to find a local service. " +
      "9 for the AI Assistant. 0 to repeat this menu. " +
      "Or just tell me what you need in your own words.";

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech dtmf" action="${twimlEscape(directoryUrl)}" method="POST" numDigits="1" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">${twimlEscape(greeting)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Goodbye for now.</Say>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
    });
  } catch (error) {
    console.error("voice-answer error:", error.message);
    return new Response("Error", { status: 500 });
  }
}