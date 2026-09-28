import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Mass SMS broadcast to all job-alert subscribers — admin only.
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    const body = await req.json();
    const { job_id, title, company, field, location, pay, job_type, dial_code } = body;

    if (!title || !field) {
      return Response.json({ error: 'Missing required fields: title, field' }, { status: 400 });
    }

    // Find all active subscriptions matching this job's field
    const allSubscribers = await base44.asServiceRole.entities.JobAlertSubscription.filter({
      selected_field: field,
      active: true
    });

    if (allSubscribers.length === 0) {
      return Response.json({ success: true, message: 'No matching subscribers', alerts_sent: 0 });
    }

    // Filter by preference tags — a subscriber with no tags gets all alerts;
    // a subscriber with tags only gets alerted if the job matches at least one tag
    const jobLocationLower = (location || '').toLowerCase();
    const isRemote = jobLocationLower.includes('remote');
    const jobTypeLower = (job_type || '').toLowerCase().replace(/[^a-z]/g, '');

    const subscribers = allSubscribers.filter((sub) => {
      const tags = sub.tags || [];
      if (tags.length === 0) return true; // no tags = receive all
      return tags.some((tag) => {
        if (tag === 'remote') return isRemote;
        if (tag === 'full-time') return jobTypeLower === 'fulltime';
        if (tag === 'part-time') return jobTypeLower === 'parttime';
        if (tag === 'contract') return jobTypeLower === 'contract';
        return false;
      });
    });

    if (subscribers.length === 0) {
      // Still mark the job as alerted so we don't reprocess
      if (job_id) {
        try { await base44.asServiceRole.entities.JobListing.update(job_id, { alert_sent: true }); } catch (e) { console.error(`Failed to mark job ${job_id}: ${e.message}`); }
      }
      return Response.json({ success: true, message: 'No subscribers matched the tag filters', alerts_sent: 0, total_subscribers: allSubscribers.length });
    }

    const payStr = pay ? ` · ${pay}` : '';
    const locStr = location ? ` · ${location}` : '';
    const dialStr = dial_code ? ` Dial ${dial_code} to apply now.` : ` Reply APPLY to get started.`;

    let sentCount = 0;
    for (const sub of subscribers) {
      const message_body = `1 CALL AWAY JOB ALERT: New ${field} job — "${title}" at ${company}${locStr}${payStr}.${dialStr} Apply fast from your phone. Reply STOP to unsubscribe.`;
      const title_str = `New ${field} Job Match`;

      try {
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'job_alert',
          recipient_name: sub.full_name,
          recipient_phone: sub.phone,
          title: title_str,
          message_body,
          related_name: `${title} at ${company}`,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(sub.phone, message_body);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) sentCount++;
      } catch (e) {
        // Continue sending to other subscribers even if one fails
        console.error(`Failed to send to ${sub.phone}: ${e.message}`);
      }
    }

    // Mark the job listing as alerted if we have a job_id
    if (job_id) {
      try {
        await base44.asServiceRole.entities.JobListing.update(job_id, { alert_sent: true });
      } catch (e) {
        console.error(`Failed to mark job ${job_id} as alerted: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      field,
      alerts_sent: sentCount,
      total_subscribers: subscribers.length,
      filtered_out: allSubscribers.length - subscribers.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});