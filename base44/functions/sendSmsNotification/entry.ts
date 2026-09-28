import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { authorizeSmsDispatch } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { notification_type, recipient_name, recipient_phone, related_name, event_date, event_location } = body;

    if (!notification_type || !recipient_name || !recipient_phone) {
      return Response.json({ error: 'Missing required fields: notification_type, recipient_name, recipient_phone' }, { status: 400 });
    }

    // Require an authenticated caller; non-admins may only send to their own registered phone.
    const auth = await authorizeSmsDispatch(base44, recipient_phone, true);
    if (auth.error) return auth.error;

    // Generate SMS message body based on notification type
    let title = '';
    let message_body = '';

    if (notification_type === 'new_match') {
      title = 'New Dating Match!';
      message_body = `1 CALL AWAY: You have a new match with ${related_name || 'someone'}! You both liked each other. Reply CHAT to start your private conversation, or dial *520# to open 1 Call Dating. Your phone number stays private.`;
    } else if (notification_type === 'new_message') {
      title = 'New Voice Message';
      message_body = `1 CALL AWAY: You received a new voice message from ${related_name || 'a member'}. Dial *520# to listen and reply securely. Your number is never shared.`;
    } else if (notification_type === 'event_starting') {
      const dateStr = event_date ? new Date(event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'soon';
      const locStr = event_location ? ` at ${event_location}` : '';
      title = 'Event Starting Soon';
      message_body = `1 CALL AWAY: Reminder — "${related_name || 'Your event'}" is coming up on ${dateStr}${locStr}. Dial *600# for event details and directions. Don't miss out!`;
    } else {
      return Response.json({ error: 'Invalid notification_type. Use: new_match, new_message, or event_starting' }, { status: 400 });
    }

    // Create the notification record via user-context client (RLS enforced, created_by_id set to caller)
    const notification = await base44.entities.SmsNotification.create({
      notification_type,
      recipient_name,
      recipient_phone,
      title,
      message_body,
      related_name: related_name || '',
      status: 'pending',
      read: false,
    });

    // Deliver the actual SMS via Twilio
    const sms = await sendTwilioSms(recipient_phone, message_body);
    try {
      await base44.entities.SmsNotification.update(notification.id, { status: sms.status });
    } catch { /* best-effort status update */ }

    return Response.json({
      success: sms.success,
      notification_id: notification.id,
      sms_message: message_body,
      title,
      sms_delivered: sms.success,
      sms_error: sms.success ? undefined : sms.error,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});