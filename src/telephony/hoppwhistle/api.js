/**
 * The Hoppwhistle HTTP endpoints Dial Browser's phone uses, and nothing more.
 *
 * Each one is the endpoint Hoppwhistle's own browser phone already calls
 * (apps/web/src/components/phone/phone-provider.tsx), with the same request
 * body. Endpoints that exist on the agent surface but do no telephony work --
 * `/call/:id/transfer` (writes metadata, no SIP REFER), `/call/:id/dtmf`
 * (returns `sent: true` and sends nothing), `/call/:id/mute` -- are
 * deliberately absent: calling them would look like a feature and do nothing.
 *
 * Every request carries the member's own voice token from the auth adapter.
 * Hoppwhistle derives the caller and agency from that token, never from the
 * body, which is what scopes every call below to the signed-in member.
 */

import { VoiceError } from "./errors.js";

export class HoppwhistleApiError extends Error {
  constructor(status, code, message) {
    super(message || `Hoppwhistle request failed (${status})`);
    this.name = "HoppwhistleApiError";
    this.status = status;
    this.code = code || null;
  }
}

/** @param {any} options */
export function createHoppwhistleApi({ apiUrl, auth, fetchImpl, onAuthExpired }) {
  const doFetch = fetchImpl || ((url, init) => fetch(url, init));

  async function request(method, path, body, { keepalive = false } = {}, retried = false) {
    const token = await auth.getAccessToken();
    if (!token) throw new VoiceError("AUTH_REQUIRED");

    const headers = { Authorization: `Bearer ${token}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let res;
    try {
      res = await doFetch(`${apiUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        keepalive,
      });
    } catch {
      throw new VoiceError("SERVER_UNREACHABLE");
    }

    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      // The token has ended (expired between the check and the request, or
      // revoked). A member's token is minted on demand, so get one fresh
      // token and try once more; a second 401 means the phone is refused.
      auth.invalidate();
      if (auth.renewable && !retried) return request(method, path, body, { keepalive }, true);
      onAuthExpired?.();
      throw new VoiceError("AUTH_EXPIRED");
    }
    if (!res.ok) {
      throw new HoppwhistleApiError(res.status, data?.error?.code, data?.error?.message);
    }
    return data;
  }

  const callPath = (callId, action) =>
    `/api/v1/agent/call/${encodeURIComponent(String(callId))}/${action}`;

  return {
    /** The agent's own SIP identity: { username, password, realm, stunServers, turnServers, ... }. */
    getWebRtcCredentials: () => request("GET", "/api/v1/agent/webrtc/credentials"),

    /** The caller IDs this agent may present: { numbers: [{ id, number, provider }] }. */
    getMyNumbers: () => request("GET", "/api/v1/agent/my-numbers"),

    /** Presence for routing. Best-effort by the caller. */
    setAgentStatus: (status, opts) => request("PUT", "/api/v1/agent/status", { status }, opts),

    /**
     * Create and validate the call before any SIP is sent. Hoppwhistle checks
     * licensed states, picks the caller ID from the agent's own numbers (the
     * browser's choice is only a request), and returns the call id the INVITE
     * must carry: { callId, callerId, ... }.
     */
    originateCall: ({ phoneNumber, callerId }) =>
      request("POST", "/api/v1/agent/call/originate", {
        phoneNumber,
        callerId: callerId || undefined,
      }),

    /** Outbound call answered: { recordingEnabled, ... }. */
    reportAnswer: (callId) => request("POST", callPath(callId, "answer"), {}),

    /** Outbound call ended. */
    reportHangup: (callId, body, opts) => request("POST", callPath(callId, "hangup"), body, opts),

    /** Three-way: FreeSWITCH joins the two legs named by their SIP Call-IDs. */
    mergeCalls: ({ activeCallId, heldCallId }) =>
      request("POST", "/api/v1/agent/call/merge", { activeCallId, heldCallId }),
  };
}
