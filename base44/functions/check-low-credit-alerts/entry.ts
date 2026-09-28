import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { remainingMinutes, remainingSms } from "../../shared/phoneMetering.ts";
import { requireAdmin } from "../../shared/smsAuth.ts";

/**
 * check-low-credit-alerts — scans every PhoneEntitlement and, for members
 * whose remaining monthly call OR text balance has dropped below 10%, fires
 * an in-app AppNotification encouraging them to top up. Idempotent per 24h
 * via the low_credit_alerted_at timestamp on the entitlement.
 *
 * This is a scheduled workflow that runs with service-role privileges and
 * touches every member's entitlement, so it MUST be gated to admins (or the
 * platform scheduler, which carries an admin session). It is not reachable
 * for anonymous enumeration.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const gate = await requireAdmin(base44);
    if (gate.error) return gate.error;

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const entitlements = await base44.asServiceRole.entities.PhoneEntitlement.list("-created_date", 1000);

    const alerted = [];
    for (const ent of (Array.isArray(entitlements) ? entitlements : [])) {
      try {
        const capMin = (ent.cap_minutes_monthly || 0) + (ent.topup_minutes || 0);
        const capSms = (ent.cap_sms_monthly || 0) + (ent.topup_sms || 0);
        if (capMin <= 0 && capSms <= 0) continue;

        const remMin = remainingMinutes(ent);
        const remSms = remainingSms(ent);
        const minPct = capMin > 0 ? remMin / capMin : 1;
        const smsPct = capSms > 0 ? remSms / capSms : 1;
        const threshold = (ent.low_credit_threshold_pct != null ? ent.low_credit_threshold_pct : 10) / 100;
        const low = minPct < threshold || smsPct < threshold;
        if (!low) continue;

        // Idempotency — one alert per 24h per entitlement
        if (ent.low_credit_alerted_at && new Date(ent.low_credit_alerted_at) > dayAgo) continue;

        const which = [];
        if (minPct < threshold) which.push(`${Math.round(minPct * 100)}% call minutes`);
        if (smsPct < threshold) which.push(`${Math.round(smsPct * 100)}% texts`);

        const message = `Your monthly Dial Phone balance is running low (${which.join(", ")} remaining). Top up to keep making calls and sending texts.`;
        await base44.asServiceRole.entities.AppNotification.create({
          notification_type: "sms_alert",
          title: "Low call & text credit",
          message,
          related_id: ent.id,
          related_type: "PhoneEntitlement",
          action_label: "Top up",
          action_url: "/#pricing",
          priority: "high",
          read: false,
          created_by_id: ent.owner_user_id,
        });

        await base44.asServiceRole.entities.PhoneEntitlement.update(ent.id, {
          low_credit_alerted_at: now.toISOString(),
        });
        alerted.push({ user_id: ent.owner_user_id, minPct: Math.round(minPct * 100), smsPct: Math.round(smsPct * 100) });
      } catch (e) {
        console.error("low-credit alert per-entitlement error:", e.message);
      }
    }

    return Response.json({ ok: true, checked: (entitlements || []).length, alerted });
  } catch (error) {
    console.error("check-low-credit-alerts error:", error.message);
    return Response.json({ error: "Unable to run the credit-alert scan right now." }, { status: 500 });
  }
}