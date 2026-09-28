import { validateWebhookUrl } from "./urlValidation.ts";

/**
 * Signs a merchant dispatch webhook payload with an HMAC-SHA256 signature
 * keyed by the merchant's per-merchant webhook_secret, so the merchant can
 * verify the order genuinely came from 1 Call Away and was not forged.
 */
export async function signWebhookPayload(payload: string, webhookSecret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/**
 * POSTs a structured order (or cancel event) to the merchant's dispatch
 * webhook with an HMAC-SHA256 signature header. Best-effort: returns
 * { ok, status, error } so the caller can mark the order delivered/failed
 * without throwing — the voice flow never blocks the caller on webhook success.
 */
export async function postOrderToMerchantWebhook(
  webhookUrl: string,
  webhookSecret: string,
  payload: Record<string, any>
): Promise<{ ok: boolean; status: number; error?: string }> {
  if (!webhookUrl) return { ok: false, status: 0, error: "no webhook url" };
  const checked = validateWebhookUrl(webhookUrl);
  if (!checked.valid) return { ok: false, status: 0, error: `webhook url rejected: ${checked.error}` };
  const body = JSON.stringify(payload);
  const signature = await signWebhookPayload(body, webhookSecret);
  try {
    const res = await fetch(checked.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-1CallAway-Signature": signature,
      },
      body,
    });
    return { ok: res.ok, status: res.status, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, status: 0, error: e.message };
  }
}

/** Generates a random per-merchant webhook signing secret (24 bytes hex). */
export function generateWebhookSecret(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}