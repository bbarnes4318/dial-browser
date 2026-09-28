import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Search, Loader2, Play, Pause, Clock, Check, X, Archive } from "lucide-react";
import { base44 } from "@/api/base44Client";
import VoiceNoteTranscript from "./VoiceNoteTranscript";

const TYPE_LABELS = {
  item_not_received: "Item Not Received",
  item_not_as_described: "Not As Described",
  payment_not_received: "Payment Not Received",
  damaged_item: "Damaged Item",
  service_not_completed: "Service Not Completed",
  poor_service_quality: "Poor Quality",
  overcharged: "Overcharged",
  unprofessional_conduct: "Unprofessional",
  no_show: "No-Show",
  other: "Other",
};

const STATUS_META = {
  pending: { label: "Open", color: "#8A8F98", bg: "rgba(138,143,152,0.1)" },
  under_review: { label: "In Review", color: "#D1FF26", bg: "rgba(209,255,38,0.1)" },
  resolved: { label: "Resolved", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  dismissed: { label: "Dismissed", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Open" },
  { id: "under_review", label: "In Review" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
];

// Admin-only searchable archive of every service dispute filed by members.
// Full list (not capped), with search across title/reporter/counterparty/
// trade id/description and status filter tabs. Status can be managed inline.
export default function DisputeArchive() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [playingId, setPlayingId] = useState(null);
  const [updating, setUpdating] = useState(null);
  const audioRef = useRef(null);

  const load = async () => {
    try {
      const d = await base44.entities.Dispute.list("-created_date", 500);
      setDisputes(d || []);
    } catch {
      /* non-admins can't reach this route */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Dispute.subscribe(() => load());
    return unsub;
  }, []);

  const play = (d) => {
    const a = audioRef.current;
    if (!a) return;
    if (playingId === d.id) {
      a.pause();
      setPlayingId(null);
      return;
    }
    a.src = d.voice_note_url;
    a.play().then(() => setPlayingId(d.id)).catch(() => {});
  };

  const setStatus = async (id, status) => {
    setUpdating(id);
    try {
      await base44.entities.Dispute.update(id, { status });
      await load();
    } catch {
      /* */
    } finally {
      setUpdating(null);
    }
  };

  const q = query.toLowerCase().trim();
  const filtered = disputes.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (!q) return true;
    return [
      d.listing_title, d.reporter_name, d.counterparty_name, d.trade_id,
      d.description, d.dispute_type, TYPE_LABELS[d.dispute_type],
    ].some((v) => (v || "").toLowerCase().includes(q));
  });

  const counts = {
    all: disputes.length,
    pending: disputes.filter((d) => d.status === "pending").length,
    under_review: disputes.filter((d) => d.status === "under_review").length,
    resolved: disputes.filter((d) => d.status === "resolved").length,
    dismissed: disputes.filter((d) => d.status === "dismissed").length,
  };

  return (
    <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      <div className="flex items-center gap-2 mb-4">
        <Archive size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DISPUTE ARCHIVE — SEARCHABLE</p>
      </div>
      <p className="text-xs mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Complete searchable archive of every service dispute filed by members. Filter by status, search across titles, members, transaction IDs, and descriptions, and manage status inline.
      </p>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 mb-4" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
        <Search size={14} style={{ color: "#8A8F98" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, member, transaction ID, description…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#F5F5F7" }}
        />
        {query && (
          <button onClick={() => setQuery("")} className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CLEAR</button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className="px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                color: active ? "#D1FF26" : "#8A8F98",
              }}
            >
              {f.label} ({counts[f.id] || 0})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8">
          <Loader2 size={16} className="animate-spin" style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING ARCHIVE…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <ShieldAlert size={28} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 10px" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
            {query || statusFilter !== "all" ? "NO DISPUTES MATCH YOUR FILTERS" : "NO DISPUTES FILED YET"}
          </p>
        </div>
      ) : (
        <>
          <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>
            SHOWING {filtered.length} OF {disputes.length} DISPUTES
          </p>
          <div className="space-y-2 max-h-[600px] overflow-auto pr-1">
            {filtered.map((d) => {
              const meta = STATUS_META[d.status] || STATUS_META.pending;
              return (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3"
                  style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${meta.color}33` }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{d.listing_title}</p>
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5 uppercase" style={{ background: meta.bg, color: meta.color, border: `0.5px solid ${meta.color}40` }}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {d.trade_id && (
                      <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                        TXN {d.trade_id}
                      </span>
                    )}
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{TYPE_LABELS[d.dispute_type] || d.dispute_type}</span>
                    <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>· Reporter: {d.reporter_name || "—"}</span>
                    {d.counterparty_name && (
                      <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>· vs {d.counterparty_name}</span>
                    )}
                    <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.5)" }}>· {new Date(d.created_date).toLocaleDateString()}</span>
                  </div>
                  {d.description && (
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{d.description}</p>
                  )}
                  {d.voice_note_url && (
                    <button
                      onClick={() => play(d)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase mb-2"
                      style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}
                    >
                      {playingId === d.id ? <Pause size={10} /> : <Play size={10} />} {playingId === d.id ? "Pause" : "Play"} Voice Note
                    </button>
                  )}
                  <VoiceNoteTranscript dispute={d} onUpdated={load} />

                  <div className="flex gap-1.5 flex-wrap">
                    <ActionBtn active={d.status === "pending"} onClick={() => setStatus(d.id, "pending")} disabled={updating === d.id} icon={Clock} label="Open" color="#8A8F98" />
                    <ActionBtn active={d.status === "under_review"} onClick={() => setStatus(d.id, "under_review")} disabled={updating === d.id} icon={Clock} label="In Review" color="#D1FF26" />
                    <ActionBtn active={d.status === "resolved"} onClick={() => setStatus(d.id, "resolved")} disabled={updating === d.id} icon={Check} label="Resolve" color="#22c55e" />
                    <ActionBtn active={d.status === "dismissed"} onClick={() => setStatus(d.id, "dismissed")} disabled={updating === d.id} icon={X} label="Dismiss" color="#ef4444" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ActionBtn({ active, onClick, disabled, icon: Icon, label, color }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || active}
      className="flex items-center gap-1 px-2 py-1.5 font-mono text-[8px] tracking-widest uppercase disabled:opacity-40"
      style={{ background: active ? `${color}1a` : "rgba(5,7,10,0.5)", border: `0.5px solid ${color}40`, color }}
    >
      <Icon size={9} /> {label}
    </button>
  );
}