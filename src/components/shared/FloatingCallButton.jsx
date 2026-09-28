import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X } from "lucide-react";

export default function FloatingCallButton() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-end gap-2"
          >
            <div className="p-4 max-w-[260px]" style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
              <p className="font-mono text-[9px] tracking-[0.3em] mb-1" style={{ color: "#D1FF26" }}>// DIAL BROWSER™</p>
              <p className="font-heading font-bold text-sm mb-3" style={{ color: "#F5F5F7" }}>Call to connect now</p>
              <a
                href="tel:*110%23"
                className="flex items-center justify-center gap-2 w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                <Phone size={13} /> Dial *110#
              </a>
              <p className="font-mono text-[8px] tracking-widest mt-2 text-center" style={{ color: "#8A8F98" }}>
                Voice-first access to all services
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <motion.button
        onClick={() => setExpanded((v) => !v)}
        whileTap={{ scale: 0.92 }}
        className="relative flex items-center justify-center w-14 h-14"
        style={{ background: "#D1FF26", color: "#05070A", borderRadius: "50%", boxShadow: "0 0 24px rgba(209,255,38,0.4)" }}
        aria-label="Call the Dial Browser"
      >
        {/* Pulsing rings */}
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: "2px solid #D1FF26" }}
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: "2px solid #D1FF26" }}
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
        />
        {expanded ? <X size={22} /> : <Phone size={22} />}
      </motion.button>
    </div>
  );
}