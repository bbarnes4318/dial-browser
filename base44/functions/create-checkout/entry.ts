import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { lookupPromoCode, calculateDiscountedPrice } from "../../shared/promoCode.ts";
import { enforceVoiceGuard } from "../../shared/voiceGuard.ts";
import { resolveReferrerByCode, COURSE_REFERRAL_DISCOUNT_PCT } from "../../shared/courseReferral.ts";

// Record a pending promo-code redemption linked to a Wix checkout session so
// the wix-payments-webhook can consume one use only after payment is confirmed.
async function recordPromoRedemption(base44, checkoutId, promo) {
  if (!promo || !checkoutId) return;
  try {
    await base44.asServiceRole.entities.PromoRedemption.create({
      checkout_id: checkoutId,
      promo_code_id: promo.id,
      promo_code: promo.code,
      status: "pending",
    });
  } catch (e) {
    console.error("promo redemption record failed:", e.message);
  }
}

// Credit-aware pricing: each tier's price exceeds the cost of the AI/integration
// credits a power user could consume in a month, so the app is always cash-flow
// positive on credits without the builder paying out of pocket.
const PRODUCTS = {
  sms_calendar_monthly: { price: "6.99", frequency: "MONTH", title: "SMS / Text Calendar — Monthly", product: "sms_calendar_subscription" },
  sms_calendar_annual: { price: "69.99", frequency: "YEAR", title: "SMS / Text Calendar — Annual", product: "sms_calendar_subscription" },
  employer_access: { price: "14.99", title: "Employer Applicant Access — One-Time", product: "employer_access" },
  creator_tip: { title: "Creator Tip — Live Stream Support", product: "creator_tip" },
  share_purchase: { title: "Show Share Purchase — 1 Call Equity™", product: "share_purchase" },
  premium_plus_monthly: { price: "19.00", frequency: "MONTH", title: "1 Call Plus — Monthly", product: "premium_subscription", tier: "plus", description: "Ad-free experience, HD audio, Radio Phone Network access — 300 AI credits/mo" },
  premium_plus_annual: { price: "190.00", frequency: "YEAR", title: "1 Call Plus — Annual", product: "premium_subscription", tier: "plus", description: "Ad-free experience, HD audio, Radio Phone Network access — 300 AI credits/mo" },
  premium_premium_monthly: { price: "39.00", frequency: "MONTH", title: "1 Call Premium — Monthly", product: "premium_subscription", tier: "premium", description: "Early-bird job alerts, priority medical consults, unlimited grocery list processing — 800 AI credits/mo" },
  premium_premium_annual: { price: "390.00", frequency: "YEAR", title: "1 Call Premium — Annual", product: "premium_subscription", tier: "premium", description: "Early-bird job alerts, priority medical consults, unlimited grocery list processing — 800 AI credits/mo" },
  premium_elite_monthly: { price: "79.00", frequency: "MONTH", title: "1 Call Elite — Monthly", product: "premium_subscription", tier: "elite", description: "Media library, AI music studio, advanced analytics — 2,000 AI credits/mo" },
  premium_elite_annual: { price: "790.00", frequency: "YEAR", title: "1 Call Elite — Annual", product: "premium_subscription", tier: "elite", description: "Media library, AI music studio, advanced analytics — 2,000 AI credits/mo" },
  premium_ultimate_monthly: { price: "149.00", frequency: "MONTH", title: "1 Call Ultimate — Monthly", product: "premium_subscription", tier: "ultimate", description: "Full platform access, creator tools, revenue share, advanced AI beat production — 5,000 AI credits/mo" },
  premium_ultimate_annual: { price: "1490.00", frequency: "YEAR", title: "1 Call Ultimate — Annual", product: "premium_subscription", tier: "ultimate", description: "Full platform access, creator tools, revenue share, advanced AI beat production — 5,000 AI credits/mo" },
  dating_plus_monthly: { price: "9.99", frequency: "MONTH", title: "1 Call Dating Plus — Monthly", product: "dating_subscription", tier: "plus", description: "Unlimited daily matches, see who liked you, voice intros on every profile" },
  dating_elite_monthly: { price: "19.99", frequency: "MONTH", title: "1 Call Dating Elite — Monthly", product: "dating_subscription", tier: "elite", description: "Everything in Plus, priority match placement, advanced filters, read receipts" },
};

