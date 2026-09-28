import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, Check, X, MapPin, ShieldAlert, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function EmergencyAlertButton({ onManageContacts }) {
  const [stage, setStage] = useState("idle"); // idle | locating | confirm | sending | success | error
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const triggerAlert = () => {
    setStage("locating");
    setLocationError(null);
    setLocation(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by this device");
      setStage("confirm");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStage("confirm");
      },
      (err) => {
        setLocationError(err.message || "Location permission denied");
        setStage("confirm");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const sendAlert = async () => {
    setStage("sending");
    setError(null);
    try {
      const response = await base44.functions.invoke("sendEmergencyAlert", {
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
      });
      setResult(response.data);
      setStage("success");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to send alert");
      setStage("error");
    }
  };

  const reset = () => {
    setStage("idle");
    setLocation(null);
    setLocationError(null);
    setResult(null);
    setError(null);
  };

  return (
    <>
      {/* The always-visible alert trigger */}
      {stage === "idle" && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onClick={triggerAlert}
          className="relative w-full flex items-center justify-center gap-3 py-4 font-mono text-xs tracking-widest uppercase font-bold transition-all overflow-hidden"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.5)",
            color: "#ef4444",
          }}
        >
          {/* Pulsing rings */}
          <span className="absolute inset-0 pointer-events-none">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full" style={{ background: "rgba(239,68,68,0.3)", animation: "emergencyPulse 2s ease-out infinite" }} />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full" style={{ background: "rgba(239,68,68,0.2)", animation: "emergencyPulse 2s ease-out infinite 0.6s" }} />
          </span>
          <ShieldAlert size={18} className="relative z-10" />
          <span className="relative z-10">Send Emergency Alert</span>
        </motion.button>
      )}

      {stage === "locating" && (
        <div className="w-full flex items-center justify-center gap-3 py-4 font-mono text-xs tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
          <Loader2 size={16} className="animate-spin" /> Acquiring Location…
        </div>
      )}

      {stage !== "idle" && stage !== "locating" && (
        <div className="w-full flex items-center justify-center gap-3 py-4 font-mono text-xs tracking-widest uppercase" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "#8A8F98" }}>
          <ShieldAlert size={16} style={{ color: "#ef4444" }} /> Emergency Alert System
        </div>
      )}

      {/* Confirm / Sending / Success / Error dialog */}
      <AnimatePresence>
        {stage !== "idle" && stage !== "locating" && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[90]"
              style={{ background: "rgba(5,7,10,0.9)", backdropFilter: "blur(6px)" }}
              onClick={stage === "sending" ? undefined : reset}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[92] w-[92%] max-w-md p-6"
              style={{ background: "#10141D", border: "1px solid rgba(239,68,68,0.4)", boxShadow: "0 24px 60px rgba(0,0,0,0.8)" }}
            >
              {/* Confirm stage */}
              {stage === "confirm" && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} style={{ color: "#ef4444" }} />
                      <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>// CONFIRM EMERGENCY ALERT</p>
                    </div>
                    <button onClick={reset} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                      <X size={16} style={{ color: "#8A8F98" }} />
                    </button>
                  </div>

                  <p className="text-sm mb-4" style={{ color: "#F5F5F7", lineHeight: 1.6 }}>
                    This will send a <span style={{ color: "#ef4444", fontWeight: 600 }}>distress SMS</span> with your location to all active emergency contacts.
                  </p>

                  {/* Location status */}
                  <div className="p-3 mb-5 flex items-start gap-2" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                    <MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: location ? "#D1FF26" : "#ef4444" }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[9px] tracking-widest mb-0.5" style={{ color: "#8A8F98" }}>LAST KNOWN LOCATION</p>
                      {location ? (
                        <>
                          <p className="font-mono text-[10px] break-all" style={{ color: "#D1FF26" }}>
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </p>
                          {location.accuracy && (
                            <p className="font-mono text-[9px] mt-0.5" style={{ color: "rgba(138,143,152,0.7)" }}>±{Math.round(location.accuracy)}m accuracy</p>
                          )}
                          <a
                            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[9px] tracking-widest underline mt-1 inline-block hover:text-[#D1FF26]"
                            style={{ color: "#8A8F98" }}
                          >
                            VIEW ON MAP ↗
                          </a>
                        </>
                      ) : (
                        <p className="font-mono text-[10px]" style={{ color: "#ef4444" }}>
                          {locationError || "Unavailable"} — alert will be sent without location
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={sendAlert}
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                      style={{ background: "#ef4444", color: "#fff" }}
                    >
                      <ShieldAlert size={14} /> Send Distress Signal
                    </button>
                    <button
                      onClick={reset}
                      className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
                      style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Sending stage */}
              {stage === "sending" && (
                <div className="py-8 text-center">
                  <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#ef4444" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#F5F5F7" }}>SENDING DISTRESS SIGNAL…</p>
                  <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>Notifying your emergency contacts</p>
                </div>
              )}

              {/* Success stage */}
              {stage === "success" && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, type: "spring" }}
                    className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                    style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.5)" }}
                  >
                    <Check size={28} style={{ color: "#D1FF26" }} />
                  </motion.div>
                  <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// ALERT SENT</p>
                  <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>
                    {result?.contacts_notified} of {result?.total_contacts} contacts notified
                  </p>
                  {result?.location && result.location !== "Location unavailable" ? (
                    <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.7)" }}>Location included in message</p>
                  ) : (
                    <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.7)" }}>Sent without location data</p>
                  )}

                  {result?.results?.some((r) => !r.success) && (
                    <div className="p-3 mb-4 text-left" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
                      <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#ef4444" }}>FAILED RECIPIENTS:</p>
                      {result.results.filter((r) => !r.success).map((r, i) => (
                        <p key={i} className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>• {r.contact} ({r.phone})</p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={reset}
                    className="w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
                    style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Error stage */}
              {stage === "error" && (
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)" }}>
                    <AlertTriangle size={28} style={{ color: "#ef4444" }} />
                  </div>
                  <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#ef4444" }}>// ALERT FAILED</p>
                  <p className="text-sm mb-4" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{error}</p>
                  {error?.includes("No active emergency contacts") && onManageContacts && (
                    <button
                      onClick={() => { reset(); onManageContacts(); }}
                      className="w-full flex items-center justify-center gap-2 py-3 mb-2 font-mono text-[10px] tracking-widest uppercase transition-all"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      <Users size={14} /> Add Emergency Contacts
                    </button>
                  )}
                  <button
                    onClick={reset}
                    className="w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
                    style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}