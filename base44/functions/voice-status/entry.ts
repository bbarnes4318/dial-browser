import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";

/**
 * voice-status — handles two Twilio callbacks:
 *  1. <Record> action + transcribeCallback: stores a caller's voicemail
 *     (audio + transcript) in the Voicemail entity.
 *  2. Call-status callbacks (CallStatus=completed/failed/etc.): logged only.
 */

export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const callSid = params.get("CallSid") || "";
    const from = params.get("From") || "";
    const to = params.get("To") || "";
    const callStatus = params.get("CallStatus") || "";
    const recordingUrl = params.get("RecordingUrl") || "";
    const transcriptionText = params.get("TranscriptionText") || "";
    const recordingDuration = Number(params.get("RecordingDuration") || 0);

    // Voicemail recording result → store it.
    if (recordingUrl) {
      const base44 = createClientFromRequest(req);
      try {
        await base44.asServiceRole.entities.Voicemail.create({
          caller_phone: from,
          caller_name: "Voice Caller",
          recipient_dial_code: to || "VOICE",
          audio_url: recordingUrl,
          transcript: transcriptionText,
          duration_sec: recordingDuration,
          call_type: "unknown",
          related_call_id: callSid,
          listened: false,
          pinned: false,
        });
        console.log(`voice-status: voicemail stored for ${from} (call ${callSid}, ${recordingDuration}s)`);
      } catch (e) {
        console.error("voice-status voicemail store failed:", e.message);
      }
      return new Response("OK", { headers: { "Content-Type": "text/plain" } });
    }

    // Plain call-status callback — log only.
    console.log(`voice-status: call ${callSid} from ${from} status=${callStatus}`);
    return new Response("OK", { headers: { "Content-Type": "text/plain" } });
  } catch (error) {
    console.error("voice-status error:", error.message);
    return new Response("Error", { status: 500 });
  }
}