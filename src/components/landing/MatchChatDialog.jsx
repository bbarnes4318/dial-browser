import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Send, MessageCircle, Lock } from "lucide-react";
import CompatibilityMeter from "@/components/landing/CompatibilityMeter";
import VerifiedBadge from "@/components/landing/VerifiedBadge";

const seedReplies = [
  "Hey! So glad we matched 😊",
  "I loved your voice message!",
  "What are you up to this weekend?",
  "We should definitely hang out sometime.",
  "Your profile caught my eye right away.",
];

export default function MatchChatDialog({ match, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  // Seed an initial greeting from the matched member when the dialog opens
  useEffect(() => {
    if (!match) return;
    const now = new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true });
    setMessages([
      { id: 1, from: "them", text: `Hi! I'm ${match.name}. So glad we matched — I loved your vibe!`, time: now },
    ]);
  }, [match]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true });
    setMessages((m) => [...m, { id: Date.now(), from: "me", text, time: now }]);
    setInput("");

    // Simulate a reply from the matched member
    setTimeout(() => {
      const reply = seedReplies[Math.floor(Math.random() * seedReplies.length)];
      const replyTime = new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true });
      setMessages((m) => [...m, { id: Date.now() + 1, from: "them", text: reply, time: replyTime }]);
    }, 1400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!match) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{ background: "rgba(5,7,10,0.88)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 30 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.15)" }}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${match.gradient || "from-rose-900/50 to-pink-800/10"} flex items-center justify-center`} style={{ border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <span className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{match.name[0]}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-base" style={{ color: "#F5F5F7" }}>{match.name}, {match.age}</h3>
                  {match.verified && <VerifiedBadge size={12} />}
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield size={10} style={{ color: "#D1FF26" }} />
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>PRIVATE CHAT</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 transition-colors hover:text-rose-400" style={{ color: "#8A8F98" }}>
              <X size={18} />
            </button>
          </div>

          {/* Compatibility view */}
          <div className="px-4 pt-4">
            <CompatibilityMeter match={match} />
          </div>

          {/* Chat messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "rgba(5,7,10,0.5)", minHeight: 200, maxHeight: 320 }}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 ${msg.from === "me" ? "rounded-l-lg rounded-tr-lg" : "rounded-r-lg rounded-tl-lg"}`}
                  style={{
                    background: msg.from === "me" ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.8)",
                    border: `0.5px solid ${msg.from === "me" ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.15)"}`,
                  }}
                >
                  <p className="text-sm mb-1" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{msg.text}</p>
                  <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{msg.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Privacy notice */}
          <div className="mx-4 mb-2 p-2.5 flex items-center gap-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <Lock size={11} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>Numbers stay private · chat routed through 1 Call Network</span>
          </div>

          {/* Input */}
          <div className="p-4 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${match.name}...`}
              className="flex-1 px-4 py-3 text-[16px] sm:text-sm outline-none"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex items-center gap-1.5 px-5 py-3 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)] disabled:opacity-40"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              <Send size={12} /> Send
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}