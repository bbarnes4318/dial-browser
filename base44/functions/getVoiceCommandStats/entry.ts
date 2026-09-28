import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function deriveCoords(text) {
  let h = 0;
  for (let i = 0; i < (text || '').length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  const absH = Math.abs(h);
  const lat = 39.8283 + ((absH % 100) - 50) * 0.4;
  const lng = -98.5795 + (((absH >> 8) % 100) - 50) * 0.5;
  return [lat, lng];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    // Fetch all voice commands (service role for global aggregation)
    const commands = await base44.asServiceRole.entities.VoiceCommand.filter({}, '-created_date', 500);

    if (!commands || commands.length === 0) {
      return Response.json({ total_commands: 0, top_categories: [], recent_commands: [], geo_points: [] });
    }

    // Aggregate by service_category
    const categoryMap = {};
    commands.forEach((cmd) => {
      const cat = cmd.service_category || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, count: 0, samples: [] };
      }
      categoryMap[cat].count++;
      if (categoryMap[cat].samples.length < 3 && cmd.command_text) {
        categoryMap[cat].samples.push(cmd.command_text);
      }
    });

    const topCategories = Object.values(categoryMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Recent commands for display
    const recentCommands = commands.slice(0, 5).map((c) => ({
      command_text: c.command_text,
      service_category: c.service_category || 'General',
      source: c.source || 'voice',
      created_date: c.created_date,
    }));

    // Geo points for map visualization — derive pseudo-coordinates from region or command text
    const geoPoints = commands.slice(0, 100).map((c) => ({
      command_text: c.command_text,
      service_category: c.service_category || 'General',
      source: c.source || 'voice',
      region: c.region || '',
      coords: deriveCoords(c.region || c.command_text || c.id),
      created_date: c.created_date,
    }));

    // Daily call volume (last 14 days) and hourly distribution (peak usage times),
    // both computed in US Eastern time (America/New_York) so the admin sees
    // traffic in the platform's standard timezone.
    const etDateFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit' });
    const etHourFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false });
    const etWeekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' });

    const dayMap = {};
    const hourBuckets = new Array(24).fill(0);
    commands.forEach((cmd) => {
      if (!cmd.created_date) return;
      const d = new Date(cmd.created_date);
      if (isNaN(d.getTime())) return;
      const dayKey = etDateFmt.format(d); // MM/DD
      dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
      const hStr = etHourFmt.format(d);
      const h = parseInt(hStr, 10) % 24;
      hourBuckets[h] += 1;
    });

    // Build a contiguous 14-day window ending today (ET), filling gaps with 0.
    const dailyVolume = [];
    const nowEt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    for (let i = 13; i >= 0; i--) {
      const dd = new Date(nowEt);
      dd.setDate(nowEt.getDate() - i);
      const key = etDateFmt.format(dd);
      dailyVolume.push({
        date: key,
        weekday: etWeekdayFmt.format(dd),
        count: dayMap[key] || 0,
      });
    }

    const hourlyVolume = hourBuckets.map((count, hour) => {
      const period = hour < 12 ? 'AM' : 'PM';
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return { hour, label: `${h12}${period}`, count };
    });

    const peakHour = hourlyVolume.reduce((max, cur) => (cur.count > max.count ? cur : max), hourlyVolume[0]);

    return Response.json({
      total_commands: commands.length,
      top_categories: topCategories,
      recent_commands: recentCommands,
      geo_points: geoPoints,
      daily_volume: dailyVolume,
      hourly_volume: hourlyVolume,
      peak_hour: peakHour,
    });
  } catch (error) {
    console.error('getVoiceCommandStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});