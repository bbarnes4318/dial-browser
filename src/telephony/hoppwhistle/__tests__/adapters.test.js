import { describe, expect, it, vi } from "vitest";

import { createHoppwhistleApi, HoppwhistleApiError } from "../api.js";
import { MemberVoiceAuth, jwtExpiryMs } from "../auth.js";
import { deriveSipWsUrl, readVoiceConfig } from "../config.js";
import { formatPhoneForDisplay, normalizeDialable, sameNumber } from "../numbers.js";
import { classifyBootstrapError, fetchVoiceSession, normalizeLegacySession } from "../session.js";
import { inboundCallSid, knownCallerName, toCallViewStatus } from "../callState.js";
import { maskNumber } from "../logger.js";
import { CREDENTIALS, NUMBERS } from "./fakes.js";

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
  it("normalizes the API URL, defaulting to the NetEnroll agent portal", () => {
    expect(readVoiceConfig({ VITE_HOPPWHISTLE_API_URL: "https://hopwhistle.com/api/v1/" })).toMatchObject({
      apiUrl: "https://hopwhistle.com",
      enabled: true,
    });
    expect(readVoiceConfig({})).toMatchObject({ apiUrl: "https://agents.netenroll.com", enabled: true });
    expect(deriveSipWsUrl({ apiUrl: readVoiceConfig({}).apiUrl })).toBe("wss://agents.netenroll.com/ws");
  });

  it("derives the SIP socket from the API host, with explicit overrides winning", () => {
    expect(deriveSipWsUrl({ apiUrl: "https://hopwhistle.com" })).toBe("wss://hopwhistle.com/ws");
    expect(deriveSipWsUrl({ apiUrl: "http://localhost:3001" })).toBe("ws://localhost:8083");
    expect(deriveSipWsUrl({ apiUrl: "https://hopwhistle.com", sessionWsUrl: "wss://sip.example:7443" })).toBe("wss://sip.example:7443");
    expect(deriveSipWsUrl({ apiUrl: "https://hopwhistle.com", override: "wss://x/ws", sessionWsUrl: "wss://y" })).toBe("wss://x/ws");
  });
});

// ── Auth ────────────────────────────────────────────────────────────────────

