import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";
import { postOrderToMerchantWebhook } from "../../shared/merchantDispatch.ts";

/**
 * merchant-cancel-sms — inbound Twilio SMS webhook for the 60-second cancel
 * window. Two paths share one reply keyword ("CANCEL"):
 *
 *  1. Merchant staff reply CANCEL to the order-alert SMS → cancels the most
 *     recent fired order for that merchant still within its window.
 *  2. Customer replies CANCEL to their order-receipt SMS → cancels their own
 *     most recent fired order still within its window.
 *
 * Both paths POST a cancel event to the merchant's dispatch webhook, mark the
 * order cancelled, and SMS the other party. Idempotent against duplicate
 * replies.
 */

const normPhone = (p) => (p || "").replace(/[^0-9]/g, "");

async function cancelOrder(svc, order, merchant, triggeredBy) {
  // Idempotent — already cancelled
  if (order.status === "cancelled") return true;

  const payload = {
    order_id: order.id,
    confirmation_code: order.confirmation_code,
    merchant_id: merchant.id,
    event: "cancel",
    cancelled_by: triggeredBy,
    cancelled_at: new Date().toISOString(),
  };
  try {
    await postOrderToMerchantWebhook(merchant.dispatch_webhook_url, merchant.webhook_secret, payload);
  } catch (e) {
    console.error("merchant-cancel-sms: webhook post failed:", e.message);
  }

  await svc.entities.MerchantOrder.update(order.id, {
    status: "cancelled",
    webhook_status: "cancelled",
  });
  return false;
}

export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const from = (params.get("From") || "").trim();
    const body = (params.get("Body") || "").trim();

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Only act on replies containing CANCEL
    if (!/cancel/i.test(body)) {
      return new Response("<Response></Response>", {
        headers: { "Content-Type": "text/xml; charset=UTF-8" },
      });
    }

    const ff = normPhone(from);
    const now = Date.now();

    // ── Path 1: staff cancel (from == merchant cancel_sms_number) ──
    const merchants = await svc.entities.MerchantDispatch.filter({ active: true }, "-created_date", 100);
    const merchant = merchants.find((m) => normPhone(m.cancel_sms_number) === ff);
    if (merchant) {
      const orders = await svc.entities.MerchantOrder.filter(
        { merchant_id: merchant.id, status: "fired" },
        "-fired_at",
        20
      );
      const order = orders.find(
        (o) => o.cancel_window_expires_at && new Date(o.cancel_window_expires_at).getTime() > now
      );
      if (!order) {
        try {
          await sendTwilioSms(from, "1 CALL AWAY: No active order to cancel (the 60s window has passed).");
        } catch (e) {
          console.error("merchant-cancel-sms: no-window SMS failed:", e.message);
        }
        return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }

      const already = await cancelOrder(svc, order, merchant, "staff");
      if (already) {
        return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }

      // Notify the caller their order was voided
      if (order.caller_phone) {
        try {
          await sendTwilioSms(
            order.caller_phone,
            `1 CALL AWAY: Your order ${order.confirmation_code} at ${merchant.merchant_name} was cancelled by the restaurant. Please call back to reorder.`
          );
        } catch (e) {
          console.error("merchant-cancel-sms: caller notify failed:", e.message);
        }
      }
      try {
        await sendTwilioSms(from, `1 CALL AWAY: Order ${order.confirmation_code} cancelled.`);
      } catch (e) {
        console.error("merchant-cancel-sms: staff confirm failed:", e.message);
      }
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // ── Path 2: customer cancel (from == order.caller_phone) ──
    const callerOrders = await svc.entities.MerchantOrder.filter(
      { status: "fired" },
      "-fired_at",
      50
    );
    const order = callerOrders.find(
      (o) => normPhone(o.caller_phone) === ff && o.cancel_window_expires_at && new Date(o.cancel_window_expires_at).getTime() > now
    );
    if (order) {
      const cm = order.merchant_id
        ? await svc.entities.MerchantDispatch.get(order.merchant_id).catch(() => null)
        : null;
      if (!cm) {
        try {
          await sendTwilioSms(from, "1 CALL AWAY: We couldn't locate the restaurant for that order.");
        } catch (e) {
          console.error("merchant-cancel-sms: customer no-merchant SMS failed:", e.message);
        }
        return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }

      const already = await cancelOrder(svc, order, cm, "customer");
      if (already) {
        try {
          await sendTwilioSms(from, `1 CALL AWAY: Order ${order.confirmation_code} was already cancelled.`);
        } catch (e) {
          console.error("merchant-cancel-sms: already-cancelled SMS failed:", e.message);
        }
        return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }

      // Notify merchant staff the customer cancelled
      if (cm.cancel_sms_number) {
        try {
          await sendTwilioSms(
            cm.cancel_sms_number,
            `1 CALL AWAY: Customer cancelled order ${order.confirmation_code}. No action needed.`
          );
        } catch (e) {
          console.error("merchant-cancel-sms: staff notify failed:", e.message);
        }
      }
      try {
        await sendTwilioSms(from, `1 CALL AWAY: Your order ${order.confirmation_code} at ${cm.merchant_name} is cancelled. Call back anytime to reorder.`);
      } catch (e) {
        console.error("merchant-cancel-sms: customer confirm failed:", e.message);
      }
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // No matching active order for this sender
    try {
      await sendTwilioSms(from, "1 CALL AWAY: No active order found to cancel. The 60s window may have passed.");
    } catch (e) {
      console.error("merchant-cancel-sms: no-match SMS failed:", e.message);
    }
    return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  } catch (error) {
    console.error("merchant-cancel-sms error:", error.message);
    return new Response("Error", { status: 500 });
  }
}