Deno.serve(async (req) => {
  try {
    // Allowlist of legitimate post-payment return origins. The header is
    // caller-controlled, so never trust it blindly — fall back to the first
    // allowed origin if it's missing or points elsewhere (prevents open redirect).
    const ALLOWED_ORIGINS = [
      "https://www.dialbrowser.com",
      "https://dialbrowser.com",
    ];
    const headerOrigin = req.headers.get("X-Base44-App-Url");
    const origin = headerOrigin && ALLOWED_ORIGINS.includes(headerOrigin)
      ? headerOrigin
      : ALLOWED_ORIGINS[0];
    const body = await req.json();
    const { plan, user_id, user_email, user_name, forwarding_phone, employer_name, employer_email, job_listing_id, job_title, company } = body;

    // ── Promo code validation (applies discount to the checkout price) ──
    const promoClient = createClientFromRequest(req);
    let validatedPromo = null;
    if (body.promo_code) {
      const promoResult = await lookupPromoCode(promoClient, body.promo_code, plan);
      if (!promoResult.valid) {
        return Response.json({ error: promoResult.error }, { status: 400 });
      }
      validatedPromo = promoResult.promo;
      // used_count is NOT incremented here (spam-initiated checkouts would exhaust
      // limited-use codes). Instead a pending PromoRedemption is recorded against
      // the checkout session, and the cap is consumed atomically in the
      // wix-payments-webhook only after payment is confirmed.
    }
    const applyPromoDiscount = (priceInput) => {
      if (!validatedPromo) return priceInput;
      const original = typeof priceInput === "number" ? priceInput : parseFloat(priceInput);
      if (isNaN(original)) return priceInput;
      const { discountedPrice } = calculateDiscountedPrice(validatedPromo, original);
      return discountedPrice.toFixed(2);
    };

    if (!plan) {
      return Response.json({ error: "Missing required field: plan" }, { status: 400 });
    }

    // Employer access — one-time payment, no user account required
    if (plan === "employer_access") {
      if (!employer_name || !employer_email || !job_listing_id || !job_title || !company) {
        return Response.json({ error: "Missing required fields (employer_name, employer_email, job_listing_id, job_title, company)" }, { status: 400 });
      }

      const config = PRODUCTS[plan];
      const base44 = createClientFromRequest(req);

      // Create pending EmployerAccess record
      const record = await base44.asServiceRole.entities.EmployerAccess.create({
        employer_name,
        employer_email,
        job_listing_id,
        job_title,
        company,
        access_granted: false,
        checkout_id: "",
        price_paid: parseFloat(applyPromoDiscount(config.price)),
      });

      const checkoutBody = {
        cart: {
          items: [{
            name: config.title,
            quantity: 1,
            price: applyPromoDiscount(config.price),
            // No subscriptionInfo — one-time charge
          }],
          customerInfo: {
            email: employer_email,
            firstName: employer_name ? employer_name.split(" ")[0] : undefined,
            lastName: employer_name ? employer_name.split(" ").slice(1).join(" ") : undefined,
          },
        },
        callbackUrls: {
          postFlowUrl: `${origin}/#jobs`,
          thankYouPageUrl: `${origin}/thank-you`,
        },
      };

      const wixResponse = await fetch(
        "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Deno.env.get("WIX_PAYMENTS_API_KEY"),
            "wix-site-id": Deno.env.get("WIX_PAYMENTS_SITE_ID"),
          },
          body: JSON.stringify(checkoutBody),
        }
      );

      if (!wixResponse.ok) {
        const errText = await wixResponse.text();
        console.error("Wix checkout error (employer_access):", errText);
        try {
          await base44.asServiceRole.entities.EmployerAccess.delete(record.id);
        } catch { /* ignore */ }
        return Response.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
      }

      const data = await wixResponse.json();
      const checkoutSession = data.checkoutSession;

      await base44.asServiceRole.entities.EmployerAccess.update(record.id, {
        checkout_id: checkoutSession.id,
      });

      await recordPromoRedemption(base44, checkoutSession.id, validatedPromo);

      return Response.json({ redirectUrl: checkoutSession.redirectUrl });
    }

    // Creator tip — one-time payment, no user account required
    if (plan === "creator_tip") {
      const { amount, tipper_name, tipper_email, creator_name } = body;
      if (!amount || !tipper_name || !tipper_email) {
        return Response.json({ error: "Missing required fields (amount, tipper_name, tipper_email)" }, { status: 400 });
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0.50) {
        return Response.json({ error: "Minimum tip amount is $0.50" }, { status: 400 });
      }

      const config = PRODUCTS[plan];
      const checkoutBody = {
        cart: {
          items: [{
            name: `Tip for ${creator_name || "Creator"} — Live Stream Support`,
            quantity: 1,
            price: applyPromoDiscount(parsedAmount.toFixed(2)),
          }],
          customerInfo: {
            email: tipper_email,
            firstName: tipper_name ? tipper_name.split(" ")[0] : undefined,
            lastName: tipper_name ? tipper_name.split(" ").slice(1).join(" ") : undefined,
          },
        },
        callbackUrls: {
          postFlowUrl: `${origin}/`,
          thankYouPageUrl: `${origin}/thank-you`,
        },
      };

      const wixResponse = await fetch(
        "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Deno.env.get("WIX_PAYMENTS_API_KEY"),
            "wix-site-id": Deno.env.get("WIX_PAYMENTS_SITE_ID"),
          },
          body: JSON.stringify(checkoutBody),
        }
      );

      if (!wixResponse.ok) {
        const errText = await wixResponse.text();
        console.error("Wix checkout error (creator_tip):", errText);
        return Response.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
      }

      const data = await wixResponse.json();
      const checkoutSession = data.checkoutSession;

      await recordPromoRedemption(createClientFromRequest(req), checkoutSession.id, validatedPromo);

      return Response.json({ redirectUrl: checkoutSession.redirectUrl });
    }

    // Show share purchase — one-time payment, no user account required
    if (plan === "share_purchase") {
      const { show_title, creator_name, shares, show_share_id, buyer_name, buyer_email } = body;
      if (!show_title || !shares || !show_share_id || !buyer_name || !buyer_email) {
        return Response.json({ error: "Missing required fields (show_title, shares, show_share_id, buyer_name, buyer_email)" }, { status: 400 });
      }
      const numShares = parseInt(shares);
      if (isNaN(numShares) || numShares < 1) {
        return Response.json({ error: "Must purchase at least 1 share" }, { status: 400 });
      }

      const config = PRODUCTS[plan];
      const base44 = createClientFromRequest(req);

      // Price is read from the trusted ShowShare entity — NEVER from the client.
      // Accepting a client-supplied price_per_share would let an attacker pay a
      // fraction of the real price while the webhook still fulfills the shares.
      let showShare;
      try {
        showShare = await base44.asServiceRole.entities.ShowShare.get(show_share_id);
      } catch {
        return Response.json({ error: "Could not verify share offering" }, { status: 500 });
      }
      if (!showShare) {
        return Response.json({ error: "Show offering not found" }, { status: 404 });
      }
      const sharePrice = parseFloat(showShare.price_per_share);
      if (isNaN(sharePrice) || sharePrice <= 0) {
        return Response.json({ error: "Invalid share price set on this offering" }, { status: 400 });
      }
      const available = showShare.total_shares - showShare.shares_sold;
      if (numShares > available) {
        return Response.json({ error: `Only ${available} shares remaining` }, { status: 400 });
      }
      const totalAmount = numShares * sharePrice;
      if (totalAmount < 0.50) {
        return Response.json({ error: "Minimum purchase amount is $0.50" }, { status: 400 });
      }

      const checkoutBody = {
        cart: {
          items: [{
            name: `${numShares} Share${numShares > 1 ? "s" : ""} — ${show_title} (${creator_name || "Creator"})`,
            quantity: 1,
            price: applyPromoDiscount(totalAmount.toFixed(2)),
          }],
          customerInfo: {
            email: buyer_email,
            firstName: buyer_name ? buyer_name.split(" ")[0] : undefined,
            lastName: buyer_name ? buyer_name.split(" ").slice(1).join(" ") : undefined,
          },
        },
        callbackUrls: {
          postFlowUrl: `${origin}/#creators`,
          thankYouPageUrl: `${origin}/thank-you`,
        },
      };

      const wixResponse = await fetch(
        "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Deno.env.get("WIX_PAYMENTS_API_KEY"),
            "wix-site-id": Deno.env.get("WIX_PAYMENTS_SITE_ID"),
          },
          body: JSON.stringify(checkoutBody),
        }
      );

      if (!wixResponse.ok) {
        const errText = await wixResponse.text();
        console.error("Wix checkout error (share_purchase):", errText);
        return Response.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
      }

      const data = await wixResponse.json();
      const checkoutSession = data.checkoutSession;

      // Persist this purchase on its OWN SharePurchase record keyed by the
      // checkout id, instead of overwriting the shared checkout_id /
      // pending_shares fields on ShowShare. One record per purchase means
      // concurrent purchases of the same offering can no longer clobber each
      // other's checkout linkage (lost fulfillment / overselling).
      // Inventory (shares_sold / status) is NOT mutated here — it is applied
      // only when payment is confirmed in the wix-payments-webhook handler,
      // which re-validates availability atomically before crediting shares.
      try {
        await base44.asServiceRole.entities.SharePurchase.create({
          show_share_id,
          show_title,
          creator_name: creator_name || "",
          buyer_name,
          buyer_email,
          shares: numShares,
          price_per_share: sharePrice,
          total_amount: totalAmount,
          checkout_id: checkoutSession.id,
          status: "pending",
        });
      } catch (e) {
        console.error("create-checkout: failed to persist share purchase:", e.message);
        return Response.json({ error: "Failed to record your purchase. Please try again." }, { status: 500 });
      }

      await recordPromoRedemption(base44, checkoutSession.id, validatedPromo);

      return Response.json({ redirectUrl: checkoutSession.redirectUrl });
    }

    // ── Course enrollment — one-time, no login required (public) ──
    // The enrollment fee unlocks lessons + certificate. The buyer's email is
    // collected on the Wix checkout page; we do NOT ask for it twice. The
    // checkoutSession.id is the only link back to this Enrollment, so it is
    // set as soon as Wix returns it. Fulfillment (status -> paid) happens in
    // wix-payments-webhook.
    if (plan === "course_enrollment") {
      const { course_id } = body;
      if (!course_id) {
        return Response.json({ error: "Missing course_id" }, { status: 400 });
      }

      const courseBase44 = createClientFromRequest(req);
      let course;
      try {
        course = await courseBase44.asServiceRole.entities.Course.get(course_id);
      } catch {
        return Response.json({ error: "Course not found" }, { status: 404 });
      }
      if (!course) {
        return Response.json({ error: "Course not found" }, { status: 404 });
      }

      const price = parseFloat(course.price);
      if (!price || price < 0.50) {
        return Response.json({ error: "This course is not available for paid enrollment." }, { status: 400 });
      }

      // Best-effort: link to the logged-in member if a session exists, but do
      // NOT require auth — checkout is public per the payment integration rules.
      let ownerUserId = "";
      let ownerName = "";
      try {
        const me = await courseBase44.auth.me();
        if (me && me.id) { ownerUserId = me.id; ownerName = me.full_name || ""; }
      } catch { /* not logged in — public purchase */ }

      // ── Course referral: resolve the referrer behind a referral code and
      // apply a discount for the buyer. Self-referrals are refused. The
      // referrer is rewarded with call credits only after payment is confirmed
      // in wix-payments-webhook (idempotent via Enrollment.referral_rewarded).
      const referralCode = (body.referral_code || "").trim().toUpperCase();
      let referrerUserId = "";
      let referralDiscount = 0;
      let finalPrice = price;
      if (referralCode) {
        const ref = await resolveReferrerByCode(courseBase44, referralCode);
        if (ref && ref.referrerId && ref.referrerId !== ownerUserId) {
          referrerUserId = ref.referrerId;
          referralDiscount = Math.round(price * COURSE_REFERRAL_DISCOUNT_PCT) / 100;
          finalPrice = Math.max(0.5, Math.round((price - referralDiscount) * 100) / 100);
        }
      }

      const enrollment = await courseBase44.asServiceRole.entities.Enrollment.create({
        course_id,
        course_title: course.title,
        owner_user_id: ownerUserId,
        learner_name: ownerName,
        status: "pending",
        price_paid: finalPrice,
        checkout_id: "",
        referral_code: referrerUserId ? referralCode : "",
        referrer_user_id: referrerUserId,
        referral_discount_applied: referralDiscount,
      });

      const checkoutBody = {
        cart: {
          items: [{
            name: `${course.title} — Certified Course Enrollment`,
            quantity: 1,
            price: applyPromoDiscount(finalPrice.toFixed(2)),
          }],
          customerInfo: {},
        },
        callbackUrls: {
          postFlowUrl: `${origin}/courses/${course_id}`,
          thankYouPageUrl: `${origin}/thank-you`,
        },
      };

      const wixResponse = await fetch(
        "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Deno.env.get("WIX_PAYMENTS_API_KEY"),
            "wix-site-id": Deno.env.get("WIX_PAYMENTS_SITE_ID"),
          },
          body: JSON.stringify(checkoutBody),
        }
      );

      if (!wixResponse.ok) {
        const errText = await wixResponse.text();
        console.error("Wix checkout error (course_enrollment):", errText);
        try { await courseBase44.asServiceRole.entities.Enrollment.delete(enrollment.id); } catch { /* ignore */ }
        return Response.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
      }

      const data = await wixResponse.json();
      const checkoutSession = data.checkoutSession;

      await courseBase44.asServiceRole.entities.Enrollment.update(enrollment.id, {
        checkout_id: checkoutSession.id,
      });

      await recordPromoRedemption(courseBase44, checkoutSession.id, validatedPromo);

      return Response.json({ redirectUrl: checkoutSession.redirectUrl });
    }

    // ── User-bound plans require an authenticated session ──
    // The remaining plans read and mutate subscription records
    // using service-role privileges. The caller MUST be authenticated, and the
    // client-supplied user_id MUST match the authenticated user's own id.
    // Without this check, an unauthenticated caller could pass a victim's
    // user_id and create or modify records on their behalf (CWE-639 / CWE-285).
    const base44 = createClientFromRequest(req);
    let me;
    try {
      me = await base44.auth.me();
    } catch {
      return Response.json({ error: "Authentication required for this purchase." }, { status: 401 });
    }
    if (!me || !me.id) {
      return Response.json({ error: "Authentication required for this purchase." }, { status: 401 });
    }
    if (!user_id || user_id !== me.id) {
      return Response.json({ error: "You can only purchase for your own account." }, { status: 403 });
    }

    // Server-side voice-guard enforcement: if the caller has enabled the optional
    // voice-biometric guard, refuse checkout without a recent successful verify.
    const guardError = await enforceVoiceGuard(base44, me);
    if (guardError) return guardError;

    // ── Audiobook purchase — one-time, member-bound (unlocks full download) ──
    if (plan === "audiobook") {
      const { audiobook_id } = body;
      if (!audiobook_id) {
        return Response.json({ error: "Missing audiobook_id" }, { status: 400 });
      }

      let book;
      try {
        book = await base44.asServiceRole.entities.Audiobook.get(audiobook_id);
      } catch {
        return Response.json({ error: "Audiobook not found" }, { status: 404 });
      }
      if (!book) {
        return Response.json({ error: "Audiobook not found" }, { status: 404 });
      }

      // Price is read from the trusted Audiobook entity — never from the client.
      const price = parseFloat(book.price);
      if (!price || price < 0.50) {
        return Response.json({ error: "This audiobook is not available for purchase." }, { status: 400 });
      }

      // Idempotency: a member who already owns it should not buy it again.
      const alreadyOwned = await base44.asServiceRole.entities.AudiobookPurchase.filter(
        { audiobook_id, owner_user_id: me.id, status: "paid" },
        "-created_date",
        1
      );
      if (alreadyOwned && alreadyOwned.length > 0) {
        return Response.json({ error: "You already own this audiobook." }, { status: 400 });
      }

      const record = await base44.asServiceRole.entities.AudiobookPurchase.create({
        owner_user_id: me.id,
        audiobook_id,
        audiobook_title: book.title,
        price_paid: price,
        checkout_id: "",
        status: "pending",
      });

      const checkoutBody = {
        cart: {
          items: [{
            name: `${book.title} — ${book.author || "Audiobook"}`,
            quantity: 1,
            price: applyPromoDiscount(price.toFixed(2)),
          }],
          customerInfo: {
            email: me.email,
            firstName: me.full_name ? me.full_name.split(" ")[0] : undefined,
            lastName: me.full_name ? me.full_name.split(" ").slice(1).join(" ") : undefined,
          },
        },
        callbackUrls: {
          postFlowUrl: `${origin}/library`,
          thankYouPageUrl: `${origin}/thank-you`,
        },
      };

      const wixResponse = await fetch(
        "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Deno.env.get("WIX_PAYMENTS_API_KEY"),
            "wix-site-id": Deno.env.get("WIX_PAYMENTS_SITE_ID"),
          },
          body: JSON.stringify(checkoutBody),
        }
      );

      if (!wixResponse.ok) {
        const errText = await wixResponse.text();
        console.error("Wix checkout error (audiobook):", errText);
        try { await base44.asServiceRole.entities.AudiobookPurchase.delete(record.id); } catch { /* ignore */ }
        return Response.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
      }

      const data = await wixResponse.json();
      const checkoutSession = data.checkoutSession;

      await base44.asServiceRole.entities.AudiobookPurchase.update(record.id, {
        checkout_id: checkoutSession.id,
      });

      await recordPromoRedemption(base44, checkoutSession.id, validatedPromo);

      return Response.json({ redirectUrl: checkoutSession.redirectUrl });
    }

    const config = PRODUCTS[plan];
    if (!config) {
      return Response.json({ error: "Invalid plan." }, { status: 400 });
    }

    // Premium platform subscription
    if (config.product === "premium_subscription") {
      const existing = await base44.asServiceRole.entities.Subscription.filter(
        { owner_user_id: user_id, subscription_active: true },
        "-created_date",
        5
      );
      if (existing && existing.length > 0) {
        return Response.json({ error: "You already have an active subscription. Cancel it first to switch plans." }, { status: 400 });
      }

      const record = await base44.asServiceRole.entities.Subscription.create({
        owner_user_id: user_id,
        owner_name: user_name || "Member",
        owner_email: user_email || "",
        tier: config.tier,
        plan: config.frequency === "YEAR" ? "annual" : "monthly",
        subscription_active: false,
        checkout_id: "",
        subscription_id: "",
        subscription_status: "pending",
      });

      const checkoutBody = {
        cart: {
          items: [{
            name: config.title,
            quantity: 1,
            price: applyPromoDiscount(config.price),
            subscriptionInfo: {
              subscriptionSettings: { frequency: config.frequency },
              title: config.title,
              description: config.description,
            },
          }],
          customerInfo: {
            email: user_email,
            firstName: user_name ? user_name.split(" ")[0] : undefined,
            lastName: user_name ? user_name.split(" ").slice(1).join(" ") : undefined,
          },
        },
        callbackUrls: {
          postFlowUrl: `${origin}/dashboard`,
          thankYouPageUrl: `${origin}/thank-you`,
        },
      };

      const wixResponse = await fetch(
        "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Deno.env.get("WIX_PAYMENTS_API_KEY"),
            "wix-site-id": Deno.env.get("WIX_PAYMENTS_SITE_ID"),
          },
          body: JSON.stringify(checkoutBody),
        }
      );

      if (!wixResponse.ok) {
        const errText = await wixResponse.text();
        console.error("Wix checkout error (premium_subscription):", errText);
        try {
          await base44.asServiceRole.entities.Subscription.delete(record.id);
        } catch { /* ignore */ }
        return Response.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
      }

      const data = await wixResponse.json();
      const checkoutSession = data.checkoutSession;

      await base44.asServiceRole.entities.Subscription.update(record.id, {
        checkout_id: checkoutSession.id,
      });

      await recordPromoRedemption(base44, checkoutSession.id, validatedPromo);

      return Response.json({ redirectUrl: checkoutSession.redirectUrl });
    }

    // 1 Call Dating subscription (Plus / Elite)
    if (config.product === "dating_subscription") {
      const existing = await base44.asServiceRole.entities.DatingSubscription.filter(
        { created_by_id: user_id, status: "active" },
        "-created_date",
        5
      );
      if (existing && existing.length > 0) {
        return Response.json({ error: "You already have an active dating subscription." }, { status: 400 });
      }

      const record = await base44.asServiceRole.entities.DatingSubscription.create({
        tier: config.tier,
        status: "pending",
        checkout_session_id: "",
        started_at: new Date().toISOString(),
        created_by_id: user_id,
      });

      const checkoutBody = {
        cart: {
          items: [{
            name: config.title,
            quantity: 1,
            price: applyPromoDiscount(config.price),
            subscriptionInfo: {
              subscriptionSettings: { frequency: config.frequency },
              title: config.title,
              description: config.description,
            },
          }],
          customerInfo: {
            email: user_email,
            firstName: user_name ? user_name.split(" ")[0] : undefined,
            lastName: user_name ? user_name.split(" ").slice(1).join(" ") : undefined,
          },
        },
        callbackUrls: {
          postFlowUrl: `${origin}/dating-dashboard`,
          thankYouPageUrl: `${origin}/thank-you`,
        },
      };

      const wixResponse = await fetch(
        "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Deno.env.get("WIX_PAYMENTS_API_KEY"),
            "wix-site-id": Deno.env.get("WIX_PAYMENTS_SITE_ID"),
          },
          body: JSON.stringify(checkoutBody),
        }
      );

      if (!wixResponse.ok) {
        const errText = await wixResponse.text();
        console.error("Wix checkout error (dating_subscription):", errText);
        try {
          await base44.asServiceRole.entities.DatingSubscription.delete(record.id);
        } catch { /* ignore */ }
        return Response.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
      }

      const data = await wixResponse.json();
      const checkoutSession = data.checkoutSession;

      await base44.asServiceRole.entities.DatingSubscription.update(record.id, {
        checkout_session_id: checkoutSession.id,
      });

      await recordPromoRedemption(base44, checkoutSession.id, validatedPromo);

      return Response.json({ redirectUrl: checkoutSession.redirectUrl });
    }

    // SMS Calendar subscription
    if (config.product === "sms_calendar_subscription") {
      const existing = await base44.asServiceRole.entities.SmsCalendarSubscription.filter(
        { owner_user_id: user_id },
        "-created_date",
        5
      );
      if (existing && existing.length > 0) {
        return Response.json({ error: "You already have an SMS Calendar subscription record." }, { status: 400 });
      }

      const record = await base44.asServiceRole.entities.SmsCalendarSubscription.create({
        owner_user_id: user_id,
        owner_name: user_name || "Member",
        subscription_active: false,
        plan: plan === "sms_calendar_annual" ? "annual" : "monthly",
        checkout_id: "",
        subscription_id: "",
        subscription_status: "pending",
      });

      const checkoutBody = {
        cart: {
          items: [{
            name: config.title,
            quantity: 1,
            price: applyPromoDiscount(config.price),
            subscriptionInfo: {
              subscriptionSettings: { frequency: config.frequency },
              title: config.title,
              description: "Schedule SMS and email messages to multiple contacts with delivery alerts",
            },
          }],
          customerInfo: {
            email: user_email,
            firstName: user_name ? user_name.split(" ")[0] : undefined,
            lastName: user_name ? user_name.split(" ").slice(1).join(" ") : undefined,
          },
        },
        callbackUrls: {
          postFlowUrl: `${origin}/dashboard`,
          thankYouPageUrl: `${origin}/thank-you`,
        },
      };

      const wixResponse = await fetch(
        "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Deno.env.get("WIX_PAYMENTS_API_KEY"),
            "wix-site-id": Deno.env.get("WIX_PAYMENTS_SITE_ID"),
          },
          body: JSON.stringify(checkoutBody),
        }
      );

      if (!wixResponse.ok) {
        const errText = await wixResponse.text();
        console.error("Wix checkout error (sms_calendar):", errText);
        try {
          await base44.asServiceRole.entities.SmsCalendarSubscription.delete(record.id);
        } catch { /* ignore */ }
        return Response.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
      }

      const data = await wixResponse.json();
      const checkoutSession = data.checkoutSession;

      await base44.asServiceRole.entities.SmsCalendarSubscription.update(record.id, {
        checkout_id: checkoutSession.id,
      });

      await recordPromoRedemption(base44, checkoutSession.id, validatedPromo);

      return Response.json({ redirectUrl: checkoutSession.redirectUrl });
    }

  } catch (error) {
    console.error("create-checkout error:", error.message);
    return Response.json({ error: "Something went wrong creating your checkout. Please try again." }, { status: 500 });
  }
});