import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, ArrowDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialVoiceRecorder from "./SocialVoiceRecorder";
import SocialVoicePlayer from "./SocialVoicePlayer";

/**
 * Private 1:1 chat window between two SocialProfiles.
 * Loads history, subscribes to new messages live, sends text + voice.
 */
export default function SocialChatWindow({ myProfile, theirProfile, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const loadMessages = async () => {
    try {
      const [sent, received] = await Promise.all([
        base44.entities.SocialMessage.filter(
          { sender_profile_id: myProfile.id, recipient_profile_id: theirProfile.id },
          "created_date",
          200
        ),
        base44.entities.SocialMessage.filter(
          { sender_profile_id: theirProfile.id, recipient_profile_id: myProfile.id },
          "created_date",
          200
        ),
      ]);
      const merged = [...sent, ...received].sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      setMessages(merged);
      // Mark received unread messages as read
      for (const m of merged) {
        if (m.recipient_profile_id === myProfile.id && !m.read) {
          try { await base44.entities.SocialMessage.update(m.id, { read: true }); } catch {}
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.SocialMessage.subscribe((event) => {
      const d = event.data;
      const involves =
        (d.sender_profile_id === myProfile.id && d.recipient_profile_id === theirProfile.id) ||
        (d.sender_profile_id === theirProfile.id && d.recipient_profile_id === myProfile.id);
      if (!involves) return;
      if (event.type === "create") {
        setMessages((prev) => {
          if (prev.some((m) => m.id === d.id)) return prev;
          return [...prev, d].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        });
        if (d.recipient_profile_id === myProfile.id && !d.read) {
          base44.entities.SocialMessage.update(d.id, { read: true }).catch(() => {});
        }
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile.id, theirProfile.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  const send = async (e) => {
    e?.preventDefault();
    if (sending) return;
    if (!text.trim() && !voiceNote) return;
    setSending(true);
    try {
      await base44.entities.SocialMessage.create({
        sender_profile_id: myProfile.id,
        recipient_profile_id: theirProfile.id,
        recipient_user_id: theirProfile.owner_user_id,
        sender_handle: myProfile.handle,
        sender_name: myProfile.display_name,
        sender_avatar: myProfile.avatar_url || "",
        text: text.trim(),
        voice_note_url: voiceNote?.url || "",
        voice_note_transcript: voiceNote?.transcript || "",
        read: false,
      });
      setText("");
      setVoiceNote(null);
    } catch {}
    setSending(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
        style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-md h-[80vh] sm:h-[600px] flex flex-col overflow-hidden"
          style={{
            background: "rgba(10,13,20,0.98)",
            border: "0.5px solid rgba(0,255,255,0.3)",
            boxShadow: "0 0 60px rgba(0,255,255,0.12), 0 20px 80px rgba(0,0,0,0.7)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated top signal line */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #00FFFF, #CC00FF, transparent)", animation: "tickerScroll 3s linear infinite" }} />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(0,255,255,0.15)", background: "rgba(0,255,255,0.03)" }}>
            <div className="w-9 h-9 flex-shrink-0 overflow-hidden" style={{ border: "0.5px solid rgba(0,255,255,0.3)" }}>
              {theirProfile.avatar_url ? (
                <img src={proxyMediaUrl(theirProfile.avatar_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-heading font-black" style={{ background: "rgba(0,255,255,0.08)", color: "#00FFFF" }}>
                  {theirProfile.display_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{theirProfile.display_name}</p>
              <p className="font-mono text-[10px] tracking-wider truncate" style={{ color: "#00FFFF" }}>@{theirProfile.handle} · PRIVATE</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-[rgba(239,68,68,0.1)]"><X size={16} style={{ color: "#8A8F98" }} /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
            {loading ? (
              <div className="flex items-center justify-center h-full"><Loader2 size={20} className="animate-spin" style={{ color: "#00FFFF" }} /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#00FFFF" }}>// SECURE CHANNEL OPEN</p>
                <p className="text-xs" style={{ color: "#8A8F98" }}>No messages yet. Say hello — by text or voice.</p>
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender_profile_id === myProfile.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[78%] px-3 py-2"
                      style={
                        mine
                          ? { background: "linear-gradient(135deg, rgba(204,0,255,0.18), rgba(0,255,255,0.12))", border: "0.5px solid rgba(204,0,255,0.35)", boxShadow: "0 0 16px rgba(204,0,255,0.08)" }
                          : { background: "rgba(0,255,255,0.06)", border: "0.5px solid rgba(0,255,255,0.2)" }
                      }
                    >
                      {m.text && <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#F5F5F7" }}>{m.text}</p>}
                      {m.voice_note_url && (
                        <div className={m.text ? "mt-2" : ""}>
                          <SocialVoicePlayer url={m.voice_note_url} transcript={m.voice_note_transcript} compact />
                        </div>
                      )}
                      <p className="font-mono text-[9px] tracking-wider mt-1 text-right" style={{ color: "#8A8F98" }}>
                        {new Date(m.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {mine && (m.read ? " · READ" : " · SENT")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="px-3 py-3" style={{ borderTop: "0.5px solid rgba(0,255,255,0.15)", background: "rgba(10,13,20,0.6)" }}>
            {voiceNote && (
              <div className="mb-2 flex items-center justify-between px-2.5 py-1.5" style={{ background: "rgba(66,225,246,0.06)", border: "0.5px solid rgba(66,225,246,0.25)" }}>
                <span className="text-[10px] font-mono" style={{ color: "#42E1F6" }}>✓ Voice ready</span>
                <button onClick={() => setVoiceNote(null)} className="text-[10px]" style={{ color: "#8A8F98" }}>Remove</button>
              </div>
            )}
            <form onSubmit={send} className="flex items-center gap-2">
              <SocialVoiceRecorder
                onComplete={setVoiceNote}
                onClear={() => setVoiceNote(null)}
                compact
              />
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(0,255,255,0.2)", color: "#F5F5F7" }}
              />
              <button
                type="submit"
                disabled={sending || (!text.trim() && !voiceNote)}
                className="flex items-center justify-center w-9 h-9 flex-shrink-0 transition-all hover:shadow-[0_0_14px_rgba(0,255,255,0.4)] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #00FFFF, #CC00FF)", color: "#05070A" }}
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}