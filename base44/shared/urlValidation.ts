// Strict URL validation layer for server-side media / PDF processing.
//
// Only trusted domains are ever fetched by the server. Image and (optional)
// zip URLs are validated to prevent SSRF, credential-leak, open-redirect and
// malicious-payload risks before any upstream request is made.
//
// Usage:
//   Host-only validation (general media proxy):
//     validateMediaUrl(url, { strict: false })
//   Strict validation (PDF generation — image + zip assembly):
//     validateMediaUrl(url, { strict: true, allowZip: true })

// Platform-trusted storage hosts. Add a new host here ONLY after explicit review.
const TRUSTED_HOSTS = ["media.base44.com"];
const TRUSTED_SUFFIXES = []; // restricted to TRUSTED_HOSTS only — broad app-domain suffixes removed (open-proxy / reflected-XSS risk)

// Image resources the PDF/media process is permitted to fetch.
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".avif"];
// Archive bundles that may contain images for PDF assembly.
const ZIP_EXTENSIONS = [".zip"];

// Hostnames that must never be reached (cloud metadata / SSRF endpoints).
const BLOCKED_HOSTNAMES = new Set([
  "169.254.169.254",          // AWS / Azure / GCP metadata
  "metadata.google.internal", // GCP metadata
  "metadata",
  "0.0.0.0",
]);

function isPrivateIp(ip: string): boolean {
  // IPv4
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = parseInt(v4[1], 10);
    const b = parseInt(v4[2], 10);
    if (a === 10) return true;            // private
    if (a === 127) return true;           // loopback
    if (a === 0) return true;             // "this network"
    if (a === 169 && b === 254) return true; // link-local / metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true;          // private
    if (a >= 224) return true;            // multicast / reserved
    return false;
  }
  // IPv6 (simple, conservative checks)
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
  if (lower.startsWith("fe80")) return true;                        // link-local
  return false;
}

export function isAllowedHost(hostname: string): boolean {
  const h = (hostname || "").toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  if (!h || BLOCKED_HOSTNAMES.has(h)) return false;

  // Block IP literals that resolve to private / reserved ranges.
  if (/^[\d.]+$/.test(h) || /^[0-9a-f:]+$/.test(h)) {
    if (isPrivateIp(h)) return false;
  }

  if (TRUSTED_HOSTS.includes(h)) return true;
  return TRUSTED_SUFFIXES.some((s) => h.endsWith(s));
}

export type ValidationResult = { valid: boolean; error?: string; url?: string };

/**
 * Validates a merchant-controlled dispatch webhook URL before the server
 * fetches it. Unlike validateMediaUrl (which is allowlist-locked to trusted
 * hosts), merchants set their own webhook endpoints, so any public host is
 * permitted — but private/link-local/metadata IP ranges, non-http(s)
 * schemes, and embedded credentials are rejected to prevent SSRF.
 */
export function validateWebhookUrl(raw: string): ValidationResult {
  if (!raw || typeof raw !== "string") return { valid: false, error: "Missing URL" };
  if (raw.length > 2048) return { valid: false, error: "URL too long" };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { valid: false, error: "Invalid URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, error: "Protocol not allowed" };
  }
  if (parsed.username || parsed.password) {
    return { valid: false, error: "Credentials in URL not allowed" };
  }
  const hostname = (parsed.hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, error: "Host not allowed" };
  }
  if (/^[\d.]+$/.test(hostname) || /^[0-9a-f:]+$/.test(hostname)) {
    if (isPrivateIp(hostname)) return { valid: false, error: "Private host not allowed" };
  }
  return { valid: true, url: parsed.toString() };
}

export function validateMediaUrl(
  raw: string,
  opts: { allowZip?: boolean; strict?: boolean } = {}
): ValidationResult {
  if (!raw || typeof raw !== "string") return { valid: false, error: "Missing URL" };
  if (raw.length > 2048) return { valid: false, error: "URL too long" };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { valid: false, error: "Invalid URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, error: "Protocol not allowed" };
  }
  // Never allow credentials embedded in the URL (prevents auth-header leakage).
  if (parsed.username || parsed.password) {
    return { valid: false, error: "Credentials in URL not allowed" };
  }
  if (!isAllowedHost(parsed.hostname)) {
    return { valid: false, error: "Host not allowed" };
  }

  const path = parsed.pathname.toLowerCase();
  const isImage = IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
  const isZip = ZIP_EXTENSIONS.some((ext) => path.endsWith(ext));

  if (opts.strict) {
    // PDF assembly: only recognized image or (when permitted) zip resources.
    if (opts.allowZip && isZip) return { valid: true, url: parsed.toString() };
    if (isImage) return { valid: true, url: parsed.toString() };
    return { valid: false, error: "URL is not a recognized image or zip resource" };
  }

  // Host-only mode (general media proxy): trust the allowlist for type.
  return { valid: true, url: parsed.toString() };
}