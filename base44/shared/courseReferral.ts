// Course referral configuration + helpers shared by create-checkout (discount
// at checkout), wix-payments-webhook (reward on payment), and the
// course-referral-code function (issue a student's code). Centralizing the
// constants here keeps the discount/reward rules consistent across all three.

// Friend-side: percentage off any course enrollment fee.
export const COURSE_REFERRAL_DISCOUNT_PCT = 20;

// Referrer-side: call credits awarded when a referred friend pays for a course.
export const COURSE_REFERRAL_CREDITS = 25;

// Per-referrer lifetime cap — prevents unbounded credit farming.
export const MAX_COURSE_REFERRALS = 50;

// No ambiguous characters (0/O, 1/I) so codes are read/shareable.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

// Resolve the referrer behind a referral code by looking up the Referral
// anchor record stored for that code. Returns { referrerId, referrerName } or null.
export async function resolveReferrerByCode(base44, code) {
  const clean = (code || "").trim().toUpperCase();
  if (!clean || !/^[A-Z0-9]{4,16}$/.test(clean)) return null;
  const records = await base44.asServiceRole.entities.Referral.filter(
    { referral_code: clean }, "-created_date", 20
  );
  const anchor = (records || []).find((r) => r.referrer_user_id);
  if (!anchor || !anchor.referrer_user_id) return null;
  return { referrerId: anchor.referrer_user_id, referrerName: anchor.referrer_name || "" };
}

// Award call credits to a user (referral reward). Creates a CallCredit row if
// the user has none, otherwise increments bonus_credits. Best-effort: logs on
// error and returns false so callers can continue without failing the payment.
export async function awardCallCredits(base44, userId, amount) {
  try {
    const rows = await base44.asServiceRole.entities.CallCredit.filter(
      { created_by_id: userId }, "-created_date", 1
    );
    if (rows && rows.length > 0) {
      await base44.asServiceRole.entities.CallCredit.updateMany(
        { created_by_id: userId },
        { $inc: { bonus_credits: amount } }
      );
    } else {
      const now = new Date();
      const end = new Date(now); end.setMonth(end.getMonth() + 1);
      await base44.asServiceRole.entities.CallCredit.create({
        plan_tier: "free",
        total_credits: 25,
        used_credits: 0,
        bonus_credits: amount,
        billing_cycle_start: now.toISOString(),
        billing_cycle_end: end.toISOString(),
      });
    }
    return true;
  } catch (e) {
    console.error("awardCallCredits error:", e.message);
    return false;
  }
}