import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { creator_name, stream_title, stream_mode, session_id } = body;
    const origin = req.headers.get("X-Base44-App-Url") || "https://www.dialbrowser.com";

    // Broadcasts reach all live-stream subscribers — restrict to authenticated admins
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required to broadcast live stream alerts' }, { status: 403 });
    }

    if (!creator_name) {
      return Response.json({ error: 'Missing required field: creator_name' }, { status: 400 });
    }

    // Deep link jumps subscribers straight into the active stream
    const streamDeepLink = session_id
      ? `${origin}/#creators?stream=${session_id}`
      : `${origin}/#creators`;

    // Fetch all active live stream subscribers
    const subscribers = await base44.asServiceRole.entities.LiveStreamSubscriber.filter(
      { active: true },
      '-created_date',
      500
    );

    if (!subscribers || subscribers.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No active subscribers found' });
    }

    const title = 'Live Stream Starting Now!';
    const modeLabel = stream_mode === 'audio' ? 'audio' : 'video';
    const message_body = `1 CALL AWAY: ${creator_name} is going LIVE now${stream_title ? ` — "${stream_title}"` : ''}! Tune in to the ${modeLabel} stream. Join the chat: ${streamDeepLink}`;

    let sentCount = 0;
    for (const sub of subscribers) {
      try {
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'event_starting',
          recipient_name: sub.full_name,
          recipient_phone: sub.phone,
          title,
          message_body,
          related_name: creator_name,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(sub.phone, message_body);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) sentCount++;
      } catch (e) {
        console.error(`Failed to notify subscriber ${sub.phone}:`, e.message);
      }
    }

    console.log(`Live stream alert sent to ${sentCount}/${subscribers.length} subscribers for ${creator_name}`);

    return Response.json({
      success: true,
      sent: sentCount,
      total_subscribers: subscribers.length,
    });
  } catch (error) {
    console.error('sendLiveStreamAlert error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});