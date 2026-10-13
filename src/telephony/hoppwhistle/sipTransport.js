/**
 * The SIP.js boundary. This is the only module in Dial Browser that imports
 * sip.js; the voice client talks to the small interface returned here, so the
 * rest of the app never touches a UserAgent, a Session or a peer connection,
 * and the client can be tested against a fake stack.
 *
 * SIP.js is used the way Hoppwhistle's own browser phone uses it
 * (apps/web/src/components/phone/phone-provider.tsx):
 *
 *   * REGISTER resolves only when the registrar ACCEPTS it
 *     (`registerAndConfirm`). `Registerer.register()` resolves as soon as the
 *     request is sent, which is how Hoppwhistle once showed agents "connected"
 *     whom FreeSWITCH had never heard of.
 *   * DTMF goes as SIP INFO (application/dtmf-relay), which FreeSWITCH relays
 *     across the bridge; RFC 2833 via the SDH is only the fallback, because
 *     WebRTC often does not negotiate telephone-event and those digits vanish.
 *   * SIP.js's own (deprecated) transport reconnection is OFF. Hoppwhistle set
 *     it to 1000 attempts; the voice client owns one bounded retry budget
 *     instead.
 */

import {
  Invitation,
  Inviter,
  Registerer,
  RegistererState,
  SessionState,
  UserAgent,
} from "sip.js";

import { ICE_GATHERING_TIMEOUT_MS } from "./config.js";

export const REGISTER_TIMEOUT_MS = 15000;

/** A REGISTER the registrar refused, with its status code. */
export class RegistrationRejectedError extends Error {
  constructor(statusCode, reasonPhrase) {
    super(`REGISTER refused: ${statusCode} ${reasonPhrase || ""}`.trim());
    this.name = "RegistrationRejectedError";
    this.statusCode = statusCode;
  }
}

export class RegistrationTimeoutError extends Error {
  constructor() {
    super("REGISTER got no answer from the registrar");
    this.name = "RegistrationTimeoutError";
  }
}

