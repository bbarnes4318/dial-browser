import React from "react";
import { Video, Headphones, Users, Clock, TrendingUp } from "lucide-react";

const formatDuration = (sec) => {
  if (!sec) return "0m";
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

const formatOffset = (sec) => {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  return `${m}m in`;
};

export default function SessionCard({ session, onSelect, isSelected }) {
  const isVideo = session.stream_mode === "video";
  const Icon = isVideo ? Video : Headphones;
  const date = session.started_at ? new Date(session.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <button
      onClick={() => onSelect(session)}
      className="w-full text-left p-4 transition-all"
      style={{
        background: isSelected ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.5)",
        border: `0.5px solid ${isSelected ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <Icon size={14} style={{ color: "#D1FF26" }} />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{session.stream_title || "Untitled Stream"}</p>
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{date}</p>
          </div>
        </div>
        {session.status === "active" && (
          <span className="flex items-center gap-1 px-2 py-0.5" style={{ background: "#ef4444" }}>
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="font-mono text-[7px] tracking-widest font-bold text-white">LIVE</span>
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5">
          <Users size={10} style={{ color: "#D1FF26" }} />
          <div>
            <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>PEAK</p>
            <p className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>{session.peak_listeners || 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={10} style={{ color: "#D1FF26" }} />
          <div>
            <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>DURATION</p>
            <p className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>{formatDuration(session.duration_seconds)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={10} style={{ color: "#D1FF26" }} />
          <div>
            <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>PEAK AT</p>
            <p className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>{formatOffset(session.peak_time_offset)}</p>
          </div>
        </div>
      </div>
    </button>
  );
}