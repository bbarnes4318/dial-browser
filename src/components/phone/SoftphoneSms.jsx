import React, { useState, useMemo } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";

function fmt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function SoftphoneSms({ messages, fromNumber, onSend, sending }) {
  const [to, setTo] = useState("");
  const [text, setText] = useState("");

  const threads = useMemo(() => {
    const map = new Map();
    for (const m of (messages || [])) {
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

  const [open, setOpen] = useState(null);
  const thread = open ? threads.find(([k]) => k === open)?.[1] || [] : [];

  const submit = () => {
    if (!to.trim() || !text.trim()) return;
    onSend(to.trim(), text.trim());
    setTo(open || to.trim());
    setText("");
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* Thread list */}
      <div>
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>// CONVERSATIONS</p>
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.15)" }}>
            <MessageSquare size={22} style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO MESSAGES YET</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {threads.map(([num, msgs]) => {
              const last = msgs[msgs.length - 1];
              return (
                <button key={num} onClick={() => { setOpen(num); setTo(num); }}
                  className="w-full text-left p-3 transition-all"
                  style={{
                    background: open === num ? "rgba(209,255,38,0.08)" : "rgba(5,7,10,0.4)",
                    border: `0.5px solid ${open === num ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs" style={{ color: "#F5F5F7" }}>{num}</span>
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{fmt(last?.created_date)}</span>
                  </div>
                  <p className="font-mono text-[10px] truncate mt-1" style={{ color: "#8A8F98" }}>{last?.body || ""}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer + open thread */}
      <div>
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>// {open ? "REPLY" : "NEW MESSAGE"}</p>
        {open && (
          <div className="max-h-[220px] overflow-y-auto mb-3 space-y-2" style={{ border: "0.5px solid rgba(138,143,152,0.12)", background: "rgba(5,7,10,0.3)" }}>
            {thread.map((m) => (
              <div key={m.id} className={`p-2.5 ${m.direction === "outbound" ? "text-right" : ""}`}>
                <span className="inline-block px-3 py-2 max-w-[85%] text-sm" style={{
                  background: m.direction === "outbound" ? "rgba(209,255,38,0.12)" : "rgba(66,225,246,0.1)",
                  border: `0.5px solid ${m.direction === "outbound" ? "rgba(209,255,38,0.25)" : "rgba(66,225,246,0.25)"}`,
                  color: "#F5F5F7",
                }}>{m.body}</span>
                <p className="font-mono text-[8px] mt-0.5" style={{ color: "#8A8F98" }}>{fmt(m.created_date)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-2">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To: +1 555 000 0000"
            className="w-full px-3 py-2.5 bg-transparent outline-none font-mono text-sm"
            style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1600))}
            placeholder="Type a message…"
            rows={3}
            className="w-full px-3 py-2.5 bg-transparent outline-none text-sm resize-none"
            style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
          />
          <button onClick={submit} disabled={sending || !to.trim() || !text.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)] disabled:opacity-40"
            style={{ background: "#D1FF26", color: "#05070A" }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
          </button>
        </div>
      </div>
    </div>
  );
}