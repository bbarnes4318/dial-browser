import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { validateTwilioRequest } from "../../shared/twilioVoiceAuth.ts";
import { ensureEntitlement, resolveTier } from "../../shared/phoneMetering.ts";

/**
 * phone-call-status — Twilio status-callback webhook invoked when a softphone
 * call ends. Finalizes the matching PhoneCall row with duration/status and
 * decrements the member's monthly call-minute cap (ceil of duration/60).
 */
export default async function(req) {
  try {
    const bodyText = await req.text();
    const valid = await validateTwilioRequest(req, bodyText);
    if (!valid) return new Response("Forbidden", { status: 403 });

    const params = new URLSearchParams(bodyText);
    const callSid = params.get("CallSid") || "";
    const callStatus = (params.get("CallStatus") || "").toLowerCase();
    const durationSec = parseInt(params.get("CallDuration") || "0", 10) || 0;

    const base44 = createClientFromRequest(req);

    const calls = await base44.asServiceRole.entities.PhoneCall.filter(
      { call_sid: callSid }, "-created_date", 1
    );
    if (!calls || !calls.length) {
      return new Response("OK", { status: 200 });
    }
    const call = calls[0];

    const statusMap = {
      completed: "completed", busy: "busy", failed: "failed", no_answer: "no_answer",
      canceled: "failed", ringing: "ringing", in_progress: "in_progress", queued: "connecting",
    };
    const mappedStatus = statusMap[callStatus] || call.status;

    const minutes = durationSec > 0 ? Math.ceil(durationSec / 60) : 0;

    // Calls pre-billed at placement (radio bridge reserves minutes upfront to
    // bound spend) are already metered — finalize the row but don't bill again.
    const preReserved = (call.minutes_billed || 0) > 0;

    await base44.asServiceRole.entities.PhoneCall.update(call.id, {
      status: mappedStatus,
      duration_seconds: durationSec,
      minutes_billed: preReserved ? call.minutes_billed : minutes,
      ended_at: new Date().toISOString(),
    });

    // Meter outbound calls only (inbound minutes to the member are free here).
    if (!preReserved && minutes > 0 && call.direction === "outbound" && call.owner_user_id) {
      const tier = await resolveTier(base44, call.owner_user_id);
      const ent = await ensureEntitlement(base44, call.owner_user_id, tier);
      await base44.asServiceRole.entities.PhoneEntitlement.update(ent.id, {
        minutes_used: (ent.minutes_used || 0) + minutes,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("phone-call-status error:", error.message);
    return new Response("OK", { status: 200 });
  }
}