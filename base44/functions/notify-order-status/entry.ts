import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

/**
 * notify-order-status — updates a FoodOrder, TransportBooking, or
 * MerchantOrder status and alerts the customer by SMS when it changes.
 * Called from the merchant / admin dashboard when an order's status
 * advances (placed → confirmed → delivered, draft → placed, etc.).
 *
 * Authorization: the caller must be an admin or the order's creator
 * (merchants own their MerchantOrders; customers own their FoodOrders
 * and TransportBookings). Service role is used only to read/update the
 * order and to send the SMS, after the code-level ownership check.
 */

const ENTITIES = {
  FoodOrder: "FoodOrder",
  TransportBooking: "TransportBooking",
  MerchantOrder: "MerchantOrder",
};

const STATUS_MESSAGES = {
  // FoodOrder
  placed: "Your food order has been placed and is being prepared.",
  confirmed: "Your food order has been confirmed by the restaurant.",
  out_for_delivery: "Your food order is out for delivery and on its way.",
  delivered: "Your food order has been delivered. Enjoy!",
  cancelled: "Your food order has been cancelled.",
  // TransportBooking
  draft: "Your transport booking is being processed.",
  placed: "Your transport booking has been placed.",
  confirmed: "Your transport booking is confirmed.",
  completed: "Your transport trip has been completed. Thanks for riding with 1 Call Away!",
  // MerchantOrder
  fired: "Your phone-in order has been sent to the kitchen.",
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const entityType = body?.entityType;
    const orderId = body?.orderId;
    const newStatus = body?.newStatus;
    const customMessage = body?.customMessage;

    if (!entityType || !orderId || !newStatus || !ENTITIES[entityType]) {
      return Response.json({ error: "Missing or invalid entityType, orderId, or newStatus" }, { status: 400 });
    }

    // Load the order via service role (RLS would block cross-owner reads).
    const order = await base44.asServiceRole.entities[entityType].get(orderId);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    // Ownership check before any mutation.
    if (user.role !== "admin" && order.created_by_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the status if it actually changed.
    if (order.status !== newStatus) {
      await base44.asServiceRole.entities[entityType].update(orderId, { status: newStatus });
    }

    // Compose the customer-facing message.
    const msg = customMessage || STATUS_MESSAGES[newStatus] || `Your ${entityType} status is now: ${newStatus}.`;
    const smsText = `1 CALL AWAY: ${msg}`;

    // Send the SMS to the customer (best-effort, non-blocking on errors).
    let smsResult = null;
    if (order.caller_phone) {
      try {
        smsResult = await sendTwilioSms(order.caller_phone, smsText);
      } catch (e) {
        console.error("notify-order-status SMS failed:", e.message);
      }
    }

    // Log a SmsNotification record for the user's history.
    try {
      await base44.asServiceRole.entities.SmsNotification.create({
        notification_type: "status_update",
        recipient_name: order.customer_name || "Customer",
        recipient_phone: order.caller_phone || "",
        title: `${entityType} status update`,
        message_body: smsText,
        related_name: order.restaurant_name || order.provider_name || order.merchant_id || "",
        status: smsResult?.success ? "sent" : "failed",
      });
    } catch (e) {
      console.error("notify-order-status log failed:", e.message);
    }

    return Response.json({ success: true, status: newStatus, notified: smsResult?.success === true });
  } catch (error) {
    console.error("notify-order-status error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}