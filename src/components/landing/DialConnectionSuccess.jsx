import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

const SERVICE_SUMMARIES = {
  Medical: "Speak your symptoms — get general wellness info and guidance on next steps.",
  Pharmacy: "Find nearby pharmacies and check medication availability by voice.",
  Weather: "Get instant forecasts for your location or any city.",
  Plumbing: "Request a callback from a verified local plumber near you.",
  Electrical: "Connect with a licensed electrician for service or emergencies.",
  Jobs: "Hear nearby openings and apply by voice.",
  Marketplace: "Browse local service listings and request callbacks.",
  Music: "Tune into the royalty-free radio network or submit a track.",
  SOS: "Emergency line — your contacts and nearest help are being alerted.",
};

export default function DialConnectionSuccess({ service, dialCode, onDismiss }) {
  const [visible, setVisible] = useState(true);
  const summary =
    SERVICE_SUMMARIES[service?.name] ||
    "You're connected. Speak naturally to get assistance.";

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 250);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.95 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] w-[90vw] max-w-sm"
        >
          <div
            className="relative p-5 overflow-hidden"
            style={{
              background: "rgba(10,13,20,0.98)",
              border: "0.5px solid rgba(209,255,38,0.4)",
              boxShadow:
                "0 12px 50px rgba(0,0,0,0.6), 0 0 40px rgba(209,255,38,0.12)",
            }}
          >
            {/* top signal line */}
            <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
              <div
                className="h-full w-1/4"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #D1FF26, transparent)",
                  animation: "tickerScroll 2.5s linear infinite",
                }}
              />
            </div>

            <button
              onClick={dismiss}
              className="absolute top-2 right-2 p-1"
              aria-label="Dismiss"
            >
              <X size={13} style={{ color: "#8A8F98" }} />
            </button>

            <div className="flex items-start gap-4">
              {/* animated check with phosphor pulse rings */}
              <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute rounded-full"
                    style={{ border: "0.5px solid rgba(209,255,38,0.45)" }}
                    initial={{ width: 48, height: 48, opacity: 0.6 }}
                    animate={{ width: 104, height: 104, opacity: 0 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeOut",
                    }}
                  />
                ))}
                <motion.div
                  className="relative w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(209,255,38,0.12)",
                    border: "1px solid #D1FF26",
                    boxShadow: "0 0 24px rgba(209,255,38,0.35)",
                  }}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
                >
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.18, type: "spring", stiffness: 300, damping: 14 }}
                  >
                    <Check size={22} style={{ color: "#D1FF26" }} strokeWidth={3} />
                  </motion.span>
                </motion.div>
              </div>

              {/* service summary */}
              <div className="flex-1 min-w-0 pr-4">
                <p
                  className="font-mono text-[9px] tracking-[0.3em] mb-1"
                  style={{ color: "#D1FF26" }}
                >
                  CONNECTION VERIFIED
                </p>
                <p
                  className="font-heading font-bold text-base mb-1 truncate"
                  style={{ color: "#F5F5F7" }}
                >
                  {service?.icon} {service?.name || "Service"}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
                  {summary}
                </p>
                {dialCode && (
                  <p
                    className="font-mono text-[9px] tracking-widest mt-2"
                    style={{ color: "rgba(138,143,152,0.7)" }}
                  >
                    DIAL CODE · {dialCode}
                  </p>
                )}
              </div>
            </div>

            {/* auto-dismiss progress bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: "rgba(209,255,38,0.08)" }}
            >
              <motion.div
                className="h-full"
                style={{ background: "#D1FF26" }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}