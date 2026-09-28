import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";
import { postOrderToMerchantWebhook } from "../../shared/merchantDispatch.ts";
import { twimlEscape, normPhone } from "../../shared/twilioVoice.ts";

/**
 * merchant-order — voice-first phone-in order dispatch for enrolled merchants.
 *
 * A customer dials the merchant's existing published number, which forwards
 * to the shared 1 Call Away line. This function (reached via a Redirect from
 * the inbound entry when ForwardedFrom matches an enrolled merchant, or when
 * the caller says the restaurant name) identifies the merchant, takes the
 * spoken order, reads it back for confirmation, and on "yes" auto-fires the
 * structured order to the merchant's dispatch webhook. The merchant's staff
 * cancel-contact number gets a 60-second "reply CANCEL" SMS safety window.
 *
 * State is threaded across Twilio <Gather> turns via the MerchantOrder draft
 * record keyed by CallSid (the `step` field drives the state machine).
 */

function genCode() {
  return "MD-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function gatherTwiml(sayText, orderUrl) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${twimlEscape(sayText)}</Say>
  <Gather input="speech" action="${twimlEscape(orderUrl)}" method="POST" speechTimeout="auto" language="en-US"></Gather>
</Response>`;
}

export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const speech = (params.get("SpeechResult") || "").trim();
    const from = (params.get("From") || "").trim();
    const callSid = params.get("CallSid") || "";
    const forwardedFrom = (params.get("ForwardedFrom") || "").trim();

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const orderUrl = `${base}/functions/merchant-order`;
    const routeUrl = `${base}/functions/voice-route`;

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // ── Turn 1: initial inbound call (no speech yet) → identify the merchant ──
    if (!speech) {
      let merchant = null;
      if (forwardedFrom) {
        const ff = normPhone(forwardedFrom);
        const matches = await svc.entities.MerchantDispatch.filter({ active: true }, "-created_date", 50);
        merchant = matches.find((m) => normPhone(m.public_phone) === ff) || null;
      }

      if (merchant) {
        if (merchant.staff_online === false) {
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, ${twimlEscape(merchant.merchant_name)} isn't accepting phone-in orders right now. Please call back later.</Say>
  <Redirect method="POST">${twimlEscape(routeUrl)}</Redirect>
</Response>`;
          return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
        }
        await svc.entities.MerchantOrder.create({
          call_sid: callSid,
          caller_phone: from,
          merchant_id: merchant.id,
          owner_user_id: merchant.created_by_id,
          items_json: "[]",
          order_type: "pickup",
          customer_name: "",
          notes: "",
          confirmation_code: "",
          step: "awaiting_order",
          status: "draft",
          webhook_status: "pending",
          fired_at: "",
          cancel_window_expires_at: "",
        });
        const twiml = gatherTwiml(
          `Thanks for calling ${merchant.merchant_name}. Tell me your order — what would you like, and is it pickup or delivery?`,
          orderUrl
        );
        return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }

      // No merchant identified from forwarding → ask the caller to say the name
      await svc.entities.MerchantOrder.create({
        call_sid: callSid,
        caller_phone: from,
        merchant_id: "",
        owner_user_id: "",
        items_json: "[]",
        order_type: "pickup",
        customer_name: "",
        notes: "",
        confirmation_code: "",
        step: "identify_merchant",
        status: "draft",
        webhook_status: "pending",
        fired_at: "",
        cancel_window_expires_at: "",
      });
      const twiml = gatherTwiml(
        "Thanks for calling the 1 Call Away order line. Which restaurant are you ordering from?",
        orderUrl
      );
      return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // ── Speech present → resume the draft by CallSid ──
    const drafts = await svc.entities.MerchantOrder.filter(
      { call_sid: callSid, status: "draft" },
      "-created_date",
      5
    );
    const draft = drafts && drafts[0];
    if (!draft) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, I lost your order. Please call back to start again.</Say>
