import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { command_text, latitude, longitude, accuracy } = body;

    if (!command_text) return Response.json({ error: 'Command text is required' }, { status: 400 });

    // Find the user's SOS contact (primary contact, or first active contact as fallback)
    const contacts = await base44.entities.EmergencyContact.filter({ active: true }, '-created_date', 50);

    if (!contacts || contacts.length === 0) {
      return Response.json({ error: 'No emergency contacts found. Add an SOS contact in your dashboard first.' }, { status: 400 });
    }

    const sosContact = contacts.find((c) => c.is_primary) || contacts[0];
    const userName = user.full_name || user.email || 'A 1 Call Away member';

    // Build location string
    let locationStr = 'Location unavailable';
    if (latitude != null && longitude != null) {
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const accStr = accuracy ? ` (±${Math.round(accuracy)}m accuracy)` : '';
      locationStr = `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}${accStr} — ${mapsUrl}`;
    }

    const message_body = `🚨 SOS ALERT from ${userName}. They triggered an emergency voice command: "${command_text}". This was sent automatically from 1 Call Away. Last known location: ${locationStr}. Please check on them immediately or contact local authorities if needed.`;

    try {
      const notif = await base44.asServiceRole.entities.SmsNotification.create({
        notification_type: 'emergency_alert',
        recipient_name: sosContact.name,
        recipient_phone: sosContact.phone,
        title: 'SOS VOICE ALERT',
        message_body,
        related_name: userName,
        status: 'sent',
        read: false,
      });

      // Actually deliver the SMS via Twilio (safety-critical).
      const sms = await sendTwilioSms(sosContact.phone, message_body);
      if (!sms.success) {
        try {
          await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: 'failed' });
        } catch { /* status update is best-effort */ }
      }

      // Also create an AppNotification for the user's feed
      try {
        await base44.asServiceRole.entities.AppNotification.create({
          notification_type: 'system',
          title: sms.success ? 'SOS Alert Sent' : 'SOS Alert Failed to Send',
          message: sms.success
            ? `Emergency voice command detected. SOS alert sent to ${sosContact.name} (${sosContact.phone}).`
            : `SOS alert to ${sosContact.name} could not be delivered (${sms.error}). Add a verified contact number or check Twilio config.`,
          priority: 'high',
          read: false,
        });
      } catch { /* non-critical */ }

      return Response.json({
        success: sms.success,
        contact_notified: sosContact.name,
        contact_phone: sosContact.phone,
        notification_id: notif.id,
        location: locationStr,
        message: message_body,
        sms_delivered: sms.success,
        sms_error: sms.success ? undefined : sms.error,
      });
    } catch (err) {
      return Response.json({ error: 'Failed to send SOS alert: ' + err.message }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});