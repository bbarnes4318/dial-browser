import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Home, Loader2, Send, MessageSquare, ArrowLeft, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SmsInbox() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(null);
  const [to, setTo] = useState("");
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("phone-account", {});
      setAccount(res?.data || res);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const messages = account?.messages || [];
  const fromNumber = account?.number?.number;

  const threads = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const key = m.remote_number || m.from_number;
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    return [...map.entries()].sort((a, b) => {
      const la = a[1][a[1].length - 1]?.created_date || "";
      const lb = b[1][b[1].length - 1]?.created_date || "";
      return lb.localeCompare(la);
    });
  }, [messages]);

  const openThread = open ? threads.find(([k]) => k === open)?.[1] || [] : [];

  const openConv = (num) => { setOpen(num); setTo(num); };
  const submit = async () => {
    if (!to.trim() || !text.trim()) return;
    setSending(true);
    try {
      await base44.functions.invoke("send-phone-sms", { to: to.trim(), text: text.trim() });
      setText("");
      await load();
    } catch (e) { console.error(e); }
    setSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#05070A" }}>
        <div className="text-center max-w-sm">
          <MessageSquare size={28} className="mx-auto mb-4" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// SIGN IN REQUIRED</p>
          <Link to="/login" className="inline-block px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>Sign in</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between"
        style={{ background: "rgba(5,7,10,0.9)", borderBottom: "0.5px solid rgba(209,255,38,0.15)", backdropFilter: "blur(12px)" }}>
        <Link to="/phone" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
          <ArrowLeft size={12} /> Dial Phone
        </Link>
        <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// MESSAGES</p>
        <Link to="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#8A8F98" }}>
          <Home size={12} /> Home
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 pb-24">
        <div className="mb-5">
          <h1 className="font-heading font-black text-2xl sm:text-3xl" style={{ color: "#F5F5F7" }}>SMS <span style={{ color: "#D1FF26" }}>Inbox</span></h1>
          <p className="text-sm mt-1.5" style={{ color: "#8A8F98" }}>View and reply to your text message threads.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)", borderRadius: 12, overflow: "hidden" }}>
          {/* Thread list */}
          <div className="sm:border-r" style={{ borderRight: "0.5px solid rgba(138,143,152,0.15)" }}>
            <p className="font-mono text-[9px] tracking-widest px-4 pt-4 pb-2" style={{ color: "#8A8F98" }}>// CONVERSATIONS</p>
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare size={26} style={{ color: "rgba(209,255,38,0.3)" }} />
                <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO MESSAGES YET</p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                {threads.map(([num, msgs]) => {
                  const last = msgs[msgs.length - 1];
                  const unread = msgs.some((m) => m.direction === "inbound" && !m.read);
                  return (
                    <button key={num} onClick={() => openConv(num)}
                      className="w-full text-left px-4 py-3 transition-all"
                      style={{
                        background: open === num ? "rgba(209,255,38,0.08)" : "transparent",
                        borderBottom: "0.5px solid rgba(138,143,152,0.08)",
                      }}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs flex items-center gap-1.5" style={{ color: unread ? "#D1FF26" : "#F5F5F7" }}>
                          {unread && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26" }} />}{num}
                        </span>
                        <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{fmtShort(last?.created_date)}</span>
                      </div>
                      <p className="text-[11px] truncate mt-1" style={{ color: "#8A8F98" }}>{last?.body || ""}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conversation + composer */}
          <div className="flex flex-col min-h-[420px]">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.15)" }}>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>// {open ? "CONVERSATION" : "NEW MESSAGE"}</p>
              {open && <span className="font-mono text-[11px]" style={{ color: "#D1FF26" }}>{open}</span>}
            </div>

            {open ? (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 max-h-[300px]">
                {openThread.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%]">
                      <span className="inline-block px-3 py-2 text-sm" style={{
                        background: m.direction === "outbound" ? "rgba(209,255,38,0.14)" : "rgba(66,225,246,0.12)",
                        border: `0.5px solid ${m.direction === "outbound" ? "rgba(209,255,38,0.3)" : "rgba(66,225,246,0.3)"}`,
                        color: "#F5F5F7",
                        borderRadius: 14,
                      }}>{m.body}</span>
                      <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98", textAlign: m.direction === "outbound" ? "right" : "left" }}>{fmt(m.created_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                <MessageSquare size={28} style={{ color: "rgba(209,255,38,0.25)" }} />
                <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>SELECT A CONVERSATION</p>
              </div>
            )}

            <div className="p-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.15)" }}>
              {!open && (
                <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To: +1 555 000 0000"
                  className="w-full px-3 py-2.5 bg-transparent outline-none font-mono text-sm mb-2"
                  style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7", borderRadius: 8 }} />
              )}
              <div className="flex gap-2">
                <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 1600))} placeholder="Type a reply..."
                  rows={1}
                  className="flex-1 px-3 py-2.5 bg-transparent outline-none text-sm resize-none"
                  style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#F5F5F7", borderRadius: 8 }} />
                <button onClick={submit} disabled={sending || !to.trim() || !text.trim()}
                  className="w-12 flex items-center justify-center transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.35)] disabled:opacity-40"
                  style={{ background: "#D1FF26", color: "#05070A", borderRadius: 8 }}>
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {!fromNumber && (
          <p className="font-mono text-[9px] mt-3 flex items-center gap-1.5" style={{ color: "#8A8F98" }}>
            <Phone size={10} /> Using the shared line. Upgrade for a personal number. <a href="/#pricing" className="underline" style={{ color: "#D1FF26" }}>See plans</a>
          </p>
        )}
      </div>
    </div>
  );
}