/**
 * The one place a number someone typed or tapped becomes a number Hoppwhistle
 * dials.
 *
 * Every call path -- keypad, contacts, address book, ?dial= deep links, the
 * home dialer -- reaches the voice client's makeCall, and makeCall runs this.
 * Nothing else in Dial Browser should reshape a number before dialling it.
 *
 * What comes out (`dial`) is what goes to POST /agent/call/originate and into
 * the SIP request URI:
 *
 *   US / NANP      "(865) 555-1212", "865.555.1212", "+1 865 555 1212",
 *                  "18655551212"            -> "18655551212"
 *                  Eleven digits with the leading 1: the shape Hoppwhistle
 *                  uses for caller IDs, and one the outbound dialplan matches
 *                  (^\+?1?([2-9]\d{9})$).
 *   Extension      "1047"                    -> "1047"
 *                  Hoppwhistle agent extensions are 1000-1999.
 *   International  "+44 20 7946 0958", "011 44 20 7946 0958"
 *                                            -> "+442079460958"
 *                  Kept in E.164, untouched. Whether it routes is
 *                  Hoppwhistle's decision, not this function's.
 *
 * Anything else is refused here, before a call row is created for it.
 */

const NANP_AREA_OR_EXCHANGE = /^[2-9]\d{2}[2-9]\d{6}$/;

export function normalizeDialable(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return invalid("Enter a phone number.");

  if (/[^\d\s().+\-]/.test(raw)) {
    return invalid("Phone numbers can only contain digits.");
  }

  const hasPlus = raw.startsWith("+");
  let digits = raw.replace(/\D/g, "");

  if (!hasPlus && digits.startsWith("011") && digits.length > 3) {
    return international(digits.slice(3));
  }

  if (hasPlus && !digits.startsWith("1")) {
    return international(digits);
  }

  if (!hasPlus && /^1\d{3}$/.test(digits)) {
    return { ok: true, kind: "extension", dial: digits, e164: null, display: digits };
  }

  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length === 10) {
    if (!NANP_AREA_OR_EXCHANGE.test(digits)) {
      return invalid("That is not a valid US phone number.");
    }
    return {
      ok: true,
      kind: "nanp",
      dial: `1${digits}`,
      e164: `+1${digits}`,
      display: formatUs(digits),
    };
  }

  return invalid("Enter a 10-digit US number, or an international number starting with +.");
}

function international(digits) {
  // E.164: country code plus subscriber number, at most 15 digits.
  if (!/^[1-9]\d{6,14}$/.test(digits)) {
    return invalid("That international number is not valid.");
  }
  const e164 = `+${digits}`;
  return { ok: true, kind: "international", dial: e164, e164, display: e164 };
}

function invalid(message) {
  return { ok: false, error: message };
}

function formatUs(ten) {
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

/**
 * A number for a person to read: (865) 555-1212 for US numbers in any shape,
 * anything else exactly as given -- a mangled number is worse than an
 * unformatted one.
 */
export function formatPhoneForDisplay(value) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  let digits = s.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  const usShaped = !s.startsWith("+") || s.startsWith("+1");
  if (digits.length === 10 && usShaped) return formatUs(digits);
  return s;
}

/** Same number regardless of formatting, for matching caller IDs. */
export function sameNumber(a, b) {
  const da = String(a ?? "").replace(/\D/g, "");
  const db = String(b ?? "").replace(/\D/g, "");
  if (!da || !db) return false;
  if (da === db) return true;
  return da.length >= 10 && db.length >= 10 && da.slice(-10) === db.slice(-10);
}
