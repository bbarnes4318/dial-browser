import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Mass SMS dispatch exposing other users' reminder data — admin only.
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    // Fetch all reminders that are unsent and not yet completed
    const reminders = await base44.asServiceRole.entities.Reminder.filter({
      sms_sent: false,
      completed: false
    });

    const now = new Date();

    // Filter to those whose due_date has arrived
    const dueReminders = reminders.filter((r) => r.due_date && new Date(r.due_date) <= now);

    let sentCount = 0;
    for (const reminder of dueReminders) {
      try {
        let message_body = `1 CALL AWAY REMINDER: "${reminder.title}"`;
        if (reminder.notes) {
          message_body += `\n\n${reminder.notes.slice(0, 200)}`;
        }
        if (reminder.related_interaction_title) {
          message_body += `\n\nFrom consultation: ${reminder.related_interaction_title}`;
        }
        if (reminder.audio_url) {
          message_body += `\n\nVoice note: ${reminder.audio_url}`;
        }
        message_body += `\n\n— Free Voice Vault Reminder Service`;

        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'event_starting',
          recipient_name: 'Member',
          recipient_phone: reminder.phone,
          title: `Reminder: ${reminder.title}`,
          message_body,
          related_name: reminder.title,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(reminder.phone, message_body);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }

        if (sms.success) {
          await base44.asServiceRole.entities.Reminder.update(reminder.id, { sms_sent: true });
          sentCount++;
        }
      } catch (e) {
        console.error(`Failed to send reminder ${reminder.id}: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      sent: sentCount,
      total_due: dueReminders.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});