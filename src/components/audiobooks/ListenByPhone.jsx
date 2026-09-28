import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, Loader2, CheckCircle2, AlertCircle, ShieldCheck, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

const LIME = "#A4FF00";
const PURPLE = "#BC00FF";

/**
 * ListenByPhone — lets a member bridge an audiobook to a real phone call.
 * The member enters a phone number saved in their contacts; we place an
 * outbound Twilio call that <Play>s the audiobook so they can listen over a
 * plain phone line (no app, no data plan). Metered against the member's
 * monthly call minutes, same as the radio bridge.
 */
export default function ListenByPhone({ book, chapterIndex = 0 }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); // idle | calling | success | error
  const [message, setMessage] = useState("");

  if (!book || !book.audio_url) return null;

  const handleBridge = async () => {
    setStatus("calling");
    setMessage("");
    try {
      const res = await base44.functions.invoke("bridge-audio-call", {
        phone,
        audiobook_id: book.id,
        chapter_index: chapterIndex,
      });
      const data = res?.data || {};
      if (data.ok) {
        setStatus("success");
        setMessage(`Your phone is ringing — pick up to listen to ${book.title}.`);
      } else if (data.code === "auth_required") {
        setStatus("error");
        setMessage("Please sign in or register to use the phone bridge.");
        setTimeout(() => openRegistrationModal(), 600);
      } else if (data.code === "disclaimer_required") {
        setStatus("error");
        setMessage("Accept the one-time non-emergency disclaimer on the Phone page first, then try again.");
      } else if (data.code === "no_minutes") {
        setStatus("error");
        setMessage("You're out of call minutes this cycle. Upgrade your plan to continue.");
      } else if (data.code === "purchase_required") {
        setStatus("error");
        setMessage("Purchase this audiobook first to unlock phone listening.");
      } else if (data.code === "recipient_not_contact") {
        setStatus("error");
        setMessage("You can only call a number saved in your contacts. Add it to your address book first.");
      } else if (data.code === "telephony_unavailable") {
        setStatus("error");
        setMessage("Telephony isn't configured right now. Please try again later.");
      } else {
        setStatus("error");
        setMessage(data.error || "Couldn't place the call. Check the number and try again.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || "Something went wrong. Please try again.");
    }
  };

  const reset = () => {
    setStatus("idle");
    setMessage("");
    setOpen(false);
  };

  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 transition-all hover:shadow-[0_0_18px_rgba(188,0,255,0.3)]"
        style={{ background: open ? `${PURPLE}1a` : "rgba(16,20,29,0.6)", border: `0.5px solid ${open ? `${PURPLE}66` : "rgba(188,0,255,0.3)"}` }}
      >
        <PhoneCall size={14} style={{ color: PURPLE }} />
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: open ? PURPLE : "#F5F5F7" }}>
          Listen by Phone
        </span>
        <span className="font-mono text-[8px] tracking-wider hidden sm:inline" style={{ color: "#8A8F98" }}>· BRIDGE TO ANY PHONE LINE</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 mt-2" style={{ background: "rgba(10,13,20,0.85)", border: `0.5px solid ${PURPLE}33` }}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>Bridge {book.title} to a phone call</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#8A8F98" }}>Enter a number saved in your contacts. We'll call it and play the audiobook — no app or data plan needed.</p>
                </div>
                <button onClick={reset} className="p-1 flex-shrink-0"><X size={14} style={{ color: "#8A8F98" }} /></button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 1234"
                  className="flex-1 px-3 py-2.5 text-[16px] sm:text-sm outline-none"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(188,0,255,0.25)", color: "#F5F5F7" }}
                />
                <button
                  onClick={handleBridge}
                  disabled={status === "calling" || !phone.trim()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(188,0,255,0.4)] disabled:opacity-40"
                  style={{ background: PURPLE, color: "#F5F5F7" }}
                >
                  {status === "calling" ? <Loader2 size={13} className="animate-spin" /> : <PhoneCall size={13} />}
                  {status === "calling" ? "Calling…" : "Call Now"}
                </button>
              </div>

              <AnimatePresence>
                {status === "success" && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 mt-3 p-2.5" style={{ background: `${LIME}10`, border: `0.5px solid ${LIME}40` }}>
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: LIME }} />
                    <p className="text-[11px]" style={{ color: LIME }}>{message}</p>
                  </motion.div>
                )}
                {status === "error" && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 mt-3 p-2.5" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.4)" }}>
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                    <p className="text-[11px]" style={{ color: "#ef4444" }}>{message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="flex items-center gap-1.5 mt-3 text-[9px]" style={{ color: "#8A8F98" }}>
                <ShieldCheck size={10} style={{ color: LIME }} />
                Metered against your monthly call minutes. Non-emergency line — never use for 911.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}