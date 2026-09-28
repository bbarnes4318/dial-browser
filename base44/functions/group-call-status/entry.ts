import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

/**
 * group-call-status — live status of a group-call conference bridge.
 * Polls the Twilio Conferences + Participants APIs by friendly name and
 * returns how many legs have joined, how many are still ringing, and a
 * derived connection-quality grade so the Groups page can render a
 * real-time status indicator and confirm when all participants are in.
 *
 * Requires the Twilio Account SID + Auth Token secrets. Degrades gracefully
 * (returns a clear error) when Twilio is not configured.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!me || !me.id) return Response.json({ error: "Authentication required." }, { status: 401 });

    const body = await req.json();
    const conference = String(body.conference || "").trim();
    const expected = Math.max(0, parseInt(body.expected, 10) || 0);
    if (!conference) return Response.json({ error: "Conference name required." }, { status: 400 });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return Response.json({ error: "Twilio is not configured, so live conference status is unavailable." }, { status: 503 });
    }
    const auth = btoa(`${accountSid}:${authToken}`);

    // Resolve the conference by its friendly name.
    const confRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Conferences.json?FriendlyName=${encodeURIComponent(conference)}&PageSize=5`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const confData = await confRes.json();
    const conf = (confData.conferences || [])[0];

    if (!conf) {
      return Response.json({
        ok: true, found: false, conference,
        totalDialed: expected, joined: 0, ringing: 0, failed: 0,
        allJoined: false, quality: "poor", participants: [],
      });
    }

    const partsRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Conferences/${conf.sid}/Participants.json?PageSize=50`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const partsData = await partsRes.json();
    const raw = Array.isArray(partsData.participants) ? partsData.participants : [];

    const participants = raw.map((p) => ({
      call_sid: p.call_sid || "",
      label: p.label || "",
      status: p.status || "",
      joined: !p.status || p.status === "connected" || p.status === "in-progress",
      ringing: p.status === "ringing" || p.status === "queued",
    }));

    const joined = participants.filter((p) => p.joined).length;
    const ringing = participants.filter((p) => p.ringing).length;
    const total = expected || participants.length;
    const failed = Math.max(0, total - joined - ringing);
    const allJoined = total > 0 && joined >= total;

    const ratio = total > 0 ? joined / total : 0;
    let quality = "poor";
    if (allJoined) quality = "excellent";
    else if (ratio >= 0.66) quality = "good";
    else if (ratio >= 0.33) quality = "fair";

    return Response.json({
      ok: true, found: true, conference,
      totalDialed: total, joined, ringing, failed,
      allJoined, quality, participants,
    });
  } catch (error) {
    console.error("group-call-status error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}