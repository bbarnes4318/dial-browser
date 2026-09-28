import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

/**
 * sendMatchReminders — admin-only (scheduled by the Match Engagement Reminder
 * workflow). Finds dating members who have at least one mutual match but
 * haven't visited the dating portal/dashboard in 48+ hours, and sends each a
 * friendly SMS nudge to come back and see who matched with them.
 *
 * Rate-limited to one reminder per member per 48 hours via the
 * last_reminder_sent_at field on DatingProfile. SMS is recorded as an
 * SmsNotification (type "new_match") using the same pattern as create-dating-like.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const now = Date.now();
    const FORTY_EIGHT_H = 48 * 60 * 60 * 1000;

    const matches = await base44.asServiceRole.entities.DatingLike.filter(
      { matched: true },
      "-created_date",
      500
    );
    if (!matches || !matches.length) {
      return Response.json({ success: true, checked: 0, sent: 0, reminders: [] });
    }

    // Unique profile ids involved in at least one mutual match.
    const involvedIds = new Set();
    matches.forEach((l) => {
      if (l.liker_profile_id) involvedIds.add(l.liker_profile_id);
      if (l.liked_profile_id) involvedIds.add(l.liked_profile_id);
    });

    const allProfiles = await base44.asServiceRole.entities.DatingProfile.filter(
      { active: true, email_verified: true },
      "-created_date",
      500
    );
    const profileById = {};
    (allProfiles || []).forEach((p) => { profileById[p.id] = p; });

    // Count matches per profile (a like where they are liker or liked and matched=true).
    const matchCountByProfile = {};
    matches.forEach((l) => {
      matchCountByProfile[l.liker_profile_id] = (matchCountByProfile[l.liker_profile_id] || 0) + 1;
      matchCountByProfile[l.liked_profile_id] = (matchCountByProfile[l.liked_profile_id] || 0) + 1;
    });

    const reminders = [];
    for (const id of involvedIds) {
      const p = profileById[id];
      if (!p || !p.phone) continue;

      const lastVisit = p.last_portal_visit ? new Date(p.last_portal_visit).getTime() : 0;
      const lastReminder = p.last_reminder_sent_at ? new Date(p.last_reminder_sent_at).getTime() : 0;
      const staleVisit = (now - lastVisit) >= FORTY_EIGHT_H;
      const reminderDue = (now - lastReminder) >= FORTY_EIGHT_H;
      if (!staleVisit || !reminderDue) continue;

      const matchCount = matchCountByProfile[id] || 0;
      const matchWord = matchCount > 1 ? `${matchCount} new matches` : "a new match";
      const msg = `1 CALL DATING: You have ${matchWord} waiting for you! Someone liked you back. Dial *520# to see who matched with you. Your number stays private.`;

      try {
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: "new_match",
          recipient_name: p.full_name,
          recipient_phone: p.phone,
          title: "A match is waiting!",
          message_body: msg,
          related_name: "Match engagement reminder",
          status: "pending",
          read: false,
        });
        const sms = await sendTwilioSms(p.phone, msg);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) {
          await base44.asServiceRole.entities.DatingProfile.update(p.id, {
            last_reminder_sent_at: new Date().toISOString(),
          });
          reminders.push({ profile_id: p.id, name: p.full_name, matches: matchCount });
        }
      } catch (e) {
        console.error("Reminder send failed for", p.id, e.message);
      }
    }

    return Response.json({
      success: true,
      checked: involvedIds.size,
      sent: reminders.length,
      reminders,
    });
  } catch (error) {
    console.error("sendMatchReminders error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}