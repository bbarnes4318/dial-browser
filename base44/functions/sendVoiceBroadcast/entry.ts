import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authentication — only admins can send voice broadcasts
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Require admin role — mass SMS broadcasts are privileged operations
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, broadcast_id } = body;

    // ── Core: send a single broadcast to opted-in subscribers ──
    const sendBroadcast = async (broadcastId) => {
      const broadcast = await base44.asServiceRole.entities.VoiceBroadcast.get(broadcastId);
      if (!broadcast) return { error: 'Broadcast not found', status: 404 };
      if (broadcast.status === 'sent' || broadcast.status === 'sending') {
        return { error: 'Broadcast already sent or in progress', status: 400 };
      }

      await base44.asServiceRole.entities.VoiceBroadcast.update(broadcastId, {
        status: 'sending',
        sent_at: new Date().toISOString(),
      });

      // Build the subscriber query based on target audience and region
      const query = { active: true };
      if (broadcast.target_audience && broadcast.target_audience !== 'all') {
        query.category = broadcast.target_audience;
      }
      if (broadcast.region && broadcast.region !== 'all') {
        query.region = broadcast.region;
      }

      const subscriptions = await base44.asServiceRole.entities.CategoryAlertSubscription.filter(
        query,
        '-created_date',
        500
      );

      const recipients = (subscriptions || []).filter((s) => s.phone);
      let sentCount = 0;
      let failedCount = 0;

      const smsBody = broadcast.message_text
        ? `${broadcast.message_text} — Listen: ${broadcast.audio_url}`
        : `New voice broadcast from 1 Call Away: ${broadcast.audio_url}`;

      for (const sub of recipients) {
        try {
          const notif = await base44.asServiceRole.entities.SmsNotification.create({
            notification_type: 'category_alert',
            recipient_name: sub.full_name,
            recipient_phone: sub.phone,
            title: broadcast.title,
            message_body: smsBody,
            status: 'pending',
            read: false,
          });
          const sms = await sendTwilioSms(sub.phone, smsBody);
          try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
          if (sms.success) sentCount++; else failedCount++;
        } catch {
          failedCount++;
        }
      }

      await base44.asServiceRole.entities.VoiceBroadcast.update(broadcastId, {
        status: 'sent',
        sent_count: sentCount,
        failed_count: failedCount,
        total_recipients: recipients.length,
      });

      return {
        success: true,
        id: broadcastId,
        title: broadcast.title,
        sent: sentCount,
        failed: failedCount,
        total: recipients.length,
      };
    };

    // ── Send a specific broadcast immediately ──
    if (action === 'send') {
      if (!broadcast_id) {
        return Response.json({ error: 'Missing broadcast_id' }, { status: 400 });
      }
      const result = await sendBroadcast(broadcast_id);
      if (result.error) {
        return Response.json({ error: result.error }, { status: result.status });
      }
      return Response.json(result);
    }

    // ── Send all scheduled broadcasts that are due ──
    if (action === 'send_due') {
      const now = new Date();
      const scheduled = await base44.asServiceRole.entities.VoiceBroadcast.filter(
        { status: 'scheduled' },
        '-created_date',
        50
      );

      const due = (scheduled || []).filter(
        (b) => b.scheduled_time && new Date(b.scheduled_time) <= now
      );

      const results = [];
      for (const b of due) {
        const result = await sendBroadcast(b.id);
        results.push(result);
      }

      return Response.json({
        success: true,
        processed: results.length,
        results,
      });
    }

    // ── Cancel a scheduled broadcast ──
    if (action === 'cancel') {
      if (!broadcast_id) {
        return Response.json({ error: 'Missing broadcast_id' }, { status: 400 });
      }
      await base44.asServiceRole.entities.VoiceBroadcast.update(broadcast_id, {
        status: 'cancelled',
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('sendVoiceBroadcast error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});