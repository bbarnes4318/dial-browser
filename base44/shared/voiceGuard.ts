// Server-side enforcement of the optional voice-biometric sensitive-action guard.
//
// When a user has enabled `require_voice_guard` (toggled via the SensitiveActionGuard
// UI), sensitive backend operations (payments, subscription changes) must refuse
// to proceed unless the caller has a recent successful `voice-biometric-verify`
// result stamped on their enrolled VoiceVerification record. The client-side
// VoiceGuardModal performs the verification (which sets last_verified_at); this
// check makes that protection non-bypassable — a script that skips the modal and
// calls the backend function directly is rejected because no fresh verification
// exists.

// A successful voice verification is valid for this window before the action
// must be re-verified.
const GUARD_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns null if the action may proceed, or a Response (403) to return
 * immediately when the guard is enabled and not satisfied. Fails closed: if the
 * verification record cannot be read, the action is blocked.
 */
export async function enforceVoiceGuard(base44, me) {
  if (!me || !me.require_voice_guard) return null; // guard not enabled for this user

  try {
    const rows = await base44.asServiceRole.entities.VoiceVerification.filter(
      { created_by_id: me.id, enrolled: true },
      "-created_date",
      1
    );
    const enrollment = rows && rows[0];

    if (!enrollment || !enrollment.last_verified_at) {
      return Response.json(
        { error: "Voice verification required for this action. Verify with your voiceprint first.", voice_guard_required: true },
        { status: 403 }
      );
    }

    const ageMs = Date.now() - new Date(enrollment.last_verified_at).getTime();
    if (isNaN(ageMs) || ageMs > GUARD_WINDOW_MS) {
      return Response.json(
        { error: "Voice verification has expired. Verify with your voiceprint again to continue.", voice_guard_required: true },
        { status: 403 }
      );
    }
  } catch (e) {
    console.error("enforceVoiceGuard: verification lookup failed:", e.message);
    return Response.json(
      { error: "Could not verify voice guard. Please try again.", voice_guard_required: true },
      { status: 403 }
    );
  }

  return null;
}