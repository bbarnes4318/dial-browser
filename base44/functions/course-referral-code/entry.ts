import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { generateReferralCode, MAX_COURSE_REFERRALS } from "../../shared/courseReferral.ts";

// Ensures the calling student has a stable course-referral code (creating an
// anchor Referral record on first call) and returns it with their referral
// stats so the dashboard can render the share link + progress. Idempotent.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

    // Look for an existing anchor record (the student's own code).
    let anchor = null;
    try {
      const existing = await base44.asServiceRole.entities.Referral.filter(
        { referrer_user_id: user.id, service_shared: "course_referral" }, "-created_date", 10
      );
      anchor = (existing || []).find((r) => r.referral_code);
    } catch { /* none yet */ }

    if (!anchor) {
      // Generate a unique code (retry on the rare collision).
      let code = "";
      for (let i = 0; i < 5; i++) {
        const candidate = generateReferralCode();
        const clash = await base44.asServiceRole.entities.Referral.filter(
          { referral_code: candidate }, "-created_date", 1
        );
        if (!clash || clash.length === 0) { code = candidate; break; }
      }
      if (!code) return Response.json({ error: "Could not generate a referral code" }, { status: 500 });
      anchor = await base44.asServiceRole.entities.Referral.create({
        referrer_user_id: user.id,
        referrer_name: user.full_name || user.email || "Student",
        referral_code: code,
        status: "pending",
        service_shared: "course_referral",
      });
    }

    // Stats: completed course referrals (exclude the anchor) + credits earned.
    const all = await base44.asServiceRole.entities.Referral.filter(
      { referrer_user_id: user.id }, "-created_date", 200
    );
    const completed = (all || []).filter(
      (r) => r.id !== anchor.id && (r.status === "completed" || r.status === "rewarded")
    );
    const credits = completed.reduce((s, r) => s + (r.credits_earned || 0), 0);

    return Response.json({
      referral_code: anchor.referral_code,
      completed_count: completed.length,
      credits_earned: credits,
      cap: MAX_COURSE_REFERRALS,
    });
  } catch (error) {
    console.error("course-referral-code error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}