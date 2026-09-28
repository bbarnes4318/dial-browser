import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";
import { normalizePhone } from "../../shared/smsAuth.ts";
import { ensureEntitlement, resolveTier, remainingSms } from "../../shared/phoneMetering.ts";

// Broadcast SMS to the caller's active emergency contacts. Metered the same
// way as the dialer SMS / voice-note share so it cannot act as an open relay:
// capped per call, and every sent message is decremented from the caller's
// monthly SMS entitlement.
const MAX_RECIPIENTS_PER_BROADCAST = 50;
const MAX_MESSAGE_LEN = 500;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { message } = body;
    if (!message || !String(message).trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }
    if (String(message).trim().length > MAX_MESSAGE_LEN) {
      return Response.json({ error: `Message must be ${MAX_MESSAGE_LEN} characters or less` }, { status: 400 });
    }

    // Meter against the caller's phone entitlement.
    const tier = await resolveTier(base44, user.id);
    const entitlement = await ensureEntitlement(base44, user.id, tier);
    if (!entitlement.disclaimer_acknowledged) {
      return Response.json({ error: 'Please accept the non-emergency disclaimer before broadcasting.', needsDisclaimer: true }, { status: 403 });
    }

    const contacts = await base44.entities.EmergencyContact.filter({ active: true }, '-created_date', 50);
    if (!contacts || contacts.length === 0) {
      return Response.json({ error: 'No active emergency contacts found. Add contacts first.' }, { status: 400 });
    }

    const eligible = (Array.isArray(contacts) ? contacts : []).slice(0, MAX_RECIPIENTS_PER_BROADCAST);
    if (eligible.length > MAX_RECIPIENTS_PER_BROADCAST) {
      return Response.json({ error: `You can broadcast to at most ${MAX_RECIPIENTS_PER_BROADCAST} contacts at once.` }, { status: 400 });
    }

    const remaining = remainingSms(entitlement);
    if (remaining < eligible.length) {
      return Response.json({ error: 'You do not have enough monthly SMS to send this broadcast. Upgrade or buy a top-up.', needsUpgrade: true }, { status: 402 });
    }

    const userName = user.full_name || user.email || 'A 1 Call Away member';
    const fullMessage = `📢 Message from ${userName}: ${String(message).trim()}`;

    const results = await Promise.all(eligible.map(async (contact) => {
      try {
        const phone = normalizePhone(contact.phone);
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'emergency_alert',
          recipient_name: contact.name,
          recipient_phone: phone,
          title: 'Broadcast Message',
          message_body: fullMessage,
          related_name: userName,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(phone, fullMessage);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        return { contact: contact.name, phone, success: sms.success, sms_error: sms.success ? undefined : sms.error };
      } catch (err) {
        return { contact: contact.name, phone: normalizePhone(contact.phone), success: false, error: 'Send failed' };
      }
    }));

    const sentCount = results.filter((r) => r.success).length;

    if (sentCount > 0) {
      try {
        await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, {
          sms_used: (entitlement.sms_used || 0) + sentCount,
        });
      } catch (e) {
        console.error('broadcastEmergencyContacts: failed to meter SMS usage:', e.message);
      }
    }

    try {
      await base44.asServiceRole.entities.AppNotification.create({
        notification_type: 'sms_alert',
        title: 'Broadcast Sent',
        message: `Your message was sent to ${sentCount} of ${eligible.length} emergency contacts.`,
        priority: 'normal',
        read: false,
      });
    } catch { /* non-critical */ }

    return Response.json({
      success: true,
      contacts_notified: sentCount,
      total_contacts: eligible.length,
      results,
    });
  } catch (error) {
    console.error('broadcastEmergencyContacts error:', error.message);
    return Response.json({ error: 'Something went wrong sending your broadcast. Please try again.' }, { status: 500 });
  }
});