describe("MemberVoiceAuth", () => {
  let now = Date.parse("2026-10-13T12:00:00Z");

  function auth(exchange) {
    return new MemberVoiceAuth({ exchange, now: () => now, logger: silent });
  }

  it("gets the member's token from Dial Browser's backend, with no Hoppwhistle login", async () => {
    const token = jwt(now / 1000 + 3600);
    const exchange = vi.fn(async () => ({ token, expiresAt: new Date(now + 3600_000).toISOString() }));
    const a = auth(exchange);
    expect(a.isAuthenticated()).toBe(false);
    expect(await a.getAccessToken()).toBe(null);
    expect(exchange).not.toHaveBeenCalled();

    a.bindUser("db-user-1");
    expect(a.isAuthenticated()).toBe(true);
    expect(await a.getAccessToken()).toBe(token);
    expect(await a.getAccessToken()).toBe(token);
    expect(exchange).toHaveBeenCalledTimes(1);
  });

  it("asks once for concurrent requests", async () => {
    let release;
    const exchange = vi.fn(() => new Promise((r) => (release = r)));
    const a = auth(exchange);
    a.bindUser("u");
    const both = Promise.all([a.getAccessToken(), a.getAccessToken()]);
    release({ token: jwt(now / 1000 + 3600) });
    const [t1, t2] = await both;
    expect(t1).toBe(t2);
    expect(exchange).toHaveBeenCalledTimes(1);
  });

  it("renews shortly before expiry", async () => {
    const first = jwt(now / 1000 + 3600);
    const second = jwt(now / 1000 + 7200);
    const exchange = vi.fn().mockResolvedValueOnce({ token: first }).mockResolvedValueOnce({ token: second });
    const a = auth(exchange);
    a.bindUser("u");
    expect(await a.getAccessToken()).toBe(first);
    now += 56 * 60 * 1000; // inside the last five minutes
    expect(await a.getAccessToken()).toBe(second);
    now -= 56 * 60 * 1000;
  });

  it("drops the token when a different member, or nobody, is signed in", async () => {
    const exchange = vi.fn(async () => ({ token: jwt(now / 1000 + 3600) }));
    const a = auth(exchange);
    a.bindUser("db-user-1");
    await a.getAccessToken();
    a.bindUser("db-user-2");
    expect(a.getToken()).toBe(null);
    a.bindUser(null);
    expect(a.isAuthenticated()).toBe(false);
    expect(await a.getAccessToken()).toBe(null);
  });

  it("does not hand a token minted for one member to the next", async () => {
    let release;
    const a = auth(() => new Promise((r) => (release = r)));
    a.bindUser("db-user-1");
    const pending = a.getAccessToken();
    a.bindUser("db-user-2");
    release({ token: jwt(now / 1000 + 3600) });
    expect(await pending).toBe(null);
    expect(a.getToken()).toBe(null);
  });

  it("explains a refusal the member can fix, and retries it as soon as they do", async () => {
    const refusal = { status: 403, data: { code: "DISCLAIMER_REQUIRED", error: "Accept the notice first." } };
    const token = jwt(now / 1000 + 3600);
    const exchange = vi.fn().mockRejectedValueOnce(refusal).mockResolvedValueOnce({ token });
    const a = auth(exchange);
    a.bindUser("u");
    await expect(a.getAccessToken()).rejects.toMatchObject({
      voice: { code: "DISCLAIMER_REQUIRED", message: "Accept the notice first.", terminal: true },
    });
    expect(await a.getAccessToken()).toBe(token);
  });

  it("backs off briefly after an outage", async () => {
    const exchange = vi.fn().mockRejectedValue({ status: 503, data: { code: "UNAVAILABLE" } });
    const a = auth(exchange);
    a.bindUser("u");
    await expect(a.getAccessToken()).rejects.toMatchObject({ voice: { code: "CREDENTIALS_UNAVAILABLE" } });
    await expect(a.getAccessToken()).rejects.toMatchObject({ voice: { code: "CREDENTIALS_UNAVAILABLE" } });
    expect(exchange).toHaveBeenCalledTimes(1);
  });

  it("maps a lost Dial Browser session and an unconfigured phone", async () => {
    const a = auth(vi.fn().mockRejectedValueOnce({ status: 401 }).mockRejectedValueOnce({ status: 503, data: { code: "NOT_CONFIGURED" } }));
    a.bindUser("u");
    await expect(a.getAccessToken()).rejects.toMatchObject({ voice: { code: "AUTH_REQUIRED" } });
    await expect(a.getAccessToken()).rejects.toMatchObject({ voice: { code: "NOT_CONFIGURED", terminal: true } });
  });

  it("has no Hoppwhistle password login", async () => {
    await expect(auth(vi.fn()).login("a@b", "pw")).rejects.toMatchObject({ voice: { code: "UNSUPPORTED" } });
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

  it("on a 401, mints one fresh member token and tries once more", async () => {
    const tokens = ["stale", "fresh"];
    const auth = { renewable: true, getAccessToken: async () => tokens[0], invalidate: vi.fn(() => tokens.shift()) };
    const fetchImpl = vi.fn(async (_url, init) =>
      init.headers.Authorization === "Bearer fresh" ? response(200, { numbers: [] }) : response(401, {}),
    );
    const a = createHoppwhistleApi({ apiUrl: "https://hw.test", auth, fetchImpl });
    await expect(a.getMyNumbers()).resolves.toEqual({ numbers: [] });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up after the fresh token is refused too", async () => {
    const auth = { renewable: true, getAccessToken: async () => "t", invalidate: vi.fn() };
    const fetchImpl = vi.fn(async () => response(401, {}));
    const a = createHoppwhistleApi({ apiUrl: "https://hw.test", auth, fetchImpl });
    await expect(a.getMyNumbers()).rejects.toMatchObject({ voice: { code: "AUTH_EXPIRED" } });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
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
