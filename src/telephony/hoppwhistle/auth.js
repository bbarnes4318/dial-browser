/**
 * How Dial Browser proves to Hoppwhistle which agent is at the phone.
 *
 * ── The model ────────────────────────────────────────────────────────────────
 *
 * Every Hoppwhistle voice endpoint (`/api/v1/agent/*`) resolves the AGENT from
 * a per-user session token and refuses anything else: an API key carries a
 * tenant but no user, so it cannot act as an agent, and there is no
 * platform-wide credential that can. That is the property this adapter keeps.
 *
 * Today Hoppwhistle offers exactly one way to obtain such a token: the agent
 * signs in (POST /api/auth/login) and receives their own session JWT, renewable
 * through POST /api/auth/refresh. Dial Browser and Hoppwhistle do not share a
 * user directory, so there is nothing Dial Browser could exchange its own
 * Base44 session for. The agent therefore links their Hoppwhistle account
 * once, here, and the token is:
 *
 *   * the agent's OWN token -- never a master key, never in a VITE_ variable;
 *   * bound to the Dial Browser user who obtained it, and dropped the moment a
 *     different Dial Browser user is signed in on this browser;
 *   * renewed inside Hoppwhistle's refresh window and discarded on any 401.
 *
 * ── The replacement ──────────────────────────────────────────────────────────
 *
 * The preferred design is a short-lived, voice-scoped token minted for the
 * signed-in Dial Browser user (see docs/HOPPWHISTLE_VOICE_INTEGRATION.md,
 * "Backend gaps"). Everything outside this file depends only on the interface
 * below -- `getAccessToken()`, `isAuthenticated()`, `invalidate()`, `clear()`,
 * `subscribe()` -- so that exchange replaces this class and nothing else.
 *
 * The token is never logged.
 */

import { VoiceError } from "./errors.js";
import { createVoiceLogger } from "./logger.js";

const STORAGE_KEY = "hoppwhistle.voice.session.v1";
/** Hoppwhistle refreshes tokens within 24h of expiry (routes/auth.ts REFRESH_WINDOW_MS). */
const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Treat a token this close to expiry as already gone. */
const EXPIRY_SKEW_MS = 30 * 1000;

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

export class HoppwhistleAuth {
  /** @param {any} [options] */
  constructor({ apiUrl, storage = safeLocalStorage(), fetchImpl, now = () => Date.now(), logger } = {}) {
    this.apiUrl = apiUrl;
    this.storage = storage;
    this.fetchImpl = fetchImpl || ((url, init) => fetch(url, init));
    this.now = now;
    this.log = logger || createVoiceLogger("Auth");
    this.owner = null;
    this.memory = null; // used when storage is unavailable
    this.listeners = new Set();
    this.refreshing = null;
  }

  // ── Identity binding ───────────────────────────────────────────────────────

  /**
   * Tie the stored Hoppwhistle session to the signed-in Dial Browser user. A
   * session that belongs to someone else on this browser is discarded rather
   * than inherited.
   */
  bindUser(dialBrowserUserId) {
    const owner = dialBrowserUserId ? String(dialBrowserUserId) : null;
    this.owner = owner;
    const record = this.read();
    if (record && record.owner !== owner) {
      this.log.info("Discarding a Hoppwhistle session that belongs to a different Dial Browser user");
      this.clear();
      return;
    }
    this.emit();
  }

  // ── Token access ──────────────────────────────────────────────────────────

  getToken() {
    const record = this.read();
    if (!record || !this.owner || record.owner !== this.owner) return null;
    if (record.expiresAt && record.expiresAt - EXPIRY_SKEW_MS <= this.now()) return null;
    return record.token;
  }

  isAuthenticated() {
    return Boolean(this.getToken());
  }

  getIdentity() {
    const record = this.read();
    if (!record || !this.isAuthenticated()) return null;
    return { email: record.email || null, expiresAt: record.expiresAt || null };
  }

  async getAccessToken() {
    await this.refreshIfNeeded();
    return this.getToken();
  }

  // ── Sign in / renew / sign out ────────────────────────────────────────────

  async login(email, password) {
    if (!this.owner) throw new VoiceError("AUTH_REQUIRED", "Sign in to Dial Browser first.");
    if (!email || !password) throw new VoiceError("AUTH_FAILED", "Enter your Hoppwhistle email and password.");
    let res;
    try {
      res = await this.fetchImpl(`${this.apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email).trim(), password }),
      });
    } catch {
      throw new VoiceError("SERVER_UNREACHABLE");
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const serverMessage = body?.error?.message;
      if (res.status === 401) throw new VoiceError("AUTH_FAILED");
      throw new VoiceError("AUTH_FAILED", serverMessage || undefined);
    }
    if (!body?.token) throw new VoiceError("AUTH_FAILED", "Hoppwhistle did not return a session.");
    this.write({ token: body.token, email: body.user?.email || String(email).trim() });
    this.log.info("Linked a Hoppwhistle agent session");
    return { email: body.user?.email || String(email).trim() };
  }

  /** Renew within Hoppwhistle's refresh window. Best-effort, single-flight. */
  async refreshIfNeeded() {
    const token = this.getToken();
    if (!token) return;
    const record = this.read();
    if (!record?.expiresAt || record.expiresAt - this.now() > REFRESH_WINDOW_MS) return;
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      try {
        const res = await this.fetchImpl(`${this.apiUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          this.log.warn("Hoppwhistle refused to renew the session");
          this.invalidate();
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (res.ok && body?.token) {
          this.write({ token: body.token, email: record.email });
          this.log.info("Renewed the Hoppwhistle session");
        }
      } catch {
        // Offline: the current token is still valid; try again next time.
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  /** The server said 401: this token is finished. */
  invalidate() {
    this.clear();
  }

  clear() {
    this.memory = null;
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.emit();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Another tab signed in or out. */
  listenForChanges(win = typeof window !== "undefined" ? window : null) {
    if (!win?.addEventListener) return () => {};
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) this.emit();
    };
    win.addEventListener("storage", onStorage);
    return () => win.removeEventListener("storage", onStorage);
  }

  // ── Storage ───────────────────────────────────────────────────────────────

  read() {
    if (!this.storage) return this.memory;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  write({ token, email }) {
    const record = {
      token,
      email: email || null,
      owner: this.owner,
      expiresAt: jwtExpiryMs(token),
    };
    if (!this.storage) {
      this.memory = record;
    } else {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(record));
      } catch {
        this.memory = record;
      }
    }
    this.emit();
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

export { STORAGE_KEY as HOPPWHISTLE_AUTH_STORAGE_KEY };
