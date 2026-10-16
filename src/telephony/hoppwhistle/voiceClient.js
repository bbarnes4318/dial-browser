/**
 * HoppwhistleVoiceClient -- Dial Browser's softphone, as a Hoppwhistle client.
 *
 *   Dial Browser UI
 *        |  (useHoppwhistleVoice)
 *   HoppwhistleVoiceClient  <- this file: call lifecycle, state, retries
 *        |-- HTTPS ------------> Hoppwhistle API (api.js)
 *        `-- SIP.js / WSS ----> Hoppwhistle FreeSWITCH (sipTransport.js)
 *                                    `--> Hoppwhistle carrier waterfalls --> PSTN
 *
 * Hoppwhistle owns the telephony: the SIP identity, caller-ID authorization,
 * call ids and records, routing, recording and presence. This client follows
 * the lifecycle Hoppwhistle's own browser phone implements
 * (apps/web/src/components/phone/phone-provider.tsx) rather than inventing
 * one; where it departs from it, the comment says why.
 *
 * It is plain JavaScript with every collaborator injected, so the whole
 * lifecycle runs under test against a fake SIP stack and a fake API. React
 * sees it through HoppwhistleVoiceProvider; no UI component touches SIP.
 */

import { deriveSipWsUrl, MAX_CONNECT_ATTEMPTS, SOFTPHONE_ROUTE_TYPE } from "./config.js";
import { HoppwhistleApiError } from "./api.js";
import {
  AgentStatus,
  CallStates,
  PhoneStatus,
  createCall,
  durationSeconds,
  inboundCallSid,
  isLive,
  isMonitorInvite,
  knownCallerName,
  sendsAgentAudio,
} from "./callState.js";
import { VoiceError, toVoiceError, voiceError } from "./errors.js";
import { createVoiceLogger, maskNumber } from "./logger.js";
import { createMediaManager } from "./mediaManager.js";
import { normalizeDialable, sameNumber } from "./numbers.js";
import { fetchVoiceSession } from "./session.js";

