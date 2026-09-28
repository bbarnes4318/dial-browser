import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * merchant-leaderboard — returns a public ranking of enrolled merchants by
 * order completion rate and average customer rating. Runs as service role so
 * it can aggregate across all merchants (the onboarding page is public, so
 * per-merchant RLS would hide other merchants). Only public aggregate stats
 * are returned — no webhook URLs, secrets, or phone numbers.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Load all active merchants (service role bypasses RLS).
    const merchants = await base44.asServiceRole.entities.MerchantDispatch.list("-created_date", 200).catch(() => []);
    if (!merchants || merchants.length === 0) {
      return Response.json({ leaderboard: [] });
    }

    // Load all orders (we only need counts, but list gives us the records).
    const orders = await base44.asServiceRole.entities.MerchantOrder.list("-created_date", 500).catch(() => []);
    const orderList = Array.isArray(orders) ? orders : [];

    // Load food ratings to average per merchant.
    const ratings = await base44.asServiceRole.entities.ServiceRating.list("-created_date", 500).catch(() => []);
    const ratingList = (Array.isArray(ratings) ? ratings : []).filter((r) => r.rating_type === "food");

    // Build a lookup from order id -> merchant_id so we can attribute ratings.
    const orderMerchantMap = new Map();
    for (const o of orderList) {
      if (o.id && o.merchant_id) orderMerchantMap.set(o.id, o.merchant_id);
    }

    // Aggregate per merchant.
    const stats = new Map();
    for (const m of merchants) {
      stats.set(m.id, {
        merchant_id: m.id,
        merchant_name: m.merchant_name || "Unknown",
        order_count: 0,
        completed_count: 0,
        rating_sum: 0,
        rating_count: 0,
      });
    }

    for (const o of orderList) {
      const s = stats.get(o.merchant_id);
      if (!s) continue;
      s.order_count += 1;
      // "Completed" = order fired to the merchant webhook AND delivered.
      if (o.status === "fired" && o.webhook_status === "delivered") {
        s.completed_count += 1;
      }
    }

    for (const r of ratingList) {
      const mid = r.related_order_id ? orderMerchantMap.get(r.related_order_id) : null;
      if (!mid) continue;
      const s = stats.get(mid);
      if (!s) continue;
      if (typeof r.score === "number" && r.score > 0) {
        s.rating_sum += r.score;
        s.rating_count += 1;
      }
    }

    // Build leaderboard rows, only including merchants with at least one order.
    const rows = [];
    for (const s of stats.values()) {
      if (s.order_count === 0) continue;
      const completion_rate = s.order_count > 0 ? s.completed_count / s.order_count : 0;
      const avg_rating = s.rating_count > 0 ? s.rating_sum / s.rating_count : 0;
      rows.push({
        merchant_name: s.merchant_name,
        order_count: s.order_count,
        completed_count: s.completed_count,
        completion_rate: Math.round(completion_rate * 100),
        avg_rating: Math.round(avg_rating * 10) / 10,
        rating_count: s.rating_count,
      });
    }

    // Rank: completion rate desc, then avg rating desc, then order volume desc.
    rows.sort((a, b) => {
      if (b.completion_rate !== a.completion_rate) return b.completion_rate - a.completion_rate;
      if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
      return b.order_count - a.order_count;
    });

    return Response.json({ leaderboard: rows.slice(0, 10) });
  } catch (error) {
    console.error("merchant-leaderboard error:", error.message);
    return Response.json({ leaderboard: [], error: error.message });
  }
});