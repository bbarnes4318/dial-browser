/**
 * Telephony logging.
 *
 * One prefix per area -- [Voice/Auth], [Voice/SIP], [Voice/Call],
 * [Voice/Media], [Voice/Presence], [Voice/Tabs] -- so a console capture from a
 * failed call can be filtered to the part that failed.
 *
 * Never pass this a password, a token, or a credential response. Phone numbers
 * go through `maskNumber` so a shared console capture does not carry a
 * customer's full number.
 */

export function maskNumber(value) {
  const s = String(value ?? "");
  const digits = s.replace(/\D/g, "");
  if (digits.length <= 4) return s ? "****" : "";
  return `***${digits.slice(-4)}`;
}

function sink() {
  return typeof console !== "undefined" ? console : null;
}

export function createVoiceLogger(area, target = sink()) {
  const prefix = `[Voice/${area}]`;
  const emit = (level, args) => {
    if (!target) return;
    const fn = target[level] || target.log;
    if (typeof fn === "function") fn.call(target, prefix, ...args);
  };
  return {
    debug: (...args) => emit("debug", args),
    info: (...args) => emit("info", args),
    warn: (...args) => emit("warn", args),
    error: (...args) => emit("error", args),
  };
}

/** A logger that discards everything, for tests. */
export const silentLogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};
