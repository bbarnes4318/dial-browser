import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Public magic-link endpoint for recipients to accept / decline / poll a
// location share WITHOUT logging in (used by emergency contacts reached via
// SMS). The SharedLocationRecipient id acts as an unguessable token.
// Friends reached in-app accept directly via the SDK + RLS instead.
//
// SECURITY: live coordinates are ONLY returned once the recipient has
// explicitly accepted (recipient.accepted === true). A 'poll' before accept
// returns a status-only payload so the share link alone cannot be used to
// silently track the sharer.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { recipient_id, action } = body || {};
    if (!recipient_id) return Response.json({ error: 'Missing recipient_id' }, { status: 400 });

    const svc = base44.asServiceRole.entities.SharedLocationRecipient;
    const recipient = await svc.get(recipient_id);
    if (!recipient) return Response.json({ error: 'Not found' }, { status: 404 });

    // Expiry / revocation checks
    const now = Date.now();
    const expired = recipient.expires_at && new Date(recipient.expires_at).getTime() < now;
    const revoked = recipient.status === 'revoked';
    if (expired || revoked) {
      return Response.json({ accepted: false, expired: true, revoked });
    }

    if (action === 'decline') {
      await svc.update(recipient_id, { declined: true, accepted: false });
      return Response.json({ declined: true });
    }

    // Accept (default action) — mark consent if not already accepted.
    // 'poll' never forces acceptance; it only observes the current state.
    let accepted = !!recipient.accepted;
    if (!accepted && action !== 'poll') {
      await svc.update(recipient_id, { accepted: true, declined: false, accepted_at: new Date().toISOString() });
      accepted = true;
    }

    const statusPayload = {
      accepted,
      declined: false,
      expired: false,
      revoked: false,
      mode: recipient.mode,
      owner_name: recipient.owner_name,
      owner_avatar: recipient.owner_avatar,
      recipient_name: recipient.recipient_name,
      recipient_type: recipient.recipient_type,
      expires_at: recipient.expires_at,
    };

    // Consent gate: coordinates are revealed only after the recipient has
    // accepted. A 'poll' issued before acceptance returns status only.
    if (!accepted) {
      return Response.json(statusPayload);
    }

    return Response.json({
      ...statusPayload,
      latitude: recipient.latitude,
      longitude: recipient.longitude,
      accuracy: recipient.accuracy,
      last_updated: recipient.last_updated,
    });
  } catch (error) {
    console.error('accept-location-share error:', error.message);
    return Response.json({ error: 'Unable to process this location share link.' }, { status: 500 });
  }
}