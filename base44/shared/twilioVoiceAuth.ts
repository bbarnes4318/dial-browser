import { secrets } from "base44:runtime";

/**
 * Validates that an inbound request genuinely came from Twilio by verifying
 * the X-Twilio-Signature header (HMAC-SHA1 of the URL + sorted POST params,
 * keyed by the Twilio auth token). Required on every public voice/SMS webhook
 * so attackers can't forge calls that trigger LLM runs or SMS dispatch.
 */
export async function validateTwilioRequest(req, bodyText) {
  const signature = req.headers.get("X-Twilio-Signature");
  if (!signature) return false;
  const authToken = secrets.get("TWILIO_AUTH_TOKEN");
  if (!authToken) return false;

  const params = new URLSearchParams(bodyText);
  const sortedKeys = [...params.keys()].sort();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  // Accept either https (what Twilio signed) or http (how an internal proxy may
  // expose req.url) so a scheme mismatch behind the platform proxy doesn't
  // reject a genuine Twilio request. Both still require a valid HMAC over the
  // full URL + params, so an attacker still needs the auth token.
  const candidateUrls = [req.url];
  try {
    const u = new URL(req.url);
    if (u.protocol === "https:") candidateUrls.push(`http://${u.host}${u.pathname}${u.search}`);
    if (u.protocol === "http:") candidateUrls.push(`https://${u.host}${u.pathname}${u.search}`);
  } catch { /* ignore malformed URL */ }

  for (const url of candidateUrls) {
    let dataString = url;
    for (const k of sortedKeys) {
      dataString += k + (params.get(k) || "");
    }
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(dataString));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
    if (computed === signature) return true;
  }
  return false;
}