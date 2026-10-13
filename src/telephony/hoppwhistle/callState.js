/**
 * The one call model. Pure: no SIP, no React, no DOM.
 *
 * A call's `state` is one of:
 *
 *   incoming    an inbound INVITE is ringing here, not yet answered
 *   connecting  outbound INVITE sent / inbound accept in progress
 *   ringing     outbound, the far end is ringing (180/183)
 *   active      established, audio flowing
 *   hold        established, on hold
 *   ended       finished (kept only as the last-ended call)
 *
 * and "no call" is `null`, which UI reads as idle.
 *
 * Mute and hold are separate facts and both silence the agent: the
 * microphone reaches the far end only when the call is neither muted nor held
 * (`sendsAgentAudio`). Unholding a muted call leaves it muted; unmuting a held
 * call leaves it silent. This is Hoppwhistle's rule (softphone/format.ts).
 */

export const CallStates = Object.freeze({
  INCOMING: "incoming",
  CONNECTING: "connecting",
  RINGING: "ringing",
  ACTIVE: "active",
  HOLD: "hold",
  ENDED: "ended",
});

/** SIP registration state -- whether the phone CAN take calls. */
export const PhoneStatus = Object.freeze({
  DISABLED: "disabled", // not configured, or this account has no extension
  OFFLINE: "offline", // not connected; connect() will try
  CONNECTING: "connecting",
  REGISTERED: "registered", // the registrar accepted our REGISTER
  RETRYING: "retrying",
  FAILED: "failed", // retry budget spent; needs a deliberate reconnect
  STANDBY: "standby", // another Dial Browser tab holds this browser's phone
});

/** Presence in Hoppwhistle -- whether the agent WANTS calls. A different fact. */
export const AgentStatus = Object.freeze({
  AVAILABLE: "available",
  ON_CALL: "on-call",
  AWAY: "away",
  DND: "dnd",
  OFFLINE: "offline",
});

export function createCall({
  callId,
  direction,
  state,
  phoneNumber,
  callerName = null,
  callerId = null,
  recordingEnabled = null,
  now = new Date(),
}) {
  return {
    callId,
    direction,
    state,
    phoneNumber,
    callerName,
    callerId,
    startTime: now,
    answerTime: null,
    endTime: null,
    duration: 0,
    isMuted: false,
    isOnHold: false,
    // null = Hoppwhistle has not said. Recording is Hoppwhistle's decision.
    recordingEnabled,
    endReason: null,
    conferenceWith: [],
  };
}

export function sendsAgentAudio(call) {
  return Boolean(call) && !call.isMuted && !call.isOnHold;
}

export function isLive(call) {
  return Boolean(call) && call.state !== CallStates.ENDED;
}

export function durationSeconds(call, now = Date.now()) {
  if (!call?.answerTime) return 0;
  const end = call.endTime ? call.endTime.getTime() : now;
  return Math.max(0, Math.floor((end - call.answerTime.getTime()) / 1000));
}

/**
 * The status strings Dial Browser's existing ModernCallView understands:
 * "incoming" | "connecting" | "ringing" | "in-call". Hold stays "in-call" so
 * the in-call controls (and the running timer) remain on screen.
 */
export function toCallViewStatus(call) {
  if (!isLive(call)) return null;
  switch (call.state) {
    case CallStates.INCOMING:
      return "incoming";
    case CallStates.RINGING:
      return "ringing";
    case CallStates.ACTIVE:
    case CallStates.HOLD:
      return "in-call";
    default:
      return "connecting";
  }
}

/**
 * The FreeSWITCH call id on an inbound INVITE: `X-Call-Id: fs-<uuid>`, the
 * callSid Hoppwhistle's CDR writes the call under (lib/softphone-call-id.ts).
 */
const SOFTPHONE_CALL_SID_RE = /^fs-[0-9a-f-]{8,}$/i;

export function inboundCallSid(getHeader) {
  const value = String(getHeader?.("X-Call-Id") || "").trim();
  return SOFTPHONE_CALL_SID_RE.test(value) ? value : null;
}

/** A supervisor listen-in leg, not a call (X-Hopwhistle-Monitor). */
export function isMonitorInvite(getHeader) {
  return Boolean(String(getHeader?.("X-Hopwhistle-Monitor") || "").trim());
}

/** Carriers fill missing names with "Unknown" or the number itself. Neither is a name. */
export function knownCallerName(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return null;
  if (/^(unknown|anonymous|unavailable|restricted)( caller)?$/i.test(trimmed)) return null;
  if (!/\p{L}/u.test(trimmed)) return null;
  return trimmed;
}
