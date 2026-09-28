import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Public certificate verification by code. Anyone can verify a certificate's
// authenticity — no login required. Returns only the public credential fields.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const code = (body.code || '').toString().trim().toUpperCase();
    if (!code) return Response.json({ valid: false, error: 'Verification code required.' }, { status: 400 });

    const certs = await base44.asServiceRole.entities.Certificate.filter(
      { verification_code: code }, '-created_date', 5
    );
    const cert = (certs || []).find((c) => !c.revoked);
    if (!cert) return Response.json({ valid: false });

    return Response.json({
      valid: true,
      owner_name: cert.owner_name || '',
      course_title: cert.course_title || '',
      issued_at: cert.issued_at || null,
      verification_code: cert.verification_code,
    });
  } catch (error) {
    console.error('verify-certificate error:', error.message);
    return Response.json({ valid: false, error: 'Verification failed.' }, { status: 500 });
  }
}