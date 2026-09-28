import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require admin — mass SMS broadcast to all category alert subscribers is a
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
    const { category, provider_name, provider_description, region, phone, dial_code } = body;

    if (!category || !provider_name) {
      return Response.json({ error: 'Missing required fields: category, provider_name' }, { status: 400 });
    }

    // Find all active subscriptions matching this category
    const subs = await base44.asServiceRole.entities.CategoryAlertSubscription.filter(
      { active: true, category },
      '-created_date',
      500
    );

    // Filter by region: subscriber region is "all"/"national" OR matches provider region
    const matched = subs.filter((sub) => {
      if (!sub.region || sub.region === 'all' || sub.region === 'national') return true;
      if (!region) return false;
      return sub.region === region;
    });

    if (matched.length === 0) {
      return Response.json({ success: true, alerts_sent: 0, message: 'No matching subscribers found' });
    }

    const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const contactStr = phone ? `Call ${phone}` : `Dial ${dial_code || '*100#'}`;

    let sent = 0;
    for (const sub of matched) {
      const message_body = `1 CALL AWAY: A new ${categoryLabel} provider just joined the network! ${provider_name}${provider_description ? ' — ' + provider_description : ''}. ${contactStr} to connect. Reply STOP to unsubscribe.`;
      try {
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'category_alert',
          recipient_name: sub.full_name,
          recipient_phone: sub.phone,
          title: `New ${categoryLabel} Provider Available`,
          message_body,
          related_name: provider_name,
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
      provider: provider_name,
      category,
    });
  } catch (error) {
    console.error('sendCategoryProviderAlert error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});