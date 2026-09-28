// media-proxy — streams platform-hosted media through the app's own domain
// so the underlying storage URL (media.base44.com / *.base44.app) never
// appears in the browser. Only allowlisted platform-storage hosts are proxied
// (prevents open-proxy / SSRF abuse). The browser only ever sees
// /functions/media-proxy?u=... on the app's connected custom domain.

import { validateMediaUrl } from "../../shared/urlValidation.ts";

Deno.serve(async (req: Request) => {
  try {
    // Browser <img>/<audio> requests use GET; the SDK test harness uses POST.
    // Both are safe — access is gated by the host allowlist below.
    if (req.method !== "GET" && req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const url = new URL(req.url);
    let target = url.searchParams.get("u");
    // Also accept `u` from a JSON body so the proxy can be invoked via the SDK
    // (the browser always uses the query string).
    if (!target && req.body) {
      try {
        const body = await req.json();
        if (body && typeof body.u === "string") target = body.u;
      } catch { /* not JSON — ignore */ }
    }
    if (!target) {
      return Response.json({ error: "Missing 'u' parameter" }, { status: 400 });
    }

    const validated = validateMediaUrl(target, { strict: false });
    if (!validated.valid) {
      return Response.json({ error: validated.error || "URL not allowed" }, { status: validated.error === "Host not allowed" ? 403 : 400 });
    }
    const parsed = new URL(validated.url);

    // Never let fetch follow redirects automatically — an allowed host could
    // 3xx to a cloud-metadata/internal endpoint (SSRF). Follow manually and
    // re-validate every Location header against the allowlist before hopping.
    let upstream: Response | null = null;
    let nextUrl = parsed.toString();
    for (let hop = 0; hop < 5; hop++) {
      const res = await fetch(nextUrl, {
        method: "GET",
        headers: { "User-Agent": "dialbrowser-media-proxy" },
        redirect: "manual",
      });
      const status = res.status;
      if (status >= 300 && status < 400) {
        const loc = res.headers.get("location");
        if (!loc) {
          return Response.json({ error: "Redirect missing Location" }, { status: 502 });
        }
        const resolved = new URL(loc, nextUrl).toString();
        const reValidated = validateMediaUrl(resolved, { strict: false });
        if (!reValidated.valid) {
          return Response.json({ error: "Redirect target not allowed" }, { status: 403 });
        }
        nextUrl = new URL(reValidated.url).toString();
        continue;
      }
      upstream = res;
      break;
    }
    if (!upstream) {
      return Response.json({ error: "Too many redirects" }, { status: 502 });
    }

    if (!upstream.ok || !upstream.body) {
      console.error("media-proxy upstream error:", upstream.status, nextUrl);
      return Response.json({ error: "Upstream error" }, { status: upstream.status || 502 });
    }

    const ct = (upstream.headers.get("content-type") || "").toLowerCase();
    // Reject script-capable content types — the proxy must never serve HTML/JS
    // that could execute in the app's own origin (reflected XSS / open proxy).
    const UNSAFE_TYPES = ["text/html", "application/xhtml+xml", "application/javascript", "text/javascript", "application/xml"];
    if (UNSAFE_TYPES.some((t) => ct.startsWith(t))) {
      console.error("media-proxy rejected unsafe content-type:", ct, nextUrl);
      return Response.json({ error: "Unsupported media type" }, { status: 415 });
    }

    const headers = new Headers();
    if (ct) headers.set("content-type", ct);
    const cl = upstream.headers.get("content-length");
    if (cl) headers.set("content-length", cl);
    headers.set("cache-control", "public, max-age=86400, immutable");
    headers.set("access-control-allow-origin", "*");
    // Defense-in-depth: block any script execution even if a script-capable
    // type slips through (e.g. via a future allowlist change or redirect).
    headers.set("content-security-policy", "default-src 'none'");

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("media-proxy error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});