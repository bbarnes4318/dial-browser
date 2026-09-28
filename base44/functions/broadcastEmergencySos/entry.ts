import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    // Require admin authentication — only admins can trigger emergency broadcasts
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
    const { broadcast_id, manual_trigger } = body;

    if (!broadcast_id) {
      return Response.json({ error: 'broadcast_id is required' }, { status: 400 });
    }

    // Fetch the broadcast record
    const broadcast = await base44.asServiceRole.entities.EmergencyBroadcast.get(broadcast_id);
    if (!broadcast) {
      return Response.json({ error: 'Emergency broadcast not found' }, { status: 404 });
    }

    // If already delivered, don't re-send unless explicitly manually triggered
    if (broadcast.broadcast_status === 'delivered' && !manual_trigger) {
      return Response.json({
        success: true,
        message: 'Broadcast already delivered',
        sent_count: broadcast.sent_count,
        total_recipients: broadcast.total_recipients,
        skipped: true,
      });
    }

    // Mark as sending
    await base44.asServiceRole.entities.EmergencyBroadcast.update(broadcast_id, {
      broadcast_status: 'sending',
    });

    // Fetch all members with a phone number
    const members = await base44.asServiceRole.entities.Member.list('-created_date', 500);

    if (!members || members.length === 0) {
      await base44.asServiceRole.entities.EmergencyBroadcast.update(broadcast_id, {
        broadcast_status: 'failed',
        total_recipients: 0,
        sent_count: 0,
      });
      return Response.json({
        success: false,
        error: 'No registered members found to notify',
        broadcast_id,
      });
    }

    // ---- Region derivation (shared shape with src/lib/regionMap.js) ----
    const STATE_TO_REGION = {
      ct:'northeast',me:'northeast',ma:'northeast',nh:'northeast',ri:'northeast',vt:'northeast',nj:'northeast',ny:'northeast',pa:'northeast',
      il:'midwest',in:'midwest',mi:'midwest',oh:'midwest',wi:'midwest',ia:'midwest',ks:'midwest',mn:'midwest',mo:'midwest',ne:'midwest',nd:'midwest',sd:'midwest',
      al:'southeast',de:'southeast',fl:'southeast',ga:'southeast',ky:'southeast',la:'southeast',md:'southeast',ms:'southeast',nc:'southeast',sc:'southeast',tn:'southeast',va:'southeast',wv:'southeast',dc:'southeast',ar:'southeast',
      az:'southwest',nm:'southwest',ok:'southwest',tx:'southwest',
      ak:'west',ca:'west',co:'west',hi:'west',id:'west',mt:'west',nv:'west',or:'west',ut:'west',wa:'west',wy:'west',
    };
    const FULL_NAME_TO_ABBR = {
      connecticut:'ct',maine:'me',massachusetts:'ma','new hampshire':'nh','rhode island':'ri',vermont:'vt','new jersey':'nj','new york':'ny',pennsylvania:'pa',
      illinois:'il',indiana:'in',michigan:'mi',ohio:'oh',wisconsin:'wi',iowa:'ia',kansas:'ks',minnesota:'mn',missouri:'mo',nebraska:'ne','north dakota':'nd','south dakota':'sd',
      alabama:'al',delaware:'de',florida:'fl',georgia:'ga',kentucky:'ky',louisiana:'la',maryland:'md',mississippi:'ms','north carolina':'nc','south carolina':'sc',tennessee:'tn',virginia:'va','west virginia':'wv','district of columbia':'dc',arkansas:'ar',
      arizona:'az','new mexico':'nm',oklahoma:'ok',texas:'tx',
      alaska:'ak',california:'ca',colorado:'co',hawaii:'hi',idaho:'id',montana:'mt',nevada:'nv',oregon:'or',utah:'ut',washington:'wa',wyoming:'wy',
    };
    const REGION_NAMES = ['northeast','southeast','midwest','southwest','west'];
    const deriveRegion = (location) => {
      if (!location) return null;
      const s = String(location).toLowerCase();
      for (const r of REGION_NAMES) {
        if (new RegExp(`\\b${r}\\b`).test(s)) return r;
      }
      for (const [name, abbr] of Object.entries(FULL_NAME_TO_ABBR)) {
        if (s.includes(name)) return STATE_TO_REGION[abbr];
      }
      const abbrMatch = s.match(/(?:^|,\s*)([a-z]{2})\b/);
      if (abbrMatch && STATE_TO_REGION[abbrMatch[1]]) return STATE_TO_REGION[abbrMatch[1]];
      return null;
    };

    // Filter members that have a phone and match the selected target regions.
    const targetRegions = (broadcast.affected_regions || ['all']);
    const broadcastAll = targetRegions.includes('all') || targetRegions.includes('national');
    const matchesRegion = (member) => {
      if (broadcastAll) return true;
      const r = deriveRegion(member.location || member.region);
      return r ? targetRegions.includes(r) : false;
    };

    const eligibleMembers = members.filter((m) => m.phone && matchesRegion(m));

    const severityPrefix = {
      sos: '🚨 SOS EMERGENCY',
      critical: '🚨 CRITICAL ALERT',
      warning: '⚠️ SAFETY ADVISORY',
      info: '📢 SERVICE UPDATE',
    }[broadcast.severity] || '📢 ALERT';

    const fullMessage = `${severityPrefix}: ${broadcast.message_body}`;

    let sentCount = 0;
    let failedCount = 0;

    // Send SMS notification to each member
    for (const member of eligibleMembers) {
      try {
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: 'emergency_alert',
          recipient_name: member.full_name || 'Member',
          recipient_phone: member.phone,
          title: broadcast.title,
          message_body: fullMessage,
          related_name: broadcast.title,
          status: 'pending',
          read: false,
        });
        const sms = await sendTwilioSms(member.phone, fullMessage);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) sentCount++; else failedCount++;
      } catch (err) {
        failedCount++;
        console.log(`Failed to send to ${member.phone}: ${err.message}`);
      }
    }

    // Also create an in-app notification for all users
    try {
      await base44.asServiceRole.entities.AppNotification.create({
        notification_type: 'system',
        title: `${severityPrefix}: ${broadcast.title}`,
        message: broadcast.message_body,
        priority: broadcast.severity === 'sos' || broadcast.severity === 'critical' ? 'high' : 'normal',
        read: false,
      });
    } catch { /* non-critical */ }

    // Update the broadcast with results
    await base44.asServiceRole.entities.EmergencyBroadcast.update(broadcast_id, {
      broadcast_status: 'delivered',
      sent_count: sentCount,
      failed_count: failedCount,
      total_recipients: eligibleMembers.length,
      active: broadcast.severity === 'sos' || broadcast.severity === 'critical',
    });

    return Response.json({
      success: true,
      broadcast_id,
      broadcast_status: 'delivered',
      sent_count: sentCount,
      failed_count: failedCount,
      total_recipients: eligibleMembers.length,
      severity: broadcast.severity,
      title: broadcast.title,
    });
  } catch (error) {
    console.error('broadcastEmergencySos error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});