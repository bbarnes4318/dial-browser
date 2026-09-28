import React, { useState, useRef } from "react";
import { Mic, Loader2, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage, languages } from "@/lib/LanguageContext";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

// Speak-to-set-language: captures speech, asks the AI to identify the
// language, then speaks the confirmation back in that language BEFORE
// applying it — all in a real, human-recorded voice.
export default function LanguageRecognizer() {
  const { setLang } = useLanguage();
  const [listening, setListening] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const recRef = useRef(null);

  const supported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = () => {
    setError("");
    setResult(null);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition isn't supported here — pick a language from the dropdown.");
      return;
    }
    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = (e) => {
      setListening(false);
      setError(
        e.error === "not-allowed"
          ? "Microphone access denied."
          : "Could not capture speech. Try again."
      );
    };
    rec.onend = () => setListening(false);
    rec.onresult = async (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || "";
      if (!transcript.trim()) {
        setError("Didn't catch that — try speaking again.");
        return;
      }
      setDetecting(true);
      try {
        const res = await base44.functions.invoke("detect-language", { transcript });
        const data = res?.data || res;
        const code = (data?.code || "").toLowerCase();
        if (!code || code === "und") {
          setError("Couldn't identify the language. Try again or pick from the dropdown.");
          return;
        }
        const native = data?.native || languages.find((l) => l.code === code)?.native || code;
        const name = data?.name || code;
        setResult({ code, native, name });
        // AI speaks the confirmation in the detected language, THEN sets it
        stopSpeaking();
        speak(`I heard you speak ${name} — ${native}. Setting your language now.`, {
          lang: code,
          onEnd: () => setLang(code),
        });
      } catch (err) {
        setError(err?.message || "Detection failed. Try again.");
      } finally {
        setDetecting(false);
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setError("Already listening…");
    }
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch (e) {}
    setListening(false);
  };

  return (
    <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Mic size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SPEAK TO SET YOUR LANGUAGE</p>
      </div>
      <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        Tap the mic and say a sentence in your language. Our AI recognizes it and speaks the confirmation back to you — in a real human voice — before applying it.
      </p>
      {!supported && (
        <p className="font-mono text-[9px] mb-3" style={{ color: "#ef4444" }}>
          Speech recognition isn't supported in this browser — use the dropdown above.
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {!listening ? (
          <button
            onClick={start}
            disabled={!supported || detecting}
            className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase disabled:opacity-40"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            {detecting ? <Loader2 size={13} className="animate-spin" /> : <Mic size={13} />}
            {detecting ? "DETECTING…" : "SPEAK YOUR LANGUAGE"}
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase"
            style={{ background: "rgba(239,68,68,0.15)", border: "0.5px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
          >
            <X size={13} /> STOP
          </button>
        )}
        {result && (
          <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: "#D1FF26" }}>
            <Check size={12} /> {result.native} ({result.code})
          </span>
        )}
      </div>
      {error && <p className="mt-2 font-mono text-[9px]" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}