import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * voice-network-stats — public aggregate counters for the social portal data
 * widget. Runs as service role so it can count across all PhoneCall rows (per-
 * user RLS would otherwise hide other members' calls). Only aggregate counts
 * are returned — no phone numbers, SIDs, or user ids.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Pull the most recent 500 call rows and count by status. Active calls are
    // few; completed calls can be many — we cap at the page size and flag when
    // the true total is likely higher.
    const calls = await base44.asServiceRole.entities.PhoneCall.list("-created_date", 500).catch(() => []);
    const list = Array.isArray(calls) ? calls : [];

    const ACTIVE = new Set(["connecting", "ringing", "in_progress"]);
    let activeCalls = 0;
    let successfulConnections = 0;
    for (const c of list) {
      if (ACTIVE.has(c.status)) activeCalls += 1;
      if (c.status === "completed") successfulConnections += 1;
    }

    return Response.json({
      activeCalls,
      successfulConnections,
      sampled: list.length,
      capped: list.length >= 500,
    });
  } catch (error) {
    console.error("voice-network-stats error:", error.message);
    return Response.json({
      activeCalls: 0,
      successfulConnections: 0,
      error: error.message,
    });
  }
});