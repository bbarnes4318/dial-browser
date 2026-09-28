import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

// Invoked by the ServiceStatusAlert workflow when a ServiceRequest transitions
// to "action_needed" (the "active" state). Sends a customized SMS notification
// to the requester confirming their service request is now active.
//
// NOTE: This app has no SMS telephony gateway (no Twilio/1-800 provisioning),
// so "sending an SMS" is modeled as creating an SmsNotification record — the
// app's representation of an SMS alert delivered to the member's notification
// center / SMS feed, consistent with sendBookingReceipt and sendCompletionReceipt.
//
// Runs under the service role (triggered by a workflow), so there is no user
// session to validate. Instead we guard by requiring a valid request_id that
// resolves to an actual ServiceRequest in an active state.

const SERVICE_LABELS = {
  medical: "Medical",
  dental: "Dental",
  real_estate: "Real Estate",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Gate dispatch to an authenticated admin (workflow carries an admin session).
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    const body = await req.json().catch(() => ({}));
    const requestId = body?.request_id;

    if (!requestId) {
      return Response.json({ error: "request_id is required" }, { status: 400 });
    }

    // Fetch the service request (service role — workflows carry no user session)
    let request = null;
    try {
      request = await base44.asServiceRole.entities.ServiceRequest.get(requestId);
    } catch {
      // get() throws when the record doesn't exist
    }
    if (!request) {
      return Response.json({ error: "Service request not found" }, { status: 404 });
    }

    const phone = (request.requester_phone || "").trim();
    if (!phone) {
      return Response.json({ skipped: true, reason: "No requester phone on file" });
    }

    const name = request.requester_name || "Member";
    const serviceLabel = SERVICE_LABELS[request.service_type] || request.service_type || "Service";
    const shortDetails = (request.details || "").slice(0, 80);

    // Customized SMS body — confirms the request is now active
    const messageBody =
      `1 CALL AWAY: Hi ${name}, your ${serviceLabel} request is now ACTIVE. ` +
      `A provider is reviewing your request${shortDetails ? ` ("${shortDetails}…")` : ""}. ` +
      `You'll receive updates as it progresses. Reply or call back for changes.`;

    // Persist the SMS notification, then deliver via Twilio
    const notification = await base44.asServiceRole.entities.SmsNotification.create({
      notification_type: "status_update",
      recipient_name: name,
      recipient_phone: phone,
      title: `${serviceLabel} request now active`,
      message_body: messageBody,
      related_name: serviceLabel,
      status: "pending",
      read: false,
    });
    const sms = await sendTwilioSms(phone, messageBody);
    try { await base44.asServiceRole.entities.SmsNotification.update(notification.id, { status: sms.status }); } catch { /* best-effort */ }

    return Response.json({
      ok: sms.success,
      notification_id: notification.id,
      recipient: phone,
      service_type: request.service_type,
      sms_delivered: sms.success,
      sms_error: sms.success ? undefined : sms.error,
    });
  } catch (error) {
    console.error("sendServiceStatusAlert error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});