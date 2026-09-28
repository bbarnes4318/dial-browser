import React, { useState, useRef, useEffect } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { Play, Pause, Loader2 } from "lucide-react";

// Plays a 30-second narration preview of an audiobook's first chapter audio.
// Purely client-side: it loads the existing chapter audio and caps playback at
// 30 seconds, so no separate preview file needs to be generated or stored.
const PREVIEW_SECONDS = 30;

export default function SnippetPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setElapsed(audio.currentTime);
      if (audio.currentTime >= PREVIEW_SECONDS) {
        audio.pause();
        audio.currentTime = 0;
        setPlaying(false);
        setElapsed(0);
      }
    };
    const onEnded = () => { setPlaying(false); setElapsed(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      audio.currentTime = 0;
      await audio.play();
      setPlaying(true);
    } catch {
      // autoplay/block — ignore
    }
    setLoading(false);
  };

  const remaining = Math.max(0, PREVIEW_SECONDS - elapsed);
  const pct = Math.min(100, (elapsed / PREVIEW_SECONDS) * 100);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggle}
        disabled={!url}
        title="Play 30s preview"
        className="flex items-center justify-center px-3 py-2.5 transition-all hover:scale-105 disabled:opacity-30"
        style={{ background: "rgba(66,225,246,0.08)", border: "0.5px solid rgba(66,225,246,0.3)", color: "#42E1F6" }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex flex-col">
        <span className="font-mono text-[7px] tracking-widest" style={{ color: "#42E1F6" }}>PREVIEW</span>
        <span className="font-mono text-[8px] tracking-wider" style={{ color: playing ? "#42E1F6" : "#8A8F98" }}>
          {playing ? `${Math.ceil(remaining)}s` : "30s"}
        </span>
      </div>
      <div className="hidden sm:block w-12 h-0.5" style={{ background: "rgba(66,225,246,0.15)" }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: "#42E1F6" }} />
      </div>
      {url && <audio ref={audioRef} src={proxyMediaUrl(url)} preload="metadata" />}
    </div>
  );
}