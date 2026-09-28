import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { COST_PER_CREDIT } from "../../shared/credits.ts";

// Volume-discount tiers — as monthly credit usage grows, the effective
// per-credit rate drops, yielding savings at each threshold. The forecast
// projects the current cycle's run-rate to a full month, then models the
// cost at 1x and at growth multipliers (2x/5x/10x), surfacing the savings
// unlocked when traffic crosses each tier.
const VOLUME_TIERS = [
  { threshold: 0, rate: 0.010, label: "BASELINE", savingsPct: 0 },
  { threshold: 50000, rate: 0.008, label: "GROWTH", savingsPct: 20 },
  { threshold: 150000, rate: 0.006, label: "SCALE", savingsPct: 40 },
  { threshold: 500000, rate: 0.005, label: "ENTERPRISE", savingsPct: 50 },
];

function rateForUsage(usage: number): number {
  let rate = VOLUME_TIERS[0].rate;
  for (const t of VOLUME_TIERS) {
    if (usage >= t.threshold) rate = t.rate;
  }
  return rate;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const credits = await base44.asServiceRole.entities.CallCredit.list("-created_date", 500).catch(() => []);
    const now = new Date();

    let totalUsed = 0;
    let cycleDays = 0;
    let daysElapsed = 0;
    (credits || []).forEach((c) => {
      totalUsed += c.used_credits || 0;
      const start = c.billing_cycle_start ? new Date(c.billing_cycle_start) : null;
      const end = c.billing_cycle_end ? new Date(c.billing_cycle_end) : null;
      if (start && end) {
        const total = Math.max(1, (end.getTime() - start.getTime()) / 86400000);
        const elapsed = Math.min(total, Math.max(0, (now.getTime() - start.getTime()) / 86400000));
        cycleDays += total;
        daysElapsed += elapsed;
      }
    });

    // Average cycle progress across all records (weighted by cycle length).
    const progress = cycleDays > 0 ? Math.min(1, daysElapsed / cycleDays) : 0;
    // Project full-month usage from the current run-rate.
    const projectedMonthlyUsage = progress > 0 ? Math.round(totalUsed / progress) : totalUsed;
    const currentRate = rateForUsage(projectedMonthlyUsage);
    const projectedMonthlyCost = Number((projectedMonthlyUsage * currentRate).toFixed(2));
    const baselineCost = Number((projectedMonthlyUsage * COST_PER_CREDIT).toFixed(2));
    const currentSavings = Number((baselineCost - projectedMonthlyCost).toFixed(2));

    // Growth scenarios — cost at 2x, 5x, 10x current traffic.
    const activeUsers = (credits || []).length;
    const scenarios = [2, 5, 10].map((m) => {
      const usage = projectedMonthlyUsage * m;
      const rate = rateForUsage(usage);
      const cost = Number((usage * rate).toFixed(2));
      const baseline = Number((usage * COST_PER_CREDIT).toFixed(2));
      const savings = Number((baseline - cost).toFixed(2));
      const tier = VOLUME_TIERS.slice().reverse().find((t) => usage >= t.threshold);
      return {
        multiplier: m,
        projectedUsage: usage,
        rate,
        cost,
        baselineCost: baseline,
        savings,
        savingsPct: baseline > 0 ? Math.round((savings / baseline) * 100) : 0,
        tierLabel: tier ? tier.label : "BASELINE",
      };
    });

    // Nearest savings milestone above the current projection.
    const nextMilestone = VOLUME_TIERS.find((t) => t.threshold > projectedMonthlyUsage) || null;
    const creditsToNext = nextMilestone ? Math.max(0, nextMilestone.threshold - projectedMonthlyUsage) : 0;
    const perUserUsage = activeUsers > 0 ? projectedMonthlyUsage / activeUsers : 0;
    const usersToNext = nextMilestone && perUserUsage > 0 ? Math.ceil(creditsToNext / perUserUsage) : 0;

    return Response.json({
      current: {
        totalUsed,
        projectedMonthlyUsage,
        cycleProgress: Number(progress.toFixed(2)),
        projectedMonthlyCost,
        baselineCost,
        currentSavings,
        effectiveRate: currentRate,
        activeUsers,
      },
      volumeTiers: VOLUME_TIERS.map((t) => ({
        ...t,
        active: projectedMonthlyUsage >= t.threshold,
      })),
      scenarios,
      nextMilestone: nextMilestone ? {
        label: nextMilestone.label,
        threshold: nextMilestone.threshold,
        savingsPct: nextMilestone.savingsPct || 0,
        creditsAway: Math.round(creditsToNext),
        usersAway: usersToNext,
      } : null,
    });
  } catch (error) {
    console.error("getUsageForecast error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}