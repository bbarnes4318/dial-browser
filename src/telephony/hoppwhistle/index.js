/**
 * Dial Browser's Hoppwhistle voice integration.
 *
 * UI code imports from here (or from HoppwhistleVoiceProvider.jsx) and never
 * from sipTransport.js: SIP.js stays behind the voice client.
 */

import { createHoppwhistleApi } from "./api.js";
import { HoppwhistleAuth, safeLocalStorage } from "./auth.js";
import { readVoiceConfig } from "./config.js";
import { createTabCoordinator } from "./tabCoordinator.js";
import { HoppwhistleVoiceClient } from "./voiceClient.js";

/** SIP.js is loaded on first connect, not with every page of the app. */
const loadSipStack = (options) => import("./sipTransport.js").then((m) => m.createSipStack(options));

export function createVoiceClient({ config = readVoiceConfig() } = {}) {
  const storage = safeLocalStorage();
  const auth = new HoppwhistleAuth({ apiUrl: config.apiUrl, storage });
  // A 401 invalidates the auth adapter, whose change notification is what
  // tells the client the session has ended.
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
