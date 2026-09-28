import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { resolveTier, ensureEntitlement, normalizeE164 } from "../../shared/phoneMetering.ts";

/**
 * set-call-forwarding — lets a PAID member toggle call forwarding and set the
 * secondary number inbound calls to their Dial number route to. Free members
 * are rejected. The setting is stored on the PhoneEntitlement and read by
 * inbound-phone-voice to decide whether to <Dial> the forward number instead
 * of ringing the in-app softphone client.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!me || !me.id) return Response.json({ error: "Authentication required." }, { status: 401 });

    const body = await req.json();
    const enable = !!body.enable;
    const rawNumber = String(body.forward_to || "").trim();

    const tier = await resolveTier(base44, me.id);
    if (tier === "free") {
      return Response.json({
        error: "Call forwarding is a paid-member feature. Upgrade to route incoming calls to another number.",
        needsUpgrade: true,
      }, { status: 402 });
    }

    const entitlement = await ensureEntitlement(base44, me.id, tier);

    // Disabling just flips the flag.
    if (!enable) {
      await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, {
        call_forwarding_enabled: false,
      });
      return Response.json({ ok: true, call_forwarding_enabled: false, forward_to_number: entitlement.forward_to_number || "" });
    }

    // Enabling requires a valid forward number.
    const forwardTo = normalizeE164(rawNumber);
    if (!forwardTo || forwardTo.length < 7) {
      return Response.json({ error: "Enter a valid phone number to forward calls to." }, { status: 400 });
    }

    await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, {
      call_forwarding_enabled: true,
      forward_to_number: forwardTo,
    });

    return Response.json({
      ok: true,
      call_forwarding_enabled: true,
      forward_to_number: forwardTo,
    });
  } catch (error) {
    console.error("set-call-forwarding error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}