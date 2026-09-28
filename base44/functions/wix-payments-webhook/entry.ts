import jwt from "npm:jsonwebtoken@9.0.2";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { consumePromoCode } from "../../shared/promoCode.ts";
import { awardCallCredits, COURSE_REFERRAL_CREDITS, MAX_COURSE_REFERRALS } from "../../shared/courseReferral.ts";

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const publicKey = Deno.env.get("WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");

    if (!publicKey) {
      console.error("Missing WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
      return new Response("Missing public key", { status: 500 });
    }

    let rawPayload;
    try {
      rawPayload = jwt.verify(rawBody, publicKey, { algorithms: ["RS256"] });
    } catch (err) {
      console.error("JWT verification failed:", err.message);
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawPayload.data);
    const eventData = JSON.parse(event.data);

    const base44 = createClientFromRequest(req);

    if (event.eventType === "wix.ecom.v1.order_approved") {
      const order = eventData.actionEvent.body.order;
      const checkoutId = order.checkoutId;

      console.log(`Order approved for checkout: ${checkoutId}`);

      let subscriptionId = "";
      for (const lineItem of order.lineItems) {
        if (lineItem.subscriptionInfo) {
          subscriptionId = lineItem.subscriptionInfo.id;
          break;
        }
      }

      let matched = false;

      // ── DatingSubscription (dating plus/elite) — matched by checkout_session_id ──
      // The like-limit gate in create-dating-like reads status === "active", so this
      // activation is what actually unlocks unlimited likes for paying members.
      if (!matched) {
        let datingSubs = await base44.asServiceRole.entities.DatingSubscription.filter(
          { checkout_session_id: checkoutId },
          "-created_date",
          5
        );

        if (datingSubs && datingSubs.length > 0) {
          const ds = datingSubs[0];
          // Idempotent — only activate if not already active (Wix redelivers, sometimes concurrently)
          if (ds.status !== "active") {
            await base44.asServiceRole.entities.DatingSubscription.update(ds.id, {
              status: "active",
              subscription_id: subscriptionId,
              started_at: ds.started_at || new Date().toISOString(),
            });
            console.log(`Activated DatingSubscription tier ${ds.tier} for user ${ds.created_by_id}`);
          } else {
            console.log(`DatingSubscription ${ds.id} already active — skipping (idempotent)`);
          }
          matched = true;
        }
      }

      // ── SmsCalendarSubscription — matched by checkout_id ──
      if (!matched) {
        let smsSubs = await base44.asServiceRole.entities.SmsCalendarSubscription.filter(
          { checkout_id: checkoutId },
          "-created_date",
          5
        );

        if (smsSubs && smsSubs.length > 0) {
          const sub = smsSubs[0];
          await base44.asServiceRole.entities.SmsCalendarSubscription.update(sub.id, {
            subscription_active: true,
            subscription_id: subscriptionId,
            subscription_status: "active",
          });
          console.log(`Activated SmsCalendarSubscription for user ${sub.owner_user_id}`);
          matched = true;
        }
      }

      // ── EmployerAccess (one-time) — matched by checkout_id ──
      if (!matched) {
        let empAccess = await base44.asServiceRole.entities.EmployerAccess.filter(
          { checkout_id: checkoutId },
          "-created_date",
          5
        );

        if (empAccess && empAccess.length > 0) {
          const ea = empAccess[0];
          await base44.asServiceRole.entities.EmployerAccess.update(ea.id, {
            access_granted: true,
          });
          console.log(`Activated EmployerAccess for ${ea.employer_email}, job: ${ea.job_title}`);
          matched = true;
        }
      }

      // ── Subscription (premium platform) — matched by checkout_id ──
      if (!matched) {
        let subs = await base44.asServiceRole.entities.Subscription.filter(
          { checkout_id: checkoutId },
          "-created_date",
          5
        );

        if (subs && subs.length > 0) {
          const sub = subs[0];
          await base44.asServiceRole.entities.Subscription.update(sub.id, {
            subscription_active: true,
            subscription_id: subscriptionId,
            subscription_status: "active",
          });
          console.log(`Activated Subscription tier ${sub.tier} for user ${sub.owner_user_id}`);
          matched = true;
        }
      }

      // ── ConstructionProvider (contractor listing) — matched by checkout_id ──
      if (!matched) {
        let contractors = await base44.asServiceRole.entities.ConstructionProvider.filter(
          { checkout_id: checkoutId },
          "-created_date",
          5
        );

        if (contractors && contractors.length > 0) {
          const c = contractors[0];
          await base44.asServiceRole.entities.ConstructionProvider.update(c.id, {
            active: true,
            subscription_id: subscriptionId,
          });
          console.log(`Activated ConstructionProvider ${c.company_name}`);
          matched = true;

          // Fire contractor availability alerts to matching subscribers
          try {
            const alertResult = await base44.asServiceRole.functions.invoke("sendContractorAlert", {
              provider_id: c.id,
              company_name: c.company_name,
              specialties: c.specialties || [],
              region: c.region,
              city: c.city,
              state: c.state,
              phone: c.phone,
              dial_code: c.dial_code || "*700#",
            });
            console.log(`Contractor alerts sent: ${alertResult?.data?.alerts_sent || 0}`);
          } catch (alertErr) {
            console.error("Failed to send contractor alerts:", alertErr.message);
          }

          // Fire category alerts to subscribers who want new construction provider notifications
          try {
            const catAlertResult = await base44.asServiceRole.functions.invoke("sendCategoryProviderAlert", {
              category: "construction",
              provider_name: c.company_name,
              provider_description: c.description || [c.city, c.state].filter(Boolean).join(", "),
              region: c.region,
              phone: c.phone,
              dial_code: c.dial_code || "*700#",
            });
            console.log(`Category alerts sent: ${catAlertResult?.data?.alerts_sent || 0}`);
          } catch (catAlertErr) {
            console.error("Failed to send category alerts:", catAlertErr.message);
          }
        }
      }

      // ── SharePurchase (show share — one-time) — matched by checkout_id ──
      // Each purchase has its own SharePurchase row, so concurrent purchases
      // never overwrite each other's checkout linkage. Inventory is credited
      // only after re-validating availability against the live ShowShare, so
      // concurrent payments cannot oversell the offering.
      if (!matched) {
        let purchases = await base44.asServiceRole.entities.SharePurchase.filter(
          { checkout_id: checkoutId },
          "-created_date",
          5
        );

        if (purchases && purchases.length > 0) {
          const purchase = purchases[0];
          // Idempotent — only fulfill a pending purchase (Wix may redeliver).
          if (purchase.status === "pending") {
            try {
              const showShare = await base44.asServiceRole.entities.ShowShare.get(purchase.show_share_id);
              if (showShare) {
                const sold = showShare.shares_sold || 0;
                const total = showShare.total_shares || 0;
                const shares = purchase.shares || 0;
                if (sold + shares > total) {
                  // Oversold — the availability snapshot at checkout is stale.
                  // Do not credit shares; flag for manual refund.
                  console.error(`SharePurchase ${purchase.id} oversold offering ${showShare.id}: ${sold}+${shares} > ${total}`);
                  await base44.asServiceRole.entities.SharePurchase.update(purchase.id, {
                    status: "failed",
                  });
                } else {
                  const newSold = sold + shares;
                  const newStatus = newSold >= total ? "sold_out" : showShare.status;
                  await base44.asServiceRole.entities.ShowShare.update(showShare.id, {
                    shares_sold: newSold,
                    status: newStatus,
                  });
                  await base44.asServiceRole.entities.SharePurchase.update(purchase.id, {
                    status: "paid",
                    fulfilled_at: new Date().toISOString(),
                  });
                  console.log(`Confirmed ${shares} shares for "${showShare.show_title}" (purchase ${purchase.id}), total sold: ${newSold}/${total}`);
                }
              } else {
                console.error(`SharePurchase ${purchase.id}: offering ${purchase.show_share_id} not found`);
                await base44.asServiceRole.entities.SharePurchase.update(purchase.id, { status: "failed" });
              }
            } catch (e) {
              console.error(`SharePurchase ${purchase.id} fulfillment error:`, e.message);
            }
          }
          matched = true;
        }
      }

      // ── Enrollment (course enrollment — one-time) — matched by checkout_id ──
      // Unlocks course lessons + certificate eligibility once payment is
      // confirmed. Idempotent — only fulfills a pending enrollment (Wix
      // redelivers). owner_email is captured from the Wix order so public
      // buyers (no account) can still receive their certificate.
      if (!matched) {
        let enrollments = await base44.asServiceRole.entities.Enrollment.filter(
          { checkout_id: checkoutId },
          "-created_date",
          5
        );

        if (enrollments && enrollments.length > 0) {
          const en = enrollments[0];
          if (en.status === "pending") {
            // Capture the buyer's email/name from the Wix order for public buyers.
            const buyerEmail = order.billingInfo?.email || order.contactInfo?.email || "";
            const buyerName = order.billingInfo?.firstName || order.contactInfo?.firstName || "";
            await base44.asServiceRole.entities.Enrollment.update(en.id, {
              status: "paid",
              owner_email: en.owner_email || buyerEmail || "",
              learner_name: en.learner_name || (buyerName ? `${buyerName} ${order.billingInfo?.lastName || ""}`.trim() : ""),
              paid_at: new Date().toISOString(),
            });
            console.log(`Unlocked course enrollment "${en.course_title}" for ${buyerEmail || en.owner_user_id}`);

            // ── Course referral reward: if this enrollment used a referral
            // code, award the referrer call credits (idempotent — gated on
            // enrollment.referral_rewarded and a per-referrer lifetime cap).
            if (en.referral_code && en.referrer_user_id && !en.referral_rewarded) {
              try {
                const allForReferrer = await base44.asServiceRole.entities.Referral.filter(
                  { referrer_user_id: en.referrer_user_id }, "-created_date", 200
                );
                const completedCount = (allForReferrer || []).filter(
                  (r) => r.status === "completed" || r.status === "rewarded"
                ).length;
                if (completedCount < MAX_COURSE_REFERRALS) {
                  await awardCallCredits(base44, en.referrer_user_id, COURSE_REFERRAL_CREDITS);
                  await base44.asServiceRole.entities.Referral.create({
                    referrer_user_id: en.referrer_user_id,
                    referral_code: en.referral_code,
                    referred_email: en.owner_email || buyerEmail || "",
                    referred_name: en.learner_name || "",
                    service_shared: `course:${en.course_title}`,
                    status: "rewarded",
                    credits_earned: COURSE_REFERRAL_CREDITS,
                  });
                  await base44.asServiceRole.entities.Enrollment.update(en.id, { referral_rewarded: true });
                  console.log(`Course referral rewarded: ${COURSE_REFERRAL_CREDITS} credits to ${en.referrer_user_id}`);
                } else {
                  console.log(`Course referral cap reached for ${en.referrer_user_id} — no reward`);
                }
              } catch (e) {
                console.error("Course referral reward failed:", e.message);
              }
            }
          }
          matched = true;
        }
      }

      // ── AudiobookPurchase (one-time) — matched by checkout_id ──
      // Unlocks the full audiobook download for the purchasing member once payment
      // is confirmed. Idempotent — only fulfills a pending purchase (Wix redelivers).
      if (!matched) {
        let abPurchases = await base44.asServiceRole.entities.AudiobookPurchase.filter(
          { checkout_id: checkoutId },
          "-created_date",
          5
        );

        if (abPurchases && abPurchases.length > 0) {
          const p = abPurchases[0];
          if (p.status === "pending") {
            await base44.asServiceRole.entities.AudiobookPurchase.update(p.id, {
              status: "paid",
              purchased_at: new Date().toISOString(),
            });
            console.log(`Unlocked audiobook "${p.audiobook_title}" for user ${p.owner_user_id}`);
          }
          matched = true;
        }
      }

      if (!matched) {
        console.warn(`No matching record found for checkout_id: ${checkoutId}`);
      }

      // ── Promo code usage accounting — consume one use now that payment is
      // confirmed. Idempotent: only consumes when the redemption is still
      // "pending", so Wix redelivers never double-count. The PromoCode.used_count
      // increment is bounded by max_uses via optimistic concurrency
      // (see shared/promoCode.ts consumePromoCode).
      try {
        const redemptions = await base44.asServiceRole.entities.PromoRedemption.filter(
          { checkout_id: checkoutId },
          "-created_date",
          5
        );
        if (redemptions && redemptions.length > 0) {
          const r = redemptions[0];
          if (r.status === "pending") {
            await consumePromoCode(base44, r.promo_code_id);
            await base44.asServiceRole.entities.PromoRedemption.update(r.id, {
              status: "consumed",
              consumed_at: new Date().toISOString(),
            });
            console.log(`Consumed promo ${r.promo_code} for checkout ${checkoutId}`);
          }
        }
      } catch (e) {
        console.error("Promo redemption consumption failed:", e.message);
      }
    } else if (
      event.eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_canceled" ||
      event.eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_expired"
    ) {
      const subscriptionContract = eventData.actionEvent.body.subscriptionContract;
      const subscriptionId = subscriptionContract.id;
      const isCanceled = event.eventType.includes("canceled");

      console.log(`Subscription ${isCanceled ? "canceled" : "expired"}: ${subscriptionId}`);

      let matched = false;

      // ── DatingSubscription — matched by subscription_id ──
      if (!matched) {
        let datingSubs = await base44.asServiceRole.entities.DatingSubscription.filter(
          { subscription_id: subscriptionId },
          "-created_date",
          5
        );

        if (datingSubs && datingSubs.length > 0) {
          const sub = datingSubs[0];
          await base44.asServiceRole.entities.DatingSubscription.update(sub.id, {
            status: isCanceled ? "canceled" : "expired",
          });
          console.log(`Deactivated DatingSubscription tier ${sub.tier} for user ${sub.created_by_id}`);
          matched = true;
        }
      }

      // ── SmsCalendarSubscription — matched by subscription_id ──
      if (!matched) {
        let smsSubs = await base44.asServiceRole.entities.SmsCalendarSubscription.filter(
          { subscription_id: subscriptionId },
          "-created_date",
          5
        );

        if (smsSubs && smsSubs.length > 0) {
          const sub = smsSubs[0];
          await base44.asServiceRole.entities.SmsCalendarSubscription.update(sub.id, {
            subscription_active: false,
            subscription_status: isCanceled ? "canceled" : "expired",
          });
          console.log(`Deactivated SmsCalendarSubscription for user ${sub.owner_user_id}`);
          matched = true;
        }
      }

      // ── Subscription (premium platform) — matched by subscription_id ──
      if (!matched) {
        let subs = await base44.asServiceRole.entities.Subscription.filter(
          { subscription_id: subscriptionId },
          "-created_date",
          5
        );

        if (subs && subs.length > 0) {
          const sub = subs[0];
          await base44.asServiceRole.entities.Subscription.update(sub.id, {
            subscription_active: false,
            subscription_status: isCanceled ? "canceled" : "expired",
          });
          console.log(`Deactivated Subscription tier ${sub.tier} for user ${sub.owner_user_id}`);
          matched = true;
        }
      }

      // ── ConstructionProvider — matched by subscription_id ──
      if (!matched) {
        let contractors = await base44.asServiceRole.entities.ConstructionProvider.filter(
          { subscription_id: subscriptionId },
          "-created_date",
          5
        );

        if (contractors && contractors.length > 0) {
          const c = contractors[0];
          await base44.asServiceRole.entities.ConstructionProvider.update(c.id, {
            active: false,
          });
          console.log(`Deactivated ConstructionProvider ${c.company_name}`);
          matched = true;
        }
      }

      if (!matched) {
        console.warn(`No matching record found for subscription_id: ${subscriptionId}`);
      }
    } else {
      console.log(`Unhandled event type: ${event.eventType}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response("Error", { status: 500 });
  }
});