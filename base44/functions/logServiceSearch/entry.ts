import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sanitizeSearchQuery } from "../../shared/searchLogSanitizer.ts";

// Public endpoint (anonymous visitors can search the directory). Sanitizes the
// query of all PII, then stores an opaque, non-reversible log record so the
// admin dashboard can see what voice services users are searching for without
// ever exposing personal identity data.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const query = sanitizeSearchQuery(body?.query || "");
    if (!query || query.length < 2) {
      return Response.json({ skipped: true, reason: "query too short or empty" });
    }

    const source = body?.source === "landing" ? "landing" : "directory";
    const category = String(body?.category || "All").slice(0, 40);
    const region = String(body?.region || "All").slice(0, 40);
    const collection = String(body?.collection || "all").slice(0, 40);
    const resultCount = Math.max(0, Math.min(9999, Number(body?.result_count) || 0));

    // Non-reversible user identifier (8-byte SHA-256 prefix) or anonymous.
    let userHash = "anonymous";
    try {
      const user = await base44.auth.me();
      if (user && user.id) {
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(user.id));
        userHash = "u_" + Array.from(new Uint8Array(digest)).slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
      }
    } catch {
      // anonymous visitor — leave as "anonymous"
    }

    await base44.asServiceRole.entities.ServiceSearchLog.create({
      query,
      category,
      region,
      collection,
      result_count: resultCount,
      source,
      user_hash: userHash,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("logServiceSearch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}