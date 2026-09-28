import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { normalizePhone } from "./smsAuth.ts";

/**
 * phoneMetering — shared softphone metering helpers used by the
 * send-phone-sms, mint-voice-token, phone-call-status, and phone-account
 * functions. All operate on a service-role base44 client so provisioning,
 * metering, and entitlement writes succeed regardless of caller role.
 */

export const PHONE_TIER_CAPS = {
  free:     { minutes: 30,  sms: 20,  personalNumber: false },
  plus:     { minutes: 500, sms: 500, personalNumber: true },
  premium:  { minutes: 500, sms: 500, personalNumber: true },
  elite:    { minutes: 500, sms: 500, personalNumber: true },
  ultimate: { minutes: 500, sms: 500, personalNumber: true },
};

export async function resolveTier(base44, userId) {
  try {
    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { owner_user_id: userId, subscription_active: true }, "-created_date", 1
    );
    if (subs && subs.length > 0 && subs[0].tier && PHONE_TIER_CAPS[subs[0].tier]) {
      return subs[0].tier;
    }
  } catch (e) {
    console.error("resolveTier error:", e.message);
  }
  return "free";
}

export async function ensureEntitlement(base44, userId, tier) {
  const caps = PHONE_TIER_CAPS[tier] || PHONE_TIER_CAPS.free;
  const existing = await base44.asServiceRole.entities.PhoneEntitlement.filter(
    { owner_user_id: userId }, "-created_date", 1
  );
  const now = new Date();
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (existing && existing.length > 0) {
    const ent = existing[0];
    const cycleExpired = !ent.cycle_end || new Date(ent.cycle_end) < now;
    const tierChanged = ent.tier !== tier;

    if (cycleExpired) {
      await base44.asServiceRole.entities.PhoneEntitlement.update(ent.id, {
        tier,
        minutes_used: 0,
        sms_used: 0,
        cap_minutes_monthly: caps.minutes,
        cap_sms_monthly: caps.sms,
        has_personal_number: caps.personalNumber || ent.has_personal_number,
        cycle_start: cycleStart.toISOString(),
        cycle_end: cycleEnd.toISOString(),
      });
      ent.minutes_used = 0;
      ent.sms_used = 0;
      ent.tier = tier;
      ent.cap_minutes_monthly = caps.minutes;
      ent.cap_sms_monthly = caps.sms;
      ent.has_personal_number = caps.personalNumber || ent.has_personal_number;
    } else if (tierChanged) {
      await base44.asServiceRole.entities.PhoneEntitlement.update(ent.id, {
        tier,
        cap_minutes_monthly: caps.minutes,
        cap_sms_monthly: caps.sms,
        has_personal_number: caps.personalNumber || ent.has_personal_number,
      });
      ent.tier = tier;
      ent.cap_minutes_monthly = caps.minutes;
      ent.cap_sms_monthly = caps.sms;
      ent.has_personal_number = caps.personalNumber || ent.has_personal_number;
    }
    return ent;
  }

  return await base44.asServiceRole.entities.PhoneEntitlement.create({
    owner_user_id: userId,
    tier,
    cap_minutes_monthly: caps.minutes,
    cap_sms_monthly: caps.sms,
    minutes_used: 0,
    sms_used: 0,
    topup_minutes: 0,
    topup_sms: 0,
    disclaimer_acknowledged: false,
    cycle_start: cycleStart.toISOString(),
    cycle_end: cycleEnd.toISOString(),
    has_personal_number: false,
    created_by_id: userId,
  });
}

export function remainingMinutes(ent) {
  const cap = (ent.cap_minutes_monthly || 0) + (ent.topup_minutes || 0);
  return Math.max(0, cap - (ent.minutes_used || 0));
}

export function remainingSms(ent) {
  const cap = (ent.cap_sms_monthly || 0) + (ent.topup_sms || 0);
  return Math.max(0, cap - (ent.sms_used || 0));
}

/**
 * isAllowedContact — verifies the dialed number is one of the caller's own
 * pre-existing contacts (age-gated), so a bridge can never dial an arbitrary
 * attacker-chosen number. Mirrors the start-group-call / bridge-radio-call
 * relay guard. `phone` must already be in E.164 (use normalizeE164 first).
 */
export async function isAllowedContact(base44, phone, minAgeMs = 30 * 1000) {
  let contacts = [];
  try { contacts = await base44.entities.Contact.list("-created_date", 500); } catch { /* none */ }
  const now = Date.now();
  for (const c of (contacts || [])) {
    const ph = normalizePhone(c.phone);
    if (!ph) continue;
    const created = c.created_date ? new Date(c.created_date).getTime() : 0;
    if (now - created < minAgeMs) continue;
    if (ph === phone) return true;
  }
  return false;
}

export function normalizeE164(num) {
  let n = String(num || "").trim();
  if (!n) return "";
  if (!n.startsWith("+")) {
    const digits = n.replace(/[^0-9]/g, "");
    n = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  }
  return n;
}

/** Returns the member's active outbound number (personal if provisioned, else the shared line). */
export async function resolveOutboundNumber(base44, userId, entitlement) {
  if (entitlement && entitlement.has_personal_number) {
    const personal = await base44.asServiceRole.entities.PhoneNumber.filter(
      { owner_user_id: userId, assignment_type: "personal", status: "active" }, "-created_date", 1
    );
    if (personal && personal.length > 0) return personal[0];
  }
  const shared = await base44.asServiceRole.entities.PhoneNumber.filter(
    { assignment_type: "shared", status: "active" }, "-created_date", 1
  );
  return (shared && shared.length > 0) ? shared[0] : null;
}