import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Credits awarded to the inviter when a referred friend joins.
const REWARD_CREDITS = 25;

// Completes a referral when a friend joins via a ref link.
// The referral code is the full base64 of the inviter's user id (reversible),
// so we can resolve the inviter directly without a pre-created pending record.
// Idempotent: if a completed referral already exists for this referrer +
// referred email, it no-ops. Awards bonus call credits to the inviter, which
// surfaces in their loyalty balance and unlocks milestone rewards
// (milestones are derived from completed-referral counts in the UI).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}
    const code = (body && body.referred_by_code ? String(body.referred_by_code) : "").trim();
    if (!code) return Response.json({ completed: false, reason: "no_code" });

    // Look up the referral by its stored, non-guessable code (not reversible base64).
    if (!/^[A-Za-z0-9_-]{6,32}$/.test(code)) return Response.json({ completed: false, reason: "invalid_code" });
    const codeRecords = await base44.asServiceRole.entities.Referral.filter(
      { referral_code: code }, "-created_date", 20
    );
    const referralRecord = (codeRecords || []).find((r) => r.referrer_user_id);
    if (!referralRecord) return Response.json({ completed: false, reason: "invalid_code" });
    const referrerId = referralRecord.referrer_user_id;
    if (!referrerId || referrerId === user.id) return Response.json({ completed: false, reason: "self_referral" });

    // Validate the inviter exists.
    let referrer = null;
    try { referrer = await base44.asServiceRole.entities.User.get(referrerId); } catch { referrer = null; }
    if (!referrer) return Response.json({ completed: false, reason: "unknown_referrer" });

    // Idempotency: a completed referral for this referrer + referred email already exists.
    const existing = await base44.asServiceRole.entities.Referral.filter(
      { referrer_user_id: referrerId, referred_email: user.email }, "-created_date", 10
    );
    const alreadyDone = (existing || []).find((r) => r.status === "completed" || r.status === "rewarded");
    if (alreadyDone) return Response.json({ completed: false, reason: "already_completed" });

    // Per-referrer lifetime cap — prevents unbounded credit farming via throwaway accounts.
    const MAX_REFERRAL_REWARDS = 10;
    const allForReferrer = await base44.asServiceRole.entities.Referral.filter(
      { referrer_user_id: referrerId }, "-created_date", 100
    );
    const completedForReferrer = (allForReferrer || []).filter(
      (r) => r.status === "completed" || r.status === "rewarded"
    ).length;
    if (completedForReferrer >= MAX_REFERRAL_REWARDS) {
      return Response.json({ completed: false, reason: "cap_reached" });
    }

    // Complete a pending one if present, otherwise create a completed record.
    const pending = (existing || []).filter((r) => r.status === "pending");
    const referredName = user.full_name || (body.new_user_name || "");
    if (pending.length > 0) {
      await base44.asServiceRole.entities.Referral.update(pending[0].id, {
        status: "completed",
        credits_earned: REWARD_CREDITS,
        referred_email: user.email,
        referred_name: referredName,
      });
    } else {
      await base44.asServiceRole.entities.Referral.create({
        referrer_user_id: referrerId,
        referrer_name: referrer.full_name || referrer.email || "Member",
        referral_code: code,
        referred_email: user.email,
        referred_name: referredName,
        status: "completed",
        credits_earned: REWARD_CREDITS,
      });
    }

    // Award bonus call credits to the inviter.
    try {
      const credits = await base44.asServiceRole.entities.CallCredit.filter(
        { created_by_id: referrerId }, "-created_date", 1
      );
      if (credits && credits.length > 0) {
        await base44.asServiceRole.entities.CallCredit.updateMany(
          { created_by_id: referrerId },
          { $inc: { bonus_credits: REWARD_CREDITS } }
        );
      } else {
        const now = new Date();
        const end = new Date(now); end.setMonth(end.getMonth() + 1);
        await base44.asServiceRole.entities.CallCredit.create({
          plan_tier: "free",
          total_credits: 25,
          used_credits: 0,
          bonus_credits: REWARD_CREDITS,
          billing_cycle_start: now.toISOString(),
          billing_cycle_end: end.toISOString(),
        });
      }
    } catch (e) { console.error("complete-referral credit award error", e); }

    return Response.json({ completed: true, inviter_id: referrerId, credits_awarded: REWARD_CREDITS });
  } catch (error) {
    console.error("complete-referral error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}