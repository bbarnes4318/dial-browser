import React, { useState, useRef, useEffect } from "react";
import { Search, Mic, MicOff, Loader2 } from "lucide-react";

/**
 * VoiceSearchBar — a search input with a voice-activation mic button.
 * Uses the browser's SpeechRecognition API to transcribe spoken service
 * names or categories, then feeds the transcript into the parent search
 * state. If the spoken phrase matches a known category label, it also
 * fires onCategoryMatch so the marketplace filter snaps to it.
 */
const RATING_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

// Parse a spoken phrase for a minimum-rating request.
function parseRating(phrase) {
  const lower = phrase.toLowerCase();
  if (/\b(highly rated|top rated|best rated|highest rated)\b/.test(lower)) return 4.5;
  const m = lower.match(/(\d(?:\.\d)?)\s*stars?/);
  if (m) return parseFloat(m[1]);
  for (const [word, val] of Object.entries(RATING_WORDS)) {
    if (new RegExp(`\\b${word}\\s+stars?`).test(lower)) return val;
  }
  return null;
}

// Parse a spoken phrase for a known service type (specialty).
function parseServiceType(phrase, serviceTypes) {
  const lower = phrase.toLowerCase();
  for (const st of serviceTypes) {
    if (!st) continue;
    if (lower.includes(st.toLowerCase())) return st;
  }
  return null;
}

// Strip matched rating + service-type words from the phrase so the
// remaining text becomes the name/keyword search term.
function stripCommands(phrase, rating, serviceType) {
  let out = phrase;
  if (serviceType) out = out.replace(new RegExp(serviceType, "ig"), "");
  out = out
    .replace(/\b(highly rated|top rated|best rated|highest rated)\b/gi, "")
    .replace(/\b\d(?:\.\d)?\s*stars?\b/gi, "")
    .replace(/\b(one|two|three|four|five)\s+stars?\b/gi, "")
    .replace(/\b(show me|find|only|with|at least|minimum|min|filter)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return out;
}

export default function VoiceSearchBar({ value, onChange, onCategoryMatch, onRatingMatch, onServiceTypeMatch, serviceTypes = [], categories = [] }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      const trimmed = transcript.trim();
      if (isFinal) {
        const rating = parseRating(trimmed);
        const sType = parseServiceType(trimmed, serviceTypes);
        if (rating != null && onRatingMatch) onRatingMatch(rating);
        if (sType && onServiceTypeMatch) onServiceTypeMatch(sType);
        const remaining = stripCommands(trimmed, rating, sType);
        onChange(remaining);
      } else {
        onChange(trimmed);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone permission denied");
      } else if (event.error === "no-speech") {
        setError("No speech detected");
      } else {
        setError("Voice search unavailable");
      }
      setTimeout(() => setError(""), 3000);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch { /* already stopped */ }
    };
  }, [onChange]);

  const toggleListening = () => {
    if (!supported || !recognitionRef.current) return;
    setError("");
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    // Clear current search so the user sees fresh voice results
    onChange("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  // Match a spoken phrase to a category label/value
  const checkCategoryMatch = (phrase) => {
    if (!onCategoryMatch || !categories.length) return;
    const lower = phrase.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    for (const cat of categories) {
      if (cat.value === "all") continue;
      const label = cat.label.toLowerCase();
      const value = cat.value.toLowerCase().replace(/_/g, " ");
      if (lower.includes(label) || lower.includes(value)) {
        onCategoryMatch(cat.value);
        return;
      }
    }
  };

  // When listening ends, check the final transcript for a category match
  const handleBlurCheck = () => {
    if (value) checkCategoryMatch(value);
  };

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlurCheck}
        placeholder="Search by name, service, or city — or tap the mic to speak..."
        className="w-full pl-9 pr-12 py-3 text-sm outline-none"
        style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${listening ? "rgba(209,255,38,0.6)" : "rgba(209,255,38,0.2)"}`, color: "#F5F5F7" }}
      />
      {/* Mic button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={!supported}
        aria-label={listening ? "Stop voice search" : "Start voice search"}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 transition-all"
        style={{
          background: listening ? "rgba(209,255,38,0.2)" : "transparent",
          border: `0.5px solid ${listening ? "rgba(209,255,38,0.6)" : "rgba(138,143,152,0.2)"}`,
          color: listening ? "#D1FF26" : supported ? "#8A8F98" : "rgba(138,143,152,0.4)",
          cursor: supported ? "pointer" : "not-allowed",
        }}
      >
        {!supported ? (
          <MicOff size={14} />
        ) : listening ? (
          <>
            <span
              className="absolute inset-0 rounded-full"
              style={{ animation: "emergencyPulse 1.2s ease-out infinite", background: "rgba(209,255,38,0.3)" }}
            />
            <Loader2 size={14} className="animate-spin relative" />
          </>
        ) : (
          <Mic size={14} />
        )}
      </button>
      {/* Listening / error indicator */}
      {(listening || error) && (
        <div className="absolute right-2 -bottom-6 flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap" style={{ color: error ? "#ef4444" : "#D1FF26" }}>
          {error ? error : "● Listening..."}
        </div>
      )}
    </div>
  );
}