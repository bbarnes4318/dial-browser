import { describe, expect, it, vi } from "vitest";

import { createHoppwhistleApi, HoppwhistleApiError } from "../api.js";
import { HoppwhistleAuth, jwtExpiryMs } from "../auth.js";
import { deriveSipWsUrl, readVoiceConfig } from "../config.js";
import { formatPhoneForDisplay, normalizeDialable, sameNumber } from "../numbers.js";
import { classifyBootstrapError, fetchVoiceSession, normalizeLegacySession } from "../session.js";
import { inboundCallSid, knownCallerName, toCallViewStatus } from "../callState.js";
import { maskNumber } from "../logger.js";
import { CREDENTIALS, NUMBERS, createMemoryStorage } from "./fakes.js";

const silent = { info() {}, warn() {}, error() {}, debug() {} };

function jwt(expSeconds) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256" })}.${b64({ userId: "u1", exp: expSeconds })}.sig`;
}

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

// ── Numbers ─────────────────────────────────────────────────────────────────

describe("normalizeDialable", () => {
  it.each([
    ["(865) 555-1212", "18655551212", "+18655551212"],
    ["865.555.1212", "18655551212", "+18655551212"],
    ["+1 865 555 1212", "18655551212", "+18655551212"],
    ["18655551212", "18655551212", "+18655551212"],
    ["8005551212", "18005551212", "+18005551212"],
  ])("US %s", (input, dial, e164) => {
    expect(normalizeDialable(input)).toMatchObject({ ok: true, kind: "nanp", dial, e164 });
  });

  it("keeps international E.164 intact", () => {
    expect(normalizeDialable("+44 20 7946 0958")).toMatchObject({ ok: true, kind: "international", dial: "+442079460958" });
    expect(normalizeDialable("011 44 20 7946 0958")).toMatchObject({ dial: "+442079460958" });
  });

  it("passes Hoppwhistle extensions through", () => {
    expect(normalizeDialable("1047")).toMatchObject({ ok: true, kind: "extension", dial: "1047" });
  });

  it.each(["", "12", "555-1212", "0655551212", "8651551212", "*67", "86555512123", "+1 065 555 1212", "abc"])(
    "refuses %s",
    (input) => {
      expect(normalizeDialable(input).ok).toBe(false);
    },
  );

  it("formats for display without mangling what it does not understand", () => {
    expect(formatPhoneForDisplay("+18655551212")).toBe("(865) 555-1212");
    expect(formatPhoneForDisplay("18655551212")).toBe("(865) 555-1212");
    expect(formatPhoneForDisplay("+442079460958")).toBe("+442079460958");
    expect(formatPhoneForDisplay("1047")).toBe("1047");
  });

  it("matches the same number in different shapes", () => {
    expect(sameNumber("+18655550101", "18655550101")).toBe(true);
    expect(sameNumber("865-555-0101", "+18655550101")).toBe(true);
    expect(sameNumber("+18655550101", "+18655550102")).toBe(false);
  });
});

// ── Config ──────────────────────────────────────────────────────────────────

describe("config", () => {
  it("normalizes the API URL and enables only when set", () => {
    expect(readVoiceConfig({ VITE_HOPPWHISTLE_API_URL: "https://hopwhistle.com/api/v1/" })).toMatchObject({
      apiUrl: "https://hopwhistle.com",
      enabled: true,
    });
    expect(readVoiceConfig({}).enabled).toBe(false);
  });

  it("derives the SIP socket from the API host, with explicit overrides winning", () => {
    expect(deriveSipWsUrl({ apiUrl: "https://hopwhistle.com" })).toBe("wss://hopwhistle.com/ws");
    expect(deriveSipWsUrl({ apiUrl: "http://localhost:3001" })).toBe("ws://localhost:8083");
    expect(deriveSipWsUrl({ apiUrl: "https://hopwhistle.com", sessionWsUrl: "wss://sip.example:7443" })).toBe("wss://sip.example:7443");
    expect(deriveSipWsUrl({ apiUrl: "https://hopwhistle.com", override: "wss://x/ws", sessionWsUrl: "wss://y" })).toBe("wss://x/ws");
  });
});

// ── Auth ────────────────────────────────────────────────────────────────────

