import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Loader2, Play, Pause, Clock, Check, X } from "lucide-react";
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
  pending: ["#8A8F98", "rgba(138,143,152,0.1)"],
  under_review: ["#D1FF26", "rgba(209,255,38,0.1)"],
  resolved: ["#22c55e", "rgba(34,197,94,0.1)"],
  dismissed: ["#ef4444", "rgba(239,68,68,0.1)"],
};

// Admin-only: surfaces every service dispute filed by members (transaction ID
// + voice note) for review, with live status updates. Mirrors the member-facing
// /disputes page into the admin dashboard.
export default function DisputeReview() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [updating, setUpdating] = useState(null);
  const audioRef = useRef(null);

  const load = async () => {
    try {
      const d = await base44.entities.Dispute.list("-created_date", 50);
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

  const pending = disputes.filter((d) => d.status === "pending").length;
  const review = disputes.filter((d) => d.status === "under_review").length;
  const resolved = disputes.filter((d) => d.status === "resolved").length;

  return (
    <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DISPUTE MANAGEMENT</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 size={14} className="animate-spin" style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING…</span>
        </div>
      ) : disputes.length === 0 ? (
        <p className="font-mono text-[9px] tracking-widest py-4" style={{ color: "#8A8F98" }}>NO DISPUTES FILED — MEMBER SERVICE REPORTS APPEAR HERE</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Metric label="TOTAL" value={disputes.length} accent="#8A8F98" />
            <Metric label="PENDING" value={pending} accent="#D1FF26" />
            <Metric label="IN REVIEW" value={review} accent="#E0A85A" />
            <Metric label="RESOLVED" value={resolved} accent="#22c55e" />
          </div>

          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {disputes.slice(0, 12).map((d) => {
              const [sc, sbg] = STATUS_META[d.status] || STATUS_META.pending;
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3"
                  style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${sc}33` }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{d.listing_title}</p>
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5 uppercase" style={{ background: sbg, color: sc, border: `0.5px solid ${sc}40` }}>
                      {d.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {d.trade_id && (
                      <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                        TXN {d.trade_id}
                      </span>
                    )}
                    <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{TYPE_LABELS[d.dispute_type] || d.dispute_type}</span>
                    <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.6)" }}>· {d.reporter_name}</span>
                  </div>

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

                  <div className="flex gap-1.5">
                    <ActionBtn active={d.status === "under_review"} onClick={() => setStatus(d.id, "under_review")} disabled={updating === d.id} icon={Clock} label="Review" color="#D1FF26" />
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

function Metric({ label, value, accent }) {
  return (
    <div className="p-3" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${accent}40` }}>
      <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>{label}</p>
      <p className="font-heading font-black text-xl" style={{ color: accent }}>{value}</p>
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