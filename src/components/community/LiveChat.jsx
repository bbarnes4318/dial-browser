import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Mic, Radio, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fmtTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true });
};

const SIMULATED_MESSAGES = [
  { author_name: "Maya R.", body: "This stream is fire! 🔥" },
  { author_name: "Devon K.", body: "Tuning in from Brooklyn 📡" },
  { author_name: "Aisha T.", body: "The audio quality is incredible" },
  { author_name: "Marcus L.", body: "First time tuning in, this is amazing" },
  { author_name: "Priya S.", body: "Can you take a voice question next?" },
  { author_name: "Sofia M.", body: "Listening from the train 🎧" },
];

export default function LiveChat({ streamId, streamTitle = "Live Session", authorName = "Guest", isLive = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const chatEndRef = useRef(null);

  const loadMessages = async () => {
    try {
      const res = await base44.entities.LiveChatMessage.filter(
        { stream_id: streamId },
        "created_date",
        100
      );
      setMessages(res || []);
    } catch {
      setMessages([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [streamId]);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = base44.entities.LiveChatMessage.subscribe((event) => {
      if (event.data?.stream_id !== streamId) return;
      if (event.type === "create") {
        setMessages((prev) => [...prev.slice(-49), event.data]);
      } else if (event.type === "delete") {
        setMessages((prev) => prev.filter((m) => m.id !== event.data.id));
      }
    });
    return unsubscribe;
  }, [streamId]);

  // Simulated incoming messages for demo when live and chat is sparse
  useEffect(() => {
    if (!isLive) return;
    setOnlineCount(Math.floor(200 + Math.random() * 600));
    const interval = setInterval(() => {
      setOnlineCount((prev) => Math.max(50, prev + Math.floor(Math.random() * 30 - 14)));
    }, 4000);

    // Inject simulated chatter if the chat is quiet
    let simIdx = 0;
    const simInterval = setInterval(() => {
      if (messages.length < 15) {
        const msg = SIMULATED_MESSAGES[simIdx % SIMULATED_MESSAGES.length];
        setMessages((prev) => [...prev.slice(-49), {
          id: `sim-${Date.now()}`,
          ...msg,
          stream_id: streamId,
          message_type: "text",
          is_host: false,
          created_date: new Date().toISOString(),
        }]);
        simIdx++;
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(simInterval);
    };
  }, [isLive, streamId, messages.length]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      await base44.entities.LiveChatMessage.create({
        stream_id: streamId,
        stream_title: streamTitle,
        author_name: authorName,
        body: body.trim(),
        message_type: "text",
        is_host: false,
      });
      setBody("");
    } catch {
      /* error bubbles */
    }
    setPosting(false);
  };

  return (
    <div className="flex flex-col" style={{ maxHeight: "500px" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center gap-2">
          <Radio size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>LIVE CHAT</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={10} style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{onlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ minHeight: "240px" }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Radio size={24} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 8px" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO MESSAGES YET</p>
            <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Be the first to say something</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[7px] tracking-widest" style={{ color: msg.is_host ? "#D1FF26" : "#8A8F98" }}>
                    {msg.author_name.toUpperCase()}{msg.is_host && " · HOST"}
                  </span>
                  <span className="font-mono text-[7px]" style={{ color: "rgba(138,143,152,0.5)" }}>{fmtTime(msg.created_date)}</span>
                </div>
                <div
                  className="max-w-[85%] p-2"
                  style={{
                    background: msg.message_type === "tip" ? "rgba(209,255,38,0.12)" : msg.is_host ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.5)",
                    border: `0.5px solid ${msg.message_type === "tip" ? "rgba(209,255,38,0.3)" : msg.is_host ? "rgba(209,255,38,0.15)" : "rgba(138,143,152,0.08)"}`,
                  }}
                >
                  <p className="text-[10px]" style={{ color: msg.is_host ? "#D1FF26" : "#F5F5F7", lineHeight: 1.4 }}>{msg.body}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={isLive ? "Send a message…" : "Stream offline"}
          disabled={!isLive}
          className="flex-1 px-3 py-2 text-[16px] sm:text-xs outline-none disabled:opacity-40"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
        />
        <button type="submit" disabled={posting || !body.trim() || !isLive} className="flex items-center justify-center w-9 h-9 transition-all disabled:opacity-30" style={{ background: "#D1FF26" }}>
          {posting ? <Loader2 size={13} className="animate-spin" style={{ color: "#05070A" }} /> : <Send size={13} style={{ color: "#05070A" }} />}
        </button>
      </form>
    </div>
  );
}