describe("HoppwhistleAuth", () => {
  const now = Date.parse("2026-10-13T12:00:00Z");

  function auth(fetchImpl, storage = createMemoryStorage()) {
    const a = new HoppwhistleAuth({ apiUrl: "https://hw.test", storage, fetchImpl, now: () => now, logger: silent });
    return { a, storage };
  }

  it("signs in with the agent's own credentials and binds the session to the Dial Browser user", async () => {
    const token = jwt(now / 1000 + 7 * 86400);
    const fetchImpl = vi.fn(async () => response(200, { token, user: { email: "agent@hw.test" } }));
    const { a, storage } = auth(fetchImpl);
    a.bindUser("db-user-1");
    await a.login("agent@hw.test", "pw");
    expect(fetchImpl).toHaveBeenCalledWith("https://hw.test/api/auth/login", expect.objectContaining({ method: "POST" }));
    expect(a.getToken()).toBe(token);
    expect(a.getIdentity()).toMatchObject({ email: "agent@hw.test" });

    // Another Dial Browser user on this browser does not inherit it.
    a.bindUser("db-user-2");
    expect(a.isAuthenticated()).toBe(false);
    expect(Object.keys(storage.dump())).toHaveLength(0);
  });

  it("refuses bad credentials", async () => {
    const { a } = auth(async () => response(401, { error: { message: "Invalid email or password" } }));
    a.bindUser("u");
    await expect(a.login("x@y", "bad")).rejects.toMatchObject({ voice: { code: "AUTH_FAILED" } });
    expect(a.isAuthenticated()).toBe(false);
  });

  it("treats an expired token as no session", () => {
    const storage = createMemoryStorage();
    storage.setItem("hoppwhistle.voice.session.v1", JSON.stringify({ token: "t", owner: "u", expiresAt: now - 1 }));
    const { a } = auth(vi.fn(), storage);
    a.bindUser("u");
    expect(a.isAuthenticated()).toBe(false);
  });

  it("renews inside Hoppwhistle's refresh window, and not outside it", async () => {
    const soon = jwt(now / 1000 + 3600);
    const renewed = jwt(now / 1000 + 7 * 86400);
    const fetchImpl = vi.fn(async (url) =>
      url.endsWith("/login") ? response(200, { token: soon }) : response(200, { token: renewed }),
    );
    const { a } = auth(fetchImpl);
    a.bindUser("u");
    await a.login("a@b", "pw");
    expect(await a.getAccessToken()).toBe(renewed);
    expect(fetchImpl.mock.calls[1][0]).toBe("https://hw.test/api/auth/refresh");
    await a.getAccessToken();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("decodes JWT expiry", () => {
    expect(jwtExpiryMs(jwt(123))).toBe(123000);
    expect(jwtExpiryMs("garbage")).toBe(null);
  });
});

// ── API ─────────────────────────────────────────────────────────────────────

describe("Hoppwhistle API adapter", () => {
  function api(fetchImpl, token = "agent-token") {
    const auth = { getAccessToken: async () => token, invalidate: vi.fn() };
    return { api: createHoppwhistleApi({ apiUrl: "https://hw.test", auth, fetchImpl }), auth };
  }

  it("sends the agent's bearer token and the exact originate body Hoppwhistle expects", async () => {
    const fetchImpl = vi.fn(async () => response(201, { callId: "c1", callerId: "18655550101" }));
    const { api: a } = api(fetchImpl);
    await a.originateCall({ phoneNumber: "18655551212", callerId: "+18655550101" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://hw.test/api/v1/agent/call/originate");
    expect(init.headers.Authorization).toBe("Bearer agent-token");
    expect(JSON.parse(init.body)).toEqual({ phoneNumber: "18655551212", callerId: "+18655550101" });
  });

  it("encodes call ids in paths", async () => {
    const fetchImpl = vi.fn(async () => response(200, {}));
    const { api: a } = api(fetchImpl);
    await a.reportHangup("../evil id", { duration: 1 });
    expect(fetchImpl.mock.calls[0][0]).toBe("https://hw.test/api/v1/agent/call/..%2Fevil%20id/hangup");
  });

  it("ends the session on 401 rather than retrying with anything else", async () => {
    const { api: a, auth } = api(async () => response(401, {}));
    await expect(a.getMyNumbers()).rejects.toMatchObject({ voice: { code: "AUTH_EXPIRED" } });
    expect(auth.invalidate).toHaveBeenCalled();
  });

  it("does not call Hoppwhistle at all without a session", async () => {
    const fetchImpl = vi.fn();
    const { api: a } = api(fetchImpl, null);
    await expect(a.getWebRtcCredentials()).rejects.toMatchObject({ voice: { code: "AUTH_REQUIRED" } });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("surfaces Hoppwhistle's refusal", async () => {
    const { api: a } = api(async () => response(403, { error: { code: "STATE_NOT_LICENSED", message: "no" } }));
    const err = await a.originateCall({ phoneNumber: "1" }).catch((e) => e);
    expect(err).toBeInstanceOf(HoppwhistleApiError);
    expect(err).toMatchObject({ status: 403, code: "STATE_NOT_LICENSED" });
  });

  it("has no transfer, DTMF or mute endpoints -- Hoppwhistle's are metadata stubs", () => {
    const { api: a } = api(vi.fn());
    expect(a.transferCall).toBeUndefined();
    expect(a.sendDtmf).toBeUndefined();
  });
});

// ── Session bootstrap ───────────────────────────────────────────────────────

describe("voice session bootstrap", () => {
  it("composes the legacy endpoints into the future /voice/session shape", () => {
    const s = normalizeLegacySession(CREDENTIALS, NUMBERS);
    expect(s).toMatchObject({
      agent: { extension: "1047" },
      sip: { username: "1047", password: "per-agent-secret", realm: "sip.hopwhistle.test", wsUrl: null },
      permissions: { inbound: true, outbound: true, recording: "server", transfer: false, conference: false },
    });
    expect(s.callerIds).toHaveLength(2);
  });

  it("strips a tenant suffix from older usernames", () => {
    expect(normalizeLegacySession({ ...CREDENTIALS, username: "1000@tenant-1" }, NUMBERS).sip.username).toBe("1000");
  });

  it("refuses incomplete credentials rather than registering as nobody", () => {
    expect(() => normalizeLegacySession({ ...CREDENTIALS, password: "" }, NUMBERS)).toThrow();
  });

  it("registers without caller IDs when that lookup fails", async () => {
    const s = await fetchVoiceSession({
      getWebRtcCredentials: async () => CREDENTIALS,
      getMyNumbers: async () => {
        throw new Error("boom");
      },
    });
    expect(s.callerIds).toEqual([]);
  });

  it("classifies refusals", () => {
    expect(classifyBootstrapError(new HoppwhistleApiError(403)).voice).toMatchObject({ code: "NO_EXTENSION", terminal: true });
    expect(classifyBootstrapError(new HoppwhistleApiError(409)).voice).toMatchObject({ code: "NO_AGENCY", terminal: true });
    expect(classifyBootstrapError(new HoppwhistleApiError(503)).voice).toMatchObject({ code: "CREDENTIALS_UNAVAILABLE", retryable: true });
  });
});

// ── Small pure helpers ──────────────────────────────────────────────────────

describe("call-state helpers", () => {
  it("maps canonical states onto ModernCallView's status strings", () => {
    expect(toCallViewStatus(null)).toBe(null);
    expect(toCallViewStatus({ state: "incoming" })).toBe("incoming");
    expect(toCallViewStatus({ state: "connecting" })).toBe("connecting");
    expect(toCallViewStatus({ state: "ringing" })).toBe("ringing");
    expect(toCallViewStatus({ state: "active" })).toBe("in-call");
    expect(toCallViewStatus({ state: "hold" })).toBe("in-call");
    expect(toCallViewStatus({ state: "ended" })).toBe(null);
  });

  it("reads Hoppwhistle's inbound call id and ignores anything else", () => {
    expect(inboundCallSid(() => "fs-0f8e2b6c-1111-4c3d")).toBe("fs-0f8e2b6c-1111-4c3d");
    expect(inboundCallSid(() => "call_123")).toBe(null);
  });

  it("does not show placeholder caller names", () => {
    expect(knownCallerName("Unknown")).toBe(null);
    expect(knownCallerName("+18655551212")).toBe(null);
    expect(knownCallerName("Jane")).toBe("Jane");
  });

  it("masks numbers in logs", () => {
    expect(maskNumber("+18655551212")).toBe("***1212");
  });
});
