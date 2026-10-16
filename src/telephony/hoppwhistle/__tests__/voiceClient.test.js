import { describe, expect, it } from "vitest";

import { AgentStatus, CallStates, PhoneStatus } from "../callState.js";
import { retryDelayMs } from "../voiceClient.js";
import { VoiceError } from "../errors.js";
import {
  FakeSession,
  apiError,
  connected,
  createFakeAuth,
  createFakeCoordinator,
  createFakeSipFactory,
  createHarness,
  flush,
  registrationRejected,
  registrationTimeout,
} from "./fakes.js";

const headerValue = (headers, name) =>
  headers.find((h) => h.toLowerCase().startsWith(`${name.toLowerCase()}:`))?.split(":").slice(1).join(":").trim();

// ════════════════════════════════════════════════════════════════════════════
// Registration
// ════════════════════════════════════════════════════════════════════════════

describe("registration", () => {
  it("fetches credentials and caller IDs, registers, and only then reports registered", async () => {
    const h = createHarness();
    const pending = h.client.connect();
    expect(h.state().phoneStatus).toBe(PhoneStatus.CONNECTING);
    expect(h.state().isRegistered).toBe(false);

    expect(await pending).toBe(true);
    expect(h.api.getWebRtcCredentials).toHaveBeenCalledTimes(1);
    expect(h.api.getMyNumbers).toHaveBeenCalledTimes(1);

    const stack = h.sip.last();
    expect(stack.options).toMatchObject({
      username: "1047",
      password: "per-agent-secret",
      realm: "sip.hopwhistle.test",
      // The SIP socket Hoppwhistle's nginx proxies, not the Verto wsUrl from the credential response.
      wsUrl: "wss://hopwhistle.test/ws",
    });
    expect(stack.options.iceServers).toEqual([{ urls: "stun:stun.example.test:3478" }]);
    expect(stack.start).toHaveBeenCalled();
    expect(stack.register).toHaveBeenCalled();

    const s = h.state();
    expect(s.phoneStatus).toBe(PhoneStatus.REGISTERED);
    expect(s.isRegistered).toBe(true);
    expect(s.extension).toBe("1047");
    expect(s.callerIds.map((c) => c.number)).toEqual(["+18655550101", "+18655550202"]);
    expect(s.selectedCallerId).toBe("+18655550101");
    await flush();
    expect(h.presence()).toEqual([AgentStatus.AVAILABLE]);
  });

  it("does not report registered when the REGISTER is refused, and does not retry a 403", async () => {
    const h = createHarness({ sipOptions: { registerErrors: [registrationRejected(403)] } });
    expect(await h.client.connect()).toBe(false);
    expect(h.state().phoneStatus).toBe(PhoneStatus.FAILED);
    expect(h.state().isRegistered).toBe(false);
    expect(h.state().error.code).toBe("REGISTRATION_REJECTED");
    expect(h.timers.pending()).toHaveLength(0);
    expect(h.presence()).not.toContain(AgentStatus.AVAILABLE);
  });

  it("retries a transport failure with backoff and succeeds", async () => {
    const h = createHarness({ sipOptions: { registerErrors: [registrationTimeout()] } });
    expect(await h.client.connect()).toBe(false);
    expect(h.state().phoneStatus).toBe(PhoneStatus.RETRYING);
    expect(h.state().error.code).toBe("REGISTRATION_TIMEOUT");
    expect(h.timers.delays()).toEqual([2000]);

    await h.timers.runAll();
    expect(h.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
    expect(h.state().attempts).toBe(0);
    // The failed attempt's stack was torn down before the new one was built.
    expect(h.sip.stacks[0].stop).toHaveBeenCalled();
  });

  it("stops after the retry budget and needs a deliberate reconnect", async () => {
    const h = createHarness({ sipOptions: { startError: new Error("ws refused") } });
    await h.client.connect();
    const delays = [];
    for (let i = 0; i < 6; i++) {
      delays.push(...h.timers.delays());
      await h.timers.runAll();
    }
    expect(delays).toEqual([2000, 4000, 8000, 16000]);
    expect(h.state().phoneStatus).toBe(PhoneStatus.FAILED);
    expect(h.state().error.code).toBe("CONNECT_EXHAUSTED");
    expect(h.timers.pending()).toHaveLength(0);
    expect(h.sip).toHaveBeenCalledTimes(5);
  });

  it("caps the backoff at 30s", () => {
    expect([1, 2, 3, 4, 5, 6].map(retryDelayMs)).toEqual([2000, 4000, 8000, 16000, 30000, 30000]);
  });

  it("manual reconnect starts a fresh attempt with a fresh budget", async () => {
    const sip = createFakeSipFactory({ registerErrors: [registrationRejected(403)] });
    const h = createHarness({ sip });
    await h.client.connect();
    expect(h.state().phoneStatus).toBe(PhoneStatus.FAILED);
    expect(await h.client.reconnect()).toBe(true);
    expect(h.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
    expect(h.state().error).toBe(null);
  });

  it("treats 403 and 409 from the credential endpoint as who-you-are, not as transient", async () => {
    const h403 = createHarness({ apiOverrides: { getWebRtcCredentials: async () => { throw apiError(403); } } });
    await h403.client.connect();
    expect(h403.state().phoneStatus).toBe(PhoneStatus.DISABLED);
    expect(h403.state().error.code).toBe("NO_EXTENSION");
    expect(h403.timers.pending()).toHaveLength(0);

    const h409 = createHarness({ apiOverrides: { getWebRtcCredentials: async () => { throw apiError(409); } } });
    await h409.client.connect();
    expect(h409.state().error.code).toBe("NO_AGENCY");
    expect(h409.sip).not.toHaveBeenCalled();
  });

  it("asks for a Hoppwhistle sign-in instead of connecting without one", async () => {
    const h = createHarness({ auth: createFakeAuth({ authenticated: false }) });
    expect(await h.client.connect()).toBe(false);
    expect(h.state().authRequired).toBe(true);
    expect(h.state().error.code).toBe("AUTH_REQUIRED");
    expect(h.api.getWebRtcCredentials).not.toHaveBeenCalled();
  });

  it("recovers when the transport drops after registering", async () => {
    const h = await connected();
    h.sip.last().drop();
    expect(h.state().isRegistered).toBe(false);
    expect(h.state().phoneStatus).toBe(PhoneStatus.RETRYING);
    await flush();
    expect(h.presence()).toContain(AgentStatus.OFFLINE);
    await h.timers.runAll();
    expect(h.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
  });

  it("keeps the call up across a transport blip by reconnecting the same stack", async () => {
    const h = await connected();
    await h.client.makeCall("8655551212");
    h.sip.last().outbound[0].establish();
    const stack = h.sip.last();
    stack.drop();
    await h.timers.runAll();
    expect(h.sip).toHaveBeenCalledTimes(1);
    expect(stack.reconnect).toHaveBeenCalled();
    expect(h.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
    expect(h.state().currentCall.state).toBe(CallStates.ACTIVE);
  });

  it("drops the session and stops when Hoppwhistle says the session expired", async () => {
    const h = await connected();
    h.auth.invalidate();
    await flush();
    expect(h.state().authRequired).toBe(true);
    expect(h.state().error.code).toBe("AUTH_EXPIRED");
    expect(h.state().phoneStatus).toBe(PhoneStatus.OFFLINE);
    expect(h.sip.last().stop).toHaveBeenCalled();
  });

  it("comes back on Reconnect once a member token can be had again", async () => {
    const h = await connected();
    h.auth.invalidate();
    await flush();
    expect(h.state().authRequired).toBe(true);
    // A member's token is minted on demand: nothing to type, just reconnect.
    h.auth.authenticated = true;
    expect(await h.client.reconnect()).toBe(true);
    expect(h.state().authRequired).toBe(false);
    expect(h.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
  });

  it("stops, without retrying, until the member accepts the emergency notice", async () => {
    const h = createHarness({
      apiOverrides: {
        getWebRtcCredentials: async () => {
          throw new VoiceError("DISCLAIMER_REQUIRED", undefined, { terminal: true });
        },
      },
    });
    expect(await h.client.connect()).toBe(false);
    expect(h.state().phoneStatus).toBe(PhoneStatus.FAILED);
    expect(h.state().error.code).toBe("DISCLAIMER_REQUIRED");
    expect(h.timers.pending()).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Outbound
// ════════════════════════════════════════════════════════════════════════════

describe("outbound calls", () => {
  it("originates through Hoppwhistle, then INVITEs with Hoppwhistle's call id, caller ID and route type", async () => {
    const h = await connected();
    h.client.setSelectedCallerId("+18655550202");
    const res = await h.client.makeCall("(865) 555-1212");
    expect(res).toEqual({ ok: true, callId: "call-1" });

    expect(h.media.ensureMicrophone).toHaveBeenCalled();
    expect(h.api.originateCall).toHaveBeenCalledWith({ phoneNumber: "18655551212", callerId: "+18655550202" });

    const session = h.sip.last().outbound[0];
    expect(session.target).toBe("18655551212");
    expect(headerValue(session.extraHeaders, "X-Hopwhistle-Call-Id")).toBe("call-1");
    // The caller ID Hoppwhistle authorized and returned -- not the browser's string.
    expect(headerValue(session.extraHeaders, "X-Caller-ID")).toBe("18655550202");
    expect(headerValue(session.extraHeaders, "X-Hopwhistle-Route-Type")).toBe("SOFTPHONE_MANUAL");

    const call = h.state().currentCall;
    expect(call).toMatchObject({ callId: "call-1", direction: "outbound", state: CallStates.CONNECTING, phoneNumber: "+18655551212" });
    expect(h.state().agentStatus).toBe(AgentStatus.ON_CALL);
  });

  it("presents the caller ID Hoppwhistle chose when it overrides the request", async () => {
    const h = await connected({
      apiOverrides: { originateCall: async () => ({ callId: "call-9", callerId: "18655550101" }) },
    });
    h.client.setSelectedCallerId("+18655550202");
    await h.client.makeCall("8655551212");
    const session = h.sip.last().outbound[0];
    expect(headerValue(session.extraHeaders, "X-Caller-ID")).toBe("18655550101");
    expect(h.state().currentCall.callerIdSubstituted).toBe(true);
  });

  it("goes connecting -> ringing -> active, reports the answer once, and shows Hoppwhistle's recording state", async () => {
    const h = await connected();
    await h.client.makeCall("8655551212");
    const session = h.sip.last().outbound[0];
    session.progress(180);
    expect(h.state().currentCall.state).toBe(CallStates.RINGING);
    session.establish();
    session.establish();
    expect(h.state().currentCall.state).toBe(CallStates.ACTIVE);
    expect(h.state().currentCall.answerTime).toBeInstanceOf(Date);
    expect(h.media.wireRemoteAudio).toHaveBeenCalledWith(session.peerConnection);
    await flush();
    expect(h.api.reportAnswer).toHaveBeenCalledTimes(1);
    expect(h.api.reportAnswer).toHaveBeenCalledWith("call-1");
    expect(h.state().currentCall.recordingEnabled).toBe(true);
  });

  it("hangs up an established call with BYE and reports the hangup once, with timings", async () => {
    const h = await connected();
    await h.client.makeCall("8655551212");
    const session = h.sip.last().outbound[0];
    session.establish();
    h.advance(42_000);
    h.client.hangupCall();
    await flush();
    expect(session.bye).toHaveBeenCalled();
    expect(h.state().currentCall).toBe(null);
    expect(h.api.reportHangup).toHaveBeenCalledTimes(1);
    const [callId, body] = h.api.reportHangup.mock.calls[0];
    expect(callId).toBe("call-1");
    expect(body).toMatchObject({ duration: 42, endReason: "agent_hangup" });
    expect(body.answeredAt).toBeTruthy();
    expect(body.startedAt).toBeTruthy();
    expect(h.state().lastEndedCall).toMatchObject({ callId: "call-1", duration: 42, state: CallStates.ENDED });
    expect(h.media.clearRemoteAudio).toHaveBeenCalled();
  });

  it("CANCELs a call that is still establishing", async () => {
    const h = await connected();
    await h.client.makeCall("8655551212");
    const session = h.sip.last().outbound[0];
    h.client.hangupCall();
    await flush();
    expect(session.cancel).toHaveBeenCalled();
    expect(session.bye).not.toHaveBeenCalled();
    expect(h.api.reportHangup).toHaveBeenCalledTimes(1);
  });

  it("refuses an invalid number before Hoppwhistle is asked", async () => {
    const h = await connected();
    const res = await h.client.makeCall("12");
    expect(res.ok).toBe(false);
    expect(res.error.code).toBe("INVALID_NUMBER");
    expect(h.api.originateCall).not.toHaveBeenCalled();
  });

  it("refuses a caller ID that is not one of the agent's numbers", async () => {
    const h = await connected();
    const res = await h.client.makeCall("8655551212", { callerId: "+12125550000" });
    expect(res.error.code).toBe("CALLER_ID_UNAUTHORIZED");
    expect(h.api.originateCall).not.toHaveBeenCalled();
  });

  it("sends no INVITE when Hoppwhistle refuses the originate", async () => {
    const h = await connected({
      apiOverrides: { originateCall: async () => { throw apiError(403, "Not licensed for that state"); } },
    });
    const res = await h.client.makeCall("8655551212");
    expect(res.error.code).toBe("LICENSE_REFUSED");
    expect(h.state().error.message).toBe("Not licensed for that state");
    expect(h.sip.last().createOutboundSession).not.toHaveBeenCalled();
    expect(h.state().currentCall).toBe(null);
    expect(h.state().dialing).toBe(false);
  });

  it("reports a busy far end and closes the call row", async () => {
    const h = await connected();
    await h.client.makeCall("8655551212");
    h.sip.last().outbound[0].remoteReject(486);
    await flush();
    expect(h.state().currentCall).toBe(null);
    expect(h.state().error.code).toBe("CALL_BUSY");
    expect(h.api.reportHangup.mock.calls[0][1].endReason).toBe("rejected_486");
  });

  it("closes the call row and sends nothing when hung up while Hoppwhistle is creating the call", async () => {
    let release;
    const h = await connected({
      apiOverrides: {
        originateCall: () => new Promise((r) => { release = () => r({ callId: "call-slow", callerId: "18655550101" }); }),
      },
    });
    const dialing = h.client.makeCall("8655551212");
    await flush();
    expect(h.state().dialing).toBe(true);
    h.client.hangupCall();
    release();
    const res = await dialing;
    await flush();
    expect(res.canceled).toBe(true);
    expect(h.sip.last().createOutboundSession).not.toHaveBeenCalled();
    expect(h.api.reportHangup).toHaveBeenCalledWith("call-slow", expect.objectContaining({ endReason: "agent_canceled" }), { keepalive: true });
  });

  it("fails clearly when the microphone is blocked, before any call row exists", async () => {
    const h = await connected();
    const { VoiceError } = await import("../errors.js");
    h.media.ensureMicrophone.mockRejectedValueOnce(new VoiceError("MIC_PERMISSION_DENIED"));
    const res = await h.client.makeCall("8655551212");
    expect(res.error.code).toBe("MIC_PERMISSION_DENIED");
    expect(h.api.originateCall).not.toHaveBeenCalled();
  });

  it("refuses a second call while one is up", async () => {
    const h = await connected();
    await h.client.makeCall("8655551212");
    const res = await h.client.makeCall("8655553434");
    expect(res.error.code).toBe("CALL_IN_PROGRESS");
    expect(h.api.originateCall).toHaveBeenCalledTimes(1);
  });

  it("connects on demand when a call is placed while offline", async () => {
    const h = createHarness();
    const res = await h.client.makeCall("8655551212");
    expect(res.ok).toBe(true);
    expect(h.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Inbound
// ════════════════════════════════════════════════════════════════════════════

function inbound(overrides = {}) {
  return new FakeSession({
    direction: "inbound",
    headers: { "X-Call-Id": "fs-0f8e2b6c-1111-4c3d-9a55-2b7d0e0d9a10", ...(overrides.headers || {}) },
    remoteUser: overrides.remoteUser ?? "+14235550199",
    remoteDisplayName: overrides.remoteDisplayName ?? "Jane Caller",
    sipCallId: "inbound-sip-1",
  });
}

describe("inbound calls", () => {
  it("rings with the caller's number, name and Hoppwhistle's call id", async () => {
    const h = await connected();
    h.sip.last().ring(inbound());
    const call = h.state().currentCall;
    expect(call).toMatchObject({
      direction: "inbound",
      state: CallStates.INCOMING,
      phoneNumber: "+14235550199",
      callerName: "Jane Caller",
      callId: "fs-0f8e2b6c-1111-4c3d-9a55-2b7d0e0d9a10",
    });
    expect(h.media.startRingtone).toHaveBeenCalled();
  });

  it("falls back to the SIP Call-ID only when FreeSWITCH sent no call id", async () => {
    const h = await connected();
    h.sip.last().ring(inbound({ headers: { "X-Call-Id": "" } }));
    expect(h.state().currentCall.callId).toBe("inbound-sip-1");
  });

  it("accepts: microphone, SIP accept, remote audio, active, presence on-call", async () => {
    const h = await connected();
    const session = h.sip.last().ring(inbound());
    const answering = h.client.answerCall();
    expect(h.media.stopRingtone).toHaveBeenCalled();
    expect(h.state().currentCall.state).toBe(CallStates.CONNECTING);
    expect((await answering).ok).toBe(true);
    expect(h.media.ensureMicrophone).toHaveBeenCalled();
    expect(session.accept).toHaveBeenCalled();
    session.establish();
    await flush();
    expect(h.state().currentCall.state).toBe(CallStates.ACTIVE);
    expect(h.media.wireRemoteAudio).toHaveBeenCalledWith(session.peerConnection);
    expect(h.presence()).toEqual([AgentStatus.AVAILABLE, AgentStatus.ON_CALL]);
    // Inbound answers and hangups are recorded by FreeSWITCH's CDR, not reported by the browser.
    expect(h.api.reportAnswer).not.toHaveBeenCalled();
  });

  it("keeps ringing when the microphone is blocked, so the person can allow it or decline", async () => {
    const h = await connected();
    const session = h.sip.last().ring(inbound());
    const { VoiceError } = await import("../errors.js");
    h.media.ensureMicrophone.mockRejectedValueOnce(new VoiceError("MIC_PERMISSION_DENIED"));
    const res = await h.client.answerCall();
    expect(res.error.code).toBe("MIC_PERMISSION_DENIED");
    expect(session.accept).not.toHaveBeenCalled();
    expect(h.state().currentCall.state).toBe(CallStates.INCOMING);
  });

  it("rejects", async () => {
    const h = await connected();
    const session = h.sip.last().ring(inbound());
    h.client.rejectCall();
    await flush();
    expect(session.reject).toHaveBeenCalled();
    expect(h.state().currentCall).toBe(null);
    expect(h.media.stopRingtone).toHaveBeenCalled();
    expect(h.api.reportHangup).not.toHaveBeenCalled();
  });

  it("clears the call when the far end hangs up", async () => {
    const h = await connected();
    const session = h.sip.last().ring(inbound());
    await h.client.answerCall();
    session.establish();
    session.remoteHangup();
    await flush();
    expect(h.state().currentCall).toBe(null);
    expect(h.state().lastEndedCall.endReason).toBe("remote_hangup");
    expect(h.presence()).toEqual([AgentStatus.AVAILABLE, AgentStatus.ON_CALL, AgentStatus.AVAILABLE]);
  });

  it("stops ringing when the caller gives up", async () => {
    const h = await connected();
    const session = h.sip.last().ring(inbound());
    session.remoteHangup();
    expect(h.state().currentCall).toBe(null);
    expect(h.state().lastEndedCall.endReason).toBe("caller_canceled");
    expect(h.state().error.code).toBe("CALL_CANCELED");
  });

  it("answers busy to a second call", async () => {
    const h = await connected();
    h.sip.last().ring(inbound());
    const second = h.sip.last().ring(inbound({ remoteUser: "+15555550100" }));
    expect(second.reject).toHaveBeenCalledWith(486);
    expect(h.state().currentCall.phoneNumber).toBe("+14235550199");
  });

  it("declines supervisor listen-in legs rather than opening them silently", async () => {
    const h = await connected();
    const leg = h.sip.last().ring(inbound({ headers: { "X-Hopwhistle-Monitor": "chan-1" } }));
    expect(leg.reject).toHaveBeenCalledWith(480);
    expect(h.state().currentCall).toBe(null);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Controls
// ════════════════════════════════════════════════════════════════════════════

async function activeCall() {
  const h = await connected();
  await h.client.makeCall("8655551212");
  const session = h.sip.last().outbound[0];
  session.establish();
  return { h, session, sender: session.peerConnection.sender };
}

describe("in-call controls", () => {
  it("mute silences the real microphone track and unmute restores it", async () => {
    const { h, sender } = await activeCall();
    h.client.toggleMute();
    expect(h.state().currentCall.isMuted).toBe(true);
    expect(sender.track.enabled).toBe(false);
    h.client.toggleMute();
    expect(sender.track.enabled).toBe(true);
  });

  it("hold and resume, without either undoing mute", async () => {
    const { h, sender } = await activeCall();
    h.client.toggleHold();
    expect(h.state().currentCall).toMatchObject({ isOnHold: true, state: CallStates.HOLD });
    expect(sender.track.enabled).toBe(false);

    // Unmuting a held call does not transmit.
    h.client.toggleMute();
    h.client.toggleMute();
    expect(sender.track.enabled).toBe(false);

    // Muted, then resumed: still muted.
    h.client.toggleMute();
    h.client.toggleHold();
    expect(h.state().currentCall).toMatchObject({ isOnHold: false, isMuted: true, state: CallStates.ACTIVE });
    expect(sender.track.enabled).toBe(false);

    h.client.toggleMute();
    expect(sender.track.enabled).toBe(true);
  });

  it("does not hold a call that is not established", async () => {
    const h = await connected();
    await h.client.makeCall("8655551212");
    expect(h.client.toggleHold().ok).toBe(false);
  });

  it("sends DTMF on the established session", async () => {
    const { h, session } = await activeCall();
    expect(h.client.sendDTMF("5")).toEqual({ ok: true, via: "info" });
    expect(session.sendDtmf).toHaveBeenCalledWith("5");
    expect(h.media.playDtmfTone).toHaveBeenCalledWith("5");
    expect(h.client.sendDTMF("x").ok).toBe(false);
    expect(session.sendDtmf).toHaveBeenCalledTimes(1);
  });

  it("does not pretend to transfer", async () => {
    const { h } = await activeCall();
    const res = h.client.transferCall("8655550000", "blind");
    expect(res.ok).toBe(false);
    expect(res.error.code).toBe("UNSUPPORTED");
  });

  it("keeps three-way calling off until Hoppwhistle grants it", async () => {
    const { h } = await activeCall();
    expect((await h.client.addThirdParty("8655553434")).error.code).toBe("UNSUPPORTED");
    expect((await h.client.mergeCalls()).error.code).toBe("UNSUPPORTED");
    expect(h.api.mergeCalls).not.toHaveBeenCalled();
  });
});

describe("caller ID", () => {
  it("selects among Hoppwhistle's numbers and remembers the choice", async () => {
    const h = await connected();
    expect(h.client.setSelectedCallerId("865-555-0202").ok).toBe(true);
    expect(h.state().selectedCallerId).toBe("+18655550202");
    expect(h.client.setSelectedCallerId("+12125550000").error.code).toBe("CALLER_ID_UNAUTHORIZED");
    expect(h.state().selectedCallerId).toBe("+18655550202");

    // A later session restores the remembered choice.
    const again = await connected({ storage: h.storage });
    expect(again.state().selectedCallerId).toBe("+18655550202");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Three-way (enabled, as a future Hoppwhistle session would grant it)
// ════════════════════════════════════════════════════════════════════════════

describe("three-way calling when granted", () => {
  async function withConference() {
    const { h, session } = await activeCall();
    h.client.setState({ permissions: { ...h.state().permissions, conference: true } });
    return { h, customer: session };
  }

  it("holds the customer, dials the third party, merges on FreeSWITCH by SIP Call-ID", async () => {
    const { h, customer } = await withConference();
    const res = await h.client.addThirdParty("(865) 555-3434");
    expect(res.ok).toBe(true);
    expect(h.state().hasHeldCall).toBe(true);
    expect(customer.peerConnection.sender.track.enabled).toBe(false);
    const added = h.sip.last().outbound[1];
    added.establish();
    expect((await h.client.mergeCalls()).ok).toBe(true);
    expect(h.api.mergeCalls).toHaveBeenCalledWith({ activeCallId: added.sipCallId, heldCallId: customer.sipCallId });
    expect(h.state().currentCall).toMatchObject({ callId: "call-1", conferenceWith: ["+18655553434"], isOnHold: false });
    expect(h.state().hasHeldCall).toBe(false);
  });

  it("returns to the customer when the added call ends without a merge", async () => {
    const { h, customer } = await withConference();
    await h.client.addThirdParty("8655553434");
    h.client.hangupCall();
    await flush();
    expect(h.state().currentCall).toMatchObject({ callId: "call-1", isOnHold: false, state: CallStates.ACTIVE });
    expect(customer.peerConnection.sender.track.enabled).toBe(true);
    expect(h.api.reportHangup.mock.calls.map((c) => c[0])).toEqual(["call-2"]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Presence and cleanup
// ════════════════════════════════════════════════════════════════════════════

describe("presence and cleanup", () => {
  it("goes available -> on-call -> available over a call", async () => {
    const { h, session } = await activeCall();
    session.remoteHangup();
    await flush();
    expect(h.presence()).toEqual([AgentStatus.AVAILABLE, AgentStatus.ON_CALL, AgentStatus.AVAILABLE]);
    expect(h.state().agentStatus).toBe(AgentStatus.AVAILABLE);
  });

  it("cleans up media when a call ends", async () => {
    const { h, session } = await activeCall();
    session.remoteHangup();
    expect(h.media.clearRemoteAudio).toHaveBeenCalled();
    expect(h.media.stopRingtone).toHaveBeenCalled();
  });

  it("ends the call, marks offline, unregisters and releases the tab on disconnect (logout)", async () => {
    const { h, session } = await activeCall();
    const stack = h.sip.last();
    await h.client.disconnect({ reason: "logout" });
    await flush();
    expect(session.bye).toHaveBeenCalled();
    expect(h.api.reportHangup).toHaveBeenCalledTimes(1);
    expect(stack.unregister).toHaveBeenCalled();
    expect(stack.stop).toHaveBeenCalled();
    expect(h.coordinator.release).toHaveBeenCalled();
    expect(h.presence().at(-1)).toBe(AgentStatus.OFFLINE);
    expect(h.presence()).not.toContain(undefined);
    expect(h.state()).toMatchObject({ phoneStatus: PhoneStatus.OFFLINE, isRegistered: false, currentCall: null });
    expect(h.media.clearRemoteAudio).toHaveBeenCalled();
  });

  it("does not report available after logout ends a call", async () => {
    const { h } = await activeCall();
    await h.client.disconnect({ reason: "logout" });
    await flush();
    const after = h.presence().slice(2);
    expect(after).toEqual([AgentStatus.OFFLINE]);
  });

  it("ignores duplicate termination events", async () => {
    const { h, session } = await activeCall();
    h.client.hangupCall();
    session.remoteHangup();
    h.client.hangupCall();
    await flush();
    expect(h.api.reportHangup).toHaveBeenCalledTimes(1);
  });

  it("disposes everything it created", async () => {
    const h = await connected();
    await h.client.dispose();
    expect(h.media.dispose).toHaveBeenCalled();
    expect(h.coordinator.dispose).toHaveBeenCalled();
    expect(h.sip.last().stop).toHaveBeenCalled();
  });
});

describe("tab ownership (client side)", () => {
  it("stands by when another tab owns the phone and takes over when it goes", async () => {
    const coordinator = createFakeCoordinator({ owner: false });
    const h = createHarness({ coordinator });
    expect(await h.client.connect()).toBe(false);
    expect(h.state().phoneStatus).toBe(PhoneStatus.STANDBY);
    expect(h.sip).not.toHaveBeenCalled();

    coordinator.canClaim = true;
    coordinator.emit({ type: "owner-gone" });
    await flush();
    expect(h.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
  });

  it("hands the phone over on request when idle, without marking the agent offline", async () => {
    const h = await connected();
    h.coordinator.emit({ type: "takeover-requested" });
    await flush();
    expect(h.state().phoneStatus).toBe(PhoneStatus.OFFLINE);
    expect(h.coordinator.release).toHaveBeenCalled();
    expect(h.presence()).toEqual([AgentStatus.AVAILABLE]);
  });

  it("refuses a hand-over mid-call", async () => {
    const { h } = await activeCall();
    h.coordinator.emit({ type: "takeover-requested" });
    await flush();
    expect(h.state().phoneStatus).toBe(PhoneStatus.REGISTERED);
  });
});
