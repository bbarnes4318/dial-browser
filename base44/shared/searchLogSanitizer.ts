// PII sanitizer for service-search logging. Applied before ANY search term is
// persisted so the admin log viewer can never surface personal identity data.
// Strips emails, phone-like digit runs, and long opaque numeric ids; lowercases,
// collapses whitespace, and truncates to the entity's maxLength.
export function sanitizeSearchQuery(raw) {
  if (!raw) return "";
  let q = String(raw).toLowerCase().trim();
  // email addresses
  q = q.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g, "[email]");
  // phone-like runs: optional +, digits with spaces/dashes/dots/parens, 10+ chars
  q = q.replace(/\+?\d[\d\s\-().]{8,}\d/g, "[phone]");
  // stray long numeric runs (ssn, card numbers, account ids)
  q = q.replace(/\b\d{9,}\b/g, "[id]");
  // collapse whitespace
  q = q.replace(/\s+/g, " ").trim();
  if (q.length > 120) q = q.slice(0, 120);
  return q;
}