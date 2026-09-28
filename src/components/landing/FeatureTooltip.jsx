import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FeatureTooltip({ value, children }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block w-full"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-56 pointer-events-none"
          >
            <div
              className="relative p-3"
              style={{
                background: '#10141D',
                border: '0.5px solid rgba(209,255,38,0.4)',
                boxShadow: '0 0 20px rgba(209,255,38,0.15)',
              }}
            >
              <p className="font-mono text-[8px] tracking-[0.3em] mb-1.5" style={{ color: '#D1FF26' }}>
                ▸ VALUE
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#F5F5F7' }}>
                {value}
              </p>
              {/* Arrow */}
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                style={{ background: '#10141D', borderRight: '0.5px solid rgba(209,255,38,0.4)', borderBottom: '0.5px solid rgba(209,255,38,0.4)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}