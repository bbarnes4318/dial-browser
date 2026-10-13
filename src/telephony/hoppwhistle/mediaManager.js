/**
 * Everything the phone does with audio in the page. The audio itself flows
 * browser <-> FreeSWITCH over WebRTC; nothing here proxies it anywhere.
 *
 * ── Remote audio ─────────────────────────────────────────────────────────────
 *
 * One hidden <audio> sink for the whole phone. `wireRemoteAudio` follows
 * Hoppwhistle's race-proof version (phone-provider.tsx): the remote track can
 * arrive before the session reports Established, after it, or only once late
 * ICE completes, so it
 *
 *   * installs a `track` listener once per RTCPeerConnection (WeakSet), and
 *   * attaches whatever live receiver tracks already exist, and
 *   * re-checks the receivers a few times shortly after, for tracks that
 *     arrived without a `track` event reaching us.
 *
 * A `play()` the browser refuses (autoplay policy) is reported, not swallowed,
 * so the UI can ask for the click that unblocks it.
 *
 * ── Microphone ───────────────────────────────────────────────────────────────
 *
 * The microphone is opened by SIP.js for the call and closed with it. Before a
 * call, `ensureMicrophone` asks for permission and immediately releases the
 * stream, so a denied or missing microphone is a clear error before a call row
 * exists, not an opaque SDP failure after. Nothing holds the microphone
 * between calls.
 */

import { createVoiceLogger } from "./logger.js";
import { VoiceError } from "./errors.js";

const DTMF_FREQUENCIES = {
  1: [697, 1209], 2: [697, 1336], 3: [697, 1477],
  4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
  7: [852, 1209], 8: [852, 1336], 9: [852, 1477],
  "*": [941, 1209], 0: [941, 1336], "#": [941, 1477],
};

/** Re-check receivers this long after wiring, for late tracks. */
const LATE_TRACK_CHECKS_MS = [250, 750, 1500];

