import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneIncoming, Phone, User, MapPin, Loader2, Shield, Ban, Check, X, Clock, Volume2, Voicemail as VoicemailIcon, Mic, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Simulated contact list — in production this would come from a contacts entity or API
const KNOWN_CONTACTS = [
  { phone: "+15551234567", name: "Sarah Johnson", location: "New York, NY" },
  { phone: "+15552345678", name: "Mike Chen", location: "San Francisco, CA" },
  { phone: "+15553456789", name: "Maria Garcia", location: "Austin, TX" },
  { phone: "+15554567890", name: "James Wilson", location: "Chicago, IL" },
];

// Simulated spam numbers
const SPAM_NUMBERS = ["+18005550100", "+18005550101", "+18005550102"];

function identifyCaller(phone) {
  if (!phone) return { name: "Unknown Caller", location: "Unknown", call_type: "unknown", identified_by: "No caller ID" };

  // Check contacts
  const contact = KNOWN_CONTACTS.find((c) => c.phone === phone);
  if (contact) {
    return { name: contact.name, location: contact.location, call_type: "contact", identified_by: "Your contact list" };
  }

  // Check spam
  if (SPAM_NUMBERS.includes(phone)) {
    return { name: "Spam Likely", location: "Unknown", call_type: "spam", identified_by: "Spam database" };
  }

  // Simulated reverse lookup — derive location from area code
  const areaCode = phone.replace(/\D/g, "").slice(0, 3);
  const areaLocations = {
    "212": "New York, NY",
    "415": "San Francisco, CA",
    "512": "Austin, TX",
    "312": "Chicago, IL",
    "305": "Miami, FL",
    "202": "Washington, DC",
  };
  const location = areaLocations[areaCode] || "Unknown area";
  return {
    name: `Unknown · ${areaCode}`,
    location,
    call_type: "unknown",
    identified_by: "Area code lookup",
  };
}

