// Allowlists a user-supplied "social link" to an absolute http/https URL.
// Profile owners (artists/hosts) set their own social_links array, so without
// scheme validation a javascript: or data: URL renders as an executable href
// (stored DOM-XSS on click). Returns the cleaned URL string when safe, or
// null for anything that isn't an absolute http(s) URL.
export function safeSocialUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    if (!parsed.hostname) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

// Derives a short label (e.g. "instagram") from a link for display. Returns a
// safe fallback when the URL is not parseable.
export function socialUrlLabel(raw, fallback = "LINK") {
  try {
    return new URL(raw).hostname.replace(/^www\./, "").split(".")[0].toUpperCase();
  } catch {
    return fallback;
  }
}