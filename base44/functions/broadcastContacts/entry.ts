import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";
import { normalizePhone } from "../../shared/smsAuth.ts";
import { ensureEntitlement, resolveTier, remainingSms } from "../../shared/phoneMetering.ts";

// Broadcast SMS to the caller's own address-book contacts.
// This is metered exactly like the dialer SMS / voice-note share to prevent it
// acting as an unmetered SMS relay: recipients must be pre-existing contacts
// (age-gated), capped per call, and every sent message is decremented from the
// caller's monthly SMS entitlement.
const MAX_RECIPIENTS_PER_BROADCAST = 50;
const MIN_CONTACT_AGE_MS = 30 * 1000;
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

    // Meter against the caller's phone entitlement — same gate as the dialer.
    const tier = await resolveTier(base44, user.id);
    const entitlement = await ensureEntitlement(base44, user.id, tier);
    if (!entitlement.disclaimer_acknowledged) {
      return Response.json({ error: 'Please accept the non-emergency disclaimer before broadcasting.', needsDisclaimer: true }, { status: 403 });
    }

    // Recipients must be the caller's own contacts (RLS-scoped) and must have
    // existed before this request (blocks "add number then immediately relay").
    let contacts = [];
    try { contacts = await base44.entities.Contact.list("-created_date", 500); } catch { /* none */ }
    if (!contacts || contacts.length === 0) {
      return Response.json({ error: 'No contacts found. Add contacts to your address book first.' }, { status: 400 });
    }

    const now = Date.now();
    const eligible = (Array.isArray(contacts) ? contacts : []).filter((c) => {
      const ph = normalizePhone(c.phone);
      if (!ph) return false;
      const created = c.created_date ? new Date(c.created_date).getTime() : 0;
      return (now - created) >= MIN_CONTACT_AGE_MS;
    });

    if (eligible.length === 0) {
      return Response.json({ error: 'Recipients must be contacts you added before this broadcast.' }, { status: 400 });
    }
    if (eligible.length > MAX_RECIPIENTS_PER_BROADCAST) {
      return Response.json({ error: `You can broadcast to at most ${MAX_RECIPIENTS_PER_BROADCAST} contacts at once.` }, { status: 400 });
    }

    const remaining = remainingSms(entitlement);
    if (remaining < eligible.length) {
      return Response.json({ error: 'You do not have enough monthly SMS to send this broadcast. Upgrade or buy a top-up.', needsUpgrade: true }, { status: 402 });
    }

    const userName = user.full_name || user.email || 'A 1 Call Away member';
    const fullMessage = `📢 ${userName}: ${String(message).trim()}`;

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

    // Meter every successfully delivered SMS against the monthly cap.
    if (sentCount > 0) {
      try {
        await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, {
          sms_used: (entitlement.sms_used || 0) + sentCount,
        });
      } catch (e) {
        console.error('broadcastContacts: failed to meter SMS usage:', e.message);
      }
    }

    try {
      await base44.asServiceRole.entities.AppNotification.create({
        notification_type: 'sms_alert',
        title: 'Broadcast Sent',
        message: `Your message was sent to ${sentCount} of ${eligible.length} contacts.`,
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
    console.error('broadcastContacts error:', error.message);
    return Response.json({ error: 'Something went wrong sending your broadcast. Please try again.' }, { status: 500 });
  }
});