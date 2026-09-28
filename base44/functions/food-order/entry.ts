import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { secrets } from "base44:runtime";

function twimlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * food-order — voice-first food ordering flow. Twilio posts the caller's
 * transcribed speech here after voice-route classifies a "Food" intent.
 *
 * When no delivery provider is configured (DELIVERY_PROVIDER_API_KEY absent),
 * speaks an honest "coming soon" message and routes the call back to the
 * main voice concierge — no menus or orders are fabricated.
 *
 * When a provider IS configured, this is the seam where the live delivery
 * API (DoorDash Drive, Uber Eats Direct, etc.) plugs in: discover nearby
 * open restaurants, read the menu in category buckets, build the cart by
 * voice, confirm, place the order with the provider (payment handled by the
 * provider directly), and send an SMS receipt. The provider adapter is
 * intentionally a clearly-marked seam until the chosen provider's API shape
 * is confirmed, so this stays honest rather than shipping speculative code.
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const routeUrl = `${base}/functions/voice-route`;

    const providerKey = secrets.get("DELIVERY_PROVIDER_API_KEY");

    // No delivery provider configured yet → honest "coming soon" message.
    if (!providerKey) {
      console.log("food-order: no DELIVERY_PROVIDER_API_KEY configured — returning coming-soon message");
      const comingSoon = "Food ordering is coming soon to 1 Call Away. We're onboarding delivery partners so you can order from nearby restaurants just by calling and speaking. I'll let you know the moment it launches. For now, I can help you find a restaurant or read reviews — just ask.";
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${twimlEscape(comingSoon)}</Say>
  <Gather input="speech" action="${twimlEscape(routeUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">What else can I help you with?</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thanks for calling 1 Call Away. Goodbye.</Say>
</Response>`;
      return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // A provider is configured. The live discover → menu → cart → confirm →
    // place flow lives here, calling the provider's order API and reusing the
    // FoodOrder entity + sendTwilioSms for receipts. Left as a clearly-marked
    // seam until the chosen provider's API shape is confirmed, so we stay
    // honest instead of shipping untested provider calls.
    console.log("food-order: provider configured but adapter not yet implemented for this provider");
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">A delivery partner is connected, but the ordering flow is still being finalized. Please check back soon.</Say>
  <Gather input="speech" action="${twimlEscape(routeUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">What else can I help you with?</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thanks for calling 1 Call Away. Goodbye.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  } catch (error) {
    console.error("food-order error:", error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, something went wrong with food ordering. Please try again in a moment.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  }
}