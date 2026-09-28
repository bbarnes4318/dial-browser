import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";

/**
 * phone-recording-status — Twilio recording-status-callback webhook. When a
 * softphone call placed with the dialer Record toggle is recorded, Twilio
 * POSTs the RecordingUrl + RecordingSid here once the recording is ready.
 * We store the URL on the matching PhoneCall (by CallSid) so it shows up as a
 * playable audio file in the call history view.
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const callSid = params.get("CallSid") || "";
    const recordingUrl = params.get("RecordingUrl") || "";
    const recordingSid = params.get("RecordingSid") || "";

    if (!callSid || !recordingUrl) return new Response("OK", { status: 200 });

    const base44 = createClientFromRequest(req);
    const calls = await base44.asServiceRole.entities.PhoneCall.filter(
      { call_sid: callSid }, "-created_date", 1
    );
    if (calls && calls.length > 0) {
      await base44.asServiceRole.entities.PhoneCall.update(calls[0].id, {
        recorded: true,
        recording_url: recordingUrl,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("phone-recording-status error:", error.message);
    return new Response("OK", { status: 200 });
  }
}