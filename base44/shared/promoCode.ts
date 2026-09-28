/**
 * Shared promo code validation and discount calculation logic.
 * Used by both validate-promo-code (frontend field) and create-checkout
 * (server-side price reduction) so the rules never diverge.
 */

/**
 * Look up a promo code by its code string and verify it is still valid
 * (active, not expired, under usage cap, applicable to the given plan).
 * Returns { valid, promo, error } — promo is the entity record on success.
 */
export async function lookupPromoCode(base44, rawCode, plan) {
  const upperCode = (rawCode || "").trim().toUpperCase();
  if (!upperCode) {
    return { valid: false, error: "No promo code provided" };
  }

  const codes = await base44.asServiceRole.entities.PromoCode.filter(
    { code: upperCode, active: true },
    "-created_date",
    5
  );
  if (!codes || codes.length === 0) {
    return { valid: false, error: "Invalid or expired promo code" };
  }

  const promo = codes[0];

  // Expiry check
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, error: "This promo code has expired" };
  }

  // Usage cap check
  if (promo.max_uses && (promo.used_count || 0) >= promo.max_uses) {
    return { valid: false, error: "This promo code has reached its usage limit" };
  }

  // Plan applicability check (empty list = applies to all)
  if (
    promo.applicable_plans &&
    promo.applicable_plans.length > 0 &&
    plan &&
    !promo.applicable_plans.includes(plan)
  ) {
    return { valid: false, error: "This promo code is not valid for this purchase" };
  }

  return { valid: true, promo };
}

/**
 * Calculate the discount amount and final discounted price.
 * Pure function — no DB access, safe to call synchronously.
 */
export function calculateDiscountedPrice(promo, originalPrice) {
  const original = typeof originalPrice === "number" ? originalPrice : parseFloat(originalPrice) || 0;

  let discountAmount = 0;
  if (promo.discount_type === "percent") {
    discountAmount = (original * promo.discount_value) / 100;
  } else {
    // fixed dollar amount off, capped at the original price
    discountAmount = Math.min(promo.discount_value, original);
  }

  const discountedPrice = Math.max(0, original - discountAmount);

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedPrice: Math.round(discountedPrice * 100) / 100,
  };
}

/**
 * Build a human-readable label for a promo code (e.g. "10% off" or "$5 off").
 */
export function promoLabel(promo) {
  if (!promo) return "";
  if (promo.discount_type === "percent") {
    return `${promo.discount_value}% off`;
  }
  return `$${promo.discount_value} off`;
}

/**
 * Atomically increment a promo code's used_count after payment is confirmed,
 * bounded by max_uses (0/null = unlimited). Uses the same optimistic-concurrency
 * pattern as shared/credits.ts consumeCredits (conditional updateMany keyed on
 * the snapshot value) so concurrent confirmations cannot push the count past the
 * cap. Returns true if the increment was applied.
 */
export async function consumePromoCode(base44, promoCodeId) {
  if (!promoCodeId) return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    let promo;
    try {
      const rows = await base44.asServiceRole.entities.PromoCode.filter(
        { id: promoCodeId }, "-created_date", 1
      );
      promo = rows && rows[0];
    } catch {
      return false;
    }
    if (!promo) return false;

    const used = promo.used_count || 0;
    const max = promo.max_uses || 0;

    // Unlimited codes (max_uses 0/null): increment unconditionally, still keyed
    // on the snapshot so concurrent calls don't double-count a single redemption.
    if (!max || max <= 0) {
      const res = await base44.asServiceRole.entities.PromoCode.updateMany(
        { id: promoCodeId, used_count: used },
        { $inc: { used_count: 1 } }
      );
      if (res && res.updated > 0) return true;
      continue; // race — re-read and retry
    }

    // Capped codes: refuse to increment once the cap is reached.
    if (used >= max) return false;
    const res = await base44.asServiceRole.entities.PromoCode.updateMany(
      { id: promoCodeId, used_count: used },
      { $inc: { used_count: 1 } }
    );
    if (res && res.updated > 0) return true;
    // race — a concurrent confirmation changed used_count; loop and re-check.
  }
  return false;
}