import { secrets } from "base44:runtime";

/**
 * get-dial-in-info — returns the public Twilio voice number so the UI can
 * show callers which number to dial. The number is public business info
 * (not a credential), but it lives in env vars so it's served via this function.
 */
export default async function(req) {
  try {
    const voiceNumber = secrets.get("TWILIO_VOICE_NUMBER") || "";
    return Response.json({ voiceNumber });
  } catch (error) {
    console.error("get-dial-in-info error:", error.message);
    return Response.json({ voiceNumber: "" });
  }
}