/**
 * Shared time formatting utility — displays all times in Eastern Standard
 * Time (America/New_York) using 12-hour format with AM/PM, never military time.
 */

const EST_TIMEZONE = "America/New_York";

/**
 * Formats a date/time string in EST 12-hour format.
 * @param {string|Date} dateStr — ISO date string or Date object
 * @param {object} opts — { includeDate, includeTime, includeSeconds }
 * @returns {string}
 */
export function formatEST(dateStr, opts = {}) {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "";

  const includeDate = opts.includeDate ?? true;
  const includeTime = opts.includeTime ?? true;
  const includeSeconds = opts.includeSeconds ?? false;

  const dateOpts = {
    timeZone: EST_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  const timeOpts = {
    timeZone: EST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12: true,
  };

  const parts = [];
  if (includeDate) parts.push(date.toLocaleDateString("en-US", dateOpts));
  if (includeTime) parts.push(date.toLocaleTimeString("en-US", timeOpts));
  return parts.join(" at ");
}

/**
 * Formats a time-only string in EST 12-hour format.
 * @param {string|Date} dateStr
 * @returns {string} e.g. "3:45 PM EST"
 */
export function formatESTTime(dateStr) {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    timeZone: EST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats a date-only string in EST.
 * @param {string|Date} dateStr
 * @returns {string} e.g. "Aug 21, 2026"
 */
export function formatESTDate(dateStr) {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    timeZone: EST_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns a relative time string (e.g. "2 hours ago") but falls back to
 * absolute EST time for older entries.
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatRelativeEST(dateStr) {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  return formatEST(dateStr);
}

/**
 * Returns the current EST time string.
 * @returns {string}
 */
export function currentESTTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: EST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Returns the current EST date string.
 * @returns {string}
 */
export function currentESTDate() {
  return new Date().toLocaleDateString("en-US", {
    timeZone: EST_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}