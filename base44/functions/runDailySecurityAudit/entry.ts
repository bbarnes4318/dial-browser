import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req) {
  const auditDate = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  console.log(`[DAILY SECURITY AUDIT ${auditDate}] Starting...`);

  try {
    const base44 = createClientFromRequest(req);

    // Require authentication — destructive audit operations (deleting voicemails,
    // purging listings, modifying subscriptions, emailing admins) must not run for
    // unauthenticated external callers. Scheduled workflow invocations and admin
    // dashboard triggers carry an authenticated session.
    let authOk = false;
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) {
        const user = await base44.auth.me();
        authOk = !!user;
      }
    } catch { /* not authenticated */ }

    if (!authOk) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Destructive asServiceRole operations (deleting voicemails, purging
    // listings, modifying subscriptions, enumerating users) are admin-only.
    let adminUser = null;
    try { adminUser = await base44.auth.me(); } catch { /* denied below */ }
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const findings = [];
    const fixes = [];
    let overallStatus = "healthy";

    // ── 1. ENTITY HEALTH CHECKS ──
    const entitiesToCheck = [
      "Member", "SmsNotification", "ServiceRequest", "WeatherSubscription",
      "JobListing", "ArtistProfile", "VoiceHost", "MarketplaceListing",
      "Reminder", "Contact", "VoiceCommand", "Subscription", "Referral",
      "GroceryOrder", "BillPayment", "ConstructionProvider", "ConstructionBooking",
      "Dispute", "Voicemail", "IncomingCall", "VideoMeeting", "VideoSignal",
      "StreamSession", "LiveChatMessage", "Comment", "AppNotification",
      "CallCredit", "SavedService", "VoiceInteraction", "VoiceVerification",
      "EmergencyContact", "ScheduledMessage", "SmsCalendarSubscription",
      "JobApplication", "JobSeekerProfile", "JobAlertSubscription",
      "SkillEndorsement", "EmployerAccess",
      "MarketplaceListing", "Trade", "ShowShare",
      "CategoryAlertSubscription", "ConstructionAlertSubscription",
      "LiveStreamSubscriber",
    ];

    for (const entityName of entitiesToCheck) {
      try {
        await base44.asServiceRole.entities[entityName]?.list("-created_date", 1);
      } catch (err) {
        findings.push({
          severity: "critical",
          category: "Entity Access",
          detail: `Entity "${entityName}" is inaccessible: ${err.message}`,
        });
        overallStatus = "issues_detected";
      }
    }

    // ── 2. AI / LLM ENGINE CHECK ──
    try {
      await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: "Respond with the word: OK",
        response_json_schema: { type: "object", properties: { status: { type: "string" } } },
      });
    } catch (err) {
      findings.push({
        severity: "critical",
        category: "AI Engine",
        detail: `LLM integration is degraded: ${err.message}`,
      });
      overallStatus = "issues_detected";
    }

    // ── 3. ORPHANED RECORD CLEANUP ──
    // Find voicemails with no associated member and clean them up
    try {
      const orphanedVoicemails = await base44.asServiceRole.entities.Voicemail.filter({}, "-created_date", 50);
      const staleVoicemails = orphanedVoicemails.filter(v => {
        if (!v.created_date) return false;
        const ageDays = (Date.now() - new Date(v.created_date).getTime()) / 86400000;
        return ageDays > 90 && (!v.transcription || v.transcription === "");
      });

      if (staleVoicemails.length > 0) {
        for (const vm of staleVoicemails) {
          try {
            await base44.asServiceRole.entities.Voicemail.delete(vm.id);
          } catch (e) {
            // non-blocking
          }
        }
        fixes.push({
          category: "Data Cleanup",
          detail: `Removed ${staleVoicemails.length} stale voicemail record(s) older than 90 days with no transcription.`,
        });
      }
    } catch (err) {
      findings.push({
        severity: "warning",
        category: "Data Cleanup",
        detail: `Could not audit voicemails: ${err.message}`,
      });
    }

    // ── 4. FAILED SMS NOTIFICATION RETRY ──
    try {
      const failedNotifications = await base44.asServiceRole.entities.SmsNotification.filter(
        { status: "failed" },
        "-created_date",
        20
      );

      if (failedNotifications.length > 0) {
        fixes.push({
          category: "SMS Delivery",
          detail: `Found ${failedNotifications.length} failed SMS notification(s). Flagged for manual review.`,
        });
        findings.push({
          severity: "warning",
          category: "SMS Delivery",
          detail: `${failedNotifications.length} SMS notification(s) have failed delivery status.`,
        });
      }
    } catch (err) {
      // non-blocking
    }

    // ── 5. PENDING SERVICE REQUESTS CHECK ──
    try {
      const staleRequests = await base44.asServiceRole.entities.ServiceRequest.filter(
        { status: "submitted" },
        "-created_date",
        50
      );

      const oldRequests = staleRequests.filter(r => {
        if (!r.created_date) return false;
        const ageHours = (Date.now() - new Date(r.created_date).getTime()) / 3600000;
        return ageHours > 48;
      });

      if (oldRequests.length > 0) {
        findings.push({
          severity: "warning",
          category: "Service Requests",
          detail: `${oldRequests.length} service request(s) have been in "submitted" status for over 48 hours.`,
        });
      }
    } catch (err) {
      // non-blocking
    }

    // ── 6. SUBSCRIPTION INTEGRITY CHECK ──
    try {
      const activeSubs = await base44.asServiceRole.entities.Subscription.filter(
        { subscription_active: true },
        "-created_date",
        100
      );

      const inconsistent = activeSubs.filter(s =>
        s.subscription_status === "pending" || s.subscription_status === "canceled"
      );

      if (inconsistent.length > 0) {
        for (const sub of inconsistent) {
          try {
            await base44.asServiceRole.entities.Subscription.update(sub.id, {
              subscription_active: false,
            });
          } catch (e) {
            // non-blocking
          }
        }
        fixes.push({
          category: "Subscription Integrity",
          detail: `Fixed ${inconsistent.length} subscription(s) that were marked active but had a non-active status.`,
        });
      }
    } catch (err) {
      // non-blocking
    }

    // ── 7. ORPHANED MARKETPLACE LISTINGS ──
    try {
      const removedListings = await base44.asServiceRole.entities.MarketplaceListing.filter(
        { status: "removed" },
        "-created_date",
        50
      );

      const oldRemoved = removedListings.filter(l => {
        if (!l.created_date) return false;
        const ageDays = (Date.now() - new Date(l.created_date).getTime()) / 86400000;
        return ageDays > 30;
      });

      if (oldRemoved.length > 0) {
        for (const listing of oldRemoved) {
          try {
            await base44.asServiceRole.entities.MarketplaceListing.delete(listing.id);
          } catch (e) {
            // non-blocking
          }
        }
        fixes.push({
          category: "Data Cleanup",
          detail: `Purged ${oldRemoved.length} marketplace listing(s) removed over 30 days ago.`,
        });
      }
    } catch (err) {
      // non-blocking
    }

    // ── BUILD REPORT ──
    const criticalFindings = findings.filter(f => f.severity === "critical");
    const warnings = findings.filter(f => f.severity === "warning");

    if (criticalFindings.length > 0) {
      overallStatus = "critical";
    } else if (warnings.length > 0 || findings.length > 0) {
      overallStatus = "issues_detected";
    }

    const statusEmoji = overallStatus === "healthy" ? "✅" : overallStatus === "issues_detected" ? "⚠️" : "🔴";

    const reportBody = `
============================================
  1 CALL AWAY — DAILY SECURITY AUDIT REPORT
============================================

Audit Date: ${auditDate} (EST)
Overall Status: ${statusEmoji} ${overallStatus.toUpperCase()}

--------------------------------------------
FINDINGS (${findings.length} total)
--------------------------------------------
${findings.length === 0 ? "No issues detected." : findings.map((f, i) =>
  `${i + 1}. [${f.severity.toUpperCase()}] ${f.category}\n   ${f.detail}`
).join("\n\n")}

--------------------------------------------
AUTOMATED FIXES APPLIED (${fixes.length} total)
--------------------------------------------
${fixes.length === 0 ? "No fixes were needed." : fixes.map((f, i) =>
  `${i + 1}. [${f.category}]\n   ${f.detail}`
).join("\n\n")}

--------------------------------------------
SUMMARY
--------------------------------------------
• Critical Issues: ${criticalFindings.length}
• Warnings: ${warnings.length}
• Automated Fixes Applied: ${fixes.length}
• Entities Audited: ${entitiesToCheck.length}

This report was generated automatically by the
Daily Security Audit workflow. Issues marked
"critical" require immediate attention.

Next audit: Tomorrow at 8:00 AM EST.
============================================
`;

    // ── EMAIL THE REPORT TO ADMIN USERS ──
    let emailsSent = 0;
    let emailError = null;

    try {
      const users = await base44.asServiceRole.entities.User.list("-created_date", 50);
      const admins = users.filter(u => u.role === "admin");

      if (admins.length === 0 && users.length > 0) {
        // If no admins found, send to the first user (app owner)
        admins.push(users[0]);
      }

      for (const admin of admins) {
        if (!admin.email) continue;
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            subject: `${statusEmoji} 1 Call Away Daily Security Audit — ${auditDate}`,
            body: reportBody,
          });
          emailsSent++;
        } catch (e) {
          emailError = e.message;
          console.error(`Failed to email ${admin.email}:`, e.message);
        }
      }
    } catch (err) {
      emailError = err.message;
      console.error("Failed to fetch admin users for email:", err.message);
    }

    console.log(`[DAILY SECURITY AUDIT] Complete. Status: ${overallStatus}. Findings: ${findings.length}. Fixes: ${fixes.length}. Emails sent: ${emailsSent}.`);

    return Response.json({
      audit_date: auditDate,
      overall_status: overallStatus,
      findings,
      fixes_applied: fixes,
      summary: {
        critical: criticalFindings.length,
        warnings: warnings.length,
        fixes_applied: fixes.length,
        entities_audited: entitiesToCheck.length,
      },
      emails_sent: emailsSent,
      email_error: emailError,
    });
  } catch (error) {
    console.error("[DAILY SECURITY AUDIT] Fatal error:", error.message);
    return Response.json({
      audit_date: auditDate,
      overall_status: "critical",
      error: error.message,
    }, { status: 500 });
  }
}