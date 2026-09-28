import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { twimlEscape } from "../../shared/twilioVoice.ts";

/**
 * service-rating — voice-based rating flow. After a food or transport
 * experience, the caller is routed here (by voice-route classifying a
 * "Rating" intent, or by the order flows post-completion). The caller
 * speaks a score / comment; we parse it with the LLM, link it to the
 * caller's most recent FoodOrder or TransportBooking, store a
 * ServiceRating, and confirm.
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const speech = (params.get("SpeechResult") || "").trim();
    const from = (params.get("From") || "").trim();
    const callSid = params.get("CallSid") || "";

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const ratingUrl = `${base}/functions/service-rating`;
    const routeUrl = `${base}/functions/voice-route`;

    const base44 = createClientFromRequest(req);

    // No speech yet → prompt for the rating.
    if (!speech) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${twimlEscape(ratingUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">Sure. On a scale of 1 to 5, how was your experience, and any quick comment?</Say>
  </Gather>
  <Redirect method="POST">${twimlEscape(routeUrl)}</Redirect>
</Response>`;
      return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Parse the score + comment from the spoken words.
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `A caller is rating their recent food or transport experience over the phone. Their spoken words: "${speech.slice(0, 300)}". Extract a numeric score from 1 to 5 (5 = best). If they did not give a clear number, return 0. Also extract a short comment summarizing what they said (max 200 chars), or an empty string if none. Return JSON {score, comment}.`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" },
          comment: { type: "string" },
        },
      },
    });

    const score = Math.max(0, Math.min(5, Number(llmRes?.score) || 0));
    const comment = String(llmRes?.comment || "").slice(0, 300);

    // Link the rating to the caller's most recent food or transport order.
    let linked = null;
    let ratingType = "food";
    try {
      const food = await base44.asServiceRole.entities.FoodOrder.filter({ caller_phone: from }, "-created_date", 1);
      const transport = await base44.asServiceRole.entities.TransportBooking.filter({ caller_phone: from }, "-created_date", 1);
      const f = food && food[0];
      const t = transport && transport[0];
      if (f && t) {
        const fNewer = new Date(f.created_date || 0) >= new Date(t.created_date || 0);
        linked = fNewer ? f : t;
        ratingType = fNewer ? "food" : "transport";
      } else if (f) {
        linked = f;
        ratingType = "food";
      } else if (t) {
        linked = t;
        ratingType = "transport";
      }
    } catch (e) {
      console.error("service-rating link lookup failed:", e.message);
    }

    try {
      await base44.asServiceRole.entities.ServiceRating.create({
        rating_type: ratingType,
        related_order_id: linked ? linked.id : "",
        related_call_sid: callSid,
        caller_phone: from,
        score,
        comment,
        voice_transcript: speech.slice(0, 500),
      });
    } catch (e) {
      console.error("service-rating create failed:", e.message);
    }

    const thankYou =
      score >= 4
        ? "Thanks so much for the great rating. We're glad it went well."
        : score > 0
        ? "Thank you for your feedback. We'll use it to do better next time."
        : "Thanks for your feedback.";

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${twimlEscape(thankYou)}</Say>
  <Gather input="speech" action="${twimlEscape(routeUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">Anything else I can help with?</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thanks for calling 1 Call Away. Goodbye.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  } catch (error) {
    console.error("service-rating error:", error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="Polly.Joanna">Sorry, I couldn't save your rating. Please try again later.</Say></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  }
}