/** REGISTER, and resolve only when the registrar accepts it. The 401 digest challenge is answered inside SIP.js. */
export function registerAndConfirm(registerer, timeoutMs = REGISTER_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new RegistrationTimeoutError()), timeoutMs);
    registerer
      .register({
        requestDelegate: {
          onAccept: () => {
            clearTimeout(timer);
            resolve();
          },
          onReject: (response) => {
            clearTimeout(timer);
            reject(new RegistrationRejectedError(response.message.statusCode, response.message.reasonPhrase));
          },
        },
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const STATE_NAMES = new Map([
  [SessionState.Initial, "initial"],
  [SessionState.Establishing, "establishing"],
  [SessionState.Established, "established"],
  [SessionState.Terminating, "terminating"],
  [SessionState.Terminated, "terminated"],
]);

function headerReader(message) {
  return (name) => {
    if (!message) return undefined;
    try {
      const v = message.getHeader?.(name);
      if (v) return v;
    } catch {
      // fall through
    }
    const headers = message.headers || {};
    const key = Object.keys(headers).find((k) => k.toLowerCase() === String(name).toLowerCase());
    return key ? headers[key]?.[0]?.raw : undefined;
  };
}

/**
 * Wrap a SIP.js Session in the handle the voice client uses.
 * Exported for tests of the wrapper itself; the client never sees a Session.
 */
export function wrapSession(session, { direction, iceServers }) {
  const sdhOptions = () => ({
    constraints: { audio: true, video: false },
    peerConnectionConfiguration: { iceServers },
  });
  const request = session.request;
  const getHeader = headerReader(request);

  return {
    direction,
    get state() {
      return STATE_NAMES.get(session.state) || "terminated";
    },
    getHeader,
    get remoteUser() {
      return session.remoteIdentity?.uri?.user || "";
    },
    get remoteDisplayName() {
      return session.remoteIdentity?.displayName || "";
    },
    /** The SIP Call-ID of this leg: what POST /agent/call/merge matches legs by. */
    get sipCallId() {
      return (getHeader("Call-ID") || request?.callId || session.id || "").trim();
    },
    get peerConnection() {
      return session.sessionDescriptionHandler?.peerConnection || null;
    },
    onStateChange(listener) {
      const fn = (s) => listener(STATE_NAMES.get(s) || "terminated");
      session.stateChange.addListener(fn);
      return () => session.stateChange.removeListener(fn);
    },
    /** Outbound only: send the INVITE. `onProgress` on 180/183, `onReject` with the final status code. */
    /** @param {any} [options] */
    invite({ onProgress, onReject } = {}) {
      return session.invite({
        requestDelegate: {
          onProgress: (response) => onProgress?.(response.message.statusCode),
          onReject: (response) => onReject?.(response.message.statusCode, response.message.reasonPhrase),
        },
      });
    },
    accept() {
      return session.accept({ sessionDescriptionHandlerOptions: sdhOptions() });
    },
    reject(statusCode) {
      return session.reject(statusCode ? { statusCode } : undefined);
    },
    cancel() {
      return session.cancel();
    },
    bye() {
      return session.bye();
    },
    sendDtmf(digit) {
      try {
        session.info({
          requestOptions: {
            body: {
              contentDisposition: "render",
              contentType: "application/dtmf-relay",
              content: `Signal=${digit}\r\nDuration=250`,
            },
          },
        });
        return "info";
      } catch {
        const sdh = session.sessionDescriptionHandler;
        if (sdh?.sendDtmf && sdh.sendDtmf(digit)) return "rtp";
        return null;
      }
    },
    dispose() {
      return session.dispose();
    },
    isInviter: session instanceof Inviter,
    isInvitation: session instanceof Invitation,
  };
}

/**
 * Build the SIP stack for one Hoppwhistle-issued identity.
 *
 * `delegate.onInvite(handle)`  inbound INVITE
 * `delegate.onDisconnect(err)` transport dropped (err set when not deliberate)
 */
/** @param {any} options */
export function createSipStack({ username, password, realm, wsUrl, iceServers, delegate = {} }) {
  const uri = UserAgent.makeURI(`sip:${username}@${realm}`);
  if (!uri) throw new Error("Invalid SIP URI");

  const ua = new UserAgent({
    uri,
    transportOptions: { server: wsUrl },
    authorizationUsername: username,
    authorizationPassword: password,
    reconnectionAttempts: 0,
    logBuiltinEnabled: false,
    sessionDescriptionHandlerFactoryOptions: {
      iceGatheringTimeout: ICE_GATHERING_TIMEOUT_MS,
      peerConnectionConfiguration: { iceServers },
    },
    delegate: {
      onConnect: () => delegate.onConnect?.(),
      onDisconnect: (error) => delegate.onDisconnect?.(error),
      onInvite: (invitation) => delegate.onInvite?.(wrapSession(invitation, { direction: "inbound", iceServers })),
    },
  });
  let registerer = null;

  return {
    async start() {
      await ua.start();
      registerer = new Registerer(ua);
    },
    async register(timeoutMs) {
      if (!registerer) registerer = new Registerer(ua);
      await registerAndConfirm(registerer, timeoutMs);
    },
    async unregister() {
      if (registerer && registerer.state === RegistererState.Registered) {
        await registerer.unregister().catch(() => {});
      }
    },
    isConnected: () => ua.isConnected(),
    isRegistered: () => registerer?.state === RegistererState.Registered,
    reconnect: () => ua.reconnect(),
    async stop() {
      try {
        await registerer?.dispose();
      } catch {
        // ignore
      }
      await ua.stop().catch(() => {});
    },
    /** A not-yet-sent outbound session to `targetUser` at Hoppwhistle's SIP domain. */
    createOutboundSession(targetUser, { extraHeaders = [] } = {}) {
      const target = UserAgent.makeURI(`sip:${targetUser}@${realm}`);
      if (!target) throw new Error("Invalid target URI");
      const inviter = new Inviter(ua, target, {
        extraHeaders,
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });
      return wrapSession(inviter, { direction: "outbound", iceServers });
    },
  };
}
