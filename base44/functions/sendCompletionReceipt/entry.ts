import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { authorizeSmsDispatch } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { record_id, service_type, requester_name, requester_phone, details, ai_notes, ai_urgency } = body;

    if (!service_type || !requester_name || !requester_phone) {
      return Response.json({ error: 'Missing required fields: service_type, requester_name, requester_phone' }, { status: 400 });
    }

    // Require an authenticated caller; non-admins may only send to their own registered phone
    const auth = await authorizeSmsDispatch(base44, requester_phone, true);
    if (auth.error) return auth.error;

    // Build the completion receipt message based on service type
    const typeLabel = service_type === 'medical' ? 'Medical'
      : service_type === 'dental' ? 'Dental'
      : service_type === 'real_estate' ? 'Real Estate'
      : service_type.charAt(0).toUpperCase() + service_type.slice(1);

    const dialCode = service_type === 'medical' ? '*301#'
      : service_type === 'dental' ? '*302#'
      : service_type === 'real_estate' ? '*500#'
      : '*110#';

    const urgencyLine = ai_urgency ? ` Urgency assessed: ${ai_urgency}.` : '';
    const notesLine = ai_notes ? ` Summary: ${ai_notes.substring(0, 150)}` : '';

    const title = `${typeLabel} Request Completed`;
    const message_body = `1 CALL AWAY: Your ${typeLabel.toLowerCase()} service request has been completed.${urgencyLine}${notesLine} Dial ${dialCode} to review your full report. Receipt ID: ${(record_id || '').slice(-8).toUpperCase() || 'N/A'}. Thank you for using 1 Call Away.`;

    // Create the SMS notification record, then deliver via Twilio
    const notification = await base44.asServiceRole.entities.SmsNotification.create({
      notification_type: 'status_update',
      recipient_name: requester_name,
      recipient_phone: requester_phone,
      title,
      message_body,
      related_name: service_type,
      status: 'pending',
      read: false,
    });
    const sms = await sendTwilioSms(requester_phone, message_body);
    try { await base44.asServiceRole.entities.SmsNotification.update(notification.id, { status: sms.status }); } catch { /* best-effort */ }

    return Response.json({
      success: sms.success,
      notification_id: notification.id,
      sms_message: message_body,
      title,
      service_type,
      record_id: record_id || '',
      sms_delivered: sms.success,
      sms_error: sms.success ? undefined : sms.error,
    });
  } catch (error) {
    console.error('sendCompletionReceipt error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});