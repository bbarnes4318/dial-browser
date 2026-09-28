import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { applicant_ids, status, job_title, company } = body;

    // Authenticate the caller — only employers who own the job listings may update applications
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      return Response.json({ error: "applicant_ids array is required" }, { status: 400 });
    }
    if (!status) {
      return Response.json({ error: "status is required" }, { status: 400 });
    }

    const STATUS_MESSAGES = {
      viewed: `Update from ${company || "1 Call Jobs"}: Your application for "${job_title || "a position"}" has been reviewed. We'll be in touch soon.`,
      shortlisted: `Great news from ${company || "1 Call Jobs"}! You've been shortlisted for "${job_title || "a position"}". We'll reach out shortly with next steps.`,
      interview_requested: `Update from ${company || "1 Call Jobs"}: We'd like to schedule an interview for "${job_title || "a position"}"! Please reply with your availability this week.`,
      rejected: `Update from ${company || "1 Call Jobs"}: Thank you for applying for "${job_title || "a position"}". We've moved forward with other candidates but appreciate your interest.`,
      hired: `Congratulations from ${company || "1 Call Jobs"}! We'd like to offer you the position of "${job_title || "a position"}". Please contact us to discuss next steps.`,
      archived: `Update from ${company || "1 Call Jobs"}: Your application for "${job_title || "a position"}" has been archived. Thank you for your interest.`,
    };

    const messageBody = STATUS_MESSAGES[status] || `Update from ${company || "1 Call Jobs"}: Your application status for "${job_title || "a position"}" has been updated to ${status}.`;

    // Fetch all selected applications
    const allApps = [];
    for (const id of applicant_ids) {
      try {
        const app = await base44.asServiceRole.entities.JobApplication.get(id);
        if (app) allApps.push(app);
      } catch (err) {
        console.log(`Failed to fetch application ${id}: ${err.message}`);
      }
    }

    // Verify the caller owns every job listing these applications belong to
    const jobListingIds = [...new Set(allApps.map(a => a.job_listing_id).filter(Boolean))];
    const jobListingOwnership = {};
    for (const jlId of jobListingIds) {
      try {
        const listing = await base44.asServiceRole.entities.JobListing.get(jlId);
        jobListingOwnership[jlId] = listing?.created_by_id === user.id;
      } catch (err) {
        console.log(`Failed to fetch job listing ${jlId}: ${err.message}`);
        jobListingOwnership[jlId] = false;
      }
    }

    // Filter to only applications for job listings the caller owns
    const authorizedApps = allApps.filter(app => app.job_listing_id && jobListingOwnership[app.job_listing_id]);

    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const app of authorizedApps) {
      if (!app.applicant_phone) {
        results.push({ id: app.id, status: "skipped", reason: "no phone number" });
        continue;
      }

      try {
        // Create SMS notification record, then deliver via Twilio
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: "job_alert",
          recipient_name: app.applicant_name || "Applicant",
          recipient_phone: app.applicant_phone,
          title: `Application Update: ${job_title || "Position"}`,
          message_body: messageBody,
          related_name: job_title || "Application",
          status: "pending",
        });
        const sms = await sendTwilioSms(app.applicant_phone, messageBody);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }

        // Update application status
        await base44.asServiceRole.entities.JobApplication.update(app.id, { status });

        if (sms.success) sentCount++;
        results.push({ id: app.id, status: sms.success ? "sent" : "failed", sms_error: sms.success ? undefined : sms.error });
      } catch (err) {
        failedCount++;
        results.push({ id: app.id, status: "failed", error: err.message });
        console.log(`Failed to send update to ${app.applicant_phone}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: authorizedApps.length,
      skipped: allApps.length - authorizedApps.length,
      results,
    });
  } catch (error) {
    console.error("sendBulkStatusUpdates error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});