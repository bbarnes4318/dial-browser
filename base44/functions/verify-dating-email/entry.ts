import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

/**
 * verify-dating-email — confirms the one-time code the member entered matches
 * the hashed code stored on their dating profile, then activates the profile
 * (email_verified = true, active = true) so it becomes visible to other
 * members and so the member can send/receive likes. Codes expire after 15 min.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body || {};
    if (!code || !/^\d{6}$/.test(String(code))) {
      return Response.json({ error: "Enter the 6-digit code from your email" }, { status: 400 });
    }

    const mine = await base44.asServiceRole.entities.DatingProfile.filter(
      { created_by_id: user.id },
      "-created_date",
      5
    );
    const profile = mine && mine[0];
    if (!profile) {
      return Response.json({ error: "No dating profile found" }, { status: 404 });
    }
    if (profile.email_verified) {
      return Response.json({ success: true, already_verified: true });
    }
    if (!profile.verification_code || !profile.verification_sent_at) {
      return Response.json({ error: "No code on file. Request a new one." }, { status: 400 });
    }

    // Expiry: 15 minutes.
    const sentAt = new Date(profile.verification_sent_at).getTime();
    if (Date.now() - sentAt > 15 * 60 * 1000) {
      return Response.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }

    // Brute-force lockout: after MAX_ATTEMPTS failed tries, force a new code.
    const MAX_ATTEMPTS = 5;
    const attempts = (profile.verification_attempts || 0);
    if (attempts >= MAX_ATTEMPTS) {
      return Response.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
    }

    // Hash the submitted code the same way send-dating-verification does.
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", enc.encode(String(code) + "::" + profile.id));
    const hashed = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");

    if (hashed !== profile.verification_code) {
      await base44.asServiceRole.entities.DatingProfile.update(profile.id, {
        verification_attempts: attempts + 1,
      });
      const remaining = MAX_ATTEMPTS - (attempts + 1);
      return Response.json({ error: `Incorrect code. ${remaining} attempt(s) left.` }, { status: 400 });
    }

    await base44.asServiceRole.entities.DatingProfile.update(profile.id, {
      email_verified: true,
      active: !!profile.phone_verified,
      verification_code: "",
      verification_attempts: 0,
    });

    return Response.json({ success: true, verified: true });
  } catch (error) {
    console.error("verify-dating-email error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}