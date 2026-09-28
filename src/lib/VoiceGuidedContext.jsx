import React, { createContext, useContext, useState, useEffect } from "react";

// Global voice-only guided mode — when enabled, service pages narrate their
// content in a real human-recorded voice instead of relying on the visual UI.
const VoiceGuidedContext = createContext();

export function VoiceGuidedProvider({ children }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("voice_guided") === "true";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("voice_guided", String(enabled));
    } catch (e) {}
  }, [enabled]);

  const toggle = () => setEnabled((e) => !e);

  return (
    <VoiceGuidedContext.Provider value={{ enabled, setEnabled, toggle }}>
      {children}
    </VoiceGuidedContext.Provider>
  );
}

export function useVoiceGuided() {
  return useContext(VoiceGuidedContext);
}