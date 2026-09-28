import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PhoneOutgoing, PhoneIncoming, MessageSquare, MessageSquareDot, Loader2, Clock, History } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

function fmtDuration(sec) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_COLOR = {
  completed: "#D1FF26",
  in_progress: "#42E1F6",
  connecting: "#42E1F6",
  ringing: "#42E1F6",
  failed: "#ef4444",
  no_answer: "#8A8F98",
  busy: "#fb923c",
  voicemail: "#a78bfa",
  sent: "#D1FF26",
  delivered: "#D1FF26",
  received: "#42E1F6",
  queued: "#8A8F98",
};

export default function RecentActivityTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        const [calls, msgs] = await Promise.all([
          base44.entities.PhoneCall
            .filter({ owner_user_id: user.id }, "-created_date", 200)
            .catch(() => []),
          base44.entities.PhoneMessage
            .filter({ owner_user_id: user.id }, "-created_date", 200)
            .catch(() => []),
        ]);
        if (!alive) return;
        const callRows = (Array.isArray(calls) ? calls : []).map((c) => ({
          id: c.id,
          kind: "call",
          direction: c.direction,
          number: c.remote_number || c.to_number || c.from_number || "—",
          date: c.started_at || c.created_date,
          duration: c.duration_seconds || 0,
          durationLabel: fmtDuration(c.duration_seconds),
          status: c.status,
          label: c.remote_label || "",
          detail: c.remote_label || c.status,
        }));
        const msgRows = (Array.isArray(msgs) ? msgs : []).map((m) => ({
          id: m.id,
          kind: "text",
          direction: m.direction,
          number: m.remote_number || "—",
          date: m.created_date,
          duration: 0,
          durationLabel: "—",
          status: m.status,
          label: m.remote_label || "",
          detail: m.body || "",
        }));
        setRows([...callRows, ...msgRows].sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch {
        // non-blocking — empty list
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  const filtered = rows.filter((r) => filter === "all" || r.kind === filter);

  const counts = {
    all: rows.length,
    call: rows.filter((r) => r.kind === "call").length,
    text: rows.filter((r) => r.kind === "text").length,
  };

  return (
    <div className="p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <History size={16} style={{ color: "#D1FF26" }} />
          <div>
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// RECENT ACTIVITY</p>
            <h3 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>Calls & Texts</h3>
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { id: "all", label: `All · ${counts.all}` },
            { id: "call", label: `Calls · ${counts.call}` },
            { id: "text", label: `Texts · ${counts.text}` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: filter === f.id ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.6)",
                border: `0.5px solid ${filter === f.id ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                color: filter === f.id ? "#D1FF26" : "#8A8F98",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.15)" }}>
          <History size={28} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO ACTIVITY YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Calls and texts from your Dial Phone will appear here.</p>
          <Link to="/phone" className="mt-4 inline-flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
            Open Dial Phone
          </Link>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "rgba(138,143,152,0.08)" }}>
          {filtered.map((r) => {
            const isCall = r.kind === "call";
            const Icon = isCall ? (r.direction === "inbound" ? PhoneIncoming : PhoneOutgoing) : (r.direction === "inbound" ? MessageSquareDot : MessageSquare);
            const accent = isCall ? (r.direction === "inbound" ? "#42E1F6" : "#D1FF26") : (r.direction === "inbound" ? "#a78bfa" : "#fb923c");
            const statusColor = STATUS_COLOR[r.status] || "#8A8F98";
            return (
              <div key={`${r.kind}-${r.id}`} className="flex items-center gap-3 py-3" style={{ borderColor: "rgba(138,143,152,0.08)" }}>
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${accent}12`, border: `0.5px solid ${accent}40` }}>
                  <Icon size={14} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs truncate" style={{ color: "#F5F5F7" }}>{r.number}</span>
                    {r.label && <span className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>· {r.label}</span>}
                  </div>
                  {isCall ? (
                    <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>
                      <span style={{ color: statusColor }}>{(r.status || "").toUpperCase()}</span>
                      {r.direction === "inbound" ? " · Inbound call" : " · Outbound call"}
                    </p>
                  ) : (
                    <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>
                      {r.direction === "inbound" ? "Inbound · " : "Outbound · "}{r.detail || "(no body)"}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {isCall ? (
                    <p className="font-mono text-[10px] flex items-center gap-1 justify-end" style={{ color: "#F5F5F7" }}>
                      <Clock size={10} style={{ color: "#8A8F98" }} /> {r.durationLabel}
                    </p>
                  ) : (
                    <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>SMS</p>
                  )}
                  <p className="font-mono text-[9px] mt-0.5" style={{ color: "#8A8F98" }}>{fmtDate(r.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}