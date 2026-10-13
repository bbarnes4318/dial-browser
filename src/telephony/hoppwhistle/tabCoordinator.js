/**
 * One registered phone per browser, however many Dial Browser tabs are open.
 *
 * Every tab that registers the same Hoppwhistle extension becomes another SIP
 * contact for it. FreeSWITCH then forks inbound calls to all of them, the
 * Redis presence key flaps as each tab writes it, and closing one tab marks
 * the agent offline while others still ring. So exactly one tab -- the OWNER
 * -- holds the registration, and the others know it.
 *
 * ── How ──────────────────────────────────────────────────────────────────────
 *
 *   * A lease in localStorage names the owner tab and expires unless renewed.
 *     The owner renews it on a heartbeat; a tab that crashes or is killed
 *     stops renewing, and the lease lapses on its own.
 *   * BroadcastChannel carries the fast path: "released" when an owner closes
 *     or disconnects (so a waiting tab takes over at once instead of after the
 *     lease lapses), a summary of the owner's phone state for the others to
 *     show, and take-over requests.
 *
 * Identity:
 *   deviceId  persistent per browser profile (`hoppwhistle-device-id`), the
 *             identity a future Hoppwhistle multi-device registry would key on;
 *   tabId     per page load.
 *
 * This only coordinates Dial Browser tabs with each other. A Hoppwhistle
 * dashboard open alongside registers the same extension independently; that
 * is Hoppwhistle's to arbitrate (see the integration doc).
 */

import { createVoiceLogger } from "./logger.js";

const LEASE_KEY = "dial-browser.voice.owner.v1";
const DEVICE_KEY = "hoppwhistle-device-id";
const CHANNEL = "dial-browser-voice";

function uuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getDeviceId(storage) {
  try {
    const existing = storage?.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = uuid();
    storage?.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return uuid();
  }
}

/** @param {any} [options] */
export function createTabCoordinator({
  storage,
  BroadcastChannelCtor = typeof BroadcastChannel !== "undefined" ? BroadcastChannel : null,
  win = typeof window !== "undefined" ? window : null,
  now = () => Date.now(),
  setRepeat = (fn, ms) => setInterval(fn, ms),
  clearRepeat = (id) => clearInterval(id),
  heartbeatMs = 2000,
  leaseMs = 7000,
  tabId = uuid(),
  logger,
} = {}) {
  const log = logger || createVoiceLogger("Tabs");
  const deviceId = getDeviceId(storage);
  const listeners = new Set();
  let channel = null;
  let heartbeat = null;
  let watch = null;
  let owner = false;
  let remoteSummary = null;
  let disposed = false;

  try {
    channel = BroadcastChannelCtor ? new BroadcastChannelCtor(CHANNEL) : null;
  } catch {
    channel = null;
  }

  function readLease() {
    try {
      const raw = storage?.getItem(LEASE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeLease() {
    try {
      storage?.setItem(LEASE_KEY, JSON.stringify({ tabId, deviceId, expiresAt: now() + leaseMs }));
    } catch {
      // Storage unavailable: this tab cannot coordinate, and owns by default.
    }
  }

  const leaseLive = (lease) => Boolean(lease && lease.expiresAt > now());

  function emit(event) {
    for (const l of [...listeners]) {
      try {
        l(event);
      } catch {
        // ignore
      }
    }
  }

  function post(message) {
    try {
      channel?.postMessage({ ...message, from: tabId });
    } catch {
      // channel closed
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeat = setRepeat(() => {
      const lease = readLease();
      if (lease && lease.tabId !== tabId && leaseLive(lease)) {
        // Someone else holds it now (we were frozen past expiry). Step down.
        log.warn("Lost phone ownership to another tab");
        owner = false;
        stopHeartbeat();
        emit({ type: "ownership-lost" });
        startWatching();
        return;
      }
      writeLease();
    }, heartbeatMs);
  }

  function stopHeartbeat() {
    if (heartbeat !== null) clearRepeat(heartbeat);
    heartbeat = null;
  }

  /** Followers notice an owner that died without saying so. */
  function startWatching() {
    if (watch !== null || disposed) return;
    watch = setRepeat(() => {
      if (owner) return;
      if (!leaseLive(readLease())) {
        remoteSummary = null;
        emit({ type: "owner-gone" });
      }
    }, heartbeatMs);
  }

  function stopWatching() {
    if (watch !== null) clearRepeat(watch);
    watch = null;
  }

  /** Become the owner if nobody live is. True when this tab now owns the phone. */
  function claim() {
    if (disposed) return false;
    const lease = readLease();
    if (leaseLive(lease) && lease.tabId !== tabId) {
      startWatching();
      return false;
    }
    writeLease();
    // Two tabs racing: the last writer wins the lease; the other sees it here.
    const confirmed = readLease();
    if (storage && confirmed && confirmed.tabId !== tabId) {
      startWatching();
      return false;
    }
    owner = true;
    remoteSummary = null;
    stopWatching();
    startHeartbeat();
    post({ type: "claimed" });
    log.info("This tab owns the phone");
    return true;
  }

  function release() {
    if (!owner) return;
    owner = false;
    stopHeartbeat();
    const lease = readLease();
    if (lease?.tabId === tabId) {
      try {
        storage?.removeItem(LEASE_KEY);
      } catch {
        // ignore
      }
    }
    post({ type: "released" });
    log.info("Released phone ownership");
  }

  /** The owner tells the others what its phone is doing. */
  function publish(summary) {
    if (owner) post({ type: "summary", summary });
  }

  /** A follower asks the owner to hand the phone over. */
  function requestTakeover() {
    post({ type: "takeover-request" });
  }

  function onMessage(event) {
    const msg = event?.data;
    if (!msg || msg.from === tabId) return;
    switch (msg.type) {
      case "released":
        if (!owner) {
          remoteSummary = null;
          emit({ type: "owner-gone" });
        }
        break;
      case "claimed":
        if (!owner) {
          startWatching();
          emit({ type: "owner-elsewhere" });
        }
        break;
      case "summary":
        if (!owner) {
          remoteSummary = msg.summary || null;
          emit({ type: "remote-summary", summary: remoteSummary });
        }
        break;
      case "takeover-request":
        if (owner) emit({ type: "takeover-requested" });
        break;
      default:
        break;
    }
  }

  if (channel) {
    if (typeof channel.addEventListener === "function") channel.addEventListener("message", onMessage);
    else channel.onmessage = onMessage;
  }

  const onPageHide = () => release();
  win?.addEventListener?.("pagehide", onPageHide);

  return {
    tabId,
    deviceId,
    claim,
    release,
    publish,
    requestTakeover,
    isOwner: () => owner,
    ownerElsewhere: () => {
      const lease = readLease();
      return !owner && leaseLive(lease) && lease.tabId !== tabId;
    },
    remoteSummary: () => remoteSummary,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      release();
      disposed = true;
      stopWatching();
      win?.removeEventListener?.("pagehide", onPageHide);
      try {
        channel?.close();
      } catch {
        // ignore
      }
      channel = null;
      listeners.clear();
    },
  };
}

export const TAB_LEASE_KEY = LEASE_KEY;
