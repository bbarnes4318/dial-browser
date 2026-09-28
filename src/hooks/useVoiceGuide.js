import { useState, useEffect, useCallback } from "react";
import { speak as speakNatural, stopSpeaking } from "@/lib/voiceSynthesis";

export function useVoiceGuide(instructions) {
  const [enabled, setEnabled] = useState(false);

  const speak = useCallback((text) => {
    speakNatural(text, { rate: 0.92, pitch: 1.0 });
  }, []);

  const stop = useCallback(() => {
    stopSpeaking();
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) stop();
      return next;
    });
  }, [stop]);

  useEffect(() => {
    if (enabled && instructions) {
      const timer = setTimeout(() => speak(instructions), 300);
      return () => clearTimeout(timer);
    }
  }, [enabled, instructions, speak]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  return { enabled, toggle, speak, stop };
}