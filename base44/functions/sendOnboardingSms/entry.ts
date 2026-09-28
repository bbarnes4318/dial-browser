import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

// Automated new-member onboarding sequence. Invoked by the
// MemberOnboardingSequence workflow (app_user_auth signup trigger) in three
// timed steps to guide a member through their first voice-dial service
// request. The workflow carries an admin session, so requireAdmin gates the
// HTTP endpoint against anonymous callers while still allowing the scheduler
// to dispatch. It resolves the member's own registered phone from their Member
// record and logs an SmsNotification (notification_type "onboarding") to that
// number.

const MESSAGES: Record<number, { title: string; body: (name: string) => string }> = {
  1: {
    title: "Welcome to 1 Call Away",
    body: (name) =>
      `Hi ${name}, welcome to 1 Call Away! Your account is set up. To use any service, dial a code from any phone — no app or internet needed. Start here: *101# local services (food, rides, doctors, weather) · *108# AI help & jobs · *105# music & movies · *106# buy/sell. Then just say what you need. Full guide: www.dialbrowser.com/dial-how-to`,
  },
  2: {
    title: "Pick a service to try",
    body: (name) =>
      `${name}, ready for your first call? Try: *101# local services, *108# AI assistant & jobs, *105# music & movies, *106# marketplace. Or just say what you need and we'll route you. Browse all services: www.dialbrowser.com/directory`,
  },
  3: {
    title: "Complete your first request",
    body: (name) =>
      `${name}, you're one step from your first connection. Dial any code above, say what you need, and we'll connect you. Need help? Dial *108# to ask the AI assistant, or reply to this text. Welcome aboard!`,
  },
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const step = Number(body.step);
    const userId = body.user_id;
    if (!userId || !MESSAGES[step]) {
      return Response.json({ error: "Missing user_id or invalid step (1-3)" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Gate dispatch to an authenticated admin (workflow carries an admin session).
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    // Resolve the member's own registered phone + name from their Member record.
    const members = await base44.asServiceRole.entities.Member.filter(
      { created_by_id: userId }, "-created_date", 1
    );
    const member = members && members[0];
    if (!member || !member.phone) {
      // Member record or phone not yet available — skip gracefully (no error)
      // so the workflow continues to the next step.
      return Response.json({ sent: false, step, reason: "no member phone" });
    }

    const msg = MESSAGES[step];
    const firstName = (member.full_name || "there").split(" ")[0];

    const notif = await base44.asServiceRole.entities.SmsNotification.create({
      notification_type: "onboarding",
      recipient_name: member.full_name || "Member",
      recipient_phone: member.phone,
      title: msg.title,
      message_body: msg.body(firstName),
      related_name: `Onboarding Step ${step}`,
      status: "pending",
      read: false,
    });
    const sms = await sendTwilioSms(member.phone, msg.body(firstName));
    try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }

    console.log(`Onboarding SMS step ${step} ${sms.success ? "delivered" : "failed"} to ${member.phone}${sms.error ? " — " + sms.error : ""}`);
    return Response.json({ sent: sms.success, step, phone: member.phone, sms_delivered: sms.success, sms_error: sms.success ? undefined : sms.error });
  } catch (error) {
    console.error("sendOnboardingSms error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});