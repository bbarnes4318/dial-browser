import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { normalizePhone } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";
import { ensureEntitlement, resolveTier, remainingSms } from "../../shared/phoneMetering.ts";

const MAX_RECIPIENTS_PER_SHARE = 10;
// Contacts must have existed for at least this long before they can be
// used as a voice-note share recipient — blocks the "add number as a
// contact then immediately relay SMS to it" abuse pattern.
const MIN_CONTACT_AGE_MS = 30 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { voice_note_title, transcript, contacts } = body;

    if (!transcript || !contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return Response.json({ error: 'Missing required fields: transcript, contacts (array of {name, phone})' }, { status: 400 });
    }
    // Bound the message body length so it can't be used as an arbitrary-length relay.
    const safeTranscript = String(transcript).slice(0, 1000);

    // Require an authenticated caller. Recipients must be the caller's own
    // contacts (RLS-scoped) so this can't act as an open SMS relay to arbitrary numbers.
    const caller = await base44.auth.me();
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Meter against the caller's phone entitlement — same gate as the dialer SMS.
    const tier = await resolveTier(base44, caller.id);
    const entitlement = await ensureEntitlement(base44, caller.id, tier);
    if (!entitlement.disclaimer_acknowledged) {
      return Response.json({ error: 'Please accept the non-emergency disclaimer before sharing a voice note.', needsDisclaimer: true }, { status: 403 });
    }

    let myContacts = [];
    try {
      myContacts = await base44.entities.Contact.list("-created_date", 500);
    } catch { /* no contacts */ }

    const now = Date.now();
    // Map normalized phone -> contact, but only for contacts that pre-existed this
    // request by at least MIN_CONTACT_AGE_MS (prevents same-request relay whitelisting).
    const allowedPhones = new Map();
    for (const c of (myContacts || [])) {
      const ph = normalizePhone(c.phone);
      if (!ph) continue;
      const created = c.created_date ? new Date(c.created_date).getTime() : 0;
      if (now - created < MIN_CONTACT_AGE_MS) continue; // too fresh — ignore
      allowedPhones.set(ph, c);
    }

    const verifiedContacts = [];
    for (const c of contacts) {
      const ph = normalizePhone(c.phone);
      if (ph && allowedPhones.has(ph)) {
        verifiedContacts.push({ ...c, phone: ph });
      }
    }
    if (verifiedContacts.length === 0) {
      return Response.json({ error: 'Recipients must come from your own contact list (added before this share).' }, { status: 403 });
    }
    if (verifiedContacts.length > MAX_RECIPIENTS_PER_SHARE) {
      return Response.json({ error: `You can share a voice note with at most ${MAX_RECIPIENTS_PER_SHARE} contacts at once.` }, { status: 400 });
    }

    const remaining = remainingSms(entitlement);
    if (remaining < verifiedContacts.length) {
      return Response.json({ error: 'You do not have enough monthly SMS to share this voice note. Upgrade or buy a top-up.', needsUpgrade: true }, { status: 402 });
    }

    const senderName = String(body.sender_name || 'A 1 CALL AWAY member').slice(0, 60);
    const titleLabel = String(voice_note_title || 'Untitled Note').slice(0, 120);
    const smsBody = `1 CALL AWAY — Voice Note from ${senderName}:\n"${titleLabel}"\n\n${safeTranscript}`.slice(0, 1600);

    const results = [];
    let used = 0;
    for (const contact of verifiedContacts) {
      try {
        const notification = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'new_message',
          recipient_name: contact.name || 'Contact',
          recipient_phone: contact.phone,
          title: `Voice Note Shared: ${titleLabel}`,
          message_body: smsBody,
          related_name: titleLabel,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(contact.phone, smsBody);
        try { await base44.asServiceRole.entities.SmsNotification.update(notification.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) used += 1;
        results.push({ contact: contact.name || contact.phone, success: sms.success, id: notification.id, sms_error: sms.success ? undefined : sms.error });
      } catch (err) {
        results.push({ contact: contact.name || contact.phone, success: false, error: err.message });
      }
    }

    // Meter every successfully delivered SMS against the monthly cap.
    if (used > 0) {
      try {
        await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, {
          sms_used: (entitlement.sms_used || 0) + used,
        });
      } catch (e) {
        console.error('shareVoiceNoteSms: failed to meter SMS usage:', e.message);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return Response.json({ success: true, sent: successCount, total: contacts.length, results });
  } catch (error) {
    console.error('shareVoiceNoteSms error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});