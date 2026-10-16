import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

/**
 * hoppwhistle-voice-token — the Dial Phone's key to the phone service.
 *
 * Members never sign in to NetEnroll/Hoppwhistle. Instead, this function --
 * running on Dial Browser's server, never in the browser -- vouches for the
 * signed-in member and asks Hoppwhistle for a one-hour voice token:
 *
 *   POST {HOPPWHISTLE_API_URL}/api/v1/integrations/dial-browser/voice-token
 *   x-dial-browser-integration-key: <HOPPWHISTLE_INTEGRATION_SECRET>
 *   { dialBrowserUserId }
 *
 * The integration secret stays here. What goes back to the browser is only
 * the member's own voice token, which Hoppwhistle accepts on the softphone
 * routes and nowhere else; the member's limits (US numbers, daily minutes and
 * calls, caller ID, no recording) are enforced by Hoppwhistle, not by the
 * browser.
 *
 * Neither the secret nor the token is ever logged.
 *
 * Responses: 200 { token, expiresAt }
 *            401 not signed in
 *            403 { code: "DISCLAIMER_REQUIRED" } -- accept the 911 notice first
 *            503 { code: "NOT_CONFIGURED" | "UNAVAILABLE" }
 */

const DEFAULT_API_URL = "https://agents.netenroll.com";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, { status: 401 });
    }
    if (!me || !me.id) {
      return Response.json({ error: "Authentication required.", code: "AUTH_REQUIRED" }, { status: 401 });
    }

    const secret = Deno.env.get("HOPPWHISTLE_INTEGRATION_SECRET");
    if (!secret) {
      console.error("hoppwhistle-voice-token: HOPPWHISTLE_INTEGRATION_SECRET is not set");
      return Response.json({ error: "The phone is not configured yet.", code: "NOT_CONFIGURED" }, { status: 503 });
    }
    const apiUrl = (Deno.env.get("HOPPWHISTLE_API_URL") || DEFAULT_API_URL).replace(/\/+$/, "");

    // The Dial Phone is not an emergency phone; the member accepts that once.
    const entitlements = await base44.asServiceRole.entities.PhoneEntitlement.filter(
      { owner_user_id: me.id }, "-created_date", 1
    ).catch(() => []);
    if (!entitlements?.[0]?.disclaimer_acknowledged) {
      return Response.json(
        { error: "Accept the emergency-calling notice on the Phone page first.", code: "DISCLAIMER_REQUIRED" },
        { status: 403 }
      );
    }

    let res;
    try {
      res = await fetch(`${apiUrl}/api/v1/integrations/dial-browser/voice-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dial-browser-integration-key": secret },
        body: JSON.stringify({ dialBrowserUserId: String(me.id) }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (e) {
      console.error("hoppwhistle-voice-token: phone service unreachable:", e?.name || "error");
      return Response.json({ error: "The phone service could not be reached.", code: "UNAVAILABLE" }, { status: 503 });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.token) {
      // Status and Hoppwhistle's error code only: never the body of a success.
      console.error("hoppwhistle-voice-token: refused", res.status, data?.error?.code || "");
      const message = res.status === 403 ? "This account cannot use the phone." : "The phone is not available right now.";
      return Response.json({ error: message, code: "UNAVAILABLE" }, { status: res.status === 403 ? 403 : 503 });
    }

    return Response.json({ token: data.token, expiresAt: data.expiresAt || null });
  } catch (error) {
    console.error("hoppwhistle-voice-token error:", error?.message);
    return Response.json({ error: "The phone is not available right now.", code: "UNAVAILABLE" }, { status: 500 });
  }
}
