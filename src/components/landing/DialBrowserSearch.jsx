import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Phone, MessageSquare, Volume2, Send, Loader2, Globe, Check, Sparkles, Mic, MicOff, BookmarkPlus, ShieldAlert, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SuggestedServices from "@/components/dial/SuggestedServices";
import { trackCategoryAccess, hasAccessHistory } from "@/lib/serviceRecommendations";
import { playSuccessChime } from "@/lib/chime";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const EMERGENCY_KEYWORDS = [
  "emergency", "help me", "sos", "distress", "danger", "save me",
  "call 911", "i'm hurt", "bleeding", "unconscious", "can't breathe",
  "heart attack", "stroke", "fire", "assault", "being followed",
  "break in", "break-in", "attacked", "call police", "call ambulance",
  "not breathing", "choking", "severe pain", "car accident", "crash",
  "i need help", "medical emergency", "someone broke", "mugged",
];

export default function DialBrowserSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("audio"); // "audio" | "sms"
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsError, setSmsError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [recommendationKey, setRecommendationKey] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sosAlert, setSosAlert] = useState(null);
  const sectionRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastInputSource = useRef("text");
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Surface suggestions on load if the user has prior search history
  useEffect(() => {
    if (hasAccessHistory()) {
      setShowSuggestions(true);
      setRecommendationKey((k) => k + 1);
    }
  }, []);

  // Set up Web Speech Recognition support detection
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }
        if (finalText) {
          lastInputSource.current = "voice";
          setQuery((prev) => (prev ? prev + " " : "") + finalText.trim());
        } else if (interim) {
          setQuery(interim);
        }
      };

      recognition.onerror = (event) => {
        setListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceError("Microphone access denied. Please allow mic permission to use voice search.");
        } else if (event.error === "no-speech") {
          setVoiceError("No speech detected. Try speaking again.");
        } else {
          setVoiceError("Voice search error. Please try again.");
        }
        setTimeout(() => setVoiceError(null), 4000);
      };

      recognition.onend = () => {
        setListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const toggleVoiceSearch = useCallback(() => {
    setVoiceError(null);
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    // Clear existing query for a fresh voice input
    setQuery("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (err) {
      setVoiceError("Could not start voice search. Try again.");
      setTimeout(() => setVoiceError(null), 3000);
    }
  }, [listening]);

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    // Check for emergency keywords — trigger SOS alert instead of search
    const lowerQuery = query.toLowerCase().trim();
    const isEmergency = EMERGENCY_KEYWORDS.some((kw) => lowerQuery.includes(kw));

    if (isEmergency) {
      setLoading(true);
      setError(null);
      setResult(null);
      setSosAlert(null);

      let location = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
          });
          location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
        } catch { /* location unavailable */ }
      }

      try {
        const res = await base44.functions.invoke("triggerVoiceSos", {
          command_text: query.trim(),
          latitude: location?.latitude,
          longitude: location?.longitude,
          accuracy: location?.accuracy,
        });
        setSosAlert(res.data);
        playSuccessChime();

        try {
          await base44.entities.VoiceCommand.create({
            command_text: query.trim(),
            service_category: "Emergency",
            source: lastInputSource.current,
            intent: "call",
            region: "Emergency",
          });
        } catch { /* non-blocking */ }
      } catch (err) {
        setSosAlert({ error: err.response?.data?.error || err.message || "Failed to send SOS alert" });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSosAlert(null);
    setSmsSent(false);
    setPlaying(false);

    try {
      const res = (await base44.functions.invoke("dial-browser-search", { query: query.trim() })).data;
      setResult(res);
      setSaved(false);
      playSuccessChime();

      // Track the inferred category so the recommendation engine can personalize suggestions
      if (res?.category) {
        trackCategoryAccess(res.category);
        setRecommendationKey((k) => k + 1);
        setShowSuggestions(true);
      }

      // Log the voice/text command for demand analytics
      try {
        await base44.entities.VoiceCommand.create({
          command_text: query.trim(),
          service_category: res?.category || "General",
          source: lastInputSource.current,
          intent: "search",
          region: res?.region || "",
        });
      } catch { /* non-blocking */ }
    } catch (err) {
      setError("Could not complete the search. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveToVault = async () => {
    if (!result?.answer) return;
    try {
      await base44.entities.VoiceInteraction.create({
        title: query.trim().substring(0, 60) || "Dial Browser Search",
        source: "dial_browser",
        query: query.trim(),
        transcript: result.answer,
        pinned: false,
      });
      setSaved(true);
    } catch (err) {
      setError("Could not save to Voice Vault.");
    }
  };

  const playAudio = () => {
    if (!result?.answer) return;
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    speak(result.answer, {
      rate: 0.98,
      pitch: 1.0,
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
    setPlaying(true);
  };

  const sendSms = async (e) => {
    e.preventDefault();
    if (!smsPhone.trim() || !result?.answer) return;
    setSmsSending(true);
    setSmsError(null);
    try {
      await base44.functions.invoke("shareVoiceNoteSms", {
        voice_note_title: query.trim().substring(0, 60) || "Dial Browser Search",
        transcript: result.answer,
        contacts: [{ name: "Dial Browser User", phone: smsPhone.trim() }],
        sender_name: "The Dial Browser",
      });
      setSmsSent(true);
    } catch (err) {
      setSmsError("Could not send SMS. Please try again.");
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="dial-search"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden min-h-[700px]"
      style={{ background: "#05070A" }}
    >
      {/* Background signal lines */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 4s ease-in-out infinite" }} />
        <div className="absolute bottom-1/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.2), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-8 lg:mb-10 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// THE DIAL BROWSER™ SEARCH</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Ask Anything. <span style={{ color: "#D1FF26" }}>Hear the Answer.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            The Dial Browser doubles as a voice-first search engine. Type or speak your query, then listen to the answer streamed over your call — or get it texted to your phone.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={runSearch}
          className="relative mb-4"
        >
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 pointer-events-none" style={{ color: query.trim() ? "#D1FF26" : "#8A8F98" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); lastInputSource.current = "text"; }}
              placeholder="Search the web by voice... e.g. 'weather in Lagos', 'who won the game', 'nearest pharmacy'"
              className="w-full pl-12 pr-32 py-4 font-mono text-sm tracking-wide outline-none transition-all"
              style={{
                background: "#10141D",
                border: query.trim() ? "0.5px solid rgba(209,255,38,0.4)" : "0.5px solid rgba(209,255,38,0.15)",
                color: "#F5F5F7",
                boxShadow: query.trim() ? "0 0 20px rgba(209,255,38,0.08)" : "none",
              }}
            />
            <div className="absolute right-2 flex items-center gap-1">
               <button
                 type="button"
                 onClick={toggleVoiceSearch}
                 title={voiceSupported ? (listening ? "Stop listening" : "Speak your search") : "Voice search not supported in this browser"}
                 className="flex items-center justify-center w-10 h-10 transition-all"
                 style={{
                   background: listening ? "rgba(239,68,68,0.15)" : "transparent",
                   color: listening ? "#ef4444" : voiceSupported ? "#8A8F98" : "rgba(138,143,152,0.3)",
                   cursor: voiceSupported ? "pointer" : "not-allowed",
                   borderRadius: "0",
                 }}
               >
                 {listening ? (
                   <span className="flex items-end gap-0.5 h-4">
                     {[0, 1, 2, 3].map((i) => (
                       <span key={i} className="w-0.5" style={{ background: "#ef4444", animation: `eqBar ${0.5 + i * 0.1}s ease-in-out ${i * 0.08}s infinite`, height: "100%" }} />
                     ))}
                   </span>
                 ) : (
                   <Mic size={16} />
                 )}
               </button>
               <button
                 type="submit"
                 disabled={!query.trim() || loading}
                 className="flex items-center justify-center gap-1.5 px-4 h-10 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                 style={{ background: "#D1FF26", color: "#05070A" }}
               >
                 {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                 <span className="hidden sm:inline">{loading ? "Searching" : "Search"}</span>
               </button>
             </div>
            </div>

            {/* Voice search status */}
            <AnimatePresence>
             {listening && (
               <motion.div
                 initial={{ opacity: 0, y: -8 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -8 }}
                 transition={{ duration: 0.2 }}
                 className="flex items-center gap-2 mt-2 px-1"
               >
                 <span className="font-mono text-[9px] tracking-widest" style={{ color: "#ef4444" }}>● LISTENING… SPEAK NOW</span>
                 <button
                   type="button"
                   onClick={toggleVoiceSearch}
                   className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase ml-auto transition-all"
                   style={{ color: "#8A8F98" }}
                 >
                   <MicOff size={11} /> Stop
                 </button>
               </motion.div>
             )}
            </AnimatePresence>
            {voiceError && (
             <p className="font-mono text-[9px] tracking-widest mt-2 px-1" style={{ color: "#ef4444" }}>⚠ {voiceError}</p>
            )}
            </motion.form>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <span className="font-mono text-[9px] tracking-widest mr-2" style={{ color: "#8A8F98" }}>DELIVER VIA:</span>
          {[
            { id: "audio", label: "Audio Call", icon: Volume2 },
            { id: "sms", label: "SMS Text", icon: MessageSquare },
          ].map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setSmsSent(false); }}
                className="flex items-center gap-2 px-3 py-2 transition-all"
                style={{
                  background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                }}
              >
                <Icon size={13} style={{ color: isActive ? "#D1FF26" : "#8A8F98" }} />
                <span className="font-heading font-semibold text-sm" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>{m.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Result panel */}
        <AnimatePresence mode="wait">
          {!loading && sosAlert && (
            <motion.div
              key="sos"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="p-6"
              style={{ background: "#10141D", border: "0.5px solid rgba(239,68,68,0.5)" }}
            >
              {sosAlert.error ? (
                <div className="text-center">
                  <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: "#ef4444" }} />
                  <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#ef4444" }}>// SOS ALERT FAILED</p>
                  <p className="text-sm mb-4" style={{ color: "#8A8F98" }}>{sosAlert.error}</p>
                  <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>
                    Set up an SOS contact in your dashboard under Emergency contacts.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)" }}
                  >
                    <ShieldAlert size={24} style={{ color: "#ef4444" }} />
                  </motion.div>
                  <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#ef4444" }}>// SOS ALERT SENT</p>
                  <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>
                    Notified {sosAlert.contact_notified}
                  </p>
                  <p className="font-mono text-[9px] mb-4" style={{ color: "#8A8F98" }}>
                    SMS alert sent to {sosAlert.contact_phone}
                  </p>
                  {sosAlert.location && sosAlert.location !== "Location unavailable" ? (
                    <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.7)" }}>Location included in message</p>
                  ) : (
                    <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.7)" }}>Sent without location data</p>
                  )}
                  <a
                    href="tel:911"
                    className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[11px] tracking-widest uppercase transition-all"
                    style={{ background: "#ef4444", color: "#fff" }}
                  >
                    <Phone size={14} /> Call 911
                  </a>
                  <button
                    onClick={() => { setSosAlert(null); setQuery(""); }}
                    className="w-full mt-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
                    style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {!sosAlert && loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="p-8 text-center"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}
            >
              <Phone size={28} className="mx-auto animate-pulse" style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#D1FF26" }}>CONNECTING TO THE DIAL BROWSER™…</p>
              <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>Fetching your answer over the network</p>
            </motion.div>
          )}

          {!sosAlert && !loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="p-8 text-center"
              style={{ background: "#10141D", border: "0.5px solid rgba(239,68,68,0.3)" }}
            >
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>SEARCH FAILED</p>
              <p className="text-sm mt-2" style={{ color: "#8A8F98" }}>{error}</p>
              <button onClick={runSearch} className="mt-4 px-5 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                Retry
              </button>
            </motion.div>
          )}

          {!sosAlert && !loading && !error && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="p-6"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>
                    {result.source_label || "WEB RESULT"}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>Query: "{query}"</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={saveToVault}
                    className="flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]"
                    style={{ background: saved ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                    title="Save to Voice Vault"
                  >
                    {saved ? <Check size={10} /> : <BookmarkPlus size={10} />} {saved ? "Saved" : "Save"}
                  </button>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>FOUND</span>

                </div>
              </div>

              {/* Answer text */}
              <p className="text-base leading-relaxed mb-4" style={{ color: "#F5F5F7" }}>
                {result.answer}
              </p>

              {result.follow_up && (
                <p className="font-mono text-[10px] mb-5" style={{ color: "#8A8F98" }}>💡 {result.follow_up}</p>
              )}

              {/* Delivery actions */}
              {mode === "audio" ? (
                <div className="pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <button
                    onClick={playAudio}
                    className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[11px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.2)]"
                    style={{ background: playing ? "rgba(209,255,38,0.15)" : "#D1FF26", color: "#05070A", border: `0.5px solid ${playing ? "rgba(209,255,38,0.5)" : "#D1FF26"}` }}
                  >
                    {playing ? <><Volume2 size={14} /> Stop Playback</> : <><Volume2 size={14} /> Play Answer Over Call</>}
                  </button>
                  <p className="flex items-center justify-center gap-1.5 mt-3 font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                    <Phone size={10} style={{ color: "#D1FF26" }} /> Or call the 1 Call Away number and ask your question aloud
                  </p>
                </div>
              ) : (
                <div className="pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
                  {!smsSent ? (
                    <form onSubmit={sendSms} className="space-y-2">
                      {smsError && (
                        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {smsError}</p>
                      )}
                      <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// SMS THIS ANSWER</p>
                      <input
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                        placeholder="Your phone number"
                        type="tel"
                        className="w-full px-3 py-3 text-[16px] sm:text-sm"
                        style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                      />
                      <button
                        type="submit"
                        disabled={!smsPhone.trim() || smsSending}
                        className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[11px] tracking-widest uppercase transition-all disabled:opacity-40"
                        style={{ background: "#D1FF26", color: "#05070A" }}
                      >
                        {smsSending ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : <><Send size={13} /> Text Me The Answer</>}
                      </button>
                      <p className="font-mono text-[9px] text-center" style={{ color: "#8A8F98" }}>Or call the 1 Call Away number and say "text me"</p>
                    </form>
                  ) : (
                    <div className="flex flex-col items-center py-4 text-center">
                      <Check size={24} style={{ color: "#D1FF26" }} />
                      <p className="font-mono text-[10px] tracking-widest mt-2" style={{ color: "#D1FF26" }}>ANSWER SENT VIA SMS!</p>
                      <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>Check your phone for the full answer</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {!sosAlert && !loading && !error && !result && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
              style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}
            >
              <Search size={28} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto" }} />
              <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>YOUR ANSWER WILL APPEAR HERE</p>
              <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Ask a question or call the 1 Call Away number to search by voice</p>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {["Weather in Miami", "Nearest coffee shop", "Translate 'hello' to Swahili", "Today's top news"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-3 py-1.5 font-mono text-[10px] tracking-wide transition-all hover:bg-[rgba(209,255,38,0.08)]"
                    style={{ border: "0.5px solid rgba(209,255,38,0.15)", color: "#8A8F98" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Personalized recommendations based on searched categories */}
          {showSuggestions && (
          <SuggestedServices refreshKey={recommendationKey} />
          )}
          </div>
          </section>
          );
          }