const CALLER_ID_KEY = "dial-browser.voice.callerId.v1";
const DTMF_RE = /^[0-9*#]$/;
/** A tab hidden this long may have slept through re-REGISTERs; probe on return. */
const SLEEP_PROBE_MS = 60_000;

const INITIAL_STATE = Object.freeze({
  phoneStatus: PhoneStatus.OFFLINE,
  isRegistered: false,
  attempts: 0,
  authRequired: true,
  identity: null,
  agentStatus: AgentStatus.OFFLINE,
  extension: null,
  currentCall: null,
  lastEndedCall: null,
  hasHeldCall: false,
  dialing: false,
  callerIds: [],
  selectedCallerId: null,
  permissions: { inbound: false, outbound: false, recording: "server", transfer: false, conference: false },
  error: null,
  audioBlocked: false,
  otherTab: { active: false, summary: null },
});

export function retryDelayMs(attempt) {
  return Math.min(2000 * 2 ** Math.max(0, attempt - 1), 30_000);
}

function rejectCodeToError(code) {
  if (code === 486 || code === 600) return voiceError("CALL_BUSY");
  if (code === 404 || code === 484 || code === 604) return voiceError("INVALID_NUMBER", "That number could not be reached.");
  if (code === 480 || code === 408) return voiceError("CALL_REJECTED", "No answer.");
  if (code === 487) return null; // our own CANCEL
  if (code === 403 || code === 603) return voiceError("CALL_REJECTED");
  return voiceError("INVITE_FAILED");
}

function originateErrorToVoice(err) {
  if (err instanceof VoiceError) return err.voice;
  if (err instanceof HoppwhistleApiError) {
    if (err.status === 400) return voiceError("INVALID_NUMBER", err.message);
    if (err.status === 403) return voiceError("LICENSE_REFUSED", err.message || undefined);
    if (err.status === 409) return voiceError("NO_AGENCY");
    return voiceError("ORIGINATE_REJECTED", err.message || undefined);
  }
  return voiceError("ORIGINATE_REJECTED");
}

export class HoppwhistleVoiceClient {
  /** @param {any} options */
  constructor({
    config,
    auth,
    api,
    createSipStack,
    media,
    coordinator,
    loadSession = fetchVoiceSession,
    storage = null,
    now = () => Date.now(),
    setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = (id) => clearTimeout(id),
    logger,
  }) {
    this.config = config;
    this.auth = auth;
    this.api = api;
    this.createSipStack = createSipStack;
    this.coordinator = coordinator;
    this.loadSession = loadSession;
    this.storage = storage;
    this.now = now;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.log = {
      sip: logger?.sip || createVoiceLogger("SIP"),
      call: logger?.call || createVoiceLogger("Call"),
      presence: logger?.presence || createVoiceLogger("Presence"),
      auth: logger?.auth || createVoiceLogger("Auth"),
    };
    this.media =
      media ||
      createMediaManager({
        onPlaybackBlocked: () => this.handlePlaybackBlocked(),
        onPlaybackResumed: () => this.handlePlaybackResumed(),
      });

    /** @type {any} */
    this.state = { ...INITIAL_STATE, authRequired: !auth?.isAuthenticated?.(), identity: auth?.getIdentity?.() || null };
    if (!config?.enabled) this.state.phoneStatus = PhoneStatus.DISABLED;
    this.listeners = new Set();
    this.endListeners = new Set();

    this.stack = null;
    this.session = null; // the SIP leg the current call is on
    this.heldSession = null; // the customer, while the agent adds a third party
    this.heldCall = null;
    this.mergedCalls = [];
    this.mergeInFlight = false;
    this.addingParty = false;
    this.pendingDial = null;
    this.desired = false; // the person wants the phone online
    this.generation = 0; // bumped on teardown; stale async work checks it
    this.attempts = 0;
    this.retryTimer = null;
    this.connecting = null;
    this.endInfo = new WeakMap();
    this.reportedAnswered = new Set();
    this.reportedEnded = new Set();
    this.endedCallIds = new Set();
    this.pendingAuthDisconnect = false;
    this.hiddenAt = null;
    this.disposers = [];

    if (auth?.subscribe) this.disposers.push(auth.subscribe(() => this.handleAuthChange()));
    if (coordinator?.subscribe) this.disposers.push(coordinator.subscribe((e) => this.handleTabEvent(e)));
  }

  // ════════════════════════════════════════════════════════════════════════
  // State
  // ════════════════════════════════════════════════════════════════════════

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Called once per ended call with the completed call. */
  onCallEnded(listener) {
    this.endListeners.add(listener);
    return () => this.endListeners.delete(listener);
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    for (const l of [...this.listeners]) {
      try {
        l(this.state);
      } catch (err) {
        this.log.call.error("State listener failed", err);
      }
    }
  }

  updateCall(patch) {
    const call = this.state.currentCall;
    if (!call) return null;
    const next = { ...call, ...patch };
    this.setState({ currentCall: next });
    return next;
  }

  fail(code, message) {
    const error = typeof code === "string" ? voiceError(code, message) : code;
    this.setState({ error });
    return { ok: false, error };
  }

  clearError() {
    this.setState({ error: null });
  }

  hasLiveCall() {
    return isLive(this.state.currentCall) || Boolean(this.heldSession);
  }

  publish() {
    const call = this.state.currentCall;
    this.coordinator?.publish?.({
      phoneStatus: this.state.phoneStatus,
      call: call ? { state: call.state, direction: call.direction, phoneNumber: call.phoneNumber } : null,
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // Connection lifecycle
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Bring the phone online: Hoppwhistle session -> SIP UA -> REGISTER
   * accepted -> presence available. Resolves after the first attempt with
   * whether the phone is registered; failures retry on their own, bounded.
   */
  connect() {
    if (!this.config?.enabled) {
      this.setState({ phoneStatus: PhoneStatus.DISABLED, error: voiceError("NOT_CONFIGURED") });
      return Promise.resolve(false);
    }
    if (!this.auth.isAuthenticated()) {
      this.setState({ authRequired: true, phoneStatus: PhoneStatus.OFFLINE, error: voiceError("AUTH_REQUIRED") });
      return Promise.resolve(false);
    }
    this.desired = true;
    if (this.state.authRequired) this.setState({ authRequired: false, identity: this.auth.getIdentity?.() || null });
    const registered = () => this.state.phoneStatus === PhoneStatus.REGISTERED;
    if (registered() && this.stack) return Promise.resolve(true);
    if (this.connecting) return this.connecting.then(registered);
    if (this.retryTimer !== null) return Promise.resolve(false); // a retry is already scheduled

    if (this.coordinator && !this.coordinator.isOwner() && !this.coordinator.claim()) {
      this.log.sip.info("Another Dial Browser tab owns the phone; standing by");
      this.setState({
        phoneStatus: PhoneStatus.STANDBY,
        isRegistered: false,
        otherTab: { active: true, summary: this.coordinator.remoteSummary?.() || null },
        error: null,
      });
      return Promise.resolve(false);
    }

    this.attempts = 0;
    this.connecting = this.attempt().finally(() => {
      this.connecting = null;
    });
    return this.connecting.then(registered);
  }

  /** "Try again" after the retry budget is spent: a fresh budget. */
  reconnect() {
    this.cancelRetry();
    this.attempts = 0;
    this.setState({ error: null });
    if (this.state.phoneStatus === PhoneStatus.FAILED) this.setState({ phoneStatus: PhoneStatus.OFFLINE });
    return this.connect();
  }

  async attempt() {
    const gen = this.generation;
    const stale = () => gen !== this.generation || !this.desired;
    this.attempts += 1;
    this.setState({
      phoneStatus: this.attempts === 1 ? PhoneStatus.CONNECTING : PhoneStatus.RETRYING,
      attempts: this.attempts,
    });

    // A transport blip mid-call: reconnect the same UA rather than rebuild it,
    // which would tear down the call. (Hoppwhistle's watchdog does the same.)
    if (this.stack && this.hasLiveCall()) {
      const stack = this.stack;
      try {
        if (!stack.isConnected()) await stack.reconnect();
        await stack.register();
        if (stale() || stack !== this.stack) return;
        this.onRegistered();
      } catch (err) {
        if (stale() || stack !== this.stack) return;
        this.log.sip.warn("Mid-call reconnect failed", err?.message || err);
        this.scheduleRetry(voiceError("NETWORK_DISCONNECTED"));
      }
      return;
    }

    let stack = null;
    try {
      const session = await this.loadSession(this.api, { log: this.log.sip });
      if (stale()) return;
      this.applySession(session);

      const wsUrl = deriveSipWsUrl({
        apiUrl: this.config.apiUrl,
        override: this.config.sipWsUrlOverride,
        sessionWsUrl: session.sip.wsUrl,
      });
      if (!wsUrl) throw new VoiceError("NOT_CONFIGURED", undefined, { terminal: true });

      await this.teardownStack();
      if (stale()) return;
      this.log.sip.info(`Registering extension ${session.sip.username} over ${wsUrl}`);
      stack = await this.createSipStack({
        username: session.sip.username,
        password: session.sip.password,
        realm: session.sip.realm,
        wsUrl,
        iceServers: session.sip.iceServers,
        delegate: {
          onInvite: (handle) => this.handleInvite(handle, stack),
          onDisconnect: (error) => this.handleTransportLoss(stack, error),
        },
      });
      if (stale()) throw new Error("stale");
      this.stack = stack;

      try {
        await stack.start();
      } catch {
        throw new VoiceError("TRANSPORT_FAILED");
      }
      if (stale()) throw new Error("stale");

      try {
        await stack.register();
      } catch (err) {
        if (err?.name === "RegistrationRejectedError") {
          throw new VoiceError("REGISTRATION_REJECTED", `The phone server refused this phone (${err.statusCode}).`, {
            terminal: true,
          });
        }
        if (err?.name === "RegistrationTimeoutError") throw new VoiceError("REGISTRATION_TIMEOUT");
        throw new VoiceError("TRANSPORT_FAILED");
      }
      if (stale()) throw new Error("stale");
      this.onRegistered();
    } catch (err) {
      if (stale()) {
        if (stack && stack !== this.stack) await stack.stop().catch(() => {});
        return;
      }
      const detail = toVoiceError(err, "SERVER_UNREACHABLE");
      this.log.sip.warn(`Attempt ${this.attempts} failed: ${detail.code}`);
      if (detail.code === "AUTH_EXPIRED" || detail.code === "AUTH_REQUIRED") {
        this.handleAuthLost();
        return;
      }
      if (detail.terminal) {
        await this.teardownStack();
        this.desired = false;
        this.coordinator?.release?.();
        const disabled = detail.code === "NO_EXTENSION" || detail.code === "NO_AGENCY" || detail.code === "NOT_CONFIGURED";
        this.setState({
          phoneStatus: disabled ? PhoneStatus.DISABLED : PhoneStatus.FAILED,
          isRegistered: false,
          error: detail,
        });
        this.publish();
        return;
      }
      this.scheduleRetry(detail);
    }
  }

  onRegistered() {
    this.attempts = 0;
    this.log.sip.info("Registered (accepted by the registrar)");
    this.setState({
      phoneStatus: PhoneStatus.REGISTERED,
      isRegistered: true,
      attempts: 0,
      error: this.state.error?.code === "AUDIO_PLAYBACK_BLOCKED" ? this.state.error : null,
      authRequired: false,
    });
    this.setPresence(isLive(this.state.currentCall) ? AgentStatus.ON_CALL : AgentStatus.AVAILABLE);
    this.publish();
  }

  applySession(session) {
    const callerIds = session.callerIds || [];
    let selected = this.state.selectedCallerId;
    if (!selected || !callerIds.some((c) => sameNumber(c.number, selected))) {
      const stored = this.readStoredCallerId();
      const match = stored && callerIds.find((c) => sameNumber(c.number, stored));
      selected = match ? match.number : callerIds[0]?.number || null;
    }
    this.setState({
      extension: session.agent?.extension || session.sip.username,
      callerIds,
      selectedCallerId: selected,
      permissions: { ...session.permissions },
    });
  }

  scheduleRetry(cause) {
    this.cancelRetry();
    if (this.attempts >= MAX_CONNECT_ATTEMPTS) {
      this.log.sip.error(`Giving up after ${MAX_CONNECT_ATTEMPTS} attempts`);
      if (!this.hasLiveCall()) void this.teardownStack();
      this.setState({
        phoneStatus: PhoneStatus.FAILED,
        isRegistered: false,
        error: voiceError("CONNECT_EXHAUSTED", undefined, { cause: cause?.code || null }),
      });
      this.publish();
      return;
    }
    const delay = retryDelayMs(this.attempts);
    this.log.sip.warn(`Retrying in ${delay / 1000}s`);
    this.setState({ phoneStatus: PhoneStatus.RETRYING, isRegistered: false, error: cause });
    this.retryTimer = this.setTimer(() => {
      this.retryTimer = null;
      if (!this.desired) return;
      this.connecting = this.attempt().finally(() => {
        this.connecting = null;
      });
    }, delay);
  }

  cancelRetry() {
    if (this.retryTimer !== null) this.clearTimer(this.retryTimer);
    this.retryTimer = null;
  }

  handleTransportLoss(stack, error) {
    if (stack !== this.stack) return;
    this.log.sip.warn("Transport disconnected", error ? error.message || error : "(deliberate)");
    if (!this.desired || !error) return;
    this.setState({ isRegistered: false });
    this.setPresence(AgentStatus.OFFLINE);
    if (this.retryTimer === null && !this.connecting) {
      this.attempts = 0;
      this.scheduleRetry(voiceError("NETWORK_DISCONNECTED"));
    }
  }

  async teardownStack() {
    const stack = this.stack;
    this.stack = null;
    if (!stack) return;
    try {
      await stack.unregister();
    } catch {
      // ignore
    }
    try {
      await stack.stop();
    } catch {
      // ignore
    }
  }

  /**
   * Take the phone offline: end any call, mark the agent offline, unregister,
   * close the transport, release the tab lease. Idempotent.
   */
  async disconnect({ reason = "manual", keepPresence = false } = {}) {
    this.desired = false;
    this.generation += 1;
    this.cancelRetry();
    if (this.pendingDial) this.pendingDial.aborted = true;
    // The customer on hold first, so hanging up the current call cannot bring them back.
    if (this.heldSession) {
      const held = this.heldSession;
      const heldCall = this.heldCall;
      this.heldSession = null;
      this.heldCall = null;
      this.endInfo.set(held, { reason });
      if (held.state === "established") Promise.resolve().then(() => held.bye()).catch(() => {});
      if (heldCall) this.reportEnded({ ...heldCall, endTime: new Date(this.now()) }, reason);
      this.setState({ hasHeldCall: false });
    }
    if (isLive(this.state.currentCall)) this.hangupCall({ reason });
    const wasRegistered = this.state.isRegistered || Boolean(this.stack);
    if (wasRegistered && !keepPresence) this.setPresence(AgentStatus.OFFLINE, { keepalive: true });
    await this.teardownStack();
    this.media.stopRingtone();
    this.media.clearRemoteAudio();
    this.coordinator?.release?.();
    this.setState({
      phoneStatus: this.config?.enabled ? PhoneStatus.OFFLINE : PhoneStatus.DISABLED,
      isRegistered: false,
      attempts: 0,
      dialing: false,
      agentStatus: AgentStatus.OFFLINE,
    });
    this.log.sip.info(`Disconnected (${reason})`);
  }

  async dispose() {
    await this.disconnect({ reason: "dispose" });
    for (const d of this.disposers.splice(0)) {
      try {
        d();
      } catch {
        // ignore
      }
    }
    this.coordinator?.dispose?.();
    this.media.dispose();
    this.listeners.clear();
    this.endListeners.clear();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async signIn(email, password) {
    try {
      const identity = await this.auth.login(email, password);
      this.setState({ authRequired: false, identity: this.auth.getIdentity(), error: null });
      this.log.auth.info("Signed in to Hoppwhistle");
      void this.connect();
      return { ok: true, identity };
    } catch (err) {
      return this.fail(toVoiceError(err, "AUTH_FAILED"));
    }
  }

  async signOut() {
    await this.disconnect({ reason: "sign-out" });
    this.auth.clear();
  }

  handleAuthChange() {
    const authed = this.auth.isAuthenticated();
    this.setState({ authRequired: !authed, identity: authed ? this.auth.getIdentity() : null });
    if (!authed && (this.desired || this.stack)) this.handleAuthLost();
  }

  /** The Hoppwhistle session ended (expired, revoked, signed out elsewhere). */
  handleAuthLost() {
    this.log.auth.warn("Hoppwhistle session ended");
    this.setState({ authRequired: true, error: voiceError("AUTH_EXPIRED") });
    if (this.hasLiveCall()) {
      // SIP does not depend on the API token: let the call finish, then stop.
      this.pendingAuthDisconnect = true;
      return;
    }
    void this.disconnect({ reason: "auth-expired", keepPresence: true });
  }

  // ── Presence ──────────────────────────────────────────────────────────────

  setPresence(status, opts) {
    this.setState({ agentStatus: status });
    this.log.presence.info(`-> ${status}`);
    Promise.resolve()
      .then(() => this.api.setAgentStatus(status, opts))
      .catch((err) => this.log.presence.warn(`Could not sync ${status}`, err?.message || err));
  }

  /** The agent's own choice (away, dnd). Not while a call is up. */
  setAgentStatus(status) {
    if (![AgentStatus.AVAILABLE, AgentStatus.AWAY, AgentStatus.DND].includes(status)) {
      return this.fail("UNSUPPORTED", "That status cannot be set from here.");
    }
    if (isLive(this.state.currentCall)) return this.fail("CALL_IN_PROGRESS");
    if (!this.state.isRegistered) return this.fail("NOT_CONNECTED");
    this.setPresence(status);
    return { ok: true };
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  handleTabEvent(event) {
    switch (event?.type) {
      case "owner-elsewhere":
      case "remote-summary":
        this.setState({ otherTab: { active: true, summary: event.summary ?? this.state.otherTab.summary } });
        break;
      case "owner-gone":
        this.setState({ otherTab: { active: false, summary: null } });
        // The owning tab closed: this one takes the phone if it wanted it.
        if (this.desired && this.state.phoneStatus === PhoneStatus.STANDBY) {
          this.log.sip.info("Owner tab is gone; taking over the phone");
          void this.connect();
        }
        break;
      case "ownership-lost":
        // This tab was frozen past its lease and another took over. That tab
        // is registered now: step down without touching presence.
        this.generation += 1;
        this.cancelRetry();
        void this.teardownStack();
        this.setState({ phoneStatus: PhoneStatus.STANDBY, isRegistered: false, otherTab: { active: true, summary: null } });
        break;
      case "takeover-requested":
        if (!this.hasLiveCall() && !this.state.dialing) {
          this.log.sip.info("Handing the phone to another tab");
          void this.disconnect({ reason: "handover", keepPresence: true });
        }
        break;
      default:
        break;
    }
  }

  /** From a standby tab: ask the owning tab to hand over, and take it when it does. */
  takeOver() {
    this.desired = true;
    this.coordinator?.requestTakeover?.();
  }

  // ════════════════════════════════════════════════════════════════════════
  // Calls
  // ════════════════════════════════════════════════════════════════════════

  bindSession(session) {
    session.onStateChange((s) => {
      if (s === "established") this.handleEstablished(session);
      else if (s === "terminated") this.handleTerminated(session);
    });
  }

  async ensureConnected() {
    if (this.state.phoneStatus === PhoneStatus.REGISTERED && this.stack) return true;
    if (this.state.phoneStatus === PhoneStatus.STANDBY) return false;
    return this.connect();
  }

  /**
   * Place a call through Hoppwhistle.
   *
   *   1. normalize the number (numbers.js -- every dial path comes here);
   *   2. POST /agent/call/originate: Hoppwhistle validates the agent, licensed
   *      state and caller ID, creates the call row, returns its id and the
   *      caller ID it authorized;
   *   3. INVITE FreeSWITCH carrying X-Caller-ID (Hoppwhistle's choice, not
   *      ours), X-Hopwhistle-Call-Id and X-Hopwhistle-Route-Type;
   *   4. FreeSWITCH applies the softphone carrier waterfall.
   *
   * Resolves { ok, callId } or { ok: false, error }; never rejects.
   */
  /**
   * @param {string} number
   * @param {{ callerId?: string }} [options]
   */
  async makeCall(number, { callerId } = {}) {
    const norm = normalizeDialable(number);
    if (!norm.ok) return this.fail("INVALID_NUMBER", norm.error);
    if (!this.state.permissions.outbound && this.state.phoneStatus === PhoneStatus.REGISTERED) {
      return this.fail("UNSUPPORTED", "Outbound calling is not enabled for this Hoppwhistle account.");
    }
    if ((isLive(this.state.currentCall) && !this.addingParty) || this.state.dialing) return this.fail("CALL_IN_PROGRESS");

    if (!(await this.ensureConnected())) {
      if (this.state.phoneStatus === PhoneStatus.STANDBY) return this.fail("OTHER_TAB_OWNS_PHONE");
      return { ok: false, error: this.state.error || this.fail("NOT_CONNECTED").error };
    }

    const requested = callerId ?? this.state.selectedCallerId ?? null;
    if (callerId && this.state.callerIds.length && !this.state.callerIds.some((c) => sameNumber(c.number, callerId))) {
      return this.fail("CALLER_ID_UNAUTHORIZED");
    }

    const gen = this.generation;
    const pending = { aborted: false };
    this.pendingDial = pending;
    this.setState({ dialing: true, error: null });
    const finishDial = () => {
      if (this.pendingDial === pending) this.pendingDial = null;
      this.setState({ dialing: false });
    };

    try {
      await this.media.ensureMicrophone();
    } catch (err) {
      finishDial();
      return this.fail(toVoiceError(err, "MIC_UNAVAILABLE"));
    }
    if (pending.aborted) {
      finishDial();
      return { ok: false, canceled: true };
    }

    let originated;
    try {
      originated = await this.api.originateCall({ phoneNumber: norm.dial, callerId: requested });
    } catch (err) {
      finishDial();
      return this.fail(originateErrorToVoice(err));
    }
    const callId = originated?.callId;
    if (!callId) {
      finishDial();
      return this.fail("ORIGINATE_REJECTED", "Hoppwhistle did not return a call id.");
    }
    const startTime = new Date(this.now());
    const callerIdUsed = originated.callerId || null;

    // Hung up (or the phone went away) while Hoppwhistle was creating the call:
    // close the row it made rather than leave it INITIATED forever.
    if (pending.aborted || gen !== this.generation || !this.stack) {
      finishDial();
      this.reportEnded(
        { callId, direction: "outbound", startTime, answerTime: null },
        pending.aborted ? "agent_canceled" : "phone_disconnected",
      );
      return pending.aborted ? { ok: false, canceled: true } : this.fail("NOT_CONNECTED");
    }

    const extraHeaders = [
      `X-Hopwhistle-Call-Id: ${callId}`,
      // Always sent: absent, Hoppwhistle falls back to SOFTPHONE_MANUAL anyway,
      // but an explicit route type is what the dialplan is written against.
      `X-Hopwhistle-Route-Type: ${SOFTPHONE_ROUTE_TYPE}`,
    ];
    if (callerIdUsed) extraHeaders.unshift(`X-Caller-ID: ${callerIdUsed}`);

    let session;
    try {
      session = this.stack.createOutboundSession(norm.dial, { extraHeaders });
    } catch (err) {
      finishDial();
      this.log.call.error("Could not create the INVITE", err?.message || err);
      this.reportEnded({ callId, direction: "outbound", startTime, answerTime: null }, "invite_failed");
      return this.fail("INVITE_FAILED");
    }

    const call = {
      ...createCall({
        callId,
        direction: "outbound",
        state: CallStates.CONNECTING,
        phoneNumber: norm.e164 || norm.dial,
        callerId: callerIdUsed,
        now: startTime,
      }),
      callerIdSubstituted: Boolean(requested && callerIdUsed && !sameNumber(requested, callerIdUsed)),
    };
    this.session = session;
    this.bindSession(session);
    if (this.pendingDial === pending) this.pendingDial = null;
    this.setState({ currentCall: call, dialing: false, agentStatus: AgentStatus.ON_CALL });
    this.log.call.info(`Dialing ${maskNumber(norm.dial)} as call ${callId}`);
    this.publish();

    session
      .invite({
        onProgress: (code) => {
          if (this.session === session && this.state.currentCall?.state === CallStates.CONNECTING && code >= 180) {
            this.updateCall({ state: CallStates.RINGING });
          }
        },
        onReject: (code) => {
          const error = rejectCodeToError(code);
          this.endInfo.set(session, { reason: code === 487 ? "canceled" : `rejected_${code}`, error });
        },
      })
      .catch((err) => {
        this.log.call.error("INVITE failed", err?.message || err);
        if (this.session === session) this.endCurrentCall("invite_failed", voiceError("INVITE_FAILED"));
      });

    return { ok: true, callId };
  }

  handleInvite(handle, stack) {
    const busy = isLive(this.state.currentCall) || this.heldSession || this.state.dialing || this.session;
    if (stack !== this.stack) {
      handle.reject(480)?.catch?.(() => {});
      return;
    }
    if (isMonitorInvite(handle.getHeader)) {
      // A supervisor listen-in leg. Dial Browser is not a monitoring client;
      // decline it so the supervisor's listen does not open here.
      this.log.call.info("Declining a listen-in leg");
      handle.reject(480)?.catch?.(() => {});
      return;
    }
    if (!this.state.permissions.inbound || busy) {
      handle.reject(486)?.catch?.(() => {});
      return;
    }

    // The id Hoppwhistle's CDR uses for this call (X-Call-Id: fs-<uuid>); the
    // SIP Call-ID only when FreeSWITCH sent none.
    const callId = inboundCallSid(handle.getHeader) || handle.sipCallId || `inbound_${this.now()}`;
    const call = createCall({
      callId,
      direction: "inbound",
      state: CallStates.INCOMING,
      phoneNumber: handle.remoteUser || "Unknown",
      callerName: knownCallerName(handle.remoteDisplayName),
      now: new Date(this.now()),
    });
    this.session = handle;
    this.bindSession(handle);
    this.setState({ currentCall: call, error: null });
    this.media.startRingtone();
    this.log.call.info(`Incoming call ${callId} from ${maskNumber(call.phoneNumber)}`);
    this.publish();
  }

  async answerCall() {
    const call = this.state.currentCall;
    const session = this.session;
    if (!call || !session || call.direction !== "inbound" || call.state !== CallStates.INCOMING) {
      return { ok: false };
    }
    this.media.stopRingtone();
    this.updateCall({ state: CallStates.CONNECTING });
    try {
      await this.media.ensureMicrophone();
    } catch (err) {
      // Still ringing: the person can allow the microphone and answer, or decline.
      if (this.session === session && session.state === "initial") {
        this.updateCall({ state: CallStates.INCOMING });
        this.media.startRingtone();
      }
      return this.fail(toVoiceError(err, "MIC_UNAVAILABLE"));
    }
    if (this.session !== session || session.state !== "initial") return { ok: false };
    try {
      await session.accept();
      this.media.wireRemoteAudio(session.peerConnection);
      return { ok: true };
    } catch (err) {
      this.log.call.error("Answer failed", err?.message || err);
      if (this.session === session) this.endCurrentCall("answer_failed", voiceError("ANSWER_FAILED"));
      return { ok: false, error: this.state.error };
    }
  }

  rejectCall() {
    const call = this.state.currentCall;
    const session = this.session;
    if (!call || !session || call.direction !== "inbound" || call.state !== CallStates.INCOMING) return { ok: false };
    this.endInfo.set(session, { reason: "agent_rejected" });
    Promise.resolve()
      .then(() => session.reject())
      .catch(() => {});
    this.endCurrentCall("agent_rejected", null);
    return { ok: true };
  }

  /** CANCEL while establishing, reject while ringing in, BYE when up. Then reconcile locally. */
  hangupCall({ reason = "agent_hangup" } = {}) {
    const call = this.state.currentCall;
    const session = this.session;
    if (!call && this.pendingDial) {
      this.pendingDial.aborted = true;
      this.setState({ dialing: false });
      return { ok: true };
    }
    if (!call) return { ok: false };
    if (session && call.direction === "inbound" && call.state === CallStates.INCOMING) return this.rejectCall();

    if (session) {
      this.endInfo.set(session, { reason });
      Promise.resolve()
        .then(() => {
          switch (session.state) {
            case "initial":
            case "establishing":
              return session.direction === "outbound" ? session.cancel() : session.reject();
            case "established":
              return session.bye();
            default:
              return undefined;
          }
        })
        .catch((err) => this.log.call.warn("Hangup signalling failed", err?.message || err));
    }
    // Local reconciliation does not wait for SIP: a stuck session must not
    // leave the call on screen.
    this.endCurrentCall(reason, null);
    return { ok: true };
  }

  handleEstablished(session) {
    if (session !== this.session) return;
    const call = this.state.currentCall;
    this.media.wireRemoteAudio(session.peerConnection);
    if (!call || call.answerTime) return;
    this.media.stopRingtone();
    const answered = this.updateCall({
      state: call.isOnHold ? CallStates.HOLD : CallStates.ACTIVE,
      answerTime: new Date(this.now()),
    });
    this.syncAgentAudio();
    this.setPresence(AgentStatus.ON_CALL);
    this.log.call.info(`Call ${answered.callId} established`);
    this.publish();

    if (answered.direction === "outbound" && !this.reportedAnswered.has(answered.callId)) {
      this.reportedAnswered.add(answered.callId);
      this.api
        .reportAnswer(answered.callId)
        .then((res) => {
          if (typeof res?.recordingEnabled === "boolean" && this.state.currentCall?.callId === answered.callId) {
            this.updateCall({ recordingEnabled: res.recordingEnabled });
          }
        })
        .catch((err) => this.log.call.warn("Could not report the answer", err?.message || err));
    }
  }

  handleTerminated(session) {
    if (session === this.heldSession) {
      if (!this.mergeInFlight) this.handleHeldEnded(session);
      return;
    }
    if (session !== this.session) return;
    if (!this.endInfo.has(session) && session.direction === "outbound" && !this.state.currentCall?.answerTime) {
      // SIP.js moves an Inviter to Terminated BEFORE it hands the final response
      // to the invite's onReject delegate (inviter.js), in the same call stack.
      // Let that land, so a 486 ends the call as "busy" and not as no answer.
      Promise.resolve().then(() => this.finishTerminated(session));
      return;
    }
    this.finishTerminated(session);
  }

  finishTerminated(session) {
    if (session !== this.session) return;
    const call = this.state.currentCall;
    const info = this.endInfo.get(session);
    let reason = info?.reason;
    let error = info?.error ?? null;
    if (!reason) {
      if (call?.answerTime) reason = "remote_hangup";
      else if (call?.direction === "inbound") {
        reason = "caller_canceled";
        error = voiceError("CALL_CANCELED");
      } else reason = "not_answered";
    }
    this.endCurrentCall(reason, error);
  }

  /** Idempotent: every path that notices a call ending comes here, and only the first counts. */
  endCurrentCall(reason, error) {
    const call = this.state.currentCall;
    if (!call) {
      this.session = null;
      return;
    }
    if (this.endedCallIds.has(call.callId)) return;
    this.endedCallIds.add(call.callId);

    this.media.stopRingtone();
    const endTime = new Date(this.now());
    const ended = { ...call, state: CallStates.ENDED, endTime, endReason: reason };
    ended.duration = durationSeconds(ended, endTime.getTime());
    this.reportEnded(ended, reason);
    this.log.call.info(`Call ${call.callId} ended (${reason}) after ${ended.duration}s`);

    // The call the agent placed to add someone ended: back to the customer.
    if (this.heldSession && !this.mergeInFlight) {
      const held = this.heldCall;
      this.session = this.heldSession;
      this.heldSession = null;
      this.heldCall = null;
      this.setState({
        currentCall: held ? { ...held, isOnHold: false, state: CallStates.ACTIVE } : null,
        hasHeldCall: false,
        lastEndedCall: ended,
        error: error || this.state.error,
      });
      this.syncAgentAudio();
      this.media.wireRemoteAudio(this.session.peerConnection);
      this.publish();
      return;
    }

    for (const merged of this.mergedCalls.splice(0)) this.reportEnded(merged, reason);
    this.session = null;
    this.media.clearRemoteAudio();
    const keepError = error || (this.state.error?.code === "AUDIO_PLAYBACK_BLOCKED" ? null : this.state.error);
    this.setState({
      currentCall: null,
      lastEndedCall: ended,
      dialing: false,
      audioBlocked: false,
      error: keepError,
    });
    // Not while disconnecting: that writes "offline", and two writes in flight
    // can land in either order.
    if (this.state.isRegistered && this.desired) this.setPresence(AgentStatus.AVAILABLE);
    this.publish();
    for (const l of [...this.endListeners]) {
      try {
        l(ended);
      } catch {
        // ignore
      }
    }
    if (this.pendingAuthDisconnect) {
      this.pendingAuthDisconnect = false;
      void this.disconnect({ reason: "auth-expired", keepPresence: true });
    }
  }

  /**
   * Outbound calls this browser placed are closed in Hoppwhistle by this
   * report; inbound calls are closed by FreeSWITCH's own CDR (as in
   * Hoppwhistle's client). Once per call id, however many paths notice.
   */
  reportEnded(call, endReason) {
    if (call.direction !== "outbound" || this.reportedEnded.has(call.callId)) return;
    this.reportedEnded.add(call.callId);
    const endedAt = call.endTime || new Date(this.now());
    const duration = call.answerTime ? Math.max(0, Math.floor((endedAt.getTime() - call.answerTime.getTime()) / 1000)) : 0;
    this.api
      .reportHangup(
        call.callId,
        {
          duration,
          startedAt: call.startTime?.toISOString?.(),
          answeredAt: call.answerTime?.toISOString?.(),
          endedAt: endedAt.toISOString(),
          endReason,
        },
        { keepalive: true },
      )
      .catch((err) => this.log.call.warn("Could not report the hangup", err?.message || err));
  }

  // ── In-call controls ─────────────────────────────────────────────────────

  syncAgentAudio() {
    this.media.setSenderAudioEnabled(this.session?.peerConnection, sendsAgentAudio(this.state.currentCall));
  }

  toggleMute() {
    const call = this.state.currentCall;
    if (!isLive(call) || call.state === CallStates.INCOMING) return { ok: false };
    this.updateCall({ isMuted: !call.isMuted });
    this.syncAgentAudio();
    return { ok: true, muted: !call.isMuted };
  }

  /**
   * Hold, the way Hoppwhistle's softphone does it: the agent's audio is cut
   * and the call stays up -- no re-INVITE, no music. Kept separate from mute
   * so neither undoes the other.
   */
  toggleHold() {
    const call = this.state.currentCall;
    if (!this.session || this.session.state !== "established" || !isLive(call)) return { ok: false };
    const isOnHold = !call.isOnHold;
    this.updateCall({ isOnHold, state: isOnHold ? CallStates.HOLD : CallStates.ACTIVE });
    this.syncAgentAudio();
    return { ok: true, onHold: isOnHold };
  }

  /** SIP INFO (application/dtmf-relay) first, RFC 2833 as the fallback -- Hoppwhistle's working path. */
  sendDTMF(digit) {
    const d = String(digit ?? "");
    if (!DTMF_RE.test(d)) return { ok: false };
    this.media.playDtmfTone(d);
    const session = this.session;
    if (!session || session.state !== "established") return { ok: false };
    const via = session.sendDtmf(d);
    if (!via) this.log.call.warn("DTMF could not be sent");
    return { ok: Boolean(via), via };
  }

  transferCall() {
    return this.fail(
      "UNSUPPORTED",
      "Call transfer is not available yet: Hoppwhistle does not perform transfers for browser phones.",
    );
  }

  /** Three-way, step 1: hold the customer and dial the person to add. */
  async addThirdParty(number) {
    if (!this.state.permissions.conference) return this.fail("UNSUPPORTED");
    const session = this.session;
    const call = this.state.currentCall;
    if (!session || session.state !== "established" || !isLive(call)) {
      return this.fail("NOT_CONNECTED", "There is no connected call to add someone to.");
    }
    if (this.heldSession) return this.fail("CALL_IN_PROGRESS", "Merge or hang up the call you already added first.");
    if (call.conferenceWith?.length) return this.fail("UNSUPPORTED", "This call already has three people on it.");
    const norm = normalizeDialable(number);
    if (!norm.ok || norm.kind !== "nanp") return this.fail("INVALID_NUMBER", "Enter a 10-digit US phone number.");

    const heldCall = { ...call, isOnHold: true, state: CallStates.HOLD };
    this.media.setSenderAudioEnabled(session.peerConnection, false);
    this.heldSession = session;
    this.heldCall = heldCall;
    this.session = null;
    this.setState({ currentCall: heldCall, hasHeldCall: true });
    this.addingParty = true;
    let result;
    try {
      result = await this.makeCall(norm.dial);
    } finally {
      this.addingParty = false;
    }
    if (!result.ok && this.heldSession === session) {
      // The call never left: put the customer back exactly as they were.
      this.session = session;
      this.heldSession = null;
      this.heldCall = null;
      this.setState({ currentCall: { ...heldCall, isOnHold: false, state: CallStates.ACTIVE }, hasHeldCall: false });
      this.syncAgentAudio();
    }
    return result;
  }

  /** Three-way, step 2: FreeSWITCH joins both legs (POST /agent/call/merge). */
  async mergeCalls() {
    if (!this.state.permissions.conference) return this.fail("UNSUPPORTED");
    const active = this.session;
    const held = this.heldSession;
    const added = this.state.currentCall;
    if (!active || !held) return this.fail("MERGE_FAILED", "Two calls are needed to merge.");
    if (active.state !== "established" || added?.state !== CallStates.ACTIVE) {
      return this.fail("MERGE_FAILED", "Wait for them to answer before merging.");
    }
    const heldCall = this.heldCall;
    this.mergeInFlight = true;
    try {
      await this.api.mergeCalls({ activeCallId: active.sipCallId, heldCallId: held.sipCallId });
      this.heldSession = null;
      this.heldCall = null;
      if (held.state === "established") Promise.resolve().then(() => held.bye()).catch(() => {});
      this.mergedCalls.push(added);
      const base = heldCall || added;
      this.setState({
        currentCall: {
          ...base,
          state: CallStates.ACTIVE,
          isOnHold: false,
          isMuted: added.isMuted,
          conferenceWith: [...(base.conferenceWith || []), added.phoneNumber],
        },
        hasHeldCall: false,
      });
      this.syncAgentAudio();
      return { ok: true };
    } catch (err) {
      const detail = err instanceof HoppwhistleApiError ? voiceError("MERGE_FAILED", err.message) : toVoiceError(err, "MERGE_FAILED");
      return this.fail(detail);
    } finally {
      this.mergeInFlight = false;
      if (this.heldSession === held && held.state === "terminated") this.handleHeldEnded(held);
    }
  }

  handleHeldEnded(session) {
    if (this.heldSession !== session) return;
    const held = this.heldCall;
    this.heldSession = null;
    this.heldCall = null;
    this.setState({ hasHeldCall: false });
    if (held) this.reportEnded({ ...held, endTime: new Date(this.now()) }, "held_party_hangup");
  }

  // ── Caller ID ─────────────────────────────────────────────────────────────

  /**
   * A preference among the numbers Hoppwhistle says this agent owns. The
   * originate request carries it, and Hoppwhistle still decides.
   */
  setSelectedCallerId(number) {
    const match = this.state.callerIds.find((c) => sameNumber(c.number, number));
    if (!match) return this.fail("CALLER_ID_UNAUTHORIZED");
    this.setState({ selectedCallerId: match.number });
    try {
      this.storage?.setItem(CALLER_ID_KEY, match.number);
    } catch {
      // preference only
    }
    return { ok: true };
  }

  readStoredCallerId() {
    try {
      return this.storage?.getItem(CALLER_ID_KEY) || null;
    } catch {
      return null;
    }
  }

  // ── Media / page lifecycle ────────────────────────────────────────────────

  handlePlaybackBlocked() {
    this.setState({ audioBlocked: true, error: voiceError("AUDIO_PLAYBACK_BLOCKED") });
  }

  handlePlaybackResumed() {
    this.setState({
      audioBlocked: false,
      error: this.state.error?.code === "AUDIO_PLAYBACK_BLOCKED" ? null : this.state.error,
    });
  }

  resumeAudio() {
    this.media.resumePlayback();
  }

  /**
   * Network and visibility events instead of a polling watchdog: the browser
   * says when the network returns or the tab wakes, and that is when a
   * registration can have gone stale.
   */
  attachLifecycle(win = typeof window !== "undefined" ? window : null, doc = typeof document !== "undefined" ? document : null) {
    if (!win?.addEventListener) return () => {};
    const onOnline = () => {
      if (!this.desired) return;
      if ([PhoneStatus.RETRYING, PhoneStatus.FAILED].includes(this.state.phoneStatus)) {
        this.log.sip.info("Network is back; reconnecting");
        void this.reconnect();
      }
    };
    const onVisible = () => {
      if (doc && doc.visibilityState === "hidden") {
        this.hiddenAt = this.now();
        return;
      }
      const sleptLong = this.hiddenAt !== null && this.now() - this.hiddenAt > SLEEP_PROBE_MS;
      this.hiddenAt = null;
      void this.healthCheck({ probe: sleptLong });
    };
    const onPageHide = () => {
      // The tab is going away and the call with it. Close the call row and the
      // presence while a keepalive request can still leave.
      const call = this.state.currentCall;
      if (call && isLive(call)) this.reportEnded({ ...call, endTime: new Date(this.now()) }, "page_closed");
      if (this.state.isRegistered) {
        this.api.setAgentStatus(AgentStatus.OFFLINE, { keepalive: true }).catch(() => {});
        // REGISTER Expires: 0 is queued on the still-open socket, so FreeSWITCH
        // drops this contact now instead of ringing a closed tab until expiry.
        this.stack?.unregister().catch(() => {});
      }
    };
    win.addEventListener("online", onOnline);
    win.addEventListener("pagehide", onPageHide);
    doc?.addEventListener?.("visibilitychange", onVisible);
    const off = () => {
      win.removeEventListener("online", onOnline);
      win.removeEventListener("pagehide", onPageHide);
      doc?.removeEventListener?.("visibilitychange", onVisible);
    };
    this.disposers.push(off);
    return off;
  }

  async healthCheck({ probe = false } = {}) {
    const stack = this.stack;
    if (!this.desired || !stack || this.state.phoneStatus !== PhoneStatus.REGISTERED) return;
    const healthy = stack.isConnected() && stack.isRegistered();
    if (healthy && !probe) return;
    try {
      if (!stack.isConnected()) throw new Error("transport down");
      // A REGISTER doubles as a liveness probe for a half-open socket after sleep.
      await stack.register();
      if (stack === this.stack) this.setState({ isRegistered: true });
    } catch {
      if (stack !== this.stack) return;
      this.log.sip.warn("Registration went stale; recovering");
      this.setState({ isRegistered: false });
      this.attempts = 0;
      this.scheduleRetry(voiceError("NETWORK_DISCONNECTED"));
    }
  }
}
