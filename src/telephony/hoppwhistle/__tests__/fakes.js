/**
 * Test doubles for the voice client's collaborators: a SIP stack that behaves
 * like the SIP.js adapter's interface, a Hoppwhistle API, media, auth, timers,
 * storage and a same-process BroadcastChannel.
 */

import { vi } from "vitest";

import { HoppwhistleApiError } from "../api.js";
import { HoppwhistleVoiceClient } from "../voiceClient.js";

// ── Timers ──────────────────────────────────────────────────────────────────

export function createManualTimers() {
  let seq = 0;
  const pending = new Map();
  return {
    setTimer: (fn, ms) => {
      const id = ++seq;
      pending.set(id, { fn, ms });
      return id;
    },
    clearTimer: (id) => pending.delete(id),
    pending: () => [...pending.values()],
    delays: () => [...pending.values()].map((t) => t.ms),
    async runAll() {
      const due = [...pending.entries()];
      pending.clear();
      for (const [, t] of due) t.fn();
      await flush();
    },
  };
}

export async function flush(times = 8) {
  for (let i = 0; i < times; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

// ── Storage / BroadcastChannel ──────────────────────────────────────────────

export function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

export function createChannelBus() {
  const channels = new Set();
  class FakeBroadcastChannel {
    constructor(name) {
      this.name = name;
      this.listeners = new Set();
      channels.add(this);
    }
    addEventListener(_type, fn) {
      this.listeners.add(fn);
    }
    postMessage(data) {
      for (const ch of channels) {
        if (ch !== this && ch.name === this.name) for (const l of ch.listeners) l({ data });
      }
    }
    close() {
      channels.delete(this);
    }
  }
  return { FakeBroadcastChannel };
}

// ── Media / peer connection ─────────────────────────────────────────────────

export function createFakeTrack(kind = "audio") {
  return { kind, enabled: true, readyState: "live", stop: vi.fn() };
}

export function createFakePeerConnection() {
  const sender = { track: createFakeTrack("audio") };
  const listeners = new Map();
  return {
    sender,
    receivers: [],
    getSenders: () => [sender],
    getReceivers() {
      return this.receivers;
    },
    addEventListener: (type, fn) => listeners.set(type, [...(listeners.get(type) || []), fn]),
    fire: (type, event) => (listeners.get(type) || []).forEach((fn) => fn(event)),
  };
}

export function createFakeMedia() {
  return {
    ensureMicrophone: vi.fn(async () => {}),
    wireRemoteAudio: vi.fn(),
    clearRemoteAudio: vi.fn(),
    setSenderAudioEnabled: vi.fn((pc, enabled) => {
      for (const s of pc?.getSenders?.() || []) if (s.track) s.track.enabled = enabled;
    }),
    startRingtone: vi.fn(),
    stopRingtone: vi.fn(),
    playDtmfTone: vi.fn(),
    resumePlayback: vi.fn(),
    dispose: vi.fn(),
  };
}

// ── SIP ─────────────────────────────────────────────────────────────────────

export class FakeSession {
  constructor({ direction, headers = {}, remoteUser = "", remoteDisplayName = "", sipCallId = "sip-call-1" }) {
    this.direction = direction;
    this.state = "initial";
    this.headers = headers;
    this.remoteUser = remoteUser;
    this.remoteDisplayName = remoteDisplayName;
    this.sipCallId = sipCallId;
    this.peerConnection = createFakePeerConnection();
    this.listeners = new Set();
    this.inviteOptions = null;
    this.accept = vi.fn(async () => {
      this.setState("establishing");
    });
    this.reject = vi.fn(async () => this.setState("terminated"));
    this.cancel = vi.fn(async () => this.setState("terminated"));
    this.bye = vi.fn(async () => this.setState("terminated"));
    this.sendDtmf = vi.fn(() => "info");
    this.getHeader = (name) => {
      const key = Object.keys(this.headers).find((k) => k.toLowerCase() === name.toLowerCase());
      return key ? this.headers[key] : undefined;
    };
  }
  onStateChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  setState(s) {
    if (this.state === s) return;
    this.state = s;
    for (const l of [...this.listeners]) l(s);
  }
  invite(options) {
    this.inviteOptions = options;
    this.setState("establishing");
    return Promise.resolve();
  }
  // Test drivers
  progress(code = 180) {
    this.inviteOptions?.onProgress?.(code);
  }
  establish() {
    this.setState("established");
  }
  /** In SIP.js's order: the session terminates first, then the invite's onReject delegate runs. */
  remoteReject(code) {
    this.setState("terminated");
    this.inviteOptions?.onReject?.(code);
  }
  remoteHangup() {
    this.setState("terminated");
  }
}

export function createFakeSipFactory({ startError = null, registerErrors = [] } = {}) {
  const stacks = [];
  // Shared by every stack the factory builds: a queued failure happens once.
  const registerQueue = [...registerErrors];
  const factory = vi.fn(async (options) => {
    const stack = {
      options,
      delegate: options.delegate,
      outbound: [],
      connected: false,
      registered: false,
      start: vi.fn(async () => {
        if (startError) throw startError;
        stack.connected = true;
      }),
      register: vi.fn(async () => {
        const err = registerQueue.shift();
        if (err) throw err;
        stack.registered = true;
      }),
      unregister: vi.fn(async () => {
        stack.registered = false;
      }),
      stop: vi.fn(async () => {
        stack.connected = false;
      }),
      reconnect: vi.fn(async () => {
        stack.connected = true;
      }),
      isConnected: () => stack.connected,
      isRegistered: () => stack.registered,
      createOutboundSession: vi.fn((target, { extraHeaders }) => {
        const s = new FakeSession({ direction: "outbound", sipCallId: `out-${stack.outbound.length + 1}` });
        s.target = target;
        s.extraHeaders = extraHeaders;
        stack.outbound.push(s);
        return s;
      }),
      // Test drivers
      ring(session) {
        stack.delegate.onInvite(session);
        return session;
      },
      drop(error = new Error("socket closed")) {
        stack.connected = false;
        stack.registered = false;
        stack.delegate.onDisconnect(error);
      },
    };
    stacks.push(stack);
    return stack;
  });
  factory.stacks = stacks;
  factory.last = () => stacks[stacks.length - 1];
  return factory;
}

export function registrationRejected(statusCode) {
  const err = new Error(`REGISTER refused: ${statusCode}`);
  err.name = "RegistrationRejectedError";
  err.statusCode = statusCode;
  return err;
}

export function registrationTimeout() {
  const err = new Error("REGISTER got no answer");
  err.name = "RegistrationTimeoutError";
  return err;
}

// ── API / auth ──────────────────────────────────────────────────────────────

export const CREDENTIALS = {
  username: "1047",
  password: "per-agent-secret",
  realm: "sip.hopwhistle.test",
  wsUrl: "wss://203.0.113.9:8082",
  stunServers: ["stun:stun.example.test:3478"],
  turnServers: [],
  expiresAt: "2026-10-13T12:05:00.000Z",
};

export const NUMBERS = {
  numbers: [
    { id: "num-1", number: "+18655550101", provider: "fractel" },
    { id: "num-2", number: "+18655550202", provider: "fractel" },
  ],
};

export function createFakeApi(overrides = {}) {
  let callSeq = 0;
  return {
    getWebRtcCredentials: vi.fn(async () => ({ ...CREDENTIALS })),
    getMyNumbers: vi.fn(async () => ({ numbers: NUMBERS.numbers.map((n) => ({ ...n })) })),
    setAgentStatus: vi.fn(async (status) => ({ status })),
    originateCall: vi.fn(async ({ callerId }) => {
      callSeq += 1;
      return { callId: `call-${callSeq}`, callerId: callerId ? callerId.replace(/\D/g, "") : "18655550101" };
    }),
    reportAnswer: vi.fn(async () => ({ recordingEnabled: true })),
    reportHangup: vi.fn(async () => ({ status: "completed" })),
    mergeCalls: vi.fn(async () => ({ success: true })),
    ...overrides,
  };
}

export function apiError(status, message = "refused", code = null) {
  return new HoppwhistleApiError(status, code, message);
}

export function createFakeAuth({ authenticated = true } = {}) {
  const listeners = new Set();
  const auth = {
    authenticated,
    isAuthenticated: () => auth.authenticated,
    getIdentity: () => (auth.authenticated ? { email: "agent@example.test" } : null),
    getAccessToken: async () => (auth.authenticated ? "token" : null),
    login: vi.fn(async () => {
      auth.authenticated = true;
      listeners.forEach((l) => l());
      return { email: "agent@example.test" };
    }),
    invalidate: vi.fn(() => {
      auth.authenticated = false;
      listeners.forEach((l) => l());
    }),
    clear: vi.fn(() => {
      auth.authenticated = false;
      listeners.forEach((l) => l());
    }),
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
  return auth;
}

export function createFakeCoordinator({ owner = true } = {}) {
  const listeners = new Set();
  const c = {
    canClaim: owner,
    owner: false,
    claim: vi.fn(() => {
      if (c.canClaim) c.owner = true;
      return c.owner;
    }),
    release: vi.fn(() => {
      c.owner = false;
    }),
    publish: vi.fn(),
    requestTakeover: vi.fn(),
    isOwner: () => c.owner,
    remoteSummary: () => null,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit: (event) => listeners.forEach((l) => l(event)),
    dispose: vi.fn(),
  };
  return c;
}

// ── The client under test ───────────────────────────────────────────────────

export const silentLogs = {
  sip: { info() {}, warn() {}, error() {}, debug() {} },
  call: { info() {}, warn() {}, error() {}, debug() {} },
  presence: { info() {}, warn() {}, error() {}, debug() {} },
  auth: { info() {}, warn() {}, error() {}, debug() {} },
};

export function createHarness(opts = {}) {
  const timers = createManualTimers();
  const api = opts.api || createFakeApi(opts.apiOverrides);
  const auth = opts.auth || createFakeAuth();
  const media = opts.media || createFakeMedia();
  const sip = opts.sip || createFakeSipFactory(opts.sipOptions);
  const coordinator = opts.coordinator === undefined ? createFakeCoordinator() : opts.coordinator;
  const storage = opts.storage || createMemoryStorage();
  let clock = Date.parse("2026-10-13T12:00:00Z");
  const client = new HoppwhistleVoiceClient({
    config: { enabled: true, apiUrl: "https://hopwhistle.test", sipWsUrlOverride: "" },
    auth,
    api,
    createSipStack: sip,
    media,
    coordinator,
    storage,
    now: () => clock,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    logger: silentLogs,
  });
  return {
    client,
    api,
    auth,
    media,
    sip,
    coordinator,
    storage,
    timers,
    advance: (ms) => {
      clock += ms;
    },
    state: () => client.getState(),
    presence: () => api.setAgentStatus.mock.calls.map((c) => c[0]),
  };
}

export async function connected(opts) {
  const h = createHarness(opts);
  await h.client.connect();
  await flush();
  return h;
}
