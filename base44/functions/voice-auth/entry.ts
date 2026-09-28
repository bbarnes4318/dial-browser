import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const PASSPHRASE = 'My voice is my passport. Verify me.';
const VERIFICATION_THRESHOLD = 0.82;

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { operation, email, voiceprint } = body;
    const base44 = createClientFromRequest(req);

    // ── ENROLL: store voiceprint signature + login secret ──
    if (operation === 'enroll') {
      // Require authentication — only logged-in users can enroll their own voiceprint
      let user;
      try {
        user = await base44.auth.me();
      } catch {
        return Response.json({ status: 'error', error: 'Authentication required. Please log in before enrolling your voiceprint.' }, { status: 401 });
      }

      if (!email || !voiceprint) {
        return Response.json({ status: 'error', error: 'Missing email or voiceprint.' }, { status: 400 });
      }

      // Ensure caller can only enroll for their own email — prevents account takeover
      if (user.email !== email) {
        return Response.json({ status: 'error', error: 'You can only enroll a voiceprint for your own account.' }, { status: 403 });
      }

      // Check if already enrolled
      const existing = await base44.asServiceRole.entities.VoiceVerification.filter({ user_email: email });
      if (existing.length > 0) {
        // Update existing
        await base44.asServiceRole.entities.VoiceVerification.update(existing[0].id, {
          voiceprint_signature: JSON.stringify(voiceprint),
          enrolled: true,
          passphrase: PASSPHRASE,
        });
        return Response.json({
          status: 'success',
          enrolled: true,
          passphrase: PASSPHRASE,
          message: 'Voiceprint updated successfully.',
        });
      }

      await base44.asServiceRole.entities.VoiceVerification.create({
        passphrase: PASSPHRASE,
        voiceprint_signature: JSON.stringify(voiceprint),
        user_email: email,
        enrolled: true,
        verification_count: 0,
      });

      return Response.json({
        status: 'success',
        enrolled: true,
        passphrase: PASSPHRASE,
        message: 'Voiceprint enrolled successfully.',
      });
    }

    // ── VERIFY: compare voiceprint against stored signature ──
    if (operation === 'verify') {
      // Require authentication — voice verification is for authenticated users only
      let verifyUser;
      try {
        verifyUser = await base44.auth.me();
      } catch {
        return Response.json({ status: 'error', error: 'Authentication required. Please log in before using voice verification.' }, { status: 401 });
      }

      // Ensure caller can only verify their own voiceprint — prevents account takeover
      if (email && verifyUser.email !== email) {
        return Response.json({ status: 'error', error: 'You can only verify your own voiceprint.' }, { status: 403 });
      }

      if (!email || !voiceprint) {
        return Response.json({ status: 'error', error: 'Missing email or voiceprint.' }, { status: 400 });
      }

      const verifications = await base44.asServiceRole.entities.VoiceVerification.filter({ user_email: email });
      const verification = verifications[0];

      if (!verification || !verification.voiceprint_signature) {
        return Response.json({
          status: 'error',
          error: 'No voiceprint found for this email. Please enroll first.',
          needsEnrollment: true,
        }, { status: 404 });
      }

      let storedVoiceprint;
      try {
        storedVoiceprint = JSON.parse(verification.voiceprint_signature);
      } catch {
        return Response.json({ status: 'error', error: 'Corrupted voiceprint data.' }, { status: 500 });
      }

      const similarity = cosineSimilarity(voiceprint, storedVoiceprint);
      const verified = similarity >= VERIFICATION_THRESHOLD;

      if (verified) {
        await base44.asServiceRole.entities.VoiceVerification.update(verification.id, {
          last_verified_at: new Date().toISOString(),
          verification_count: (verification.verification_count || 0) + 1,
        });

        return Response.json({
          status: 'success',
          verified: true,
          score: similarity,
        });
      } else {
        return Response.json({
          status: 'success',
          verified: false,
          score: similarity,
          threshold: VERIFICATION_THRESHOLD,
        });
      }
    }

    // ── STATUS: check enrollment (authenticated, own-email only) ──
    if (operation === 'status') {
      let statusUser;
      try {
        statusUser = await base44.auth.me();
      } catch {
        return Response.json({ status: 'error', error: 'Authentication required. Please log in before checking voice authentication status.' }, { status: 401 });
      }

      if (!email) {
        return Response.json({ status: 'error', error: 'Missing email.' }, { status: 400 });
      }

      // Only the account owner may query their own enrollment status — prevents
      // unauthenticated user enumeration via the status endpoint (CWE-200).
      if (statusUser.email !== email) {
        return Response.json({ status: 'error', error: 'You can only check your own voice authentication status.' }, { status: 403 });
      }

      const verifications = await base44.asServiceRole.entities.VoiceVerification.filter({ user_email: email });
      const verification = verifications[0];

      // Do NOT reveal whether a record exists for this email — both "no record"
      // and "not yet enrolled" return the same shape to avoid user enumeration.
      if (!verification) {
        return Response.json({ status: 'success', enrolled: false });
      }

      return Response.json({
        status: 'success',
        enrolled: verification.enrolled,
        verificationCount: verification.verification_count || 0,
        passphrase: PASSPHRASE,
      });
    }

    return Response.json({ status: 'error', error: `Unknown operation: ${operation}` }, { status: 400 });
  } catch (error) {
    console.error('voice-auth error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});