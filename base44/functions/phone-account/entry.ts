import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { resolveTier, ensureEntitlement, remainingMinutes, remainingSms, resolveOutboundNumber } from "../../shared/phoneMetering.ts";

/**
 * phone-account — single bundle loader for the softphone UI. Returns the
 * member's entitlement (with live remaining caps), their active outbound
 * number (personal or shared), recent call log, and recent SMS threads.
 * Optionally marks the one-time non-emergency disclaimer as acknowledged.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!me || !me.id) return Response.json({ error: "Authentication required." }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch { /* GET or empty body */ }
    const acknowledge = !!body.acknowledge_disclaimer;

    const tier = await resolveTier(base44, me.id);
    let entitlement = await ensureEntitlement(base44, me.id, tier);

    if (acknowledge && !entitlement.disclaimer_acknowledged) {
      await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, {
        disclaimer_acknowledged: true,
        disclaimer_acknowledged_at: new Date().toISOString(),
      });
      entitlement = { ...entitlement, disclaimer_acknowledged: true, disclaimer_acknowledged_at: new Date().toISOString() };
    }

    const number = await resolveOutboundNumber(base44, me.id, entitlement);

    const [calls, messages] = await Promise.all([
      base44.asServiceRole.entities.PhoneCall.filter(
        { owner_user_id: me.id }, "-created_date", 50
      ).catch(() => []),
      base44.asServiceRole.entities.PhoneMessage.filter(
        { owner_user_id: me.id }, "-created_date", 100
      ).catch(() => []),
    ]);

    return Response.json({
      entitlement: {
        ...entitlement,
        remainingMinutes: remainingMinutes(entitlement),
        remainingSms: remainingSms(entitlement),
      },
      number,
      calls: calls || [],
      messages: messages || [],
      tier,
    });
  } catch (error) {
    console.error("phone-account error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}