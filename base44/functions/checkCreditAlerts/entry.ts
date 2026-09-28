import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Creates notifications for all users — admin only.
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    const credits = await base44.asServiceRole.entities.CallCredit.list("-created_date", 500);

    const LOW_THRESHOLD = 10;
    const RENEWAL_WARNING_DAYS = 3;
    const now = new Date();

    const toCreate = [];

    for (const credit of credits || []) {
      const total = (credit.total_credits || 0) + (credit.bonus_credits || 0);
      const used = credit.used_credits || 0;
      const remaining = Math.max(0, total - used);
      const ownerId = credit.created_by_id;
      if (!ownerId) continue;

      // Low credit alert — remaining below threshold or below 10% of total
      if (total > 0 && (remaining <= LOW_THRESHOLD || remaining <= total * 0.1)) {
        toCreate.push({
          notification_type: "system",
          title: "Low Call Credit Balance",
          message: `You have ${remaining} call credits remaining out of ${total}. Dial *500# to upgrade your plan or purchase bonus credits.`,
          related_id: credit.id,
          related_type: "CallCredit",
          priority: "high",
          action_label: "Upgrade Plan",
          action_url: "/dashboard",
          read: false,
        });
      }

      // Renewal reminder — billing cycle ending soon
      if (credit.billing_cycle_end) {
        const cycleEnd = new Date(credit.billing_cycle_end);
        const daysUntil = Math.ceil((cycleEnd.getTime() - now.getTime()) / 86400000);
        if (daysUntil >= 0 && daysUntil <= RENEWAL_WARNING_DAYS) {
          toCreate.push({
            notification_type: "system",
            title: daysUntil === 0 ? "Subscription Renews Today" : `Subscription Renews in ${daysUntil} Day${daysUntil === 1 ? "" : "s"}`,
            message: `Your ${credit.plan_tier || "current"} plan billing cycle ${daysUntil === 0 ? "ends today" : `ends in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}. Credits will reset automatically. Visit your dashboard to manage your subscription.`,
            related_id: credit.id,
            related_type: "CallCredit",
            priority: daysUntil === 0 ? "high" : "normal",
            action_label: "View Status",
            action_url: "/dashboard",
            read: false,
          });
        }
      }
    }

    if (toCreate.length === 0) {
      return Response.json({ success: true, created: 0, message: "No credit alerts needed." });
    }

    // Deduplicate — don't create if an unread notification for the same credit record already exists today
    const existing = await base44.asServiceRole.entities.AppNotification.filter(
      { read: false, related_type: "CallCredit" },
      "-created_date",
      200
    ).catch(() => []);

    const existingKeys = new Set();
    const todayStr = now.toDateString();
    for (const n of existing || []) {
      if (n.created_date && new Date(n.created_date).toDateString() === todayStr) {
        existingKeys.add(`${n.related_id}:${n.title}`);
      }
    }

    const newNotifications = toCreate.filter((n) => !existingKeys.has(`${n.related_id}:${n.title}`));

    if (newNotifications.length === 0) {
      return Response.json({ success: true, created: 0, message: "All alerts already sent today." });
    }

    const created = await base44.asServiceRole.entities.AppNotification.bulkCreate(newNotifications);

    return Response.json({
      success: true,
      created: newNotifications.length,
      skipped: toCreate.length - newNotifications.length,
      notifications: created,
    });
  } catch (error) {
    console.error('checkCreditAlerts error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});