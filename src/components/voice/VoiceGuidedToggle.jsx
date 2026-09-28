import React from "react";
import { Headphones, Volume2, RotateCcw } from "lucide-react";
import { useVoiceGuided } from "@/lib/VoiceGuidedContext";
import { useLanguage } from "@/lib/LanguageContext";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const DEFAULT_STEPS = [
  "Voice-only guided mode is on. I'll narrate each step in a real, human-recorded voice.",
];

// Speaks an array of steps one after another in the selected language.
function narrateSteps(steps, lang, onDone) {
  let i = 0;
  stopSpeaking();
  const next = () => {
    if (i >= steps.length) {
      onDone?.();
      return;
    }
    const step = steps[i++];
    speak(step, { lang, onEnd: next, onError: next });
  };
  next();
}

// Toggle between the standard interface and a voice-only guided mode.
// When enabled, it walks the user through each step of the current page's
// process using a real, human-recorded voice. Pass page-specific `steps`.
export default function VoiceGuidedToggle({ steps }) {
  const { enabled, toggle } = useVoiceGuided();
  const { lang } = useLanguage();
  const guide = steps && steps.length ? steps : DEFAULT_STEPS;

  const handleToggle = () => {
    const nextEnabled = !enabled;
    toggle();
    if (nextEnabled) {
      narrateSteps(guide, lang);
    } else {
      stopSpeaking();
      speak("Standard interface restored.", { lang });
    }
  };

  const replay = () => narrateSteps(guide, lang);

  return (
    <div
      className="flex items-center justify-between gap-4 p-4"
      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Headphones size={16} style={{ color: "#D1FF26" }} />
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#F5F5F7" }}>VOICE-ONLY GUIDED MODE</p>
          <p className="font-mono text-[9px] mt-0.5 flex items-center gap-1" style={{ color: "#8A8F98" }}>
            <Volume2 size={9} style={{ color: "#D1FF26" }} /> NARRATED IN REAL HUMAN-RECORDED VOICES
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {enabled && (
          <button
            onClick={replay}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
            title="Replay the guided steps"
          >
            <RotateCcw size={11} /> REPLAY
          </button>
        )}
        <button
          onClick={handleToggle}
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle voice-only guided mode"
          className="relative w-12 h-6 transition-colors"
          style={{ background: enabled ? "#D1FF26" : "rgba(138,143,152,0.25)", borderRadius: 999 }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 transition-all"
            style={{
              left: enabled ? "26px" : "2px",
              background: enabled ? "#05070A" : "#F5F5F7",
              borderRadius: 999,
            }}
          />
        </button>
      </div>
    </div>
  );
}