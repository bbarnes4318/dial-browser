import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * sendBookingVoiceConfirmation — creates a voice-confirmation voicemail that
 * reads the booking service summary back to the user via the in-app phone.
 * Triggered automatically by the BookingVoiceConfirmation workflow the moment a
 * CallbackRequest is created, so it fires regardless of which surface made the
 * booking (modal, voice command, API).
 *
 * The voicemail is stored transcript-only (no generated audio) so the platform's
 * natural, language-aware TTS speaks it through the phone — zero integration
 * credits per booking. VoicemailBox renders a "Read" button for any voicemail
 * with a transcript, which is how the summary is read back aloud.
 *
 * The workflow trigger has no live user session, so ownership is verified via
 * the CallbackRequest record (created under RLS by an authenticated member) and
 * the member's registered phone number — mirroring sendBookingReceipt.
 */
function normalizePhone(p) {
  return String(p || "").replace(/[^0-9]/g, "");
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const {
      callback_request_id,
      provider_name,
      caller_name,
      caller_phone,
      service_needed,
      preferred_time,
    } = body;

    if (!caller_name || !caller_phone || !provider_name) {
      return Response.json(
        { error: "Missing required fields (caller_name, caller_phone, provider_name)" },
        { status: 400 }
      );
    }

    // Resolve the acting caller (workflow trigger carries no user session).
    let actingUser = null;
    try { actingUser = await base44.auth.me(); } catch { /* service-role / workflow context */ }

    let ownerId = null;
    if (actingUser && actingUser.role === "admin") {
      // Admins may trigger confirmations for any booking (support / operations).
      ownerId = actingUser.id;
    } else if (callback_request_id) {
      const cb = await base44.asServiceRole.entities.CallbackRequest.get(callback_request_id);
      if (!cb) {
        return Response.json({ error: "Callback request not found" }, { status: 404 });
      }
      ownerId = cb.created_by_id || null;
      if (!ownerId) {
        return Response.json({ error: "Booking has no verified owner" }, { status: 403 });
      }
      // Confirm the confirmation phone matches the member's registered number.
      const members = await base44.asServiceRole.entities.Member.filter({ created_by_id: ownerId });
      const member = members && members[0];
      const memberPhone = member && member.phone ? normalizePhone(member.phone) : null;
      if (!memberPhone || normalizePhone(caller_phone) !== memberPhone) {
        return Response.json(
          { error: "Recipient phone must match the booking owner's registered number" },
          { status: 403 }
        );
      }
    } else {
      return Response.json({ error: "Not authorized: could not verify booking ownership" }, { status: 403 });
    }

    const timeLabels = {
      asap: "as soon as possible",
      morning: "in the morning",
      afternoon: "in the afternoon",
      evening: "in the evening",
      flexible: "at a convenient time",
    };
    const timeLabel = timeLabels[preferred_time] || "at a convenient time";

    // Spoken summary — prefixed with the member's name so the phone read-back
    // is personal. VoicemailBox prepends "Voicemail from {caller_name}." on play.
    const transcript = `Booking confirmation for ${caller_name}. Your service booking with ${provider_name} is confirmed. Service requested: ${service_needed || "general service"}. ${provider_name} will call you back ${timeLabel}. Thank you for using 1 Call Away.`;

    const voicemail = await base44.asServiceRole.entities.Voicemail.create({
      caller_name: `${provider_name} — Booking Confirmation`,
      caller_phone: "AUTOMATED",
      recipient_dial_code: caller_phone,
      transcript,
      call_type: "contact",
      listened: false,
      // created_by_id is forced to the service principal when running under the
      // workflow (no user session), so we tag the owning member via a custom
      // field the read/update/delete RLS recognizes — letting them see, play,
      // and manage their own booking-confirmation voicemail.
      owner_user_id: ownerId,
    });

    console.log(`Booking voice confirmation created for ${caller_name} (${caller_phone}) — ${provider_name}`);

    return Response.json({
      success: true,
      voicemail_id: voicemail.id,
      transcript,
    });
  } catch (error) {
    console.error("sendBookingVoiceConfirmation error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}