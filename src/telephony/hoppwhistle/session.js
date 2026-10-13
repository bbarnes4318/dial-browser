/**
 * Voice-session bootstrap: everything the phone needs from Hoppwhistle before
 * it can register, in one normalized object.
 *
 * Hoppwhistle does not yet have a single bootstrap endpoint, so this composes
 * the two existing, agent-scoped ones Hoppwhistle's own softphone uses:
 *
 *   GET /api/v1/agent/webrtc/credentials   the agent's own SIP identity
 *   GET /api/v1/agent/my-numbers           the caller IDs they may present
 *
 * and returns the shape of the desired POST /api/v1/voice/session response.
 * When that endpoint ships, `fetchVoiceSession` becomes one request and
 * nothing that consumes the session changes.
 */

import { FALLBACK_ICE_SERVERS } from "./config.js";
import { HoppwhistleApiError } from "./api.js";
import { VoiceError } from "./errors.js";

/**
 * What this Dial Browser phone may do on Hoppwhistle today.
 *
 *   transfer   false -- Hoppwhistle has no working transfer: its own
 *              softphone's transferCall is a TODO, and POST
 *              /agent/call/:id/transfer only writes metadata.
 *   conference false -- POST /agent/call/merge acts on any SIP Call-IDs it is
 *              handed with no check that the legs belong to the requesting
 *              agent or tenant. Not exposed to a second application until
 *              Hoppwhistle validates ownership (see the integration doc).
 *   recording  "server" -- Hoppwhistle decides and records server-side.
 */
export const LEGACY_PERMISSIONS = Object.freeze({
  inbound: true,
  outbound: true,
  recording: "server",
  transfer: false,
  conference: false,
});

function toIceServers(creds) {
  const servers = [];
  for (const url of creds?.stunServers || []) {
    if (typeof url === "string" && url) servers.push({ urls: url });
  }
  for (const turn of creds?.turnServers || []) {
    if (!turn) continue;
    if (typeof turn === "string") servers.push({ urls: turn });
    else if (turn.urls) servers.push({ urls: turn.urls, username: turn.username, credential: turn.credential });
  }
  return servers.length ? servers : FALLBACK_ICE_SERVERS;
}

export function normalizeLegacySession(creds, numbersResponse) {
  const rawUser = String(creds?.username || "");
  // Older Hoppwhistle builds returned "1000@<tenant>"; the extension is before the @.
  const [username] = rawUser.split("@");
  if (!username || !creds?.password) {
    throw new VoiceError("CREDENTIALS_UNAVAILABLE", "Hoppwhistle returned incomplete phone credentials.");
  }
  if (!creds.realm) {
    throw new VoiceError("CREDENTIALS_UNAVAILABLE", "Hoppwhistle did not say which SIP domain to use.");
  }
  const numbers = Array.isArray(numbersResponse?.numbers) ? numbersResponse.numbers : [];
  return {
    agent: { extension: username },
    sip: {
      username,
      password: creds.password,
      realm: creds.realm,
      // The legacy `wsUrl` is the Verto endpoint, not the SIP socket.
      wsUrl: null,
      iceServers: toIceServers(creds),
    },
    callerIds: numbers
      .filter((n) => n && n.number)
      .map((n) => ({ id: n.id || n.number, number: n.number, provider: n.provider || null })),
    permissions: { ...LEGACY_PERMISSIONS },
    expiresAt: creds.expiresAt || null,
  };
}

/** Translate a bootstrap refusal into what the phone should say and do. */
export function classifyBootstrapError(err) {
  if (err instanceof VoiceError) return err;
  if (err instanceof HoppwhistleApiError) {
    // A refusal about who this user is: retrying cannot change it.
    if (err.status === 403) return new VoiceError("NO_EXTENSION", undefined, { terminal: true });
    if (err.status === 409) return new VoiceError("NO_AGENCY", undefined, { terminal: true });
    if (err.status === 503) return new VoiceError("CREDENTIALS_UNAVAILABLE", err.message);
  }
  return new VoiceError("SERVER_UNREACHABLE");
}

/**
 * @param {any} api
 * @param {any} [options]
 */
export async function fetchVoiceSession(api, { log } = {}) {
  let creds;
  try {
    creds = await api.getWebRtcCredentials();
  } catch (err) {
    throw classifyBootstrapError(err);
  }
  // Caller IDs are not required to register: an agent with none still dials,
  // and Hoppwhistle presents a pool number for them.
  let numbers = { numbers: [] };
  try {
    numbers = await api.getMyNumbers();
  } catch (err) {
    if (err instanceof VoiceError && err.voice.code === "AUTH_EXPIRED") throw err;
    log?.warn("Could not load caller IDs; Hoppwhistle will choose one per call");
  }
  return normalizeLegacySession(creds, numbers);
}
