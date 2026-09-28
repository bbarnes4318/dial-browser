import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

/**
 * send-dating-verification — generates a 6-digit one-time code and emails it
 * to the member's account email, then stores the (hashed) code + send time on
 * their dating profile. The member must enter the code via verify-dating-email
 * before their profile becomes visible to other members.
 *
 * Email is resolved server-side from base44.auth.me() — the member cannot
 * spoof the destination. SendEmail is invoked through the service role so the
 * caller does not need elevated permissions to trigger the email.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.email) {
      return Response.json({ error: "No email on file for this account" }, { status: 400 });
    }

    // Resolve the caller's dating profile (most recent).
    const mine = await base44.asServiceRole.entities.DatingProfile.filter(
      { created_by_id: user.id },
      "-created_date",
      5
    );
    const profile = mine && mine[0];
    if (!profile) {
      return Response.json({ error: "Create your dating profile first" }, { status: 400 });
    }

    // Already verified? Short-circuit.
    if (profile.email_verified) {
      return Response.json({ success: true, already_verified: true, email: user.email });
    }

    // Generate a 6-digit code and a lightweight hash to store (never store raw).
    const rawCode = String(Math.floor(100000 + Math.random() * 900000));
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", enc.encode(rawCode + "::" + profile.id));
    const hashed = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");

    await base44.asServiceRole.entities.DatingProfile.update(profile.id, {
      verification_code: hashed,
      verification_sent_at: new Date().toISOString(),
      verification_attempts: 0,
    });

    // Email the code to the member's account address.
    const subject = "Your 1 Call Dating™ verification code";
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#05070A;padding:32px;color:#F5F5F7;">
        <div style="max-width:420px;margin:auto;background:#10141D;border:1px solid rgba(209,255,38,0.3);padding:28px;">
          <p style="font-family:monospace;letter-spacing:.3em;color:#D1FF26;font-size:11px;margin:0 0 16px;">// 1 CALL DATING™ — EMAIL VERIFICATION</p>
          <h2 style="color:#F5F5F7;margin:0 0 12px;">Verify your dating profile</h2>
          <p style="color:#8A8F98;line-height:1.6;margin:0 0 20px;">Enter this code in the dating portal to activate your profile. Your profile stays hidden from other members until verified.</p>
          <div style="text-align:center;padding:18px;background:rgba(209,255,38,0.08);border:1px solid rgba(209,255,38,0.4);font-size:34px;letter-spacing:.4em;font-weight:800;color:#D1FF26;">${rawCode}</div>
          <p style="color:#8A8F98;font-size:11px;margin-top:18px;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      </div>`;
    const text = `1 CALL DATING — verify your dating profile. Your code is: ${rawCode}. It expires in 15 minutes.`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject,
        html,
        text,
      });
    } catch (e) {
      console.error("SendEmail failed:", e.message);
      return Response.json({ error: "Could not send verification email. Try again." }, { status: 500 });
    }

    return Response.json({ success: true, sent_to: user.email.replace(/(.{1,2}).*(@.*)/, "$1***$2") });
  } catch (error) {
    console.error("send-dating-verification error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}