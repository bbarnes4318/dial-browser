// Generates a random per-merchant webhook signing secret (24 bytes hex).
// Runs client-side in the enrollment form — this is the merchant's own
// signing secret (like an API key), not a platform secret.
export function generateWebhookSecret() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}