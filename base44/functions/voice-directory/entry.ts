import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { twimlEscape } from "../../shared/twilioVoice.ts";

/**
 * voice-directory — receives the caller's DTMF digit or spoken keyword from
 * the voice-answer directory menu and routes the call:
 *   - Services with a dedicated voice handler (food, transport, rating) →
 *     <Redirect> straight to that handler.
 *   - Everything else → speaks a short contextual prompt, then <Gather>s
 *     the detail and posts it to voice-route, whose LLM classifier handles
 *     weather, doctor, jobs, radio, courses, local directory, and the AI
 *     assistant.
 *   - "0" / "help" / "repeat" / unknown → back to voice-answer to replay the menu.
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const digits = (params.get("Digits") || "").trim();
    const speech = (params.get("SpeechResult") || "").trim().toLowerCase();

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const routeUrl = `${base}/functions/voice-route`;
    const answerUrl = `${base}/functions/voice-answer`;
    const foodUrl = `${base}/functions/food-order`;
    const transportUrl = `${base}/functions/transport-order`;
    const ratingUrl = `${base}/functions/service-rating`;

    // Resolve the selection: DTMF digit takes precedence, else keyword match.
    let choice = digits;
    if (!choice) {
      if (/(weather|forecast|temperature)/.test(speech)) choice = "1";
      else if (/(food|restaurant|hungry|eat|pizza|meal|order food)/.test(speech)) choice = "2";
      else if (/(ride|taxi|cab|car|transport|uber|lyft|bus|train|flight|pickup)/.test(speech)) choice = "3";
      else if (/(doctor|pharmacy|medical|medicine|sick|symptom|pain|clinic|health)/.test(speech)) choice = "4";
      else if (/(job|jobs|work|employment|hire|hiring|career)/.test(speech)) choice = "5";
      else if (/(radio|music|station|song|listen)/.test(speech)) choice = "6";
      else if (/(course|learn|class|lesson|study|school|train|cert)/.test(speech)) choice = "7";
      else if (/(find|plumber|electrician|directory|service|repair|handyman|near me)/.test(speech)) choice = "8";
      else if (/(ai|assistant|question|ask|general|help me|information|info)/.test(speech)) choice = "9";
      else if (/(repeat|menu|options|restart|back)/.test(speech)) choice = "0";
    }

    // Helper: speak a prompt, gather speech, post to voice-route.
    const gatherToRoute = (prompt) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${twimlEscape(routeUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">${twimlEscape(prompt)}</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Let me bring you back to the menu.</Say>
  <Redirect method="POST">${twimlEscape(answerUrl)}</Redirect>
</Response>`;

    // Helper: redirect straight to a dedicated handler.
    const redirectTo = (target) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${twimlEscape(target)}</Redirect>
</Response>`;

    switch (choice) {
      case "1":
        return new Response(gatherToRoute("Sure. What city would you like the weather for?"), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "2":
        return new Response(redirectTo(foodUrl), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "3":
        return new Response(redirectTo(transportUrl), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "4":
        return new Response(gatherToRoute("I can help with general health guidance. What are your symptoms, or what do you need? Remember, for an emergency, call your local emergency number."), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "5":
        return new Response(gatherToRoute("What kind of job are you looking for? For example, warehouse work, nursing, or driving."), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "6":
        return new Response(gatherToRoute("Say a station name, or just say music and I'll pick one for you."), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "7":
        return new Response(gatherToRoute("What's your course dial code? For example, A I 0 1."), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "8":
        return new Response(gatherToRoute("What service do you need? For example, a plumber, an electrician, or a mechanic near you."), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "9":
        return new Response(gatherToRoute("Go ahead — what's your question?"), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      case "0":
        return new Response(redirectTo(answerUrl), {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
      default:
        // No recognizable input — replay the menu.
        const retry = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, I didn't get that. Let me repeat the menu.</Say>
  <Redirect method="POST">${twimlEscape(answerUrl)}</Redirect>
</Response>`;
        return new Response(retry, {
          headers: { "Content-Type": "text/xml; charset=UTF-8" },
        });
    }
  } catch (error) {
    console.error("voice-directory error:", error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, something went wrong. Please call back.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  }
}