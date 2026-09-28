// radio-proxy — streams third-party internet radio through the app's own
// domain with permissive CORS headers so the browser <audio> element can:
//   1. Play cross-origin radio streams reliably (no CORS playback errors).
//   2. Feed a Web Audio AnalyserNode for real-time frequency visualization
//      (requires crossOrigin="anonymous" + CORS-clean response).
//
// Only an allowlist of known radio stream hosts is proxied (prevents SSRF /
// open-proxy abuse). Live streams are piped straight through without buffering.

const RADIO_HOSTS = [
  "ice1.somafm.com", "ice2.somafm.com", "ice3.somafm.com", "ice4.somafm.com",
  "stream.radioparadise.com",
  "stream.live.vc.bbcmedia.co.uk",
  "live.powerhitz.com",
  "pd.npr.org",
];
const RADIO_SUFFIXES = [".somafm.com", ".powerhitz.com"];

const BLOCKED_HOSTNAMES = new Set([
  "169.254.169.254", "metadata.google.internal", "metadata", "0.0.0.0", "localhost",
]);

function isPrivateIp(ip) {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = parseInt(v4[1], 10), b = parseInt(v4[2], 10);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80")) return true;
  return false;
}

function radioHostAllowed(hostname) {
  const h = (hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!h || BLOCKED_HOSTNAMES.has(h)) return false;
  if (/^[\d.]+$/.test(h) || /^[0-9a-f:]+$/.test(h)) {
    if (isPrivateIp(h)) return false;
  }
  if (RADIO_HOSTS.includes(h)) return true;
  return RADIO_SUFFIXES.some((s) => h.endsWith(s));
}

export default async function (req) {
  try {
    // CORS preflight — the browser's <audio> element sends a Range header for
    // streams, which makes the request non-simple and triggers OPTIONS first.
    // Answer it with permissive headers so the real GET can proceed.
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "range",
          "access-control-max-age": "86400",
        },
      });
    }

    if (req.method !== "GET" && req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const url = new URL(req.url);
    let target = url.searchParams.get("u");
    if (!target && req.body) {
      try {
        const body = await req.json();
        if (body && typeof body.u === "string") target = body.u;
      } catch { /* not JSON */ }
    }
    if (!target) {
      return Response.json({ error: "Missing 'u' parameter" }, { status: 400 });
    }

    let parsed;
    try { parsed = new URL(target); } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return Response.json({ error: "Protocol not allowed" }, { status: 400 });
    }
    if (parsed.username || parsed.password) {
      return Response.json({ error: "Credentials in URL not allowed" }, { status: 400 });
    }
    if (!radioHostAllowed(parsed.hostname)) {
      return Response.json({ error: "Host not allowed" }, { status: 403 });
    }

    // Follow redirects manually and re-validate each hop (SSRF defense).
    let upstream = null;
    let nextUrl = parsed.toString();
    for (let hop = 0; hop < 5; hop++) {
      const res = await fetch(nextUrl, {
        method: "GET",
        // Some stream hosts (Powerhitz, NPR) reject non-browser User-Agents
        // with 403, so send a realistic desktop browser UA.
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "Accept": "audio/*, */*",
        },
        redirect: "manual",
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return Response.json({ error: "Redirect missing Location" }, { status: 502 });
        const resolved = new URL(loc, nextUrl).toString();
        const rp = new URL(resolved);
        if (!radioHostAllowed(rp.hostname)) {
          return Response.json({ error: "Redirect target not allowed" }, { status: 403 });
        }
        nextUrl = resolved;
        continue;
      }
      upstream = res;
      break;
    }
    if (!upstream) return Response.json({ error: "Too many redirects" }, { status: 502 });
    if (!upstream.ok || !upstream.body) {
      console.error("radio-proxy upstream error:", upstream.status, nextUrl);
      return Response.json({ error: "Upstream error" }, { status: upstream.status || 502 });
    }

    const ct = (upstream.headers.get("content-type") || "").toLowerCase();
    // Never serve script-capable content from the app origin.
    if (["text/html", "application/xhtml+xml", "application/javascript", "text/javascript"].some((t) => ct.startsWith(t))) {
      return Response.json({ error: "Unsupported media type" }, { status: 415 });
    }

    const headers = new Headers();
    if (ct) headers.set("content-type", ct);
    const cl = upstream.headers.get("content-length");
    if (cl) headers.set("content-length", cl);
    // Live stream — never cache.
    headers.set("cache-control", "no-store");
    // Permissive CORS so crossOrigin="anonymous" + AnalyserNode both work.
    headers.set("access-control-allow-origin", "*");
    headers.set("access-control-allow-methods", "GET, OPTIONS");
    headers.set("access-control-allow-headers", "range");
    // Expose so client could read status if needed.
    headers.set("x-content-type-options", "nosniff");

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("radio-proxy error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}