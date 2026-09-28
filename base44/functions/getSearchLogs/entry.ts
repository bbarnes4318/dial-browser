import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sanitizeSearchQuery } from "../../shared/searchLogSanitizer.ts";

// Admin-only. Aggregates ServiceSearchLog records into a safe summary for the
// admin dashboard: top search terms, per-category counts, source split, and
// recent searches. PII is stripped at write time AND re-sanitized on read as
// defense-in-depth — the viewer never receives raw identity data.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    const logs = await base44.asServiceRole.entities.ServiceSearchLog.list("-created_date", 1000);

    const termCounts = {};
    const categoryCounts = {};
    const sourceCounts = { directory: 0, landing: 0 };
    const recent = [];

    for (const l of logs) {
      const term = sanitizeSearchQuery(l.query) || "";
      if (term) termCounts[term] = (termCounts[term] || 0) + 1;

      const cat = l.category || "All";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const src = l.source === "landing" ? "landing" : "directory";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      if (recent.length < 25) {
        recent.push({
          query: term || "(empty)",
          category: cat,
          region: l.region || "All",
          source: src,
          result_count: l.result_count || 0,
          created_date: l.created_date,
        });
      }
    }

    const topTerms = Object.entries(termCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, count]) => ({ term, count }));

    const byCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    return Response.json({
      total: logs.length,
      topTerms,
      byCategory,
      sourceCounts,
      recent,
    });
  } catch (error) {
    console.error("getSearchLogs error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}