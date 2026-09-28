import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, PhoneCall } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BookingVoiceConfirmation from "@/components/marketplace/BookingVoiceConfirmation";

const TIME_PREFERENCES = [
  { value: "asap", label: "ASAP" }, { value: "morning", label: "AM" },
  { value: "afternoon", label: "PM" }, { value: "evening", label: "EVE" },
  { value: "flexible", label: "FLEX" },
];

export default function CallbackRequestModal({ open, onClose, listing }) {
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("");
  const [preferredTime, setPreferredTime] = useState("flexible");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!callerName.trim() || !callerPhone.trim() || !serviceNeeded.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await base44.entities.CallbackRequest.create({
        listing_id: listing.id,
        provider_name: listing.provider_name,
        caller_name: callerName.trim(),
        caller_phone: callerPhone.trim(),
        service_needed: serviceNeeded.trim(),
        preferred_time: preferredTime,
        notes: notes.trim() || undefined,
        status: "requested",
      });
      setSubmitted(true);
    } catch {
      setError("Could not submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setCallerName(""); setCallerPhone(""); setServiceNeeded(""); setNotes("");
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100]" style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }} onClick={handleClose} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md pointer-events-auto overflow-hidden" style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }} onClick={(e) => e.stopPropagation()}>
              <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 z-10"><X size={16} style={{ color: "#8A8F98" }} /></button>

              {submitted ? (
                <BookingVoiceConfirmation
                  providerName={listing.provider_name}
                  callerPhone={callerPhone}
                  serviceNeeded={serviceNeeded}
                  preferredTime={preferredTime}
                  onClose={handleClose}
                />
              ) : (
                <>
                  <div className="p-6 pb-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-12 h-12 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}><PhoneCall size={24} style={{ color: "#D1FF26" }} /></div>
                      <div>
                        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// REQUEST CALLBACK</p>
                        <h3 className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>{listing.provider_name}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 py-5 space-y-3">
                    <input value={callerName} onChange={(e) => setCallerName(e.target.value)} placeholder="Your name *" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                    <input type="tel" value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} placeholder="Your phone number *" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                    <textarea value={serviceNeeded} onChange={(e) => setServiceNeeded(e.target.value)} placeholder="What service do you need? *" rows={2} className="w-full px-3 py-2.5 text-sm outline-none resize-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />

                    <div>
                      <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>// PREFERRED TIME</p>
                      <div className="grid grid-cols-5 gap-1">
                        {TIME_PREFERENCES.map((t) => (
                          <button key={t.value} onClick={() => setPreferredTime(t.value)} className="py-2 font-mono text-[7px] tracking-widest transition-all" style={{ background: preferredTime === t.value ? "rgba(209,255,38,0.15)" : "rgba(5,7,10,0.4)", border: `0.5px solid ${preferredTime === t.value ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: preferredTime === t.value ? "#D1FF26" : "#8A8F98" }}>{t.label}</button>
                        ))}
                      </div>
                    </div>

                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes (optional)" rows={2} maxLength={500} className="w-full px-3 py-2.5 text-sm outline-none resize-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                  </div>

                  {error && <div className="mx-6 mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>⚠ {error}</div>}

                  <div className="p-6 pt-0">
                    <button onClick={handleSubmit} disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)] disabled:opacity-50" style={{ background: "#D1FF26", color: "#05070A" }}>
                      {loading ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><PhoneCall size={14} /> Request Callback</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}