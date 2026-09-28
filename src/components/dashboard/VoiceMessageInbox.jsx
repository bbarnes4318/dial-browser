import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AudioLines, ShieldAlert, Heart, Play, Pause, Loader2, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fmtDur = (s) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "0:00");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

// Dedicated voice-message inbox. Pulls recorded dispute voice notes (the
// member's own reports) and dating voice intros (the member's own clip plus
// every matched member's clip) into one filterable, playable list.
export default function VoiceMessageInbox() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me().catch(() => null);
        const [disputes, likes, mine] = await Promise.all([
          base44.entities.Dispute.filter({}, "-created_date", 100).catch(() => []),
          base44.entities.DatingLike.filter({}, "-created_date", 200).catch(() => []),
          me ? base44.entities.DatingProfile.filter({ created_by_id: me.id }, "-created_date", 5).catch(() => []) : [],
        ]);

        const collected = [];

        // Dispute voice notes (member's own reports).
        (disputes || []).forEach((d) => {
          if (d.voice_note_url) {
            collected.push({
              id: "dispute_" + d.id,
              type: "dispute",
              url: d.voice_note_url,
              duration: d.voice_note_duration,
              title: d.listing_title || "Dispute report",
              subtitle: `${(d.dispute_type || "issue").replace(/_/g, " ")} · ${d.status || "pending"}`,
              date: d.created_date,
            });
          }
        });

        // Member's own dating voice intro.
        const my = (mine && mine[0]) || null;
        if (my && my.voice_intro_url) {
          collected.push({
            id: "dating_self",
            type: "dating",
            url: my.voice_intro_url,
            duration: my.voice_intro_duration,
            title: my.full_name ? `${my.full_name} (You)` : "Your voice intro",
            subtitle: "Your dating voice intro",
            date: my.created_date,
          });
        }

        // Voice intros from matched members.
        const matched = (likes || []).filter((l) => l.matched);
        const matchIds = [...new Set(matched.map((l) => l.liked_profile_id))];
        await Promise.all(
          matchIds.map(async (id) => {
            if (!id) return;
            try {
              const p = await base44.entities.DatingProfile.get(id);
              if (p && p.voice_intro_url) {
                collected.push({
                  id: "dating_" + p.id,
                  type: "dating",
                  url: p.voice_intro_url,
                  duration: p.voice_intro_duration,
                  title: p.full_name || "Match",
                  subtitle: `Match · ${p.location || ""}`.trim(),
                  date: p.created_date,
                });
              }
            } catch { /* ignore missing */ }
          })
        );

        collected.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setItems(collected);
      } catch (e) {
        console.error("voice inbox load error", e);
      } finally {
        setLoading(false);
      }
    })();
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

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const disputeCount = items.filter((i) => i.type === "dispute").length;
  const datingCount = items.filter((i) => i.type === "dating").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Inbox size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// VOICE MESSAGE INBOX</p>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
          Your Voice <span style={{ color: "#D1FF26" }}>Messages</span>
        </h2>
        <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          All your recorded dispute reports and dating voice intros in one place — listen, replay, and manage every clip.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Clips" value={items.length} />
        <StatCard label="Dispute Reports" value={disputeCount} accent="#ef4444" />
        <StatCard label="Dating Intros" value={datingCount} accent="#D1FF26" />
      </div>

      <div className="flex gap-2">
        {[
          { id: "all", label: "All", count: items.length },
          { id: "dispute", label: "Disputes", count: disputeCount },
          { id: "dating", label: "Dating", count: datingCount },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all"
            style={{
              background: filter === f.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${filter === f.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
              color: filter === f.id ? "#D1FF26" : "#8A8F98",
            }}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-10 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
          <AudioLines size={28} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO VOICE MESSAGES YET</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>File a dispute with a voice note or record a dating voice intro to populate this inbox</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isPlaying = playingId === item.id;
            const isDispute = item.type === "dispute";
            const Icon = isDispute ? ShieldAlert : Heart;
            const accent = isDispute ? "#ef4444" : "#D1FF26";
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 flex items-center gap-3"
                style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${isPlaying ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.1)"}` }}
              >
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: `${accent}1a`, border: `0.5px solid ${accent}55` }}>
                  <Icon size={16} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{item.title}</p>
                  <p className="font-mono text-[9px] tracking-wide truncate" style={{ color: "#8A8F98" }}>{item.subtitle}</p>
                  <p className="font-mono text-[8px] mt-0.5" style={{ color: "rgba(138,143,152,0.5)" }}>{fmtDate(item.date)} · {fmtDur(item.duration)}</p>
                </div>
                <button
                  onClick={() => toggle(item)}
                  className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all flex-shrink-0"
                  style={{
                    background: isPlaying ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)",
                    border: `0.5px solid ${isPlaying ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.2)"}`,
                    color: "#D1FF26",
                  }}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />} {isPlaying ? "Pause" : "Play"}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div
      className="p-4 text-center"
      style={{ background: accent ? `${accent}10` : "rgba(16,20,29,0.6)", border: `0.5px solid ${accent ? `${accent}40` : "rgba(138,143,152,0.1)"}` }}
    >
      <p className="font-heading font-black text-xl" style={{ color: accent || "#F5F5F7" }}>{value}</p>
      <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>{label}</p>
    </div>
  );
}