</Response>`;
      return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Step: identify_merchant → fuzzy-match the spoken restaurant name
    if (draft.step === "identify_merchant") {
      const merchants = await svc.entities.MerchantDispatch.filter({ active: true }, "-created_date", 100);
      const list = merchants.map((m) => ({ id: m.id, name: m.merchant_name, created_by_id: m.created_by_id }));
      const llmRes = await svc.integrations.Core.InvokeLLM({
        prompt: `A caller said their restaurant is: "${speech.slice(0, 200)}". Match it to one of these enrolled restaurants by best fuzzy match. Restaurants: ${JSON.stringify(list.map((n) => n.name))}. Return JSON with merchant_id (the id from the list, or empty string if no good match), matched_name, and confidence (high/medium/low).`,
        response_json_schema: {
          type: "object",
          properties: {
            merchant_id: { type: "string" },
            matched_name: { type: "string" },
            confidence: { type: "string" },
          },
        },
      });
      const mid = llmRes?.merchant_id || "";
      const merchant = merchants.find((m) => m.id === mid);
      const conf = String(llmRes?.confidence || "").toLowerCase();
      if (!merchant || conf === "low" || !mid) {
        const twiml = gatherTwiml(
          "I couldn't find that restaurant on our order line. Can you say the name again?",
          orderUrl
        );
        return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }
      if (merchant.staff_online === false) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, ${twimlEscape(merchant.merchant_name)} isn't accepting phone-in orders right now. Please call back later.</Say>
  <Redirect method="POST">${twimlEscape(routeUrl)}</Redirect>
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }
      await svc.entities.MerchantOrder.update(draft.id, {
        merchant_id: merchant.id,
        owner_user_id: merchant.created_by_id,
        step: "awaiting_order",
      });
      const twiml = gatherTwiml(
        `Got it, ${merchant.merchant_name}. Tell me your order — what would you like, and is it pickup or delivery?`,
        orderUrl
      );
      return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Step: awaiting_order → parse the spoken order into structured items
    if (draft.step === "awaiting_order") {
      const llmRes = await svc.integrations.Core.InvokeLLM({
        prompt: `A customer called a restaurant to place an order. Their spoken order: "${speech.slice(0, 600)}". Extract a structured order. Return JSON with: items (array of { name, qty }), order_type ("pickup" or "delivery"), customer_name (the caller's name if they said it, else empty string), notes (special instructions, else empty string).`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { type: "object", properties: { name: { type: "string" }, qty: { type: "number" } } },
            },
            order_type: { type: "string" },
            customer_name: { type: "string" },
            notes: { type: "string" },
          },
        },
      });
      const items = Array.isArray(llmRes?.items) ? llmRes.items : [];
      const orderType = String(llmRes?.order_type || "pickup").toLowerCase() === "delivery" ? "delivery" : "pickup";
      const customerName = llmRes?.customer_name || "";
      const notes = llmRes?.notes || "";
      await svc.entities.MerchantOrder.update(draft.id, {
        items_json: JSON.stringify(items),
        order_type: orderType,
        customer_name: customerName,
        notes,
        step: "confirm",
      });
      const itemsReadable = items.map((i) => `${i.qty || 1} ${i.name}`).join(", ");
      const namePart = customerName ? ` for ${customerName}` : "";
      const twiml = gatherTwiml(
        `I heard: ${itemsReadable}, for ${orderType}${namePart}. Is that correct?`,
        orderUrl
      );
      return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Step: confirm → fire the order or restart
    if (draft.step === "confirm") {
      const affirm = /\b(yes|yeah|yep|correct|right|sure|ok|okay|confirm|that'?s right)\b/i.test(speech);
      if (!affirm) {
        await svc.entities.MerchantOrder.update(draft.id, { step: "awaiting_order" });
        const twiml = gatherTwiml(
          "No problem. Tell me your order again — what would you like?",
          orderUrl
        );
        return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }

      // Fire the order
      const merchant = draft.merchant_id ? await svc.entities.MerchantDispatch.get(draft.merchant_id) : null;
      if (!merchant) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, I couldn't find the restaurant. Please call back.</Say>
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
      }

      const code = genCode();
      const now = new Date();
      const expires = new Date(now.getTime() + 60 * 1000);
      const items = JSON.parse(draft.items_json || "[]");

      const payload = {
        order_id: draft.id,
        confirmation_code: code,
        merchant_id: merchant.id,
        customer_phone: draft.caller_phone,
        customer_name: draft.customer_name,
        items,
        order_type: draft.order_type,
        notes: draft.notes || "",
        fired_at: now.toISOString(),
      };

      // Best-effort webhook POST — do not block the caller on success
      const delivery = await postOrderToMerchantWebhook(
        merchant.dispatch_webhook_url,
        merchant.webhook_secret,
        payload
      );

      await svc.entities.MerchantOrder.update(draft.id, {
        status: "fired",
        confirmation_code: code,
        webhook_status: delivery.ok ? "delivered" : "failed",
        fired_at: now.toISOString(),
        cancel_window_expires_at: expires.toISOString(),
        step: "fired",
      });

      const itemsShort = items.map((i) => `${i.qty || 1}x ${i.name}`).join(", ").slice(0, 100);
      const callerName = draft.customer_name || "a caller";

      // 60-second cancel window SMS to merchant staff
      if (merchant.cancel_sms_number) {
        try {
          await sendTwilioSms(
            merchant.cancel_sms_number,
            `1 CALL AWAY: New order ${code} from ${callerName} - ${itemsShort}. Reply CANCEL within 60s to void.`
          );
        } catch (e) {
          console.error("merchant-order: staff cancel SMS failed:", e.message);
        }
      }

      // SMS receipt to the caller
      if (from) {
        try {
          await sendTwilioSms(
            from,
            `1 CALL AWAY: Your order ${code} at ${merchant.merchant_name} (${draft.order_type}) is confirmed. Items: ${itemsShort}. Changed your mind? Reply CANCEL within 60s to void it.`
          );
        } catch (e) {
          console.error("merchant-order: caller receipt SMS failed:", e.message);
        }
      }

      const spokenCode = code.split("").join(" ");
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Your order is confirmed. Your confirmation code is ${twimlEscape(spokenCode)}. We sent you a text with the details. Thanks for calling ${twimlEscape(merchant.merchant_name)}!</Say>
</Response>`;
      return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
    }

    // Unknown step fallback
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, something went wrong. Please call back.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  } catch (error) {
    console.error("merchant-order error:", error.message);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Sorry, something went wrong on our end. Please try again in a moment.</Say>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=UTF-8" } });
  }
}