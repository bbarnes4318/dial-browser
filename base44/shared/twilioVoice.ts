/**
 * Shared Twilio voice helpers used across the voice entry functions
 * (voice-answer, voice-route, merchant-order). Extracted so the same
 * XML-escaping logic isn't copied into every function.
 */

/** Escapes a string for safe inclusion inside Twilio TwiML text content. */
export function twimlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Normalizes a phone number to digits only (for matching across formats). */
export function normPhone(p) {
  return (p || "").replace(/[^0-9]/g, "");
}