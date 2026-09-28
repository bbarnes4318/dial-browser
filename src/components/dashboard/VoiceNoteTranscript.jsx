import React, { useState } from "react";
import { FileText, Loader2, Mic } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Inline auto-transcription display for the admin dispute panels. Renders
// the stored transcript when present, or a "Transcribe" button the admin can
// click to generate (or regenerate) the transcript for a dispute that has a
// voice note but no transcript yet. Fires the transcribe-dispute-voice
// backend function, then calls onUpdated so the parent list reloads.
export default function VoiceNoteTranscript({ dispute, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!dispute.voice_note_url) return null;

  const transcribe = async () => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("transcribe-dispute-voice", { dispute_id: dispute.id, force: !dispute.voice_note_transcript });
      onUpdated?.();
    } catch {
      setError("Transcription failed — try again");
    } finally {
      setBusy(false);
    }
  };

  if (dispute.voice_note_transcript) {
    return (
      <div className="mb-2 p-2.5" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <FileText size={10} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>AUTO-TRANSCRIPTION</span>
          </div>
          <button onClick={transcribe} disabled={busy} className="font-mono text-[8px] tracking-widest uppercase disabled:opacity-40" style={{ color: "#8A8F98" }}>
            {busy ? "…" : "Re-run"}
          </button>
        </div>
        <p className="text-xs" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>{dispute.voice_note_transcript}</p>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <button
        onClick={transcribe}
        disabled={busy}
        className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase disabled:opacity-40"
        style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}
      >
        {busy ? <Loader2 size={10} className="animate-spin" /> : <Mic size={10} />} {busy ? "Transcribing…" : "Transcribe Voice Note"}
      </button>
      {error && <p className="font-mono text-[8px] mt-1" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}