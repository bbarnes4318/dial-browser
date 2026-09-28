import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, Check, X, RotateCcw, Award, AlertCircle, Target, ChevronRight, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SERVICE_GUIDES } from "@/pages/VoiceInstructionGuide";

function ScoreBadge({ score }) {
  const color = score >= 80 ? "#D1FF26" : score >= 50 ? "#FBBF24" : "#ef4444";
  return (
    <div
      className="relative w-20 h-20 flex items-center justify-center flex-shrink-0"
      style={{ border: `2px solid ${color}`, borderRadius: "50%", boxShadow: score >= 80 ? `0 0 24px ${color}40` : "none" }}
    >
      <span className="font-heading font-black text-2xl" style={{ color }}>{score}</span>
      <span className="absolute -bottom-4 font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>CLARITY</span>
    </div>
  );
}

export default function VoiceTrainingMode() {
  const [selectedServiceId, setSelectedServiceId] = useState("grocery");
  const [practicePhrase, setPracticePhrase] = useState(null);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

  const service = SERVICE_GUIDES.find((s) => s.id === selectedServiceId);
  const phrases = service?.commands || [];

  const startListening = (phrase, index) => {
    setPracticePhrase(phrase);
    setPracticeIndex(index);
    setTranscript("");
    setFeedback(null);
    setError("");
    finalTranscriptRef.current = "";

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    let hadError = false;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      const text = final || interim;
      setTranscript(text);
      if (final) finalTranscriptRef.current = final;
    };

    recognition.onerror = (event) => {
      hadError = true;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access denied. Please allow microphone permissions in your browser.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Try speaking louder and closer to your microphone.");
      } else if (event.error !== "aborted") {
        setError(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        analyzePhrase(finalText, phrase);
      } else if (!hadError) {
        setError("No speech detected. Try speaking louder and closer to your microphone.");
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start microphone. Please try again.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const analyzePhrase = async (spoken, target) => {
    setAnalyzing(true);
    const clean = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    const spokenWords = clean(spoken);
    const targetWords = clean(target);
    const matched = targetWords.filter((w) => spokenWords.includes(w)).length;
    const accuracy = Math.round((matched / targetWords.length) * 100);

    try {
      const llmRes = (await base44.functions.invoke("voice-coaching", {
        target,
        spoken,
        accuracy,
      })).data;
      setFeedback({
        spoken,
        accuracy,
        score: llmRes.score ?? accuracy,
        feedback: llmRes.feedback || "",
        tip: llmRes.tip || "",
        passed: llmRes.passed ?? accuracy >= 70,
      });
    } catch {
      setFeedback({
        spoken,
        accuracy,
        score: accuracy,
        feedback: accuracy >= 80
          ? "Great job! Your pronunciation was clear and easy to understand."
          : "Almost there! Try speaking a bit slower and enunciating each word.",
        tip: accuracy >= 80 ? "" : "Focus on pronouncing each word distinctly.",
        passed: accuracy >= 70,
      });
    }
    setAnalyzing(false);
  };

  const tryAgain = () => {
    if (practicePhrase) startListening(practicePhrase, practiceIndex);
  };

  const nextPhrase = () => {
    const nextIdx = (practiceIndex + 1) % phrases.length;
    setPracticeIndex(nextIdx);
    setPracticePhrase(null);
    setFeedback(null);
    setTranscript("");
    setError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-8 p-5 lg:p-6"
      style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.25)", boxShadow: "0 0 30px rgba(209,255,38,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div style={{ animation: "phosphorPulse 2.5s ease-in-out infinite" }}>
          <Target size={15} style={{ color: "#D1FF26" }} />
        </div>
        <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// INTERACTIVE TRAINING MODE</p>
      </div>
      <h2 className="font-heading font-black text-2xl lg:text-3xl mb-2" style={{ color: "#F5F5F7" }}>
        Practice <span style={{ color: "#D1FF26" }}>Out Loud</span>
      </h2>
      <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Select a phrase, speak it into your mic, and get instant feedback on your pronunciation and clarity. Train your voice to work perfectly with the Dial Browser.
      </p>

      {/* Service selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {SERVICE_GUIDES.map((svc) => {
          const isActive = selectedServiceId === svc.id;
          const Icon = svc.icon;
          return (
            <button
              key={svc.id}
              onClick={() => { setSelectedServiceId(svc.id); setPracticePhrase(null); setFeedback(null); setError(""); }}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase whitespace-nowrap transition-all"
              style={{
                background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                color: isActive ? "#D1FF26" : "#8A8F98",
              }}
            >
              <Icon size={10} style={{ color: isActive ? "#D1FF26" : svc.color }} /> {svc.name}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Practice panel */}
      {practicePhrase ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={practicePhrase + practiceIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 lg:p-5"
            style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}
          >
            {/* Target phrase */}
            <div className="text-center mb-5">
              <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SAY THIS PHRASE:</p>
              <p className="font-heading font-bold text-lg lg:text-xl" style={{ color: "#D1FF26" }}>"{practicePhrase.phrase}"</p>
              <p className="text-xs mt-2" style={{ color: "#8A8F98" }}>{practicePhrase.result}</p>
            </div>

            {/* Mic button / transcript / feedback */}
            {analyzing ? (
              <div className="flex flex-col items-center py-6">
                <Loader2 size={28} className="animate-spin mb-3" style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ANALYZING YOUR PRONUNCIATION...</p>
              </div>
            ) : feedback ? (
              <div>
                <div className="flex items-start gap-5 mb-4">
                  <ScoreBadge score={feedback.score} />
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      {feedback.passed ? (
                        <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                          <Check size={10} /> PASSED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                          <X size={10} /> TRY AGAIN
                        </span>
                      )}
                      <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{feedback.accuracy}% word match</span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{feedback.feedback}</p>
                    {feedback.tip && (
                      <div className="flex items-start gap-2 p-2.5 mt-2" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                        <Volume2 size={11} style={{ color: "#D1FF26", flexShrink: 0, marginTop: 1 }} />
                        <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{feedback.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* What you said */}
                <div className="mb-4 p-3" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>YOU SAID:</p>
                  <p className="text-sm italic" style={{ color: "#F5F5F7" }}>"{feedback.spoken}"</p>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={tryAgain} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                    <RotateCcw size={12} /> Try Again
                  </button>
                  <button onClick={nextPhrase} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.2)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                    Next Phrase <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Live transcript */}
                {transcript && (
                  <div className="w-full mb-4 p-3 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>HEARING:</p>
                    <p className="text-sm" style={{ color: "#F5F5F7" }}>"{transcript}"</p>
                  </div>
                )}
                {/* Mic / Stop button */}
                <button
                  onClick={listening ? stopListening : () => startListening(practicePhrase, practiceIndex)}
                  className="flex items-center gap-2 px-8 py-4 font-mono text-[10px] tracking-widest uppercase transition-all"
                  style={{
                    background: listening ? "rgba(239,68,68,0.15)" : "#D1FF26",
                    color: listening ? "#ef4444" : "#05070A",
                    border: listening ? "0.5px solid rgba(239,68,68,0.4)" : "none",
                    boxShadow: listening ? "0 0 20px rgba(239,68,68,0.2)" : "0 0 20px rgba(209,255,38,0.15)",
                  }}
                >
                  {listening ? <Square size={14} fill="#ef4444" /> : <Mic size={14} />}
                  {listening ? "Stop & Analyze" : "Start Speaking"}
                </button>
                {listening && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
                    <p className="font-mono text-[8px] tracking-widest" style={{ color: "#ef4444" }}>LISTENING — Speak the phrase now</p>
                  </div>
                )}
                {!listening && !transcript && (
                  <p className="font-mono text-[8px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>Click the mic and say the phrase clearly</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Phrase list */
        <div className="space-y-2">
          {phrases.map((cmd, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="group p-3 flex items-center gap-3 transition-all"
              style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}
            >
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>"{cmd.phrase}"</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#8A8F98" }}>{cmd.result}</p>
              </div>
              <button
                onClick={() => startListening(cmd, i)}
                className="flex items-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.3)] flex-shrink-0"
                style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              >
                <Mic size={11} /> Practice
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}