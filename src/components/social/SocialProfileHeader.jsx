import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Heart, MessageSquare, Share2, UserPlus, UserMinus, Settings, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialVoicePlayer from "./SocialVoicePlayer";
import SocialEditProfile from "./SocialEditProfile";
import SocialChatWindow from "./SocialChatWindow";

/**
 * Holographic profile header with stats, follow toggle, and share.
 */
export default function SocialProfileHeader({ profile, myProfile, onFollowChange, onProfileUpdated }) {
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.follower_count || 0);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const isOwn = myProfile?.id === profile.id;

  useEffect(() => {
    setFollowerCount(profile.follower_count || 0);
    if (!myProfile || isOwn) return;
    (async () => {
      try {
        const follows = await base44.entities.SocialFollow.filter({
          follower_profile_id: myProfile.id,
          followed_profile_id: profile.id,
        });
        setFollowing(follows.length > 0);
      } catch {}
    })();
  }, [profile.id, profile.follower_count, myProfile, isOwn]);

  const toggleFollow = async () => {
    if (!myProfile || loading) return;
    setLoading(true);
    try {
      if (following) {
        const follows = await base44.entities.SocialFollow.filter({
          follower_profile_id: myProfile.id,
          followed_profile_id: profile.id,
        });
        for (const f of follows) await base44.entities.SocialFollow.delete(f.id);
        setFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
        await base44.entities.SocialProfile.update(profile.id, { follower_count: Math.max(0, followerCount - 1) });
      } else {
        await base44.entities.SocialFollow.create({
          follower_profile_id: myProfile.id,
          followed_profile_id: profile.id,
          follower_handle: myProfile.handle,
          followed_handle: profile.handle,
        });
        setFollowing(true);
        setFollowerCount((c) => c + 1);
        await base44.entities.SocialProfile.update(profile.id, { follower_count: followerCount + 1 });
        await base44.entities.SocialProfile.update(myProfile.id, { following_count: (myProfile.following_count || 0) + 1 });
      }
      onFollowChange?.();
    } catch {}
    setLoading(false);
  };

  const profileUrl = `${window.location.origin}/social/profile/${profile.handle}`;
  const share = async () => {
    try { await navigator.share({ title: `@${profile.handle} on Dial Social`, url: profileUrl }); } catch {}
  };

  return (
    <div className="relative" style={{ background: "linear-gradient(180deg, rgba(209,255,38,0.04) 0%, transparent 100%)" }}>
      {/* Holographic glow border */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with glow ring */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(209,255,38,0.2), transparent 70%)" }} />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 overflow-hidden" style={{ border: "1px solid rgba(209,255,38,0.4)", boxShadow: "0 0 30px rgba(209,255,38,0.15)" }}>
              {profile.avatar_url ? (
                <img src={proxyMediaUrl(profile.avatar_url)} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(209,255,38,0.06)" }}>
                  <span className="font-heading font-black text-3xl" style={{ color: "#D1FF26" }}>{profile.display_name?.[0]?.toUpperCase() || "?"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Identity + stats */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-heading font-black text-2xl sm:text-3xl mb-1" style={{ color: "#F5F5F7", textShadow: "0 0 20px rgba(209,255,38,0.15)" }}>
              {profile.display_name}
            </h1>
            <p className="font-mono text-sm tracking-wider mb-2" style={{ color: "#D1FF26" }}>@{profile.handle}</p>
            {profile.bio && <p className="text-sm leading-relaxed mb-4 max-w-md" style={{ color: "#8A8F98" }}>{profile.bio}</p>}

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
              <Stat icon={MessageSquare} label="Posts" value={profile.post_count || 0} />
              <Stat icon={Users} label="Followers" value={followerCount} />
              <Stat icon={Heart} label="Following" value={profile.following_count || 0} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {!isOwn && myProfile && (
                <>
                  <button onClick={toggleFollow} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)] disabled:opacity-40" style={following ? { background: "transparent", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" } : { background: "#D1FF26", color: "#05070A" }}>
                    {following ? <><UserMinus size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
                  </button>
                  <button onClick={() => setChatOpen(true)} className="flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(66,225,246,0.3)]" style={{ background: "rgba(66,225,246,0.08)", border: "0.5px solid rgba(66,225,246,0.3)", color: "#42E1F6" }}>
                    <Mail size={12} /> Message
                  </button>
                </>
              )}
              {isOwn && (
                <>
                  <Link to="/social" className="flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                    Feed
                  </Link>
                  <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                    <Settings size={12} /> Edit Profile
                  </button>
                </>
              )}
              <button onClick={share} className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:opacity-80" style={{ background: "rgba(66,225,246,0.08)", border: "0.5px solid rgba(66,225,246,0.3)", color: "#42E1F6" }}>
                <Share2 size={12} /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Voice greeting */}
        {profile.voice_greeting_url && (
          <div className="mt-6">
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#42E1F6" }}>// VOICE GREETING</p>
            <SocialVoicePlayer url={profile.voice_greeting_url} transcript={profile.voice_greeting_transcript} />
          </div>
        )}
      </div>

      {editOpen && (
        <SocialEditProfile
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            onProfileUpdated?.(updated);
            setEditOpen(false);
          }}
        />
      )}

      {chatOpen && myProfile && (
        <SocialChatWindow
          myProfile={myProfile}
          theirProfile={profile}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center sm:flex-row sm:gap-1.5">
      <Icon size={13} style={{ color: "#8A8F98" }} />
      <span className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{value}</span>
      <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "#8A8F98" }}>{label}</span>
    </div>
  );
}