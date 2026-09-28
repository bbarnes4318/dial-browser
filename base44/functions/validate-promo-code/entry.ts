import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { lookupPromoCode, calculateDiscountedPrice, promoLabel } from "../../shared/promoCode.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { code, plan, original_price } = body;

    if (!code) {
      return Response.json({ error: "Missing required field: code" }, { status: 400 });
    }

    const result = await lookupPromoCode(base44, code, plan);
    if (!result.valid) {
      return Response.json({ valid: false, error: result.error });
    }

    const promo = result.promo;
    const originalPrice = typeof original_price === "number" ? original_price : parseFloat(original_price) || 0;
    const { discountAmount, discountedPrice } = calculateDiscountedPrice(promo, originalPrice);

    return Response.json({
      valid: true,
      code: promo.code,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      label: promo.description || promoLabel(promo),
      discount_amount: discountAmount,
      discounted_price: discountedPrice,
      original_price: originalPrice,
    });
  } catch (error) {
    console.error("validate-promo-code error:", error.message);
    return Response.json({ valid: false, error: "Could not validate promo code. Please try again." }, { status: 500 });
  }
}