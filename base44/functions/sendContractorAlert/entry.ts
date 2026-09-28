import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require admin — mass SMS broadcast to all contractor alert subscribers is a
    // privileged operation that must not be triggerable by unauthenticated callers.
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { provider_id, company_name, specialties, region, city, state, phone, dial_code } = body;

    if (!company_name || !specialties || !Array.isArray(specialties) || specialties.length === 0) {
      return Response.json({ error: 'Missing required fields: company_name, specialties (array)' }, { status: 400 });
    }

    // Find all active subscriptions matching any of the provider's specialties
    const subs = await base44.asServiceRole.entities.ConstructionAlertSubscription.filter({ active: true }, '-created_date', 500);

    // Match: specialty is in the provider's specialties AND region matches (sub region is "all"/"national" OR matches provider region)
    const matched = subs.filter((sub) => {
      if (!specialties.includes(sub.specialty)) return false;
      if (!sub.region || sub.region === 'all' || sub.region === 'national') return true;
      return sub.region === region;
    });

    if (matched.length === 0) {
      return Response.json({ success: true, alerts_sent: 0, message: 'No matching subscribers found' });
    }

    const specialtyLabel = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const locationStr = [city, state].filter(Boolean).join(', ') || region || 'your area';

    let sent = 0;
    for (const sub of matched) {
      const message_body = `1 CALL AWAY: A ${specialtyLabel(sub.specialty)} contractor is now available near you! ${company_name} — ${locationStr}. ${phone ? `Call ${phone}` : `Dial ${dial_code || '*700#'}`} to book. Reply STOP to unsubscribe.`;
      try {
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'contractor_alert',
          recipient_name: sub.full_name,
          recipient_phone: sub.phone,
          title: `${specialtyLabel(sub.specialty)} Contractor Available`,
          message_body,
          related_name: company_name,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(sub.phone, message_body);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) sent++;
      } catch (err) {
        console.error(`Failed to send alert to ${sub.phone}:`, err.message);
      }
    }

    return Response.json({
      success: true,
      alerts_sent: sent,
      total_subscribers_checked: subs.length,
      matched_subscribers: matched.length,
      provider: company_name,
    });
  } catch (error) {
    console.error('sendContractorAlert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});