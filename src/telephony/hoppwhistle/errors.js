/**
 * Every failure the voice client reports, as `{ code, message, retryable }`.
 *
 * The message is written for the person at the phone, not for a log; the code
 * is for UI that wants to react (offer "Sign in", "Reconnect", a mic help
 * link). Errors live in the client's state so the UI can render them -- a
 * failure that only reaches console.log is a failure nobody sees.
 */

export const VoiceErrorCode = Object.freeze({
  NOT_CONFIGURED: "NOT_CONFIGURED",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  AUTH_FAILED: "AUTH_FAILED",
  NO_EXTENSION: "NO_EXTENSION",
  NO_AGENCY: "NO_AGENCY",
  CREDENTIALS_UNAVAILABLE: "CREDENTIALS_UNAVAILABLE",
  SERVER_UNREACHABLE: "SERVER_UNREACHABLE",
  TRANSPORT_FAILED: "TRANSPORT_FAILED",
  REGISTRATION_REJECTED: "REGISTRATION_REJECTED",
  REGISTRATION_TIMEOUT: "REGISTRATION_TIMEOUT",
  CONNECT_EXHAUSTED: "CONNECT_EXHAUSTED",
  NETWORK_DISCONNECTED: "NETWORK_DISCONNECTED",
  OTHER_TAB_OWNS_PHONE: "OTHER_TAB_OWNS_PHONE",
  NOT_CONNECTED: "NOT_CONNECTED",
  CALL_IN_PROGRESS: "CALL_IN_PROGRESS",
  MIC_PERMISSION_DENIED: "MIC_PERMISSION_DENIED",
  MIC_NOT_FOUND: "MIC_NOT_FOUND",
  MIC_UNAVAILABLE: "MIC_UNAVAILABLE",
  INVALID_NUMBER: "INVALID_NUMBER",
  CALLER_ID_UNAUTHORIZED: "CALLER_ID_UNAUTHORIZED",
  LICENSE_REFUSED: "LICENSE_REFUSED",
  ORIGINATE_REJECTED: "ORIGINATE_REJECTED",
  INVITE_FAILED: "INVITE_FAILED",
  CALL_REJECTED: "CALL_REJECTED",
  CALL_BUSY: "CALL_BUSY",
  CALL_CANCELED: "CALL_CANCELED",
  ANSWER_FAILED: "ANSWER_FAILED",
  AUDIO_PLAYBACK_BLOCKED: "AUDIO_PLAYBACK_BLOCKED",
  UNSUPPORTED: "UNSUPPORTED",
  MERGE_FAILED: "MERGE_FAILED",
});

const MESSAGES = {
  NOT_CONFIGURED: "The phone is not configured for this site yet.",
  AUTH_REQUIRED: "Sign in to your Hoppwhistle agent account to use the phone.",
  AUTH_EXPIRED: "Your Hoppwhistle session has expired. Sign in again to keep calling.",
  AUTH_FAILED: "Those Hoppwhistle credentials were not accepted.",
  NO_EXTENSION: "This Hoppwhistle account does not have a phone extension. Ask an administrator for one.",
  NO_AGENCY: "Select an agency in Hoppwhistle before using the phone.",
  CREDENTIALS_UNAVAILABLE: "Hoppwhistle could not issue phone credentials right now.",
  SERVER_UNREACHABLE: "Hoppwhistle could not be reached. Check your connection.",
  TRANSPORT_FAILED: "The phone could not connect to the Hoppwhistle phone server.",
  REGISTRATION_REJECTED: "The Hoppwhistle phone server refused this phone's sign-in.",
  REGISTRATION_TIMEOUT: "The Hoppwhistle phone server did not answer.",
  CONNECT_EXHAUSTED: "The phone could not connect after several attempts. Calls will not reach you until it does.",
  NETWORK_DISCONNECTED: "The phone lost its connection.",
  OTHER_TAB_OWNS_PHONE: "Your phone is already active in another Dial Browser tab.",
  NOT_CONNECTED: "The phone is not connected.",
  CALL_IN_PROGRESS: "Finish the current call first.",
  MIC_PERMISSION_DENIED: "Microphone access is blocked. Allow the microphone for this site, then try again.",
  MIC_NOT_FOUND: "No microphone was found. Connect one and try again.",
  MIC_UNAVAILABLE: "The microphone could not be started.",
  INVALID_NUMBER: "That phone number is not valid.",
  CALLER_ID_UNAUTHORIZED: "That caller ID is not assigned to your Hoppwhistle account.",
  LICENSE_REFUSED: "You are not licensed to call that number's state.",
  ORIGINATE_REJECTED: "Hoppwhistle did not allow this call.",
  INVITE_FAILED: "The call did not go through.",
  CALL_REJECTED: "The call was rejected.",
  CALL_BUSY: "The number is busy.",
  CALL_CANCELED: "The caller hung up.",
  ANSWER_FAILED: "That call could not be answered. The caller may have hung up.",
  AUDIO_PLAYBACK_BLOCKED: "Your browser blocked call audio. Click anywhere on the page to hear the call.",
  UNSUPPORTED: "This feature is not available on your Hoppwhistle account yet.",
  MERGE_FAILED: "The calls could not be merged.",
};

const RETRYABLE = new Set([
  "SERVER_UNREACHABLE",
  "TRANSPORT_FAILED",
  "REGISTRATION_TIMEOUT",
  "CREDENTIALS_UNAVAILABLE",
  "NETWORK_DISCONNECTED",
]);

export function voiceError(code, message, extra = {}) {
  return {
    code,
    message: message || MESSAGES[code] || "Something went wrong with the phone.",
    retryable: RETRYABLE.has(code),
    ...extra,
  };
}

/** An Error carrying a voiceError, for paths that throw. */
export class VoiceError extends Error {
  constructor(code, message, extra) {
    const detail = voiceError(code, message, extra);
    super(detail.message);
    this.name = "VoiceError";
    this.voice = detail;
  }
}

export function toVoiceError(err, fallbackCode = "INVITE_FAILED") {
  if (err && err.voice) return err.voice;
  return voiceError(fallbackCode);
}
