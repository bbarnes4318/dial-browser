/**
 * The React face of the Hoppwhistle voice client.
 *
 *   const voice = useHoppwhistleVoice();
 *   voice.makeCall(number)        voice.answerCall()     voice.hangupCall()
 *   voice.phoneStatus             voice.currentCall      voice.error
 *
 * Mounted once, above the routes, so a call survives navigation and one tab
 * has one phone. Components get state and actions only -- never SIP.js, a
 * peer connection, a token or a URL.
 *
 * Rendering: state changes on call and registration events only. Nothing
 * here ticks per second; the call timer lives inside the call view.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { useAuth } from "@/lib/AuthContext";

import { CallStates, PhoneStatus, toCallViewStatus } from "./callState.js";
import { createVoiceClient } from "./index.js";
import { registerVoiceLogoutHandler } from "./logoutHook.js";

const VoiceContext = createContext(null);

export function HoppwhistleVoiceProvider({ children, client: injectedClient }) {
  const { user } = useAuth();
  const [client] = useState(() => injectedClient || createVoiceClient());
  const state = useSyncExternalStore(
    useCallback((cb) => client.subscribe(cb), [client]),
    () => client.getState(),
  );
  const [surfaceCount, setSurfaceCount] = useState(0);

  useEffect(() => {
    const offLifecycle = client.attachLifecycle();
    const offStorage = client.auth.listenForChanges?.() || (() => {});
    const offLogout = registerVoiceLogoutHandler(() => {
      void client.disconnect({ reason: "logout" });
      client.auth.clear();
    });
    return () => {
      offLifecycle();
      offStorage();
      offLogout();
      void client.dispose();
    };
  }, [client]);

  // The Hoppwhistle session belongs to the Dial Browser user who linked it.
  const userId = user?.id || null;
  useEffect(() => {
    client.auth.bindUser(userId);
    if (!userId) void client.disconnect({ reason: "logout" });
  }, [client, userId]);

  /** Components that render the call (Phone page, home dialer) register here; the dock covers the rest. */
  const registerCallSurface = useCallback(() => {
    setSurfaceCount((n) => n + 1);
    return () => setSurfaceCount((n) => Math.max(0, n - 1));
  }, []);

  const actions = useMemo(
    () => ({
      connect: () => client.connect(),
      disconnect: () => client.disconnect({ reason: "manual" }),
      reconnect: () => client.reconnect(),
      signIn: (email, password) => client.signIn(email, password),
      signOut: () => client.signOut(),
      makeCall: (number, options) => client.makeCall(number, options),
      answerCall: () => client.answerCall(),
      rejectCall: () => client.rejectCall(),
      hangupCall: () => client.hangupCall(),
      toggleMute: () => client.toggleMute(),
      toggleHold: () => client.toggleHold(),
      sendDTMF: (digit) => client.sendDTMF(digit),
      transferCall: (destination, type) => client.transferCall(destination, type),
      addThirdParty: (number) => client.addThirdParty(number),
      mergeCalls: () => client.mergeCalls(),
      setSelectedCallerId: (number) => client.setSelectedCallerId(number),
      setAgentStatus: (status) => client.setAgentStatus(status),
      takeOver: () => client.takeOver(),
      resumeAudio: () => client.resumeAudio(),
      clearError: () => client.clearError(),
      onCallEnded: (fn) => client.onCallEnded(fn),
      registerCallSurface,
    }),
    [client, registerCallSurface],
  );

  const value = useMemo(() => {
    const call = state.currentCall;
    return {
      ...state,
      ...actions,
      isConnecting:
        state.dialing || state.phoneStatus === PhoneStatus.CONNECTING || state.phoneStatus === PhoneStatus.RETRYING,
      incomingCall: call && call.direction === "inbound" && call.state === CallStates.INCOMING ? call : null,
      muted: Boolean(call?.isMuted),
      onHold: Boolean(call?.isOnHold),
      callViewStatus: toCallViewStatus(call),
      hasCallSurface: surfaceCount > 0,
    };
  }, [state, actions, surfaceCount]);

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useHoppwhistleVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useHoppwhistleVoice must be used within a HoppwhistleVoiceProvider");
  return ctx;
}

/** Declare that this component shows the live call, so the global call dock stays out of the way. */
export function useCallSurface() {
  const { registerCallSurface } = useHoppwhistleVoice();
  useEffect(() => registerCallSurface(), [registerCallSurface]);
}
