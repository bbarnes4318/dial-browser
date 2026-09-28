import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";
import { ensureEntitlement, resolveTier, remainingSms, normalizeE164 } from "../../shared/phoneMetering.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Processes ALL users' scheduled messages — admin only (scheduled workflow
    // carries an admin session; manual dashboard triggers are admins too).
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    const now = new Date();
    const allPending = await base44.asServiceRole.entities.ScheduledMessage.filter(
      { status: 'scheduled' },
      '-created_date',
      100
    );

    const due = (allPending || []).filter((m) => new Date(m.send_date) <= now);

    if (due.length === 0) {
      return Response.json({ success: true, message: 'No scheduled messages due', sent: 0 });
    }

    // Allowlist of registered app-user emails. The email channel must never act as
    // an open relay to arbitrary external addresses — Contact records are
    // user-created and may point at any email, so only registered members may
    // receive scheduled emails. (Fails closed: if the user list can't be loaded,
    // the set stays empty and all email sends are skipped.)
    const registeredEmails = new Set();
    try {
      const users = await base44.asServiceRole.entities.User.list("-created_date", 500);
      for (const u of (users || [])) {
        if (u.email) registeredEmails.add(u.email.toLowerCase());
      }
    } catch (e) {
      console.log("sendScheduledMessages: could not load user allowlist:", e.message);
    }

    const results = [];

    for (const msg of due) {
      try {
        await base44.asServiceRole.entities.ScheduledMessage.update(msg.id, { status: 'sending' });

        const contactIds = msg.contact_ids || [];
        let contacts = [];
        if (contactIds.length > 0) {
          const fetched = await Promise.all(
            contactIds.map((id) =>
              base44.asServiceRole.entities.Contact.get(id).catch(() => null)
            )
          );
          contacts = fetched.filter(Boolean);
        }

        if (contacts.length === 0) {
          await base44.asServiceRole.entities.ScheduledMessage.update(msg.id, {
            status: 'failed',
            delivery_results: JSON.stringify({ error: 'No valid contacts found' }),
          });
          results.push({ id: msg.id, status: 'failed', error: 'No contacts' });
          continue;
        }

        const channels = msg.channels || ['sms'];
        const deliveryResults = [];

        // SMS metering — the message owner pays for every scheduled SMS out of
        // their monthly SMS cap, just like send-phone-sms. Contacts must be the
        // owner's own (created_by_id match) so a user can't relay to arbitrary
        // third-party numbers via someone else's Contact rows. A per-message
        // recipient cap bounds a single scheduled burst.
        const ownerId = msg.created_by_id;
        const MAX_SMS_PER_MESSAGE = 50;
        let smsEntitlement = null;
        let smsRemaining = 0;
        let smsSentThisMsg = 0;
        if (channels.includes('sms') && ownerId) {
          try {
            const tier = await resolveTier(base44, ownerId);
            smsEntitlement = await ensureEntitlement(base44, ownerId, tier);
            smsRemaining = remainingSms(smsEntitlement);
          } catch (e) {
            console.log("sendScheduledMessages: could not resolve owner entitlement:", e.message);
          }
        }

        for (const contact of contacts) {
          const result = { name: contact.name, phone: contact.phone, email: contact.email, channels: {} };

          if (channels.includes('sms') && contact.phone) {
            const to = normalizeE164(contact.phone);
            if (!to) {
              result.channels.sms = 'skipped: invalid phone number';
            } else if (contact.created_by_id !== ownerId) {
              result.channels.sms = 'skipped: contact not owned by message owner';
            } else if (smsSentThisMsg >= MAX_SMS_PER_MESSAGE) {
              result.channels.sms = 'skipped: per-message SMS cap reached';
            } else if (smsRemaining <= 0) {
              result.channels.sms = 'skipped: owner monthly SMS cap reached';
            } else {
              try {
                const notif = await base44.asServiceRole.entities.SmsNotification.create({
                  notification_type: 'daily_summary',
                  recipient_name: contact.name,
                  recipient_phone: to,
                  title: msg.title,
                  message_body: msg.message_body,
                  status: 'pending',
                  read: false,
                });
                const sms = await sendTwilioSms(to, msg.message_body);
                try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
                if (sms.success) {
                  smsRemaining -= 1;
                  smsSentThisMsg += 1;
                  result.channels.sms = 'sent';
                } else {
                  result.channels.sms = 'failed: ' + (sms.error || 'twilio error');
                }
              } catch (e) {
                result.channels.sms = 'failed: ' + e.message;
              }
            }
          }

          if (channels.includes('email') && contact.email) {
            if (!registeredEmails.has(String(contact.email).toLowerCase())) {
              result.channels.email = 'skipped: recipient is not a registered app user';
            } else {
              try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                  to: contact.email,
                  subject: msg.title,
                  body: msg.message_body,
                });
                result.channels.email = 'sent';
              } catch (e) {
                result.channels.email = 'failed: ' + e.message;
              }
            }
          }

          deliveryResults.push(result);
        }

        // Persist the owner's SMS metering for this message.
        if (smsSentThisMsg > 0 && smsEntitlement) {
          try {
            await base44.asServiceRole.entities.PhoneEntitlement.update(smsEntitlement.id, {
              sms_used: (smsEntitlement.sms_used || 0) + smsSentThisMsg,
            });
          } catch (e) {
            console.log("sendScheduledMessages: could not meter SMS entitlement:", e.message);
          }
        }

        const allSmsOk = deliveryResults.every((r) => !r.channels.sms || r.channels.sms === 'sent');
        const allEmailOk = deliveryResults.every((r) => !r.channels.email || r.channels.email === 'sent');
        const newStatus = (allSmsOk && allEmailOk) ? 'sent' : 'partially_sent';

        await base44.asServiceRole.entities.ScheduledMessage.update(msg.id, {
          status: newStatus,
          delivery_results: JSON.stringify(deliveryResults),
          delivery_alert_sent: true,
        });

        const successCount = deliveryResults.filter((r) =>
          Object.values(r.channels).some((v) => v === 'sent')
        ).length;

        try {
          await base44.asServiceRole.entities.AppNotification.create({
            notification_type: 'sms_alert',
            title: 'Scheduled Message Delivered',
            message: `"${msg.title}" was delivered to ${successCount} of ${contacts.length} contacts.`,
            related_id: msg.id,
            related_type: 'ScheduledMessage',
            priority: 'normal',
            read: false,
          });
        } catch { /* non-critical */ }

        results.push({ id: msg.id, status: newStatus, delivered: successCount, total: contacts.length });
      } catch (err) {
        try {
          await base44.asServiceRole.entities.ScheduledMessage.update(msg.id, {
            status: 'failed',
            delivery_results: JSON.stringify({ error: err.message }),
          });
        } catch { /* ignore */ }
        results.push({ id: msg.id, status: 'failed', error: err.message });
      }
    }

    return Response.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('sendScheduledMessages error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});