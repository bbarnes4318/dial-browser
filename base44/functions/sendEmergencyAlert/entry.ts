import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { latitude, longitude, accuracy } = body;

    // Fetch all active emergency contacts for this user
    const contacts = await base44.entities.EmergencyContact.filter({ active: true }, '-created_date', 50);

    if (!contacts || contacts.length === 0) {
      return Response.json({ error: 'No active emergency contacts found. Add emergency contacts first.' }, { status: 400 });
    }

    const userName = user.full_name || user.email || 'A 1 Call Away member';

    // Build location string
    let locationStr = 'Location unavailable';
    if (latitude != null && longitude != null) {
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const accStr = accuracy ? ` (±${Math.round(accuracy)}m accuracy)` : '';
      locationStr = `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}${accStr} — ${mapsUrl}`;
    }

    const title = 'EMERGENCY DISTRESS ALERT';
    const message_body = `🚨 EMERGENCY ALERT from ${userName}. They triggered a distress signal from 1 Call Away and may need help. Last known location: ${locationStr}. Please try to reach them or contact local authorities if needed.`;

    // Create SmsNotification for each contact and deliver via Twilio
    const results = await Promise.all(contacts.map(async (contact) => {
      try {
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'emergency_alert',
          recipient_name: contact.name,
          recipient_phone: contact.phone,
          title,
          message_body,
          related_name: userName,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(contact.phone, message_body);
        try {
          await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status });
        } catch { /* best-effort */ }
        return {
          contact: contact.name,
          phone: contact.phone,
          success: sms.success,
          sms_delivered: sms.success,
          sms_error: sms.success ? undefined : sms.error,
          notification_id: notif.id,
        };
      } catch (err) {
        return { contact: contact.name, phone: contact.phone, success: false, error: err.message };
      }
    }));

    // Also create an AppNotification for the user's own feed
    const sentCount = results.filter((r) => r.success).length;
    try {
      await base44.asServiceRole.entities.AppNotification.create({
        notification_type: 'system',
        title: 'Emergency Alert Sent',
        message: `Distress signal sent to ${sentCount} of ${contacts.length} emergency contact${contacts.length === 1 ? '' : 's'}.${locationStr !== 'Location unavailable' ? ' Location included.' : ' No location available.'}`,
        priority: 'high',
        read: false,
      });
    } catch { /* non-critical */ }

    return Response.json({
      success: true,
      contacts_notified: sentCount,
      total_contacts: contacts.length,
      results,
      location: locationStr,
      message: message_body,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});