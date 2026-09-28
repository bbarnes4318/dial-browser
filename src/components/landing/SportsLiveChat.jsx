import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, AlertCircle, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

const LIME = "#D4FF00";

// Lightweight sport filter — 'all' is the general live-game chat.
const CHAT_SPORTS = [
  { id: "all", label: "All" },
  { id: "soccer", label: "⚽ Soccer" },
  { id: "football", label: "🏈 Football" },
  { id: "baseball", label: "⚾ Baseball" },
  { id: "basketball", label: "🏀 Basketball" },
  { id: "motorsport", label: "🏎️ Motorsport" },
];

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function SportsLiveChat() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sport, setSport] = useState("all");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setCheckedAuth(true);
      }
      try {
        const recent = await base44.entities.SportsChatMessage.list("-created_date", 50);
        setMessages(recent.reverse());
      } catch {}
      // Real-time: append new messages as they're created across the chat.
      unsubscribe = base44.entities.SportsChatMessage.subscribe((event) => {
        if (event.type === "create" && event.data) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === event.data.id)) return prev;
            return [...prev, event.data].slice(-100);
          });
        }
      });
    })();
    return () => unsubscribe();
  }, []);

  // Auto-scroll to newest message.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const visible = messages.filter((m) => sport === "all" || m.sport === sport || !m.sport);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    if (!user) { openRegistrationModal(); return; }
    setSending(true);
    setError(null);
    try {
      await base44.entities.SportsChatMessage.create({
        message: value,
        author_name: user.full_name || user.email || "Fan",
        sport,
        owner_user_id: user.id,
      });
      setText("");
    } catch (e) {
      setError("Could not send. You may need to log in.");
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="mt-5 p-4" style={{ borderRadius: 10, background: "linear-gradient(180deg,#0d0d0d,#141414)", border: "0.5px solid rgba(255,255,255,0.06)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <MessageCircle size={11} style={{ color: LIME }} />
          <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: LIME }}>LIVE GAME CHAT · COMMENT AS YOU LISTEN</p>
        </div>
        <span className="flex items-center gap-1 font-mono text-[7px] tracking-widest" style={{ color: "#FF3838" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF3838", animation: "dotPulse 1.6s ease-in-out infinite" }} /> LIVE
        </span>
      </div>

      {/* Sport filter */}
      <div className="flex gap-1.5 overflow-x-auto overscroll-contain pb-2 mb-3" style={{ WebkitOverflowScrolling: "touch" }}>
        {CHAT_SPORTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSport(s.id)}
            className="px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase whitespace-nowrap"
            style={{
              background: sport === s.id ? "rgba(212,255,0,0.12)" : "rgba(255,255,255,0.03)",
              border: `0.5px solid ${sport === s.id ? "rgba(212,255,0,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: sport === s.id ? LIME : "#8a8a8a",
              borderRadius: 4,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex flex-col gap-2 mb-3" style={{ maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
        {visible.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={20} className="mx-auto mb-2" style={{ color: "#3a3a3a" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#6a6a6a" }}>NO MESSAGES YET — BE THE FIRST TO CHAT</p>
          </div>
        ) : (
          visible.map((m) => {
            const mine = user && m.owner_user_id === user.id;
            return (
              <div key={m.id} className="flex flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                <div className="max-w-[85%] px-3 py-2" style={{ background: mine ? "rgba(212,255,0,0.10)" : "rgba(255,255,255,0.04)", border: `0.5px solid ${mine ? "rgba(212,255,0,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 7 }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[8px] tracking-wider" style={{ color: mine ? LIME : "#9a9a9a" }}>{(m.author_name || "Fan").slice(0, 18)}</span>
                    {m.sport && m.sport !== "all" && <span className="font-mono text-[7px] px-1" style={{ background: "rgba(255,255,255,0.06)", color: "#8a8a8a", borderRadius: 2 }}>{m.sport}</span>}
                    <span className="font-mono text-[7px]" style={{ color: "#5a5a5a" }}>{timeAgo(m.created_date)}</span>
                  </div>
                  <p className="text-[11px] leading-snug break-words" style={{ color: "#EDEDED" }}>{m.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2" style={{ background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.45)", borderRadius: 5 }}>
          <AlertCircle size={12} style={{ color: "#ef4444" }} />
          <p className="text-[10px]" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Composer */}
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          maxLength={280}
          placeholder={checkedAuth && !user ? "Login to join the chat…" : "Comment on the live game…"}
          className="flex-1 px-3 py-2.5 text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", color: "#F5F5F7", borderRadius: 6 }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40"
          style={{ background: LIME, borderRadius: 6, color: "#05070A" }}
          aria-label="Send message"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : checkedAuth && !user ? <LogIn size={14} /> : <Send size={14} />}
        </button>
      </div>
      <p className="font-mono text-[8px] tracking-wider mt-2 text-center" style={{ color: "#5a5a5a" }}>
        ▸ BE RESPECTFUL · MAX 280 CHARS · MESSAGES ARE PUBLIC
      </p>
    </div>
  );
}