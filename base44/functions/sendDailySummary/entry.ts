import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Mass SMS dispatch — admin only (scheduled workflow carries an admin session).
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    // Get today's date range (full day, not just from now)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Fetch all incomplete, unsent reminders
    const reminders = await base44.asServiceRole.entities.Reminder.filter({
      completed: false,
      sms_sent: false
    });

    // Filter to today's due reminders that have a phone number
    const todaysReminders = reminders.filter((r) => {
      if (!r.due_date || !r.phone) return false;
      const due = new Date(r.due_date);
      return due >= startOfDay && due < endOfDay;
    });

    // Group by phone number — one summary SMS per user
    const byPhone = {};
    todaysReminders.forEach((r) => {
      if (!byPhone[r.phone]) byPhone[r.phone] = [];
      byPhone[r.phone].push(r);
    });

    let sentCount = 0;
    for (const [phone, items] of Object.entries(byPhone)) {
      try {
        const count = items.length;
        const sorted = items.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        let message = `1 CALL AWAY — DAILY SUMMARY\n\nYou have ${count} pending item${count !== 1 ? 's' : ''} scheduled for today:\n`;

        sorted.slice(0, 5).forEach((item, i) => {
          const time = new Date(item.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          message += `\n${i + 1}. ${item.title} (${time})`;
        });

        if (count > 5) message += `\n\n…and ${count - 5} more`;
        message += `\n\nDial *110# to manage your reminders.`;

        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'daily_summary',
          recipient_name: 'Member',
          recipient_phone: phone,
          title: `Daily Summary: ${count} item${count !== 1 ? 's' : ''} today`,
          message_body: message,
          related_name: sorted[0].title,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(phone, message);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) sentCount++;
      } catch (e) {
        console.error(`Failed to send daily summary to ${phone}: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      sent: sentCount,
      total_reminders: todaysReminders.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});