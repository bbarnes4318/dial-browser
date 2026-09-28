import React, { useState, useEffect } from "react";
import { Users, Heart, Image as ImageIcon, MessageSquare, UserPlus, UserMinus, Settings, Mail, Share2, BadgeCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialVoicePlayer from "../SocialVoicePlayer";
import SocialEditProfile from "../SocialEditProfile";
import SocialChatWindow from "../SocialChatWindow";
import { PORTAL } from "./portalTheme";

const TABS = [
  { id: "posts", label: "Posts", Icon: MessageSquare },
  { id: "reels", label: "Reels", Icon: Heart },
  { id: "photos", label: "Photos", Icon: ImageIcon },
  { id: "videos", label: "Videos", Icon: ImageIcon },
  { id: "tagged", label: "Tagged", Icon: Users },
];

export default function PortalProfileHeader({ profile, myProfile, likesCount = 0, tab, onTabChange, onProfileUpdated }) {
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.follower_count || 0);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const isOwn = myProfile?.id === profile.id;
  const verified = profile.handle === "dialbrowser" || profile.handle === "dial";

  useEffect(() => {
    setFollowerCount(profile.follower_count || 0);
    if (!myProfile || isOwn) return;
    (async () => {
      try {
        const follows = await base44.entities.SocialFollow.filter({ follower_profile_id: myProfile.id, followed_profile_id: profile.id });
        setFollowing(follows.length > 0);
      } catch {}
    })();
  }, [profile.id, profile.follower_count, myProfile, isOwn]);

  const toggleFollow = async () => {
    if (!myProfile || loading) return;
    setLoading(true);
    try {
      if (following) {
        const follows = await base44.entities.SocialFollow.filter({ follower_profile_id: myProfile.id, followed_profile_id: profile.id });
        for (const f of follows) await base44.entities.SocialFollow.delete(f.id);
        setFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
        await base44.entities.SocialProfile.update(profile.id, { follower_count: Math.max(0, followerCount - 1) });
      } else {
        await base44.entities.SocialFollow.create({ follower_profile_id: myProfile.id, followed_profile_id: profile.id, follower_handle: myProfile.handle, followed_handle: profile.handle });
        setFollowing(true);
        setFollowerCount((c) => c + 1);
        await base44.entities.SocialProfile.update(profile.id, { follower_count: followerCount + 1 });
        await base44.entities.SocialProfile.update(myProfile.id, { following_count: (myProfile.following_count || 0) + 1 });
      }
    } catch {}
    setLoading(false);
  };

  const share = async () => {
    const url = `${window.location.origin}/social/profile/${profile.handle}`;
    try { await navigator.share({ title: `@${profile.handle} on Dial Social`, url }); } catch {}
  };

  return (
    <div className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(0,240,255,0.06) 0%, rgba(255,0,255,0.03) 40%, transparent 100%)", borderBottom: "0.5px solid rgba(0,240,255,0.18)" }}>
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/3" style={{ background: "linear-gradient(90deg, transparent, #00f0ff, #ff00ff, transparent)", animation: "tickerScroll 5s linear infinite" }} />
      </div>
      <div className="px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with neon glow ring */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(0,240,255,0.28), transparent 70%)" }} />
            <div className="relative w-24 h-24 overflow-hidden" style={{ border: `1.5px solid ${PORTAL.cyan}`, borderRadius: "50%", boxShadow: "0 0 30px rgba(0,240,255,0.3)" }}>
              {profile.avatar_url ? (
                <img src={proxyMediaUrl(profile.avatar_url)} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(0,240,255,0.08)" }}>
                  <span className="font-heading font-black text-3xl" style={{ color: PORTAL.cyan }}>{profile.display_name?.[0]?.toUpperCase() || "?"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="font-heading font-black text-2xl" style={{ color: PORTAL.text, textShadow: "0 0 20px rgba(0,240,255,0.2)" }}>{profile.display_name}</h1>
              {verified && <BadgeCheck size={18} style={{ color: "#00f0ff", filter: "drop-shadow(0 0 6px rgba(0,240,255,0.6))" }} />}
            </div>
            <p className="font-mono text-sm tracking-wider mb-1" style={{ color: PORTAL.cyan }}>@{profile.handle}</p>
            {profile.bio && <p className="text-sm leading-relaxed mb-3 max-w-md" style={{ color: "#c8c8d0" }}>{profile.bio}</p>}

            {/* Stats row */}
            <div className="flex items-center justify-center sm:justify-start gap-5 mb-4">
              <Stat label="Posts" value={profile.post_count || 0} />
              <Stat label="Followers" value={followerCount} />
              <Stat label="Following" value={profile.following_count || 0} />
              <Stat label="Likes" value={likesCount} accent />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              {!isOwn && myProfile && (
                <>
                  <button onClick={toggleFollow} disabled={loading} className="flex items-center gap-2 px-5 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(255,0,255,0.35)] disabled:opacity-40" style={following ? { background: "transparent", border: `0.5px solid ${PORTAL.magenta}`, color: PORTAL.magenta, borderRadius: 6 } : { background: "linear-gradient(135deg,#00f0ff,#ff00ff)", color: "#050515", borderRadius: 6 }}>
                    {following ? <><UserMinus size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
                  </button>
                  <button onClick={() => setChatOpen(true)} className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(0,240,255,0.3)]" style={{ background: "rgba(0,240,255,0.08)", border: `0.5px solid ${PORTAL.cyan}`, color: PORTAL.cyan, borderRadius: 6 }}>
                    <Mail size={12} /> Message
                  </button>
                </>
              )}
              {isOwn && (
                <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 px-5 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(0,240,255,0.3)]" style={{ background: "rgba(0,240,255,0.08)", border: `0.5px solid rgba(0,240,255,0.4)`, color: PORTAL.cyan, borderRadius: 6 }}>
                  <Settings size={12} /> Edit Profile
                </button>
              )}
              <button onClick={share} className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:opacity-80" style={{ background: "rgba(255,0,255,0.06)", border: `0.5px solid ${PORTAL.magenta}`, color: PORTAL.magenta, borderRadius: 6 }}>
                <Share2 size={12} /> Share
              </button>
            </div>
          </div>
        </div>

        {profile.voice_greeting_url && (
          <div className="mt-5">
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: PORTAL.cyan }}>// VOICE GREETING</p>
            <SocialVoicePlayer url={profile.voice_greeting_url} transcript={profile.voice_greeting_transcript} />
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 mt-5 overflow-x-auto" style={{ borderTop: "0.5px solid rgba(0,240,255,0.1)", paddingTop: 4 }}>
          {TABS.map(({ id, label, Icon }) => {
            const isActive = tab === id;
            return (
              <button key={id} onClick={() => onTabChange?.(id)} className="flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition-all" style={{ borderBottom: isActive ? `2px solid ${PORTAL.cyan}` : "2px solid transparent" }}>
                <Icon size={13} style={{ color: isActive ? PORTAL.cyan : "#808090" }} />
                <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: isActive ? PORTAL.cyan : "#808090" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {editOpen && <SocialEditProfile profile={profile} onClose={() => setEditOpen(false)} onSaved={(u) => { onProfileUpdated?.(u); setEditOpen(false); }} />}
      {chatOpen && myProfile && <SocialChatWindow myProfile={myProfile} theirProfile={profile} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="flex flex-col">
      <span className="font-heading font-black text-lg leading-none" style={{ color: accent ? PORTAL.magenta : PORTAL.text, textShadow: accent ? "0 0 12px rgba(255,0,255,0.4)" : "0 0 12px rgba(0,240,255,0.2)" }}>{value}</span>
      <span className="font-mono text-[9px] tracking-wider uppercase mt-1" style={{ color: PORTAL.muted }}>{label}</span>
    </div>
  );
}