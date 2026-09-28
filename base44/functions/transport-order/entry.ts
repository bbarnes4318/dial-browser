import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { secrets } from "base44:runtime";

function twimlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * transport-order — voice-first transportation booking flow. Twilio posts the
 * caller's transcribed speech here after voice-route classifies a
 * "Transportation" intent (ride, taxi, scheduled pickup, bus, train, flight).
 *
 * When no travel aggregator is configured (TRANSPORT_AGGREGATOR_API_KEY absent),
 * speaks an honest "coming soon" message and routes the call back to the main
 * voice concierge — no fares, bookings, or confirmations are fabricated.
 *
 * When an aggregator IS configured, this is the seam where the live travel
 * marketplace API plugs in: search scheduled-car options or intercity legs,
 * read back the top options with fares, confirm by voice, create a
 * TransportBooking + Base44 Payments checkout session for the fare, then —
 * once the webhook confirms payment — place the booking with the aggregator
 * and send an SMS ticket/receipt. The aggregator adapter is intentionally a
 * clearly-marked seam until the chosen partner's API shape is confirmed, so
 * this stays honest rather than shipping speculative code.
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const routeUrl = `${base}/functions/voice-route`;

    const aggregatorKey = secrets.get("TRANSPORT_AGGREGATOR_API_KEY");

    // No travel aggregator configured yet → honest "coming soon" message.
    if (!aggregatorKey) {
      console.log("transport-order: no TRANSPORT_AGGREGATOR_API_KEY configured — returning coming-soon message");
      const comingSoon = "Transportation booking is coming soon to 1 Call Away. We're onboarding travel partners so you can book a scheduled ride or an intercity bus, train, or flight ticket just by calling and speaking. I'll let you know the moment it launches. For now, I can help you find a local business or answer a question — just ask.";
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

    // An aggregator is configured. The live discover → search → confirm →
    // checkout → place flow lives here, calling the aggregator's search/booking
    // API and reusing the TransportBooking entity + create-checkout + the
    // payments webhook (which triggers aggregator booking placement on payment)
    // + sendTwilioSms for receipts. Left as a clearly-marked seam until the
    // chosen partner's API shape is confirmed, so we stay honest instead of
    // shipping untested provider calls.
    console.log("transport-order: aggregator configured but adapter not yet implemented for this provider");
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">A travel partner is connected, but the booking flow is still being finalized. Please check back soon.</Say>
  <Gather input="speech" action="${twimlEscape(routeUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">What else can I help you with?</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thanks for calling 1 Call Away. Goodbye.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  } catch (error) {
    console.error("transport-order error:", error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, something went wrong with transportation booking. Please try again in a moment.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  }
}