import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AudioLines, ShieldAlert, Heart, Play, Pause, Loader2, Search, Inbox, Check, X, Clock, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

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

const DISPUTE_STATUS = {
  pending: { label: "Open", color: "#8A8F98", bg: "rgba(138,143,152,0.1)" },
  under_review: { label: "In Review", color: "#D1FF26", bg: "rgba(209,255,38,0.1)" },
  resolved: { label: "Resolved", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  dismissed: { label: "Dismissed", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

const fmtDur = (s) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "0:00");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

// Admin-only unified voice-message inbox. Aggregates every dispute voice note
// across the platform with every member's dating voice intro into one
// searchable, playable list. Disputes can be managed inline (status changes).
export default function AdminVoiceInbox() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [updating, setUpdating] = useState(null);
  const audioRef = useRef(null);

  const load = async () => {
    try {
      const [disputes, profiles] = await Promise.all([
        base44.entities.Dispute.list("-created_date", 500),
        base44.entities.DatingProfile.list("-created_date", 500),
      ]);
      const collected = [];
      (disputes || []).forEach((d) => {
        if (d.voice_note_url) {
          collected.push({
            id: "dispute_" + d.id,
            refId: d.id,
            type: "dispute",
            url: d.voice_note_url,
            duration: d.voice_note_duration,
            title: d.listing_title || "Dispute report",
            subtitle: `${TYPE_LABELS[d.dispute_type] || d.dispute_type} · ${d.reporter_name || "—"}`,
            date: d.created_date,
            status: d.status,
          });
        }
      });
      (profiles || []).forEach((p) => {
        if (p.voice_intro_url) {
          collected.push({
            id: "dating_" + p.id,
            refId: p.id,
            type: "dating",
            url: p.voice_intro_url,
            duration: p.voice_intro_duration,
            title: `${p.full_name || "Member"}${p.age ? ", " + p.age : ""}`,
            subtitle: `Dating voice intro · ${p.location || ""} · ${p.phone_verified && p.email_verified ? "verified" : "unverified"}`,
            date: p.created_date,
            verified: p.phone_verified && p.email_verified,
          });
        }
      });
      collected.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setItems(collected);
    } catch (e) {
      console.error("admin voice inbox load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (item) => {
    const a = audioRef.current;
    if (playingId === item.id) {
      if (a) a.pause();
      setPlayingId(null);
      return;
    }
    if (a) {
      a.pause();
      a.src = item.url;
      a.play().then(() => setPlayingId(item.id)).catch(() => setPlayingId(null));
    }
  };

  const setStatus = async (item, status) => {
    setUpdating(item.id);
    try {
      await base44.entities.Dispute.update(item.refId, { status });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status } : i)));
    } catch {
      /* */
    } finally {
      setUpdating(null);
    }
  };

  const q = query.toLowerCase().trim();
  const filtered = items.filter((i) => {
    if (filter !== "all" && i.type !== filter) return false;
    if (!q) return true;
    return [i.title, i.subtitle, i.type, i.status].some((v) => (v || "").toLowerCase().includes(q));
  });

  const disputeCount = items.filter((i) => i.type === "dispute").length;
  const datingCount = items.filter((i) => i.type === "dating").length;

  return (
    <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

      <div className="flex items-center gap-2 mb-4">
        <Inbox size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// UNIFIED VOICE INBOX — ADMIN</p>
      </div>
      <p className="text-xs mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Every recorded service dispute voice note and member dating voice intro across the platform, in one place. Listen, search, filter, and manage dispute status inline.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Metric label="TOTAL CLIPS" value={items.length} accent="#8A8F98" />
        <Metric label="DISPUTE NOTES" value={disputeCount} accent="#ef4444" />
        <Metric label="DATING INTROS" value={datingCount} accent="#D1FF26" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 mb-4" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
        <Search size={14} style={{ color: "#8A8F98" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, member, type, status…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#F5F5F7" }}
        />
        {query && (
          <button onClick={() => setQuery("")} className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CLEAR</button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: "all", label: "All", count: items.length },
          { id: "dispute", label: "Disputes", count: disputeCount },
          { id: "dating", label: "Dating Intros", count: datingCount },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
            style={{
              background: filter === f.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${filter === f.id ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
              color: filter === f.id ? "#D1FF26" : "#8A8F98",
            }}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <AudioLines size={28} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 10px" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
            {query || filter !== "all" ? "NO CLIPS MATCH YOUR FILTERS" : "NO VOICE MESSAGES YET"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[640px] overflow-auto pr-1">
          {filtered.map((item) => {
            const isPlaying = playingId === item.id;
            const isDispute = item.type === "dispute";
            const Icon = isDispute ? ShieldAlert : Heart;
            const accent = isDispute ? "#ef4444" : "#D1FF26";
            const meta = isDispute ? (DISPUTE_STATUS[item.status] || DISPUTE_STATUS.pending) : null;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3"
                style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${isPlaying ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.1)"}` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: `${accent}1a`, border: `0.5px solid ${accent}55` }}>
                    <Icon size={16} style={{ color: accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{item.title}</p>
                      {meta && (
                        <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5 uppercase" style={{ background: meta.bg, color: meta.color, border: `0.5px solid ${meta.color}40` }}>
                          {meta.label}
                        </span>
                      )}
                      {!isDispute && item.verified && (
                        <span className="flex items-center gap-0.5 font-mono text-[7px] tracking-widest px-1.5 py-0.5 uppercase" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "0.5px solid rgba(34,197,94,0.4)" }}>
                          <ShieldCheck size={8} /> VERIFIED
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[9px] tracking-wide truncate mt-0.5" style={{ color: "#8A8F98" }}>{item.subtitle}</p>
                    <p className="font-mono text-[8px] mt-0.5" style={{ color: "rgba(138,143,152,0.5)" }}>{fmtDate(item.date)} · {fmtDur(item.duration)}</p>
                  </div>
                  <button
                    onClick={() => toggle(item)}
                    className="flex items-center gap-1.5 px-3 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all flex-shrink-0"
                    style={{
                      background: isPlaying ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)",
                      border: `0.5px solid ${isPlaying ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.2)"}`,
                      color: "#D1FF26",
                    }}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />} {isPlaying ? "Pause" : "Play"}
                  </button>
                </div>

                {/* Inline dispute status management */}
                {isDispute && (
                  <div className="flex gap-1.5 flex-wrap mt-3 pt-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.08)" }}>
                    <ActionBtn active={item.status === "pending"} onClick={() => setStatus(item, "pending")} disabled={updating === item.id} icon={Clock} label="Open" color="#8A8F98" />
                    <ActionBtn active={item.status === "under_review"} onClick={() => setStatus(item, "under_review")} disabled={updating === item.id} icon={Clock} label="In Review" color="#D1FF26" />
                    <ActionBtn active={item.status === "resolved"} onClick={() => setStatus(item, "resolved")} disabled={updating === item.id} icon={Check} label="Resolve" color="#22c55e" />
                    <ActionBtn active={item.status === "dismissed"} onClick={() => setStatus(item, "dismissed")} disabled={updating === item.id} icon={X} label="Dismiss" color="#ef4444" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
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