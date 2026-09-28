import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { enforceVoiceGuard } from "../../shared/voiceGuard.ts";

Deno.serve(async (req) => {
  try {
    const { subscription_id } = await req.json();

    if (!subscription_id) {
      return Response.json({ error: "Missing subscription_id" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Authenticate the caller and verify ownership before contacting Wix
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // Look up the subscription locally to verify the caller owns it
    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { subscription_id: subscription_id },
      "-created_date",
      5
    );
    const ownsSubscription = (subs && subs[0] && subs[0].owner_user_id === user.id);
    if (!ownsSubscription) {
      return Response.json({ error: "Subscription not found or not authorized" }, { status: 403 });
    }

    // Server-side voice-guard enforcement: if the caller has enabled the optional
    // voice-biometric guard, refuse cancellation without a recent successful verify.
    const guardError = await enforceVoiceGuard(base44, user);
    if (guardError) return guardError;

    const apiKey = Deno.env.get("WIX_PAYMENTS_API_KEY");
    const siteId = Deno.env.get("WIX_PAYMENTS_SITE_ID");

    // Try soft cancellation first (stays active until end of billing cycle)
    let response = await fetch(
      `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": apiKey,
          "wix-site-id": siteId,
        },
        body: JSON.stringify({
          subscription_id: subscription_id,
          immediate: false,
          reason: "User requested cancellation",
        }),
      }
    );

    // If soft cancel fails (e.g., auto-renew already off), try immediate
    if (!response.ok) {
      const errText = await response.text();
      console.error("Soft cancel failed, trying immediate:", errText);

      response = await fetch(
        `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscription_id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": apiKey,
            "wix-site-id": siteId,
          },
          body: JSON.stringify({
            subscription_id: subscription_id,
            immediate: true,
            reason: "User requested cancellation",
          }),
        }
      );

      if (!response.ok) {
        const retryErr = await response.text();
        console.error("Immediate cancel also failed:", retryErr);
        return Response.json({ error: "Failed to cancel subscription" }, { status: 500 });
      }
    }

    const data = await response.json();

    // Update local records — ownership already verified above
    try {
      if (subs && subs[0]) {
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
          subscription_active: false,
          subscription_status: "canceled",
        });
        console.log(`Canceled Subscription tier ${subs[0].tier} for user ${subs[0].owner_user_id}`);
      }

    } catch (e) {
      console.error("Local record update failed:", e.message);
    }

    return Response.json({ subscription: data.subscription });
  } catch (error) {
    console.error("cancel-subscription error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});