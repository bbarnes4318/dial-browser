// Rewrites platform-hosted storage URLs (media.base44.com / *.base44.app) to
// route through the app's own media-proxy backend function, so the raw
// storage URL never appears in the browser. The browser only ever requests
// <origin>/functions/media-proxy?u=... which lives on the connected custom
// domain in production.
//
// Non-base44 URLs (Unsplash, data:, blob:, tel:, mailto:, relative paths,
// other domains) pass through unchanged, so this is safe to apply at any
// image / audio / video / download render site.

const PROXY_PATH = "/functions/media-proxy";

function isBase44Host(hostname) {
  const h = (hostname || "").toLowerCase();
  return h === "media.base44.com" || h.endsWith(".base44.app");
}

export function proxyMediaUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Leave non-network URLs and already-proxied URLs untouched
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith(PROXY_PATH)
  ) {
    return trimmed;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed; // relative or invalid — leave as-is
  }

  if (!isBase44Host(parsed.hostname)) return trimmed;

  const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";
  return `${origin}${PROXY_PATH}?u=${encodeURIComponent(trimmed)}`;
}

// Rewrites third-party internet-radio stream URLs (SomaFM, Radio Paradise,
// BBC) to route through the app's radio-proxy backend function. The proxy
// returns the live stream with permissive CORS headers, so the browser
// <audio> element can both play cross-origin streams reliably and feed a Web
// Audio AnalyserNode for real-time frequency visualization (requires
// crossOrigin="anonymous" on the element). Non-radio URLs pass through
// unchanged so this is safe to apply to any stream URL.
const RADIO_PROXY_PATH = "/functions/radio-proxy";
const RADIO_HOSTS = new Set([
  "ice1.somafm.com", "ice2.somafm.com", "ice3.somafm.com", "ice4.somafm.com",
  "stream.radioparadise.com",
  "stream.live.vc.bbcmedia.co.uk",
]);

function isRadioHost(hostname) {
  const h = (hostname || "").toLowerCase();
  if (!h) return false;
  if (RADIO_HOSTS.has(h)) return true;
  return h.endsWith(".somafm.com");
}

export function proxyRadioStreamUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  let parsed;
  try { parsed = new URL(trimmed); } catch { return trimmed; }
  if (!isRadioHost(parsed.hostname)) return trimmed;
  const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";
  return `${origin}${RADIO_PROXY_PATH}?u=${encodeURIComponent(trimmed)}`;
}