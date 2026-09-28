import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

/**
 * send-dating-phone-code — generates a 6-digit one-time code and delivers it
 * to the member's phone via the app's SMS channel (SmsNotification), then
 * stores the (hashed) code + send time on their dating profile. The member
 * confirms it via verify-dating-phone before the profile can go live.
 *
 * The destination phone is read from the member's own profile (never client
 * supplied), so the member cannot spoof the number being verified. The SMS
 * is dispatched through the service role so the caller needs no elevated
 * permissions.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mine = await base44.asServiceRole.entities.DatingProfile.filter(
      { created_by_id: user.id },
      "-created_date",
      5
    );
    const profile = mine && mine[0];
    if (!profile) {
      return Response.json({ error: "Create your dating profile first" }, { status: 400 });
    }
    if (!profile.phone) {
      return Response.json({ error: "Add a phone number to your profile first" }, { status: 400 });
    }
    if (profile.phone_verified) {
      return Response.json({ success: true, already_verified: true });
    }

    // Rate-limit: enforce a minimum cooldown between sends and a daily cap
    // to prevent SMS-bombing of arbitrary numbers from the app's Twilio line.
    const MAX_DAILY_SENDS = 5;
    const COOLDOWN_MS = 60 * 1000;
    const nowMs = Date.now();
    const sentAtMs = profile.phone_verification_sent_at ? new Date(profile.phone_verification_sent_at).getTime() : 0;
    if (sentAtMs && nowMs - sentAtMs < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (nowMs - sentAtMs)) / 1000);
      return Response.json({ error: `Please wait ${wait}s before requesting another code` }, { status: 429 });
    }
    // Reset the daily counter when crossing a calendar-day boundary (UTC).
    const sentDay = sentAtMs ? new Date(sentAtMs).toISOString().slice(0, 10) : null;
    const today = new Date(nowMs).toISOString().slice(0, 10);
    const sendCount = sentDay === today ? (profile.phone_verification_send_count || 0) : 0;
    if (sendCount >= MAX_DAILY_SENDS) {
      return Response.json({ error: "Daily code limit reached. Try again tomorrow." }, { status: 429 });
    }

    // Cryptographically secure 6-digit code.
    const randBytes = new Uint32Array(6);
    crypto.getRandomValues(randBytes);
    const rawCode = randBytes.map((d) => d % 10).join("");
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", enc.encode(rawCode + "::" + profile.id));
    const hashed = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");

    await base44.asServiceRole.entities.DatingProfile.update(profile.id, {
      phone_verification_code: hashed,
      phone_verification_sent_at: new Date().toISOString(),
      phone_verification_send_count: sendCount + 1,
      phone_verification_attempts: 0,
    });

    // Deliver the code via real SMS (Twilio), logging the SmsNotification record.
    const codeMsg = `1 CALL DATING: Your verification code is ${rawCode}. Enter it in the dating portal to confirm your phone and activate your profile.`;
    try {
      const notif = await base44.asServiceRole.entities.SmsNotification.create({
        notification_type: "new_match",
        recipient_name: profile.full_name || "Member",
        recipient_phone: profile.phone,
        title: "Dial Dating phone verification code",
        message_body: codeMsg,
        related_name: "Phone verification",
        status: "pending",
        read: false,
      });
      const sms = await sendTwilioSms(profile.phone, codeMsg);
      try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
      if (!sms.success) {
        console.error("Phone verification SMS failed:", sms.error);
        return Response.json({ error: "Could not send verification code. Try again." }, { status: 500 });
      }
    } catch (e) {
      console.error("Phone verification SMS failed:", e.message);
      return Response.json({ error: "Could not send verification code. Try again." }, { status: 500 });
    }

    const digits = profile.phone.replace(/\D/g, "");
    const masked = digits.length >= 4 ? `***-***-${digits.slice(-4)}` : profile.phone;
    const resp = { success: true, sent_to: masked };
    // Admin testing affordance: surface the code so the flow can be exercised
    // before a real SMS provider is connected (non-admins never see it).
    if (user.role === "admin") resp.dev_code = rawCode;
    return Response.json(resp);
  } catch (error) {
    console.error("send-dating-phone-code error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}