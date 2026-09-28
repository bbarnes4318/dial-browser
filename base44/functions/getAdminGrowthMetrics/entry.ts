import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * getAdminGrowthMetrics — admin-only. Returns live growth & engagement counts
 * pulled directly from the app's entities (no placeholders), a 14-day daily
 * trend for signups / searches / matches, and live operations counters (open
 * disputes, open reports, failed SMS). Powers the Growth Overview section of
 * the admin dashboard.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    // Each read is resilient on its own — a flaky entity yields [] rather than
    // breaking the whole dashboard. This is an admin analytics view, so partial
    // data is preferable to a total failure.
    const [members, users, commands, likes, posts, profiles, disputes, reports, sms] = await Promise.all([
      base44.asServiceRole.entities.Member.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.User.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.VoiceCommand.filter({}, "-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.DatingLike.filter({ matched: true }, "-matched_at", 500).catch(() => []),
      base44.asServiceRole.entities.SocialPost.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.DatingProfile.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.Dispute.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.DatingReport.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.SmsNotification.list("-created_date", 500).catch(() => []),
    ]);

    // 14-day daily trend in US Eastern (matches getVoiceCommandStats timezone),
    // filling gaps with 0 so the chart is contiguous.
    const etDateFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit' });
    const nowEt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const dayKeys = [];
    for (let i = 13; i >= 0; i--) {
      const dd = new Date(nowEt);
      dd.setDate(nowEt.getDate() - i);
      dayKeys.push(etDateFmt.format(dd));
    }
    const daySet = new Set(dayKeys);
    const bucket = (arr, dateField) => {
      const m = {};
      (arr || []).forEach((r) => {
        if (!r[dateField]) return;
        const d = new Date(r[dateField]);
        if (isNaN(d.getTime())) return;
        const k = etDateFmt.format(d);
        if (daySet.has(k)) m[k] = (m[k] || 0) + 1;
      });
      return dayKeys.map((k) => m[k] || 0);
    };
    const signupSeries = bucket(members, 'created_date');
    const searchSeries = bucket(commands, 'created_date');
    const matchSeries = bucket(likes, 'matched_at');

    const openDisputes = (disputes || []).filter((d) => d.status === 'pending' || d.status === 'under_review').length;
    const openReports = (reports || []).filter((r) => r.status === 'pending').length;
    const failedSms = (sms || []).filter((s) => s.status === 'failed').length;

    return Response.json({
      growth: {
        totalMembers: (members || []).length,
        totalUsers: (users || []).length,
        totalSearches: (commands || []).length,
        totalMatches: (likes || []).length,
        totalSocialPosts: (posts || []).length,
        totalDatingProfiles: (profiles || []).length,
        trend: dayKeys.map((k, i) => ({
          date: k,
          signups: signupSeries[i],
          searches: searchSeries[i],
          matches: matchSeries[i],
        })),
      },
      operations: {
        openDisputes,
        openReports,
        failedSms,
      },
    });
  } catch (error) {
    console.error('getAdminGrowthMetrics error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}