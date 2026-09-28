import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Loader2, Send, AlertCircle, Volume2, UserRound, RotateCcw, Stethoscope } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { speak as voiceSpeak, playVoiceLocalized } from "@/lib/voiceSynthesis";

const urgencyColors = { low: "#D1FF26", moderate: "#FBBF24", high: "#FB923C", emergency: "#EF4444" };

const VOICE_PROMPT = "What is your main symptom today? Describe it in your own words, then press get general wellness info.";

// Pre-generated natural human-voice audio — generated once, reused on every click (no per-click charge).
const SYMPTOM_PROMPT_AUDIO_URL =
  "https://media.base44.com/files/public/6a422320311efd575ae6536c/dbcd5e76d_speech.mp3";

// Reuse triage results for identical inputs so the same symptom/question isn't re-run (and re-charged).
const triageCache = new Map();

export default function TeleMedicalVoiceFlow() {
  const [symptom, setSymptom] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaThread, setQaThread] = useState([]);

  const speak = (text) => {
    if (!text) return;
    setSpeaking(true);
    voiceSpeak(text, { onEnd: () => setSpeaking(false), onError: () => setSpeaking(false) });
  };

  // Play a natural human-sounding voiceover URL; fall back to browser TTS only if unavailable.
  // When the app language isn't English, the translated fallbackText is spoken instead.
  const playVoice = (url, fallbackText) => {
    setSpeaking(true);
    playVoiceLocalized(url, fallbackText, { onEnd: () => setSpeaking(false), onError: () => setSpeaking(false) });
  };

  const hearPrompt = () => playVoice(SYMPTOM_PROMPT_AUDIO_URL, VOICE_PROMPT);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => setSymptom(e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    try { rec.start(); } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptom.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const cacheKey = symptom.trim().toLowerCase();
      let res = triageCache.get(cacheKey);
      if (!res) {
        res = (await base44.functions.invoke("medical-triage", {
          service_title: "AI Symptom Info",
          input: symptom,
        })).data;
        triageCache.set(cacheKey, res);
        base44.entities.HealthWellnessLog.create({
          entry_type: "symptom",
          symptom: symptom.trim(),
          urgency_level: res?.urgency_level || "",
          possible_conditions: res?.possible_conditions || [],
          recommended_action: res?.recommended_action || "",
          home_remedies: res?.home_remedies || [],
          see_doctor_within: res?.see_doctor_within || "",
        }).catch(() => {});
      }
      setResult(res);
      if (res?.audio_url) playVoice(res.audio_url, res?.recommended_action);
      else if (res?.recommended_action) speak(res.recommended_action);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to retrieve general wellness information right now. Please try again, or consult a licensed healthcare provider."
      );
    }
    setLoading(false);
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUp.trim() || !symptom) return;
    setQaLoading(true);
    const question = followUp.trim();
    setFollowUp("");
    try {
      const cacheKey = `fu:${symptom.trim().toLowerCase()}:${question.toLowerCase()}`;
      let res = triageCache.get(cacheKey);
      if (!res) {
        res = (await base44.functions.invoke("medical-triage", {
          service_title: "AI Symptom Info",
          input: `Main symptom: ${symptom}. Follow-up question: ${question}`,
        })).data;
        triageCache.set(cacheKey, res);
        base44.entities.HealthWellnessLog.create({
          entry_type: "followup",
          symptom: symptom.trim(),
          question: question,
          urgency_level: res?.urgency_level || "",
          possible_conditions: res?.possible_conditions || [],
          recommended_action: res?.recommended_action || "",
          home_remedies: res?.home_remedies || [],
          see_doctor_within: res?.see_doctor_within || "",
        }).catch(() => {});
      }
      setQaThread((t) => [...t, { question, answer: res }]);
      if (res?.audio_url) playVoice(res.audio_url, res?.recommended_action);
      else if (res?.recommended_action) speak(res.recommended_action);
    } catch (err) {
      setQaThread((t) => [...t, { question, answer: null, error: err?.message || "Unable to retrieve information right now." }]);
    }
    setQaLoading(false);
  };

  const reset = () => {
    setSymptom("");
    setResult(null);
    setError("");
    setFollowUp("");
    setQaThread([]);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  return (
    <div className="max-w-3xl mx-auto p-8 mb-12" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Voice-guided prompt */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)" }}>
            <Stethoscope size={20} style={{ color: "#D1FF26" }} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>Voice-Guided Symptom Flow</h3>
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>// GENERAL WELLNESS INFO — NOT A DIAGNOSIS</p>
          </div>
        </div>
        <button
          onClick={hearPrompt}
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.2)]"
          style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          {speaking ? <Loader2 size={13} className="animate-spin" /> : <Volume2 size={13} />}
          HEAR PROMPT
        </button>
      </div>

      <p className="text-sm mb-4" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>
        Tell us your <span style={{ color: "#D1FF26" }}>main symptom</span>. You can speak it aloud or type it — we'll provide general wellness information and suggest seeing a licensed provider.
      </p>

      {/* Quick examples */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["Headache and fever", "Sore throat", "Stomach pain", "Fatigue", "Nausea", "Dizziness"].map((chip) => (
          <button
            key={chip}
            onClick={() => setSymptom(chip)}
            className="px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.1)]"
            style={{
              background: symptom === chip ? "rgba(209,255,38,0.15)" : "rgba(5,7,10,0.6)",
              border: `0.5px solid ${symptom === chip ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
              color: symptom === chip ? "#D1FF26" : "#8A8F98",
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            rows={3}
            placeholder="Describe your main symptom... (e.g. 'sharp headache and mild fever for two days')"
            className="w-full pl-5 pr-12 py-3.5 font-mono text-sm bg-transparent focus:outline-none resize-none"
            style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
          />
          <button
            type="button"
            onClick={startListening}
            className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center transition-all"
            style={{ background: listening ? "rgba(239,68,68,0.15)" : "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}
            aria-label="Speak your symptom"
          >
            <Mic size={14} style={{ color: listening ? "#EF4444" : "#D1FF26" }} className={listening ? "animate-pulse" : ""} />
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || !symptom.trim()}
          className="w-full py-3.5 font-mono text-sm font-bold tracking-widest transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
          {loading ? "GATHERING INFO..." : "GET GENERAL WELLNESS INFO"}
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
          <span className="font-mono text-xs tracking-widest" style={{ color: "#8A8F98" }}>GATHERING GENERAL INFORMATION...</span>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 p-4 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#F5F5F7" }}>
          <div className="flex items-start gap-2">
            <AlertCircle size={16} style={{ color: "#EF4444" }} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-6">
          {/* Urgency */}
          <div className="flex items-center gap-3 p-4" style={{ background: "rgba(209,255,38,0.04)", border: `0.5px solid ${urgencyColors[result.urgency_level] || "#D1FF26"}` }}>
            <AlertCircle size={20} style={{ color: urgencyColors[result.urgency_level] || "#D1FF26" }} />
            <div>
              <span className="font-mono text-[10px] tracking-widest block" style={{ color: "#8A8F98" }}>AI-ESTIMATED URGENCY (NOT A DIAGNOSIS)</span>
              <span className="font-heading font-bold text-lg uppercase" style={{ color: urgencyColors[result.urgency_level] || "#D1FF26" }}>{result.urgency_level}</span>
            </div>
            {result.see_doctor_within && (
              <div className="ml-auto text-right">
                <span className="font-mono text-[10px] tracking-widest block" style={{ color: "#8A8F98" }}>CONSIDER A PROVIDER VISIT</span>
                <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{result.see_doctor_within}</span>
              </div>
            )}
          </div>

          {/* Topics to raise with a clinician */}
          {result.possible_conditions?.length > 0 && (
            <div>
              <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// TOPICS TO RAISE WITH A CLINICIAN</p>
              <div className="flex flex-wrap gap-2">
                {result.possible_conditions.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 font-mono text-xs" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* General guidance */}
          {result.recommended_action && (
            <div>
              <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// GENERAL WELLNESS GUIDANCE (NOT A TREATMENT PLAN)</p>
              <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{result.recommended_action}</p>
            </div>
          )}

          {/* Self-care notes */}
          {result.home_remedies?.length > 0 && (
            <div>
              <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// GENERAL SELF-CARE NOTES</p>
              <ul className="space-y-1">
                {result.home_remedies.map((r, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: "#8A8F98" }}>
                    <span style={{ color: "#D1FF26" }}>•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <p className="font-mono text-[10px] pt-4" style={{ color: "rgba(239,68,68,0.7)", borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
              ⚠ {result.disclaimer}
            </p>
          )}

          {/* See a licensed provider callout */}
          <div className="p-5 flex items-start gap-3" style={{ background: "rgba(209,255,38,0.06)", border: "1px solid rgba(209,255,38,0.4)" }}>
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.12)" }}>
              <UserRound size={20} style={{ color: "#D1FF26" }} />
            </div>
            <div>
              <p className="font-heading font-bold text-sm mb-1" style={{ color: "#D1FF26" }}>See a licensed healthcare provider</p>
              <p className="text-sm" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>
                This is general wellness information, not a diagnosis or treatment. For an actual diagnosis and treatment, please consult a licensed physical healthcare provider near you.
              </p>
              <p className="font-mono text-[10px] tracking-widest mt-2" style={{ color: "#EF4444" }}>
                IN A MEDICAL EMERGENCY: CALL YOUR LOCAL EMERGENCY NUMBER IMMEDIATELY.
              </p>
            </div>
          </div>

          {/* Follow-up Q&A */}
          <div className="pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.15)" }}>
            <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// ASK A FOLLOW-UP QUESTION</p>
            {qaThread.map((qa, i) => (
              <div key={i} className="mb-4 p-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <p className="font-mono text-xs mb-2" style={{ color: "#F5F5F7" }}>Q: {qa.question}</p>
                {qa.error ? (
                  <p className="text-sm" style={{ color: "#EF4444" }}>{qa.error}</p>
                ) : qa.answer ? (
                  <div className="space-y-2">
                    <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{qa.answer.recommended_action}</p>
                    {qa.answer.home_remedies?.length > 0 && (
                      <ul className="space-y-1">
                        {qa.answer.home_remedies.map((r, j) => (
                          <li key={j} className="text-sm flex items-start gap-2" style={{ color: "#8A8F98" }}>
                            <span style={{ color: "#D1FF26" }}>•</span> {r}
                          </li>
                        ))}
                      </ul>
                    )}
                    {qa.answer.disclaimer && <p className="font-mono text-[9px]" style={{ color: "rgba(239,68,68,0.6)" }}>⚠ {qa.answer.disclaimer}</p>}
                  </div>
                ) : null}
              </div>
            ))}
            <form onSubmit={handleFollowUp}>
              <div className="relative mb-2">
                <input
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="Ask about your symptom... (e.g. 'Is this serious?')"
                  className="w-full pl-5 pr-12 py-3 font-mono text-sm bg-transparent focus:outline-none"
                  style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
                <button type="button" onClick={startListening} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }} aria-label="Speak your question">
                  <Mic size={14} style={{ color: listening ? "#EF4444" : "#D1FF26" }} className={listening ? "animate-pulse" : ""} />
                </button>
              </div>
              <button type="submit" disabled={qaLoading || !followUp.trim()} className="w-full py-3 font-mono text-[10px] tracking-widest font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)] disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                {qaLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
                {qaLoading ? "ASKING..." : "ASK QUESTION"}
              </button>
            </form>
            {qaLoading && (
              <div className="flex items-center gap-2 py-3 justify-center">
                <Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>GATHERING INFO...</span>
              </div>
            )}
          </div>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest transition-all hover:bg-[rgba(209,255,38,0.06)]"
            style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
          >
            <RotateCcw size={13} /> START OVER
          </button>
        </motion.div>
      )}
    </div>
  );
}