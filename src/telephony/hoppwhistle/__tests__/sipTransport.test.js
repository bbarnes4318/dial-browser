import { describe, expect, it, vi } from "vitest";
import { SessionState } from "sip.js";

import { registerAndConfirm, wrapSession } from "../sipTransport.js";

function fakeRegisterer(behaviour) {
  return {
    register: vi.fn(async ({ requestDelegate }) => {
      behaviour(requestDelegate);
    }),
  };
}

describe("registerAndConfirm", () => {
  it("resolves only on the registrar's acceptance", async () => {
    let accept;
    const reg = fakeRegisterer((d) => {
      accept = d.onAccept;
    });
    let done = false;
    const p = registerAndConfirm(reg, 1000).then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(false); // the request is sent, but nobody has accepted it
    accept();
    await p;
    expect(done).toBe(true);
  });

  it("rejects with the status code on a refusal", async () => {
    const reg = fakeRegisterer((d) => d.onReject({ message: { statusCode: 403, reasonPhrase: "Forbidden" } }));
    await expect(registerAndConfirm(reg, 1000)).rejects.toMatchObject({ name: "RegistrationRejectedError", statusCode: 403 });
  });

  it("times out when the registrar never answers", async () => {
    vi.useFakeTimers();
    const p = registerAndConfirm(fakeRegisterer(() => {}), 15000);
    vi.advanceTimersByTime(15000);
    await expect(p).rejects.toMatchObject({ name: "RegistrationTimeoutError" });
    vi.useRealTimers();
  });
});

function fakeSipSession({ infoThrows = false } = {}) {
  const listeners = new Set();
  return {
    state: SessionState.Established,
    request: { getHeader: (n) => ({ "X-Call-Id": "fs-abcdef12-3456", "Call-ID": " abc@host " })[n], callId: "abc@host" },
    remoteIdentity: { uri: { user: "+18655551212" }, displayName: "Jane" },
    sessionDescriptionHandler: { peerConnection: { id: "pc" }, sendDtmf: vi.fn(() => true) },
    stateChange: { addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn) },
    info: vi.fn(() => {
      if (infoThrows) throw new Error("no INFO");
    }),
    emit: (s) => listeners.forEach((fn) => fn(s)),
  };
}

describe("wrapSession", () => {
  it("sends DTMF as SIP INFO dtmf-relay, Hoppwhistle's working path", () => {
    const s = fakeSipSession();
    const handle = wrapSession(s, { direction: "inbound", iceServers: [] });
    expect(handle.sendDtmf("7")).toBe("info");
    const body = s.info.mock.calls[0][0].requestOptions.body;
    expect(body).toEqual({ contentDisposition: "render", contentType: "application/dtmf-relay", content: "Signal=7\r\nDuration=250" });
    expect(s.sessionDescriptionHandler.sendDtmf).not.toHaveBeenCalled();
  });

  it("falls back to RFC 2833 only when INFO cannot be sent", () => {
    const s = fakeSipSession({ infoThrows: true });
    const handle = wrapSession(s, { direction: "inbound", iceServers: [] });
    expect(handle.sendDtmf("#")).toBe("rtp");
    expect(s.sessionDescriptionHandler.sendDtmf).toHaveBeenCalledWith("#");
  });

  it("exposes headers, identity, Call-ID and state without leaking the session", () => {
    const s = fakeSipSession();
    const handle = wrapSession(s, { direction: "inbound", iceServers: [] });
    expect(handle.getHeader("X-Call-Id")).toBe("fs-abcdef12-3456");
    expect(handle.remoteUser).toBe("+18655551212");
    expect(handle.remoteDisplayName).toBe("Jane");
    expect(handle.sipCallId).toBe("abc@host");
    expect(handle.state).toBe("established");
    const seen = [];
    handle.onStateChange((st) => seen.push(st));
    s.emit(SessionState.Terminated);
    expect(seen).toEqual(["terminated"]);
  });
});
