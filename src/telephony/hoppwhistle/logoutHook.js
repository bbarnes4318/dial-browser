/**
 * Dial Browser sign-out, as the phone needs to see it.
 *
 * AuthContext.logout() redirects straight away, before any React effect
 * watching the user could run, so the phone is told synchronously instead:
 * the Hoppwhistle session is removed from storage here, whatever else
 * happens, and the mounted voice provider gets the chance to unregister and
 * mark the agent offline.
 */

import { HOPPWHISTLE_AUTH_STORAGE_KEY, safeLocalStorage } from "./auth.js";

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
  try {
    safeLocalStorage()?.removeItem(HOPPWHISTLE_AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
