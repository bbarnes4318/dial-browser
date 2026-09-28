import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";
import { twimlEscape } from "../../shared/twilioVoice.ts";

/**
 * voice-route — receives the caller's transcribed speech from Twilio's
 * <Gather>, classifies the intent with the LLM (with live web context for
 * factual questions), speaks a conversational reply, sends the caller an
 * SMS summary, and loops back to listen for a follow-up. Empty speech offers
 * to record a voicemail (handed off to voice-status).
 */

import { RADIO_STATIONS } from "../../shared/radioStations.ts";

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
    const routeUrl = `${base}/functions/voice-route`;
    const statusUrl = `${base}/functions/voice-status`;
    const foodUrl = `${base}/functions/food-order`;
    const transportUrl = `${base}/functions/transport-order`;
    const ratingUrl = `${base}/functions/service-rating`;

    // No speech captured → offer to leave a voicemail.
    if (!speech) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I didn't hear you. If you'd like to leave a message, speak after the beep.</Say>
  <Record action="${twimlEscape(statusUrl)}" method="POST" maxLength="60" playBeep="true" transcribe="true" transcribeCallback="${twimlEscape(statusUrl)}" />
  <Say voice="Polly.Joanna">Goodbye.</Say>
</Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml; charset=UTF-8" },
      });
    }

    const base44 = createClientFromRequest(req);

    // Classify intent and generate a warm, concise spoken reply + SMS summary.
    // Live web context lets it answer weather / local / factual questions directly.
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the voice assistant for "1 Call Away", a phone-based service concierge anyone can call to access digital services by speaking naturally.

A caller just said: "${speech.slice(0, 500)}"

Do two things:
1. Classify the intent into one of: Weather, Restaurant, Food, Transportation, Pharmacy, Doctor, Jobs, Local Directory, Marketplace, Creator, Radio, AI Assistant, Emergency, Rating, Course, or General. Do NOT classify into or claim the platform offers any other service — 1 Call Away does NOT offer dental, grocery, hotels, real estate, bill pay, money transfer, or housing. If the caller asks for one of those, classify as General and politely explain it is not available, then suggest a live alternative (e.g. local directory, AI assistant). If the caller wants to learn, take a course, study a lesson, or mentions a course dial code (e.g. "AI01", "star AI01", "A I 0 1"), classify as "Course" and set course_dial_code to the alphanumeric code they said (letters and digits only, no "star" word, e.g. "AI01"). If the caller wants to order food, have a meal delivered, or find a place to eat right now, classify as "Food". If the caller wants to book a ride, taxi, scheduled car pickup, or an intercity bus, train, or flight ticket, classify as "Transportation". If the caller wants to listen to music, radio, or a specific radio station, classify as "Radio" and set station_id to the best match from this list: groove=Groove Salad, beatblender=Beat Blender, lush=Lush Radio, indiepop=Indie Pop Rocks, bootliquor=Boot Liquor, sonicuniverse=Sonic Universe, sevensoul=Seven Inch Soul, defcon=DEF CON Radio, spacestation=Space Station, missioncontrol=Mission Control, blackrock=Black Rock FM, cliqhop=cliqhop idm, doomed=Doomed, reggae=Heavyweight Reggae, secretagent=Secret Agent, thetrip=The Trip, dronezone=Drone Zone, suburbsofgoa=Suburbs of Goa, folkfwd=Folk Forward, poptron=PopTron, radioparadise=Radio Paradise. If no specific station is mentioned, use "groove".
2. Write a warm, concise reply to READ ALOUD to the caller (under 400 characters, conversational, no URLs or special characters). If it's an actionable request within the live services, confirm and state the next step briefly. If it's a factual question (weather, info, hours), answer it directly and briefly.
3. Write a short SMS text (under 200 characters) to send the caller with the key info or next step.

