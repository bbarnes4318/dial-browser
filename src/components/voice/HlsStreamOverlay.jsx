import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, AlertCircle } from "lucide-react";

// Clean, branded overlay that plays a web-based HLS stream. Uses native HLS
// (Safari / iOS); on browsers without native HLS it shows a graceful, branded
// fallback with a direct link — so the user never sees a broken player.
export default function HlsStreamOverlay({ stream, onClose }) {
  const videoRef = useRef(null);
  const [nativeHls, setNativeHls] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;
    const can = v.canPlayType("application/vnd.apple.mpegurl") !== "";
    setNativeHls(can);
    setErrored(false);
    if (can) {
      v.src = stream.url;
      v.play().catch(() => setErrored(true));
    }
    return () => {
      try {
        v.pause();
        v.removeAttribute("src");
        v.load();
      } catch (e) {}
    };
  }, [stream]);

  return (
    <AnimatePresence>
      {stream && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0A0D12", border: "1px solid rgba(209,255,38,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }}
          >
            <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
              <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
            </div>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
              <p className="font-mono text-[10px] tracking-widest truncate" style={{ color: "#D1FF26" }}>// {stream.title}</p>
              <button onClick={onClose} className="p-1.5 hover:bg-[rgba(138,143,152,0.1)] transition-colors">
                <X size={16} style={{ color: "#8A8F98" }} />
              </button>
            </div>
            <div className="relative bg-black aspect-video">
              {nativeHls && !errored ? (
                <video ref={videoRef} controls autoPlay playsInline className="w-full h-full" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <AlertCircle size={28} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: "#F5F5F7" }}>HLS PLAYBACK UNSUPPORTED HERE</p>
                  <p className="text-xs max-w-sm" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                    Your browser can't play this HLS stream natively. Open it in Safari or iOS, or use the direct link below.
                  </p>
                  <a
                    href={stream.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    <ExternalLink size={13} /> OPEN STREAM
                  </a>
                </div>
              )}
            </div>
            <div className="p-3 flex items-center justify-between" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{stream.category}</span>
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>WEB-BASED HLS · 1 CALL AWAY™</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}