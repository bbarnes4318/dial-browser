/**
 * Hoppwhistle voice configuration.
 *
 * Dial Browser is a Hoppwhistle softphone client, so the only thing it needs to
 * know about the telephony platform is where the Hoppwhistle API lives. SIP
 * identities, caller IDs, ICE servers and permissions all come from
 * Hoppwhistle's authenticated endpoints at runtime -- never from here.
 *
 *   VITE_HOPPWHISTLE_API_URL     required. e.g. https://hopwhistle.com
 *   VITE_HOPPWHISTLE_SIP_WS_URL  optional. Only when the SIP WebSocket is not
 *                                at wss://<api host>/ws (see deriveSipWsUrl).
 *
 * Nothing secret belongs in a VITE_ variable: everything here ships to every
 * browser.
 */

/** The carrier waterfall a manual browser softphone call uses in Hoppwhistle. */
export const SOFTPHONE_ROUTE_TYPE = "SOFTPHONE_MANUAL";

/**
 * Fallback STUN servers, the same list Hoppwhistle's own softphone uses. Only
 * applied when Hoppwhistle's credential response carries none.
 */
export const FALLBACK_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * How long answering or dialling waits for ICE gathering before sending SDP.
 * Hoppwhistle measured SIP.js's 5s default leaving agents talking into calls
 * that had not connected yet; host and srflx candidates arrive well inside 1s.
 */
export const ICE_GATHERING_TIMEOUT_MS = 1000;

/** Registration attempts before the phone stops and asks for a manual retry. */
export const MAX_CONNECT_ATTEMPTS = 5;

function readEnv() {
  try {
    // Must stay the literal `import.meta.env`: Vite replaces that exact
    // expression at build time, and any cast around it hides it from Vite.
    // @ts-ignore -- ImportMeta has no `env` without Vite's client types.
    return import.meta.env || {};
  } catch {
    return {};
  }
}

/** The API base with no trailing slash and no trailing /api/v1. */
export function normalizeApiUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  return value.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
}

export function readVoiceConfig(source = readEnv()) {
  const apiUrl = normalizeApiUrl(source.VITE_HOPPWHISTLE_API_URL);
  const sipWsUrlOverride = String(source.VITE_HOPPWHISTLE_SIP_WS_URL || "").trim();
  return {
    apiUrl,
    sipWsUrlOverride,
    enabled: Boolean(apiUrl),
  };
}

/**
 * The SIP-over-WebSocket URL to register on, in order of authority:
 *
 *   1. VITE_HOPPWHISTLE_SIP_WS_URL -- an explicit deployment override;
 *   2. the session's own `sip.wsUrl`, once Hoppwhistle issues one that really
 *      is the SIP socket (the future POST /api/v1/voice/session);
 *   3. wss://<Hoppwhistle API host>/ws -- the path Hoppwhistle's nginx proxies
 *      to FreeSWITCH on 443, which is exactly what Hoppwhistle's own browser
 *      phone connects to (phone-provider.tsx). Port 443 is used rather than
 *      FreeSWITCH's native 7443 because 7443 is filtered on many networks.
 *
 * The legacy GET /agent/webrtc/credentials `wsUrl` is NOT used: it is the
 * Verto endpoint (wss://<ip>:8082), not the SIP socket, and Hoppwhistle's own
 * client ignores it for the same reason.
 */
export function deriveSipWsUrl({ apiUrl, override, sessionWsUrl }) {
  if (override) return override;
  if (sessionWsUrl) return sessionWsUrl;
  if (!apiUrl) return "";
  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch {
    return "";
  }
  if (parsed.protocol === "https:") return `wss://${parsed.host}/ws`;
  return `ws://${parsed.hostname}:8083`;
}