Return JSON with intent, spoken_reply, sms_summary.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          intent: { type: "string" },
          station_id: { type: "string" },
          course_dial_code: { type: "string" },
          spoken_reply: { type: "string" },
          sms_summary: { type: "string" },
        },
      },
    });

    // Radio intent → stream the station live over the phone call via Twilio <Play>.
    if ((llmRes?.intent || "").toLowerCase() === "radio") {
      const stationId = String(llmRes?.station_id || "groove").toLowerCase();
      const station = RADIO_STATIONS[stationId] || RADIO_STATIONS["groove"];
      console.log(`voice-route: radio intent → station=${stationId} call=${callSid}`);
      if (from) {
        try {
          await sendTwilioSms(from, `1 CALL AWAY: Now playing ${station.name}. Listen in your browser anytime at www.dialbrowser.com.`);
        } catch (e) { console.error("voice-route radio SMS failed:", e.message); }
      }
      const radioTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Now playing ${twimlEscape(station.name)}. Say change station or stop when you're done. Enjoy the music.</Say>
  <Gather input="speech" action="${twimlEscape(routeUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Play>${twimlEscape(station.streamUrl)}</Play>
  </Gather>
  <Say voice="Polly.Joanna">Thanks for listening to 1 Call Away Radio. Goodbye.</Say>
</Response>`;
      return new Response(radioTwiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Food intent → hand off to the voice-first food ordering flow.
    if ((llmRes?.intent || "").toLowerCase() === "food") {
      console.log(`voice-route: food intent → food-order call=${callSid}`);
      const foodTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${twimlEscape(foodUrl)}</Redirect>
</Response>`;
      return new Response(foodTwiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Transportation intent → hand off to the voice-first transportation booking flow.
    if ((llmRes?.intent || "").toLowerCase() === "transportation") {
      console.log(`voice-route: transportation intent → transport-order call=${callSid}`);
      const transportTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${twimlEscape(transportUrl)}</Redirect>
</Response>`;
      return new Response(transportTwiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Rating intent → hand off to the voice-based rating flow.
    if ((llmRes?.intent || "").toLowerCase() === "rating") {
      console.log(`voice-route: rating intent → service-rating call=${callSid}`);
      const ratingTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${twimlEscape(ratingUrl)}</Redirect>
</Response>`;
      return new Response(ratingTwiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Course / Learning intent → play the learner's next lesson audio over the call.
    if ((llmRes?.intent || "").toLowerCase() === "course") {
      const spokenCode = String(llmRes?.course_dial_code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      console.log(`voice-route: course intent dial_code=${spokenCode} call=${callSid}`);
      if (spokenCode) {
        const courses = await base44.asServiceRole.entities.Course.filter({ status: "published" }, "-created_date", 300);
        const course = (courses || []).find((c) => {
          const dc = String(c.dial_code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
          return dc && (dc === spokenCode || dc.endsWith(spokenCode) || spokenCode.endsWith(dc));
        });
        if (course) {
          const courseUrl = `${base}/functions/course-voice-delivery?course_id=${encodeURIComponent(course.id)}`;
          const courseTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${twimlEscape(courseUrl)}</Redirect>
</Response>`;
          return new Response(courseTwiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
        }
      }
      const courseTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I couldn't find that course. Please check your course dial code in the 1 Call app and try again. Goodbye.</Say>
</Response>`;
      return new Response(courseTwiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    const reply = (llmRes?.spoken_reply || "I'm on it. You'll get a text shortly with the details.").slice(0, 500);
    const smsSummary = (llmRes?.sms_summary || "1 CALL AWAY: Thanks for calling. We're processing your request.").slice(0, 300);

    // Send the caller an SMS summary (best-effort, non-blocking).
    if (from) {
      try {
        await sendTwilioSms(from, smsSummary);
      } catch (e) {
        console.error("voice-route SMS failed:", e.message);
      }
    }

    console.log(`voice-route: call=${callSid} from=${from} intent=${llmRes?.intent || "General"} speech="${speech.slice(0, 80)}"`);

    // Speak the reply, then loop back to listen for a follow-up request.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${twimlEscape(reply)}</Say>
  <Gather input="speech" action="${twimlEscape(routeUrl)}" method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">Anything else I can help with?</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thanks for calling 1 Call Away. Goodbye.</Say>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
    });
  } catch (error) {
    console.error("voice-route error:", error.message);
    // Return spoken error TwiML so the caller isn't left in silence.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, something went wrong on our end. Please try again in a moment.</Say>
</Response>`;
    return new Response(twiml, {
      headers: { "Content-Type": "text/xml; charset=UTF-8" },
    });
  }
}