/** @param {any} [options] */
export function createMediaManager({
  doc = typeof document !== "undefined" ? document : null,
  win = typeof window !== "undefined" ? window : null,
  mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : null,
  MediaStreamCtor = typeof MediaStream !== "undefined" ? MediaStream : null,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
  setRepeat = (fn, ms) => setInterval(fn, ms),
  clearRepeat = (id) => clearInterval(id),
  logger,
  onPlaybackBlocked,
  onPlaybackResumed,
} = {}) {
  const log = logger || createVoiceLogger("Media");
  let audioEl = null;
  let wired = new WeakSet();
  const lateChecks = new Set();
  let audioCtx = null;
  let ringTimer = null;
  let unlockInstalled = false;
  let blocked = false;

  function ensureAudioElement() {
    if (audioEl || !doc) return audioEl;
    audioEl = doc.createElement("audio");
    audioEl.autoplay = true;
    audioEl.setAttribute("playsinline", "");
    audioEl.style.display = "none";
    audioEl.dataset.voice = "hoppwhistle-remote";
    doc.body.appendChild(audioEl);
    return audioEl;
  }

  function play() {
    const el = audioEl;
    if (!el?.play) return;
    let result;
    try {
      result = el.play();
    } catch (err) {
      result = Promise.reject(err);
    }
    Promise.resolve(result)
      .then(() => {
        if (blocked) {
          blocked = false;
          onPlaybackResumed?.();
        }
      })
      .catch((err) => {
        if (err?.name === "NotAllowedError") {
          log.warn("Remote audio blocked by the browser's autoplay policy");
          blocked = true;
          onPlaybackBlocked?.();
          installUnlock();
        } else if (err?.name !== "AbortError") {
          log.warn("Remote audio play() failed", err?.name || err);
        }
      });
  }

  function attach(stream) {
    if (!stream || stream.getAudioTracks().length === 0) return false;
    const el = ensureAudioElement();
    if (!el) return false;
    if (el.srcObject !== stream) el.srcObject = stream;
    play();
    return true;
  }

  function attachLiveReceivers(pc) {
    if (!MediaStreamCtor) return false;
    let receivers = [];
    try {
      receivers = pc.getReceivers();
    } catch {
      return false; // closed
    }
    const live = receivers.map((r) => r.track).filter((t) => t && t.kind === "audio" && t.readyState === "live");
    if (live.length === 0) return false;
    const stream = new MediaStreamCtor(live);
    return attach(stream);
  }

  function wireRemoteAudio(pc) {
    if (!pc) return;
    if (!wired.has(pc)) {
      wired.add(pc);
      const accumulated = MediaStreamCtor ? new MediaStreamCtor() : null;
      pc.addEventListener("track", (event) => {
        log.info("Remote track arrived", event.track?.kind);
        if (event.track?.kind && event.track.kind !== "audio") return;
        if (event.streams?.[0]) {
          attach(event.streams[0]);
        } else if (accumulated && event.track) {
          accumulated.addTrack(event.track);
          attach(accumulated);
        }
      });
    }
    if (attachLiveReceivers(pc)) return;
    for (const ms of LATE_TRACK_CHECKS_MS) {
      const id = setTimer(() => {
        lateChecks.delete(id);
        if (!audioEl?.srcObject || audioEl.srcObject.getAudioTracks?.().length === 0) {
          if (attachLiveReceivers(pc)) log.info(`Attached a late remote track after ${ms}ms`);
        }
      }, ms);
      lateChecks.add(id);
    }
  }

  function clearRemoteAudio() {
    for (const id of lateChecks) clearTimer(id);
    lateChecks.clear();
    if (audioEl) {
      try {
        audioEl.pause?.();
      } catch {
        // ignore
      }
      audioEl.srcObject = null;
    }
    blocked = false;
  }

  /** The microphone itself, not the icon: enable or silence every outgoing audio track. */
  function setSenderAudioEnabled(pc, enabled) {
    if (!pc) return;
    let senders = [];
    try {
      senders = pc.getSenders();
    } catch {
      return;
    }
    for (const sender of senders) {
      if (sender.track && sender.track.kind === "audio") sender.track.enabled = Boolean(enabled);
    }
  }

  async function ensureMicrophone() {
    if (!mediaDevices?.getUserMedia) {
      throw new VoiceError("MIC_UNAVAILABLE", "This browser cannot use a microphone for calls.");
    }
    let stream;
    try {
      stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      const name = err?.name;
      if (name === "NotAllowedError" || name === "SecurityError") throw new VoiceError("MIC_PERMISSION_DENIED");
      if (name === "NotFoundError" || name === "OverconstrainedError") throw new VoiceError("MIC_NOT_FOUND");
      throw new VoiceError("MIC_UNAVAILABLE");
    }
    // Permission is what we wanted; SIP.js opens its own stream for the call.
    for (const track of stream.getTracks()) track.stop();
  }

  // ── Tones ────────────────────────────────────────────────────────────────

  function context() {
    if (audioCtx) return audioCtx;
    const Ctor = win?.AudioContext || /** @type {any} */ (win)?.webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
    } catch {
      audioCtx = null;
    }
    return audioCtx;
  }

  function tone(freqs, seconds, gainValue) {
    const ctx = context();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume?.().catch?.(() => {});
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainValue, t + 0.02);
    gain.gain.setValueAtTime(gainValue, t + Math.max(0.03, seconds - 0.08));
    gain.gain.linearRampToValueAtTime(0, t + seconds);
    gain.connect(ctx.destination);
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + seconds + 0.05);
    }
  }

  /** US ring cadence on 440+480 Hz, synthesised: no audio file to fail to load. */
  function startRingtone() {
    stopRingtone();
    try {
      tone([440, 480], 1.9, 0.3);
      ringTimer = setRepeat(() => tone([440, 480], 1.9, 0.3), 4000);
    } catch (err) {
      log.warn("Ringtone failed", err?.name || err);
    }
  }

  function stopRingtone() {
    if (ringTimer !== null) {
      clearRepeat(ringTimer);
      ringTimer = null;
    }
  }

  function playDtmfTone(digit) {
    const freqs = DTMF_FREQUENCIES[digit];
    if (!freqs) return;
    try {
      tone(freqs, 0.15, 0.05);
    } catch {
      // feedback only
    }
  }

  /**
   * Browsers keep audio suspended until a user gesture. Resume the tone
   * context and any blocked call audio on the next one, then stop listening.
   */
  const unlockEvents = ["click", "keydown", "pointerdown", "touchstart"];
  function unlock() {
    const ctx = context();
    if (ctx && ctx.state === "suspended") ctx.resume?.().catch?.(() => {});
    if (blocked && audioEl?.srcObject) play();
    removeUnlock();
  }
  function installUnlock() {
    if (unlockInstalled || !win?.addEventListener) return;
    unlockInstalled = true;
    unlockEvents.forEach((e) => win.addEventListener(e, unlock, { passive: true }));
  }
  function removeUnlock() {
    if (!unlockInstalled || !win?.removeEventListener) return;
    unlockInstalled = false;
    unlockEvents.forEach((e) => win.removeEventListener(e, unlock));
  }

  /** Explicit retry for blocked audio, from a button. */
  function resumePlayback() {
    unlock();
    if (audioEl?.srcObject) play();
  }

  function dispose() {
    stopRingtone();
    clearRemoteAudio();
    removeUnlock();
    wired = new WeakSet();
    if (audioEl?.parentNode) audioEl.parentNode.removeChild(audioEl);
    audioEl = null;
    if (audioCtx?.close) audioCtx.close().catch?.(() => {});
    audioCtx = null;
  }

  return {
    ensureAudioElement,
    wireRemoteAudio,
    clearRemoteAudio,
    setSenderAudioEnabled,
    ensureMicrophone,
    startRingtone,
    stopRingtone,
    playDtmfTone,
    installUnlock,
    resumePlayback,
    isPlaybackBlocked: () => blocked,
    dispose,
  };
}
