import React, { useState } from "react";
import { Share2, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TrackShareButton({ track, compact = false }) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (sharing || shared) return;
    setSharing(true);
    try {
      const shareUrl = `${window.location.origin}/artist/${encodeURIComponent(track.artist_name)}`;
      await navigator.clipboard?.writeText(shareUrl).catch(() => {});
      await base44.entities.ArtistTrack.update(track.id, {
        share_count: (track.share_count || 0) + 1,
      });
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // silent fail
    } finally {
      setSharing(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-1 px-2 py-1 font-mono text-[7px] tracking-widest uppercase transition-all flex-shrink-0"
        style={{
          background: shared ? "rgba(209,255,38,0.2)" : "rgba(209,255,38,0.06)",
          border: `0.5px solid ${shared ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.2)"}`,
          color: "#D1FF26",
        }}
      >
        {shared ? <Check size={8} /> : sharing ? <Loader2 size={8} className="animate-spin" /> : <Share2 size={8} />}
        {track.share_count || 0}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="flex items-center justify-center gap-1.5 px-3 py-3 font-mono text-[10px] tracking-widest uppercase transition-all flex-shrink-0"
      style={{
        background: shared ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)",
        border: `0.5px solid ${shared ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.2)"}`,
        color: "#D1FF26",
      }}
    >
      {shared ? <Check size={12} /> : sharing ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
      {shared ? "COPIED" : "SHARE"}
    </button>
  );
}