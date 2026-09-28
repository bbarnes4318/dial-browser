import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { sendTwilioSms } from "../../shared/twilioSms.ts";
import { ensureEntitlement, resolveTier, remainingSms, normalizeE164, resolveOutboundNumber } from "../../shared/phoneMetering.ts";

/**
 * send-phone-sms — sends a real SMS from the member's Dial number (paid) or
 * the shared line (free) to any real phone, meters it against the monthly
 * SMS cap, and records the outbound message in their threaded PhoneMessage
 * history. Requires the non-emergency disclaimer to be acknowledged.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!me || !me.id) return Response.json({ error: "Authentication required." }, { status: 401 });

    const body = await req.json();
    const to = normalizeE164(body.to);
    const text = String(body.text || "").slice(0, 1600);
    if (!to) return Response.json({ error: "A destination number is required." }, { status: 400 });
    if (!text) return Response.json({ error: "Message text is required." }, { status: 400 });

    const tier = await resolveTier(base44, me.id);
    const entitlement = await ensureEntitlement(base44, me.id, tier);

    if (!entitlement.disclaimer_acknowledged) {
      return Response.json({ error: "Please accept the non-emergency disclaimer before sending a message.", needsDisclaimer: true }, { status: 403 });
    }
    if (remainingSms(entitlement) <= 0) {
      return Response.json({ error: "You've used your free monthly SMS. Upgrade or buy a top-up to keep texting.", needsUpgrade: true }, { status: 402 });
    }

    const fromRecord = await resolveOutboundNumber(base44, me.id, entitlement);
    if (!fromRecord || !fromRecord.number) {
      return Response.json({ error: "No outbound number is available yet. Paid members can provision a number; free members use the shared line once it's configured." }, { status: 503 });
    }

    const result = await sendTwilioSms(to, text, fromRecord.number);
    if (!result.success) {
      console.error("send-phone-sms: Twilio send failed:", result.error);
      return Response.json({ error: result.error || "Failed to send SMS." }, { status: 502 });
    }

    // Meter + record.
    await base44.asServiceRole.entities.PhoneEntitlement.update(entitlement.id, {
      sms_used: (entitlement.sms_used || 0) + 1,
    });

    const threadId = [normalizeE164(fromRecord.number), to].sort().join("|");
    const message = await base44.asServiceRole.entities.PhoneMessage.create({
      owner_user_id: me.id,
      direction: "outbound",
      from_number: fromRecord.number,
      remote_number: to,
      body: text,
      message_sid: result.messageId,
      status: "sent",
      read: true,
      thread_id: threadId,
      created_by_id: me.id,
    });

    return Response.json({
      message,
      remainingSms: remainingSms({ ...entitlement, sms_used: (entitlement.sms_used || 0) + 1 }),
    });
  } catch (error) {
    console.error("send-phone-sms error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}