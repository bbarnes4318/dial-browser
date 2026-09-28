import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * sendBookingReceipt — creates an SMS receipt notification when a user
 * finalizes a service booking (callback request) through the Dial Browser.
 * Invoked by the BookingReceiptNotifier workflow on CallbackRequest creation.
 *
 * The workflow trigger has no live user session, so ownership is verified
 * via the CallbackRequest record (created under RLS by an authenticated
 * member) and the member's registered phone number — not base44.auth.me().
 */
import { sendTwilioSms } from "../../shared/twilioSms.ts";

function normalizePhone(p) {
  return String(p || "").replace(/[^0-9]/g, "");
}

// Strip URLs, control characters, and excess length from caller-supplied
// free-text fields before they are interpolated into an SMS body. Prevents
// the receipt from being used as a phishing/relay channel.
function sanitizeText(value, maxLen) {
  let s = String(value || "");
  // Remove URLs (http(s)://, www., and bare domain-like tokens) to block phishing links.
  s = s.replace(/https?:\/\/\S+/gi, "").replace(/www\.\S+/gi, "");
  s = s.replace(/[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?/gi, (m) => /\s/.test(m) ? m : "");
  // Remove control characters (keep newlines/spaces).
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return s.trim().slice(0, maxLen);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { callback_request_id, provider_name, caller_name, caller_phone, service_needed, preferred_time } = body;

    if (!caller_name || !caller_phone || !provider_name) {
      return Response.json({ error: "Missing required fields (caller_name, caller_phone, provider_name)" }, { status: 400 });
    }

    // Resolve the acting caller. The workflow trigger carries no user session.
    let actingUser = null;
    try { actingUser = await base44.auth.me(); } catch { /* workflow / service-role context */ }

    let ownerId = null;
    if (actingUser && actingUser.role === "admin") {
      // Admins may trigger receipts for any booking (support / operations).
      ownerId = actingUser.id;
    } else if (callback_request_id) {
      // Verify ownership via the CallbackRequest (created under RLS), then
      // confirm the caller IS the booking owner and the receipt phone matches
      // the member's registered number.
      const cb = await base44.asServiceRole.entities.CallbackRequest.get(callback_request_id);
      if (!cb) {
        return Response.json({ error: "Callback request not found" }, { status: 404 });
      }
      ownerId = cb.created_by_id || null;
      if (!ownerId) {
        return Response.json({ error: "Booking has no verified owner" }, { status: 403 });
      }
      // Explicit ownership check: only the booking owner (or an admin) may
      // trigger a receipt for this booking — prevents a non-owner who merely
      // knows the record id from texting the owner's registered phone.
      if (!actingUser || actingUser.id !== ownerId) {
        return Response.json({ error: "Not authorized: you can only receive a receipt for your own booking." }, { status: 403 });
      }
      const members = await base44.asServiceRole.entities.Member.filter({ created_by_id: ownerId });
      const member = members && members[0];
      const memberPhone = member && member.phone ? normalizePhone(member.phone) : null;
      if (!memberPhone || normalizePhone(caller_phone) !== memberPhone) {
        return Response.json({ error: "Recipient phone must match the booking owner's registered number" }, { status: 403 });
      }
    } else {
      return Response.json({ error: "Not authorized: could not verify booking ownership" }, { status: 403 });
    }

    const timeLabels = {
      asap: "as soon as possible",
      morning: "in the morning",
      afternoon: "in the afternoon",
      evening: "in the evening",
      flexible: "at a convenient time",
    };
    const timeLabel = timeLabels[preferred_time] || "at a convenient time";

    // Sanitize caller-supplied free text before it lands in the SMS body.
    const safeProvider = sanitizeText(provider_name, 80) || "the provider";
    const safeService = sanitizeText(service_needed, 160) || "General service";

    const title = "Booking Confirmation";
    const message_body = `1 CALL AWAY: Your service booking with ${safeProvider} is confirmed! Service requested: ${safeService}. ${safeProvider} will call you back ${timeLabel}. Keep this message as your receipt. Dial *700# for updates.`;

    const notification = await base44.asServiceRole.entities.SmsNotification.create({
      notification_type: "booking_receipt",
      recipient_name: caller_name,
      recipient_phone: caller_phone,
      title,
      message_body,
      related_name: provider_name,
      status: "pending",
      read: false,
    });

    // Deliver the actual SMS receipt via Twilio
    const sms = await sendTwilioSms(caller_phone, message_body);
    try {
      await base44.asServiceRole.entities.SmsNotification.update(notification.id, { status: sms.status });
    } catch (e) {
      console.error("Could not update receipt status:", e.message);
    }

    // Mark the callback as confirmed — ownership already verified above.
    if (callback_request_id) {
      try {
        await base44.asServiceRole.entities.CallbackRequest.update(callback_request_id, {
          status: "confirmed",
        });
      } catch (e) {
        console.error("Could not update callback status:", e.message);
      }
    }

    console.log(`Booking receipt ${sms.success ? "delivered" : "failed"} to ${caller_name} (${caller_phone}) for ${provider_name}${sms.error ? " — " + sms.error : ""}`);

    return Response.json({
      success: sms.success,
      notification_id: notification.id,
      message: message_body,
      sms_delivered: sms.success,
      sms_error: sms.success ? undefined : sms.error,
    });
  } catch (error) {
    console.error("sendBookingReceipt error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}