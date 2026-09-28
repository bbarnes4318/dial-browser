import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Radio, ArrowUpRight } from "lucide-react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialVoicePlayer from "./SocialVoicePlayer";

/**
 * 5K holographic community gallery card — human portrait cover, neon
 * cyan/magenta glassmorphism, and a voice-enabled preview of the
 * member's latest voice post.
 */
export default function GalleryProfileCard({ profile, latestVoicePost, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const showImage = profile.avatar_url && !imgError;

  return (
    <div
      className="relative flex flex-col overflow-hidden transition-all duration-300 group"
      style={{
        background: "linear-gradient(160deg, rgba(0,255,255,0.05) 0%, rgba(10,13,20,0.7) 45%, rgba(204,0,255,0.05) 100%)",
        border: "0.5px solid rgba(0,255,255,0.22)",
        boxShadow: "0 0 28px rgba(0,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 48px rgba(0,255,255,0.14), inset 0 1px 0 rgba(255,255,255,0.05)";
        e.currentTarget.style.borderColor = "rgba(0,255,255,0.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 28px rgba(0,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(0,255,255,0.22)";
      }}
    >
      {/* Holographic top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden pointer-events-none z-10">
        <div
          className="h-full w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, #00FFFF, #CC00FF, transparent)",
            animation: `tickerScroll ${6 + (index % 3)}s linear infinite`,
          }}
        />
      </div>

      {/* Human portrait cover */}
      <Link to={`/social/profile/${profile.handle}`} className="relative block aspect-[4/5] overflow-hidden">
        {showImage ? (
          <img
            src={proxyMediaUrl(profile.avatar_url)}
            alt={profile.display_name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ filter: "saturate(0.95) brightness(0.96)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(160deg, rgba(0,255,255,0.1), rgba(204,0,255,0.1))" }}>
            <span className="font-heading font-black text-5xl" style={{ color: "#00FFFF", textShadow: "0 0 20px rgba(0,255,255,0.4)" }}>
              {profile.display_name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        {/* Scanline / holographic overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent 55%, rgba(5,7,10,0.85) 100%), repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,255,255,0.03) 3px, rgba(0,255,255,0.03) 4px)",
            mixBlendMode: "screen",
          }}
        />
        {/* Handle chip */}
        <div className="absolute top-3 left-3 px-2 py-1 font-mono text-[9px] tracking-widest" style={{ background: "rgba(5,7,10,0.7)", border: "0.5px solid rgba(0,255,255,0.35)", color: "#00FFFF", boxShadow: "0 0 10px rgba(0,255,255,0.15)" }}>
          @{profile.handle}
        </div>
        {/* Open-profile affordance */}
        <div className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(5,7,10,0.7)", border: "0.5px solid rgba(0,255,255,0.4)" }}>
          <ArrowUpRight size={13} style={{ color: "#00FFFF" }} />
        </div>
      </Link>

      {/* Identity + stats */}
      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/social/profile/${profile.handle}`} className="mb-1">
          <h3 className="font-heading font-bold text-lg leading-tight transition-opacity group-hover:opacity-80" style={{ color: "#F5F5F7", textShadow: "0 0 12px rgba(0,255,255,0.12)" }}>
            {profile.display_name}
          </h3>
        </Link>
        {profile.bio && (
          <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "#8A8F98" }}>{profile.bio}</p>
        )}

        <div className="flex items-center gap-4 mb-3 font-mono text-[10px] tracking-wider uppercase" style={{ color: "#8A8F98" }}>
          <span className="flex items-center gap-1"><Users size={11} style={{ color: "#00FFFF" }} /> {profile.follower_count || 0} followers</span>
          <span className="flex items-center gap-1"><Radio size={11} style={{ color: "#CC00FF" }} /> {profile.post_count || 0} posts</span>
        </div>

        {/* Voice-enabled post preview */}
        {latestVoicePost && (
          <div className="mt-auto pt-3" style={{ borderTop: "0.5px solid rgba(0,255,255,0.12)" }}>
            <p className="font-mono text-[8px] tracking-widest mb-2" style={{ color: "#00FFFF" }}>// LATEST VOICE POST</p>
            {latestVoicePost.text && (
              <p className="text-[11px] leading-snug mb-2 line-clamp-2" style={{ color: "#8A8F98" }}>{latestVoicePost.text}</p>
            )}
            <SocialVoicePlayer url={latestVoicePost.voice_note_url} transcript={latestVoicePost.voice_note_transcript} compact />
          </div>
        )}

        <Link
          to={`/social/profile/${profile.handle}`}
          className="mt-3 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_14px_rgba(0,255,255,0.3)]"
          style={{ background: "rgba(0,255,255,0.06)", border: "0.5px solid rgba(0,255,255,0.35)", color: "#00FFFF" }}
        >
          View Profile <ArrowUpRight size={11} />
        </Link>
      </div>
    </div>
  );
}