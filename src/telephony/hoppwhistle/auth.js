/**
 * How Dial Browser proves to Hoppwhistle which member is at the phone.
 *
 * ── The model ────────────────────────────────────────────────────────────────
 *
 * Members never sign in to Hoppwhistle. When the phone needs a token, it asks
 * Dial Browser's own backend (the `hoppwhistle-voice-token` Base44 function).
 * That function knows who is signed in to Dial Browser, holds the integration
 * secret, and exchanges the member's identity for a one-hour Hoppwhistle
 * VOICE token. The token is:
 *
 *   * the member's own -- the integration secret never reaches the browser,
 *     and nothing here is a VITE_ variable;
 *   * voice-scoped: Hoppwhistle accepts it on the softphone routes only, and
 *     enforces the member's limits itself;
 *   * kept in memory only, bound to the Dial Browser user who obtained it, and
 *     dropped the moment a different user (or nobody) is signed in;
 *   * renewed a few minutes before it expires, and replaced once on a 401.
 *
 * Everything outside this file depends only on the interface below --
 * `getAccessToken()`, `isAuthenticated()`, `getIdentity()`, `invalidate()`,
 * `clear()`, `subscribe()` -- so the voice client does not know or care how
 * the token was obtained.
 *
 * The token is never logged.
 */

import { VoiceError } from "./errors.js";
import { createVoiceLogger } from "./logger.js";

/**
 * Where the old NetEnroll-login build kept the agent session. Nothing is stored
 * there any more; it is only ever removed, so a browser that linked an agent
 * account before does not keep that token lying around.
 */
export const LEGACY_AUTH_STORAGE_KEY = "hoppwhistle.voice.session.v1";

export function clearLegacyAuthStorage(storage = safeLocalStorage()) {
  try {
    storage?.removeItem(LEGACY_AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Renew this long before expiry, so a call never starts on a dying token. */
const RENEW_BEFORE_MS = 5 * 60 * 1000;
/** After the exchange fails, don't hammer it. */
const FAILURE_BACKOFF_MS = 15 * 1000;

export function safeLocalStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    // Storage disabled (privacy mode, sandboxed frame).
  }
  return null;
}

/** The `exp` claim of a JWT, in ms, or null. Decodes; never verifies -- the server does. */
export function jwtExpiryMs(token) {
  try {
    const part = String(token).split(".")[1];
    if (!part) return null;
    const json = JSON.parse(base64UrlDecode(part));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function base64UrlDecode(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  return atob(b64);
}

/** What the exchange's refusal means for the person at the phone. */
function exchangeErrorToVoice(err) {
  if (err instanceof VoiceError) return err;
  const status = err?.status ?? err?.response?.status ?? null;
  const body = err?.data ?? err?.response?.data ?? null;
  const code = body?.code;
  if (status === 401 || code === "AUTH_REQUIRED") return new VoiceError("AUTH_REQUIRED");
  if (code === "DISCLAIMER_REQUIRED") {
    return new VoiceError("DISCLAIMER_REQUIRED", body?.error || undefined, { terminal: true });
  }
  if (code === "NOT_CONFIGURED") return new VoiceError("NOT_CONFIGURED", undefined, { terminal: true });
  if (status === 403) return new VoiceError("ACCOUNT_REFUSED", body?.error || undefined, { terminal: true });
  if (status == null) return new VoiceError("SERVER_UNREACHABLE");
  return new VoiceError("CREDENTIALS_UNAVAILABLE", body?.error || undefined);
}

export class MemberVoiceAuth {
  /**
   * @param {any} options
   *   exchange: async () => ({ token, expiresAt }) -- Dial Browser's backend.
   */
  constructor({ exchange, now = () => Date.now(), logger } = {}) {
    this.exchange = exchange;
    this.now = now;
    this.log = logger || createVoiceLogger("Auth");
    this.owner = null;
    this.record = null; // { token, owner, expiresAt }
    this.listeners = new Set();
    this.inflight = null;
    this.failedAt = null;
    this.lastFailure = null;
  }

  // ── Identity binding ───────────────────────────────────────────────────────

  /** The signed-in Dial Browser user. A token minted for anyone else is dropped. */
  bindUser(dialBrowserUserId) {
    const owner = dialBrowserUserId ? String(dialBrowserUserId) : null;
    if (owner === this.owner) return;
    this.owner = owner;
    this.record = null;
    this.inflight = null;
    this.failedAt = null;
    this.lastFailure = null;
    this.emit();
  }

  // ── Token access ──────────────────────────────────────────────────────────

  /** A usable token in hand, without asking for one. */
  getToken() {
    const r = this.record;
    if (!r || !this.owner || r.owner !== this.owner) return null;
    if (r.expiresAt && r.expiresAt - RENEW_BEFORE_MS <= this.now()) return null;
    return r.token;
  }

  /**
   * Whether the phone can get a token: a Dial Browser member is signed in. The
   * token itself is fetched on demand, so this is true before the first one.
   */
  isAuthenticated() {
    return Boolean(this.owner);
  }

  getIdentity() {
    return this.owner ? { member: true } : null;
  }

  /** The member's voice token, minting or renewing it as needed. Throws a VoiceError when it can't. */
  async getAccessToken() {
    const held = this.getToken();
    if (held) return held;
    if (!this.owner) return null;
    if (this.inflight) return this.inflight;
    if (this.failedAt !== null && this.now() - this.failedAt < FAILURE_BACKOFF_MS && this.lastFailure) {
      throw this.lastFailure;
    }

    const owner = this.owner;
    const run = (async () => {
      let result;
      try {
        result = await this.exchange();
      } catch (err) {
        const voiceErr = exchangeErrorToVoice(err);
        // Back off only from outages; a refusal the member can fix (the
        // emergency notice) must be retried the moment they fix it.
        if (owner === this.owner && voiceErr.voice.retryable) {
          this.failedAt = this.now();
          this.lastFailure = voiceErr;
        }
        this.log.warn(`Could not get a phone token: ${voiceErr.voice.code}`);
        throw voiceErr;
      }
      const token = result?.token;
      if (!token) throw new VoiceError("CREDENTIALS_UNAVAILABLE");
      // Signed out or switched users while waiting: this token is not theirs.
      if (owner !== this.owner) return null;
      const parsed = result.expiresAt ? Date.parse(result.expiresAt) : NaN;
      this.record = {
        token,
        owner,
        expiresAt: jwtExpiryMs(token) ?? (Number.isFinite(parsed) ? parsed : null),
      };
      this.failedAt = null;
      this.lastFailure = null;
      this.log.info("Got a phone token");
      return token;
    })();
    this.inflight = run;
    try {
      return await run;
    } finally {
      if (this.inflight === run) this.inflight = null;
    }
  }

  /** Mint a fresh token on the next request. */
  get renewable() {
    return Boolean(this.owner);
  }

  // ── Sign in / sign out ────────────────────────────────────────────────────

  /** Members don't sign in to Hoppwhistle; their Dial Browser session is enough. */
  async login() {
    throw new VoiceError("UNSUPPORTED", "The phone signs in with your Dial Browser account.");
  }

  /** The server said 401: this token is finished. The next request mints another. */
  invalidate() {
    this.record = null;
  }

  clear() {
    this.record = null;
    this.inflight = null;
    this.emit();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Tokens live in memory per tab; there is nothing to sync between tabs. */
  listenForChanges() {
    return () => {};
  }

  emit() {
    for (const l of [...this.listeners]) {
      try {
        l();
      } catch {
        // a listener's failure is its own
      }
    }
  }
}
