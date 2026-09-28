import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

/**
 * create-dating-like — records one member's like on another member's dating
 * profile. If the feeling is mutual (the target already liked the caller back),
 * marks BOTH likes as matched and sends each member an SMS notification
 * containing the other's dating profile, so they can connect privately.
 *
 * SMS delivery uses the same SmsNotification record pattern as the rest of the
 * platform (notification_type "new_match"). Created with the service role so
 * the caller can legitimately notify the other member on a mutual match.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { liked_profile_id } = body;
    if (!liked_profile_id) {
      return Response.json({ error: "Missing liked_profile_id" }, { status: 400 });
    }

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve the caller's active dating profile.
    const myProfiles = await base44.asServiceRole.entities.DatingProfile.filter(
      { created_by_id: user.id, active: true },
      "-created_date",
      5
    );
    const myProfile = myProfiles && myProfiles[0];
    if (!myProfile) {
      return Response.json({ error: "Create a dating profile first" }, { status: 400 });
    }
    if (liked_profile_id === myProfile.id) {
      return Response.json({ error: "Cannot like your own profile" }, { status: 400 });
    }
    // Only verified members can like — unverified profiles stay hidden.
    if (!myProfile.email_verified) {
      return Response.json({ error: "Verify your email to start matching" }, { status: 403 });
    }

    // Free-tier daily like limit (5 likes/day). Paid dating tiers (plus/elite) are unlimited.
    let datingTier = "free";
    try {
      const subs = await base44.asServiceRole.entities.DatingSubscription.filter(
        { created_by_id: user.id, status: "active" },
        "-created_date",
        5
      );
      if (subs && subs[0]) datingTier = subs[0].tier;
    } catch { /* no subscription entity yet → free */ }
    if (datingTier === "free") {
      const dayMs = 24 * 60 * 60 * 1000;
      let recent = [];
      try {
        recent = await base44.asServiceRole.entities.DatingLike.filter(
          { created_by_id: user.id },
          "-created_date",
          50
        );
      } catch { /* ignore */ }
      const inLastDay = (recent || []).filter(
        (l) => l.created_date && (Date.now() - new Date(l.created_date).getTime()) < dayMs
      );
      if (inLastDay.length >= 5) {
        return Response.json(
          { error: "You've reached today's free limit of 5 likes. Upgrade to Plus for unlimited matches.", limit_reached: true, tier: "free" },
          { status: 402 }
        );
      }
    }

    // Resolve the target profile.
    const target = await base44.asServiceRole.entities.DatingProfile.get(liked_profile_id);
    if (!target || !target.active || !target.email_verified) {
      return Response.json({ error: "Profile not found or inactive" }, { status: 404 });
    }

    // Already liked? Return early (idempotent).
    const existing = await base44.asServiceRole.entities.DatingLike.filter(
      { liker_profile_id: myProfile.id, liked_profile_id: target.id },
      "-created_date",
      1
    );
    if (existing && existing[0]) {
      return Response.json({
        success: true,
        already_liked: true,
        matched: existing[0].matched,
      });
    }

    // Check for a reciprocal like (target already liked the caller).
    const reverse = await base44.asServiceRole.entities.DatingLike.filter(
      { liker_profile_id: target.id, liked_profile_id: myProfile.id },
      "-created_date",
      1
    );
    const reverseLike = reverse && reverse[0];
    const isMatch = !!reverseLike;

    const now = new Date().toISOString();

    // Create this like row.
    const like = await base44.asServiceRole.entities.DatingLike.create({
      liker_profile_id: myProfile.id,
      liker_name: myProfile.full_name,
      liked_profile_id: target.id,
      liked_name: target.full_name,
      matched: isMatch,
      matched_at: isMatch ? now : null,
      created_by_id: user.id,
    });

    // On a mutual match, mark the reverse like matched and notify both via SMS.
    if (isMatch) {
      try {
        await base44.asServiceRole.entities.DatingLike.update(reverseLike.id, {
          matched: true,
          matched_at: now,
        });
      } catch (e) {
        console.error("Could not mark reverse like as matched:", e.message);
      }

      const trunc = (s, n) => (s ? (s.length > n ? s.slice(0, n - 1) + "…" : s) : "");

      // SMS to the caller about the target.
      const msgToCaller = `1 CALL DATING: You matched with ${target.full_name}, ${target.age}, from ${target.location}. Their voice note: "${trunc(target.voice_greeting, 120)}". See your match: https://www.dialbrowser.com/dating-dashboard — your number stays private.`;
      try {
        await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: "new_match",
          recipient_name: myProfile.full_name,
          recipient_phone: myProfile.phone,
          title: "New Dating Match!",
          message_body: msgToCaller,
          related_name: target.full_name,
          status: "sent",
          read: false,
        });
      } catch (e) {
        console.error("Match SMS to caller failed:", e.message);
      }

      // SMS to the target about the caller.
      const msgToTarget = `1 CALL DATING: You matched with ${myProfile.full_name}, ${myProfile.age}, from ${myProfile.location}. Their voice note: "${trunc(myProfile.voice_greeting, 120)}". See your match: https://www.dialbrowser.com/dating-dashboard — your number stays private.`;
      try {
        await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: "new_match",
          recipient_name: target.full_name,
          recipient_phone: target.phone,
          title: "New Dating Match!",
          message_body: msgToTarget,
          related_name: myProfile.full_name,
          status: "sent",
          read: false,
        });
      } catch (e) {
        console.error("Match SMS to target failed:", e.message);
      }
    }

    return Response.json({
      success: true,
      matched: isMatch,
      like_id: like.id,
      match_with: isMatch
        ? {
            id: target.id,
            name: target.full_name,
            age: target.age,
            location: target.location,
            voice_greeting: target.voice_greeting,
            avatar_url: target.avatar_url || (target.photos && target.photos[0]) || null,
          }
        : null,
    });
  } catch (error) {
    console.error("create-dating-like error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}