export default function CallerIdDisplay({ dialCode, receiveCallsEnabled }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [voicemailMode, setVoicemailMode] = useState(null); // the call being sent to voicemail
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [savingVoicemail, setSavingVoicemail] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const loadCalls = useCallback(async () => {
    try {
      const data = await base44.entities.IncomingCall.list("-created_date", 20);
      setCalls(data || []);
    } catch {
      // entity might not have records yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const simulateIncomingCall = async () => {
    setSimulating(true);
    // Pick a random caller from contacts or generate an unknown number
    const useContact = Math.random() > 0.4;
    const caller = useContact
      ? KNOWN_CONTACTS[Math.floor(Math.random() * KNOWN_CONTACTS.length)]
      : { phone: `+1${Math.floor(200 + Math.random() * 700)}${Math.floor(1000000 + Math.random() * 8999999)}` };

    const id = identifyCaller(caller.phone);
    const callData = {
      caller_phone: caller.phone,
      caller_name: id.name,
      recipient_dial_code: dialCode || "*1000#",
      caller_location: id.location,
      call_type: id.call_type,
      status: "ringing",
      identified_by: id.identified_by,
    };

    // Persist the incoming call record
    try {
      await base44.entities.IncomingCall.create(callData);
    } catch {
      // persist failure is non-critical for the demo
    }

    // If receiving is off, send straight to voicemail
    if (!receiveCallsEnabled) {
      setVoicemailMode({ ...callData, id: undefined });
      try {
        const recent = await base44.entities.IncomingCall.filter(
          { caller_phone: caller.phone, status: "ringing" },
          "-created_date",
          1
        );
        if (recent && recent[0]) {
          await base44.entities.IncomingCall.update(recent[0].id, { status: "missed" });
        }
      } catch { /* ignore */ }
      loadCalls();
      setSimulating(false);
      return;
    }

    setIncomingCall(callData);

    // Auto-dismiss after 8 seconds if not answered
    setTimeout(() => {
      setIncomingCall((current) => {
        if (current && current.caller_phone === caller.phone) {
          handleCallAction("missed", caller.phone);
        }
        return null;
      });
    }, 8000);

    setSimulating(false);
  };

  const handleCallAction = async (status, phone) => {
    setIncomingCall(null);
    // Update the most recent call record for this phone
    try {
      const recent = await base44.entities.IncomingCall.filter(
        { caller_phone: phone, status: "ringing" },
        "-created_date",
        1
      );
      if (recent && recent[0]) {
        await base44.entities.IncomingCall.update(recent[0].id, {
          status,
          duration_sec: status === "answered" ? Math.floor(30 + Math.random() * 300) : 0,
        });
      }
    } catch {
      // ignore
    }
    loadCalls();
  };

  // Speak caller ID aloud for accessibility
  const announceCaller = (call) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text = `Incoming call from ${call.caller_name}. ${call.caller_location}. ${call.call_type === "spam" ? "This number is flagged as spam." : ""}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // --- Voicemail recording flow ---
  const sendToVoicemail = async () => {
    if (!incomingCall) return;
    // Mark call as missed (sent to voicemail)
    handleCallAction("missed", incomingCall.caller_phone);
    setVoicemailMode(incomingCall);
  };

  const startVoicemailRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      // mic denied — fall back to text-only voicemail
      setRecording(false);
    }
  };

  const stopVoicemailRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    saveVoicemail();
  };

  const saveVoicemail = async () => {
    if (!voicemailMode) return;
    setSavingVoicemail(true);
    let audioUrl = "";
    let duration = recordSecs;
    let transcript = "";

    // Upload audio if recorded
    if (chunksRef.current.length > 0) {
      try {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voicemail-${Date.now()}.webm`, { type: "audio/webm" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        audioUrl = file_url;
        // Transcribe
        try {
          const result = (await base44.functions.invoke("transcribe-audio", { audio_url: audioUrl })).data;
          transcript = (result?.transcript || "").trim();
        } catch { /* transcription optional */ }
      } catch { /* upload failed — save text-only */ }
    }

    // Save voicemail record
    try {
      await base44.entities.Voicemail.create({
        caller_phone: voicemailMode.caller_phone,
        caller_name: voicemailMode.caller_name,
        recipient_dial_code: voicemailMode.recipient_dial_code,
        audio_url: audioUrl,
        transcript,
        duration_sec: duration,
        call_type: voicemailMode.call_type,
        related_call_id: voicemailMode.id || "",
        listened: false,
        pinned: false,
      });
    } catch { /* ignore */ }

    setSavingVoicemail(false);
    setVoicemailMode(null);
    setRecordSecs(0);
    chunksRef.current = [];
  };

  const skipVoicemail = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setVoicemailMode(null);
    setRecordSecs(0);
    chunksRef.current = [];
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <PhoneIncoming size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CALLER ID — INCOMING CALLS</p>
        {calls.length > 0 && (
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{calls.filter((c) => c.status === "missed").length} MISSED</span>
        )}
      </div>

      {/* Receiving status indicator */}
      {dialCode && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2" style={{ background: receiveCallsEnabled ? "rgba(209,255,38,0.06)" : "rgba(138,143,152,0.06)", border: `0.5px solid ${receiveCallsEnabled ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.15)"}` }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: receiveCallsEnabled ? "#D1FF26" : "#8A8F98", animation: receiveCallsEnabled ? "dotPulse 2s ease-in-out infinite" : "none" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: receiveCallsEnabled ? "#D1FF26" : "#8A8F98" }}>
            {receiveCallsEnabled ? "RECEIVING CALLS — RINGING ENABLED" : "RECEIVING OFF — CALLS GO TO VOICEMAIL"}
          </span>
        </div>
      )}

      {/* Simulate incoming call button */}
      {dialCode && (
        <button
          onClick={simulateIncomingCall}
          disabled={simulating || incomingCall}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
          style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          <PhoneIncoming size={13} /> {simulating ? "Connecting…" : receiveCallsEnabled ? "Simulate Incoming Call" : "Simulate Call (Goes to Voicemail)"}
        </button>
      )}

      {/* Recent calls list */}
      {loading ? (
        <div className="p-6 flex items-center justify-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : calls.length === 0 ? (
        <div className="p-6 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <PhoneIncoming size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO INCOMING CALLS YET</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>When someone dials your number, their caller ID appears here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {calls.slice(0, 8).map((call) => (
            <div key={call.id} className="p-3 flex items-center gap-3" style={{ background: "#10141D", border: `0.5px solid ${call.status === "missed" ? "rgba(239,68,68,0.2)" : "rgba(209,255,38,0.12)"}` }}>
              <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{
                background: call.call_type === "spam" ? "rgba(239,68,68,0.1)" : call.call_type === "contact" ? "rgba(209,255,38,0.08)" : "rgba(138,143,152,0.08)"
              }}>
                {call.call_type === "spam" ? <Ban size={16} style={{ color: "#ef4444" }} /> :
                 call.call_type === "contact" ? <User size={16} style={{ color: "#D1FF26" }} /> :
                 <Phone size={16} style={{ color: "#8A8F98" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm truncate" style={{ color: call.call_type === "spam" ? "#ef4444" : "#F5F5F7" }}>
                  {call.caller_name || "Unknown"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{call.caller_phone}</span>
                  {call.caller_location && call.caller_location !== "Unknown" && (
                    <span className="flex items-center gap-0.5 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                      <MapPin size={8} /> {call.caller_location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{
                  background: call.status === "missed" ? "rgba(239,68,68,0.08)" : call.status === "answered" ? "rgba(209,255,38,0.08)" : "rgba(138,143,152,0.08)",
                  color: call.status === "missed" ? "#ef4444" : call.status === "answered" ? "#D1FF26" : "#8A8F98",
                }}>
                  {call.status?.toUpperCase()}
                </span>
                <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>
                  {new Date(call.created_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incoming call overlay */}
      <AnimatePresence>
        {incomingCall && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              style={{ background: "rgba(5,7,10,0.9)", backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[92] w-[92%] max-w-sm p-8 text-center"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.4)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
            >
              {/* Pulsing avatar */}
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full" style={{ background: incomingCall.call_type === "spam" ? "rgba(239,68,68,0.15)" : "rgba(209,255,38,0.15)", animation: "emergencyPulse 1.5s ease-out infinite" }} />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full" style={{
                  background: incomingCall.call_type === "spam" ? "rgba(239,68,68,0.12)" : "rgba(209,255,38,0.12)",
                  border: `1px solid ${incomingCall.call_type === "spam" ? "rgba(239,68,68,0.5)" : "rgba(209,255,38,0.5)"}`,
                }}>
                  {incomingCall.call_type === "spam" ? <Ban size={32} style={{ color: "#ef4444" }} /> :
                   incomingCall.call_type === "contact" ? <User size={32} style={{ color: "#D1FF26" }} /> :
                   <Phone size={32} style={{ color: "#D1FF26" }} />}
                </div>
              </div>

              <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>INCOMING CALL TO {incomingCall.recipient_dial_code}</p>
              <h2 className="font-heading font-black text-2xl mb-1" style={{ color: incomingCall.call_type === "spam" ? "#ef4444" : "#F5F5F7" }}>
                {incomingCall.caller_name}
              </h2>
              <p className="font-mono text-sm mb-1" style={{ color: "#D1FF26" }}>{incomingCall.caller_phone}</p>

              {incomingCall.caller_location && incomingCall.caller_location !== "Unknown" && (
                <p className="flex items-center justify-center gap-1 text-xs mb-3" style={{ color: "#8A8F98" }}>
                  <MapPin size={11} /> {incomingCall.caller_location}
                </p>
              )}

              {/* Identification source */}
              <p className="flex items-center justify-center gap-1 font-mono text-[8px] tracking-widest mb-4" style={{ color: "rgba(209,255,38,0.6)" }}>
                <Shield size={9} /> ID via {incomingCall.identified_by}
              </p>

              {incomingCall.call_type === "spam" && (
                <div className="p-2 mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#ef4444" }}>⚠ FLAGGED AS SPAM</p>
                </div>
              )}

              {/* Caller ID announcement */}
              <button
                onClick={() => announceCaller(incomingCall)}
                className="flex items-center justify-center gap-1.5 mx-auto mb-4 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
              >
                <Volume2 size={11} /> Announce Caller
              </button>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleCallAction("declined", incomingCall.caller_phone)}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444" }}>
                    <X size={20} style={{ color: "#ef4444" }} />
                  </span>
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>DECLINE</span>
                </button>
                <button
                  onClick={sendToVoicemail}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "1px solid rgba(209,255,38,0.5)" }}>
                    <VoicemailIcon size={20} style={{ color: "#D1FF26" }} />
                  </span>
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>VOICEMAIL</span>
                </button>
                <button
                  onClick={() => handleCallAction("answered", incomingCall.caller_phone)}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", border: "1px solid #D1FF26" }}>
                    <Check size={20} style={{ color: "#05070A" }} />
                  </span>
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>ANSWER</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Voicemail recording overlay */}
      <AnimatePresence>
        {voicemailMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              style={{ background: "rgba(5,7,10,0.9)", backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[92] w-[92%] max-w-sm p-8 text-center"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.4)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <VoicemailIcon size={20} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LEAVING A VOICEMAIL</p>
              </div>

              <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>{voicemailMode.caller_name}</p>
              <p className="font-mono text-xs mb-6" style={{ color: "#8A8F98" }}>{voicemailMode.caller_phone} → {voicemailMode.recipient_dial_code}</p>

              {savingVoicemail ? (
                <div className="py-8">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SAVING & TRANSCRIBING VOICEMAIL…</p>
                </div>
              ) : !recording ? (
                <>
                  <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                    Record a voicemail message as the caller. The recipient will see it in their Voicemail Box with a full transcript.
                  </p>
                  <button
                    onClick={startVoicemailRecording}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    <Mic size={14} /> Start Recording
                  </button>
                  <button
                    onClick={skipVoicemail}
                    className="mt-3 font-mono text-[9px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]"
                    style={{ color: "#8A8F98" }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="relative mx-auto w-20 h-20 mb-4">
                    <div className="absolute inset-0 rounded-full" style={{ background: "rgba(239,68,68,0.15)", animation: "emergencyPulse 1.5s ease-out infinite" }} />
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-full" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)" }}>
                      <Mic size={32} style={{ color: "#ef4444" }} />
                    </div>
                  </div>
                  <p className="font-heading font-black text-3xl mb-4" style={{ color: "#ef4444" }}>{fmtTime(recordSecs)}</p>
                  <div className="flex items-end justify-center gap-0.5 h-8 mb-6">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="w-1" style={{ background: "#ef4444", height: "40%", animation: `eqBar ${0.5 + i * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.08}s` }} />
                    ))}
                  </div>
                  <button
                    onClick={stopVoicemailRecording}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    <Send size={14} /> Save Voicemail
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}