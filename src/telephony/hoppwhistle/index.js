/**
 * Dial Browser's Hoppwhistle voice integration.
 *
 * UI code imports from here (or from HoppwhistleVoiceProvider.jsx) and never
 * from sipTransport.js: SIP.js stays behind the voice client.
 */

import { base44 } from "@/api/base44Client";

import { createHoppwhistleApi } from "./api.js";
import { MemberVoiceAuth, clearLegacyAuthStorage, safeLocalStorage } from "./auth.js";
import { readVoiceConfig } from "./config.js";
import { createTabCoordinator } from "./tabCoordinator.js";
import { HoppwhistleVoiceClient } from "./voiceClient.js";

/** SIP.js is loaded on first connect, not with every page of the app. */
const loadSipStack = (options) => import("./sipTransport.js").then((m) => m.createSipStack(options));

/** The `hoppwhistle-voice-token` function: { token, expiresAt } for the signed-in member. */
async function exchangeForVoiceToken() {
  const res = await base44.functions.invoke("hoppwhistle-voice-token", {});
  return res?.data ?? res;
}

export function createVoiceClient({ config = readVoiceConfig() } = {}) {
  const storage = safeLocalStorage();
  clearLegacyAuthStorage(storage);
  // Dial Browser's backend vouches for the signed-in member and hands back a
  // voice token; the integration secret never reaches the browser.
  const auth = new MemberVoiceAuth({ exchange: exchangeForVoiceToken });
  // A 401 drops the token; the API client mints one more and tries again.
  const api = createHoppwhistleApi({ apiUrl: config.apiUrl, auth });
  return new HoppwhistleVoiceClient({
    config,
    auth,
    api,
    createSipStack: loadSipStack,
    coordinator: createTabCoordinator({ storage }),
    storage,
  });
}

export { AgentStatus, CallStates, PhoneStatus, toCallViewStatus } from "./callState.js";
export { VoiceErrorCode } from "./errors.js";
export { formatPhoneForDisplay, normalizeDialable } from "./numbers.js";
