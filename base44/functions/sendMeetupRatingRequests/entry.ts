import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

/**
 * sendMeetupRatingRequests — admin-only (scheduled by the Meetup Rating
 * Followup workflow, daily). Finds mutual matches that became active 3+ days
 * ago and haven't yet been prompted, and sends each member a friendly SMS
 * asking how their meetup went — with a link back to their private dating
 * dashboard where they can submit a rating. Marks the match's
 * rating_request_sent_at so the prompt isn't sent twice.
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
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const DASH_LINK = "https://www.dialbrowser.com/dating-dashboard";

    const matches = await base44.asServiceRole.entities.DatingLike.filter(
      { matched: true },
      "-matched_at",
      500
    );
    const eligible = (matches || []).filter((l) => {
      if (!l.matched_at || l.rating_request_sent_at) return false;
      return (now - new Date(l.matched_at).getTime()) >= THREE_DAYS;
    });
    if (!eligible.length) {
      return Response.json({ success: true, eligible: 0, sent: 0 });
    }

    const profileIds = new Set();
    eligible.forEach((l) => {
      profileIds.add(l.liker_profile_id);
      profileIds.add(l.liked_profile_id);
    });
    const allProfiles = await base44.asServiceRole.entities.DatingProfile.filter(
      { active: true, email_verified: true },
      "-created_date",
      500
    );
    const profileById = {};
    (allProfiles || []).forEach((p) => { profileById[p.id] = p; });

    let sent = 0;
    for (const l of eligible) {
      const liker = profileById[l.liker_profile_id];
      const liked = profileById[l.liked_profile_id];
      const targets = [
        { p: liker, otherName: l.liked_name },
        { p: liked, otherName: l.liker_name },
      ].filter((t) => t.p && t.p.phone);

      for (const t of targets) {
        const msg = `1 CALL DATING: You matched with ${t.otherName} a few days ago — how did it go? Rate your meetup to keep our community genuine: ${DASH_LINK}`;
        try {
          const notif = await base44.asServiceRole.entities.SmsNotification.create({
            notification_type: "new_match",
            recipient_name: t.p.full_name,
            recipient_phone: t.p.phone,
            title: "How was your meetup?",
            message_body: msg,
            related_name: "Meetup rating request",
            status: "pending",
            read: false,
          });
          const sms = await sendTwilioSms(t.p.phone, msg);
          try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
          if (sms.success) sent += 1;
        } catch (e) {
          console.error("Rating SMS failed:", e.message);
        }
      }

      try {
        await base44.asServiceRole.entities.DatingLike.update(l.id, {
          rating_request_sent_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Could not mark rating_request_sent_at:", e.message);
      }
    }

    return Response.json({ success: true, eligible: eligible.length, sent });
  } catch (error) {
    console.error("sendMeetupRatingRequests error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}