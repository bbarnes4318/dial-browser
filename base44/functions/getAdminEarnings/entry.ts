import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { TIER_PRICE, COST_PER_CREDIT, TIER_ALLOWANCE } from "../../shared/credits.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [subs, credits, tips, employers, shares] = await Promise.all([
      base44.asServiceRole.entities.Subscription.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.CallCredit.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.Tip.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.EmployerAccess.list("-created_date", 500).catch(() => []),
      base44.asServiceRole.entities.ShowShare.list("-created_date", 500).catch(() => []),
    ]);

    // ── Subscription revenue (MRR + breakdown by tier) ──
    const active = (subs || []).filter((s) => s.subscription_active);
    const byTier: Record<string, { count: number; mrr: number }> = {};
    let mrr = 0;
    active.forEach((s) => {
      const t = s.tier || "plus";
      const price = TIER_PRICE[t] || { monthly: 0, annual: 0 };
      const monthly = s.plan === "annual" ? price.annual / 12 : price.monthly;
      mrr += monthly;
      byTier[t] = byTier[t] || { count: 0, mrr: 0 };
      byTier[t].count += 1;
      byTier[t].mrr += monthly;
    });
    Object.keys(byTier).forEach((t) => { byTier[t].mrr = Number(byTier[t].mrr.toFixed(2)); });

    // ── Credit consumption (current cycle across all users) ──
    let totalUsed = 0;
    let totalAllocated = 0;
    (credits || []).forEach((c) => {
      totalUsed += c.used_credits || 0;
      totalAllocated += c.total_credits || 0;
    });
    const estimatedCost = totalUsed * COST_PER_CREDIT;

    // ── One-time revenue (lifetime) ──
    const tipsTotal = (tips || []).filter((t) => t.status === "completed").reduce((sum, t) => sum + (t.amount || 0), 0);
    const employerTotal = (employers || []).filter((e) => e.access_granted).reduce((sum, e) => sum + (e.price_paid || 0), 0);
    const sharesTotal = (shares || []).reduce((sum, s) => sum + ((s.shares_sold || 0) * (s.price_per_share || 0)), 0);
    const oneTimeTotal = tipsTotal + employerTotal + sharesTotal;

    // Per-tier profitability guard: subscription price vs the MAXIMUM possible
    // credit cost for that tier's allowance. A tier is profitable when price >
    // allowance * COST_PER_CREDIT. Free is the only unrecovered tier (the
    // marketing cost the builder accepts); every paid tier must clear a margin.
    const tierProfitability = Object.keys(TIER_ALLOWANCE).map((t) => {
      const price = (TIER_PRICE[t] || { monthly: 0 }).monthly;
      const maxCost = TIER_ALLOWANCE[t] * COST_PER_CREDIT;
      return {
        tier: t,
        price,
        max_credit_cost: Number(maxCost.toFixed(2)),
        max_profit_per_user: Number((price - maxCost).toFixed(2)),
        profitable: price > maxCost,
        recovered: price >= maxCost,
      };
    });

    return Response.json({
      subscriptions: {
        activeCount: active.length,
        totalRecords: (subs || []).length,
        mrr: Number(mrr.toFixed(2)),
        byTier,
      },
      tierProfitability,
      credits: {
        totalUsed,
        totalAllocated,
        estimatedCostUsd: Number(estimatedCost.toFixed(2)),
        activeUsers: (credits || []).length,
        costPerCredit: COST_PER_CREDIT,
      },
      oneTime: {
        tips: Number(tipsTotal.toFixed(2)),
        employer: Number(employerTotal.toFixed(2)),
        shares: Number(sharesTotal.toFixed(2)),
        total: Number(oneTimeTotal.toFixed(2)),
      },
      profit: {
        monthlyNet: Number((mrr - estimatedCost).toFixed(2)),
      },
    });
  } catch (error) {
    console.error("getAdminEarnings error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});