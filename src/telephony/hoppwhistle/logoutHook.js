/**
 * Dial Browser sign-out, as the phone needs to see it.
 *
 * AuthContext.logout() redirects straight away, before any React effect
 * watching the user could run, so the phone is told synchronously instead:
 * the mounted voice provider drops the member's voice token (held in memory
 * only), unregisters and marks the line offline, and any session left in
 * storage by the old agent-login build is removed, whatever else happens.
 */

import { clearLegacyAuthStorage } from "./auth.js";

const handlers = new Set();

export function registerVoiceLogoutHandler(fn) {
  handlers.add(fn);
  return () => handlers.delete(fn);
}

export function endVoiceSessionOnLogout() {
  for (const fn of [...handlers]) {
    try {
      fn();
    } catch {
      // sign-out must not fail because the phone did
    }
  }
  clearLegacyAuthStorage();
}
