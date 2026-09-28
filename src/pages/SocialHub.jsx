import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Images, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SocialVoiceSearch from "@/components/social/SocialVoiceSearch";
import SocialComposer from "@/components/social/SocialComposer";
import SocialPostCard from "@/components/social/SocialPostCard";
import SocialCreateProfile from "@/components/social/SocialCreateProfile";
import PortalShell from "@/components/social/portal/PortalShell";
import PortalProfileHeader from "@/components/social/portal/PortalProfileHeader";
import { PORTAL } from "@/components/social/portal/portalTheme";

export default function SocialHub() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState("following");
  const [profileTab, setProfileTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const profiles = await base44.entities.SocialProfile.filter({ owner_user_id: u.id });
        setMyProfile(profiles[0] || null);
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!myProfile) { setFeedLoading(false); return; }
    loadFeed();
  }, [myProfile, feedTab]);

  useEffect(() => {
    if (!myProfile) return;
    const unsub = base44.entities.SocialPost.subscribe((event) => {
      if (event.type === "create") setPosts((prev) => [event.data, ...prev.filter((p) => p.id !== event.data.id)]);
    });
    return unsub;
  }, [myProfile]);

  const loadFeed = async () => {
    setFeedLoading(true);
    try {
      let list;
      if (feedTab === "following") {
        const follows = await base44.entities.SocialFollow.filter({ follower_profile_id: myProfile.id });
        const followedIds = new Set(follows.map((f) => f.followed_profile_id));
        if (followedIds.size === 0) { setPosts([]); setFeedLoading(false); return; }
        list = await base44.entities.SocialPost.list("-created_date", 200);
        list = list.filter((p) => followedIds.has(p.author_profile_id));
      } else {
        list = await base44.entities.SocialPost.list("-created_date", 100);
        list = [...list].sort((a, b) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count));
      }
      setPosts(list);
    } catch {}
    setFeedLoading(false);
  };

  const onProfileCreated = (p) => setMyProfile(p);

  const filtered = searchQuery
    ? posts.filter((p) => {
        const q = searchQuery.toLowerCase();
        return p.text?.toLowerCase().includes(q) || p.author_handle?.toLowerCase().includes(q) || p.author_name?.toLowerCase().includes(q) || p.voice_note_transcript?.toLowerCase().includes(q);
      })
    : posts;

  // Profile-tab filtering (Posts / Reels=voice / Photos=media)
  const profileFiltered = (() => {
    if (profileTab === "reels") return filtered.filter((p) => p.voice_note_url);
    if (profileTab === "photos") return filtered.filter((p) => p.media_url);
    if (profileTab === "videos") return []; // no video posts yet
    if (profileTab === "tagged") return []; // tagging not implemented
    return filtered;
  })();

  const [likedIds, setLikedIds] = useState(new Set());
  useEffect(() => {
    if (!myProfile || filtered.length === 0) return;
    (async () => {
      try {
        const likes = await base44.entities.SocialLike.filter({ liker_profile_id: myProfile.id }, "-created_date", 200);
        setLikedIds(new Set(likes.map((l) => l.post_id)));
      } catch {}
    })();
  }, [myProfile, posts.length]);

  const handleVoiceCommand = (text) => {
    if (text === "__unsupported__") {
      setSearchQuery("");
      return;
    }
    setSearchQuery(text || "");
  };

  const likesCount = myProfile ? posts.reduce((sum, p) => sum + (p.like_count || 0), 0) : 0;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: PORTAL.bg }}><Loader2 size={24} className="animate-spin" style={{ color: PORTAL.cyan }} /></div>;
  }

  if (!myProfile) {
    return <SocialCreateProfile user={user} onCreated={onProfileCreated} />;
  }

  return (
    <PortalShell myProfile={myProfile} active="home" onVoiceCommand={handleVoiceCommand}>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 px-4 py-3 mb-3" style={{ background: "rgba(5,5,21,0.92)", borderBottom: "0.5px solid rgba(0,240,255,0.18)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: PORTAL.cyan }} />
            <h1 className="font-heading font-black text-lg" style={{ color: PORTAL.text }}>DIAL <span style={{ color: PORTAL.cyan }}>SOCIAL</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/community-gallery" className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all hover:shadow-[0_0_12px_rgba(255,0,255,0.25)]" style={{ background: "rgba(255,0,255,0.06)", border: "0.5px solid rgba(255,0,255,0.3)", color: PORTAL.magenta, borderRadius: 6 }}>
              <Images size={12} /> Gallery
            </Link>
            <Link to={`/social/profile/${myProfile.handle}`} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all hover:shadow-[0_0_12px_rgba(0,240,255,0.25)]" style={{ background: "rgba(0,240,255,0.06)", border: "0.5px solid rgba(0,240,255,0.3)", color: PORTAL.cyan, borderRadius: 6 }}>
              <Bell size={12} /> My Profile
            </Link>
          </div>
        </div>
        <SocialVoiceSearch onSearch={setSearchQuery} />
      </div>

      {/* Profile header (own) */}
      <PortalProfileHeader profile={myProfile} myProfile={myProfile} likesCount={likesCount} tab={profileTab} onTabChange={setProfileTab} onProfileUpdated={setMyProfile} />

      <div className="px-4 mt-4">
        {/* Feed tabs */}
        <div className="flex gap-1 mb-4">
          {["following", "discover"].map((t) => (
            <button key={t} onClick={() => setFeedTab(t)} className="flex-1 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all" style={feedTab === t ? { background: "rgba(0,240,255,0.12)", border: `0.5px solid ${PORTAL.cyan}`, color: PORTAL.cyan, borderRadius: 6 } : { background: "transparent", border: "0.5px solid rgba(255,255,255,0.08)", color: "#808090", borderRadius: 6 }}>
              {t === "following" ? "Following" : "Discover"}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div id="composer" className="mb-4">
          <SocialComposer profile={myProfile} onPosted={loadFeed} />
        </div>

        {/* Feed */}
        {feedLoading ? (
          <div className="text-center py-12"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: PORTAL.muted }} /></div>
        ) : profileFiltered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm mb-2" style={{ color: PORTAL.muted }}>{searchQuery ? "No results found." : profileTab !== "posts" ? `No ${profileTab} yet.` : feedTab === "following" ? "You're not following anyone yet." : "No posts yet."}</p>
            {feedTab === "following" && !searchQuery && profileTab === "posts" && <p className="text-xs" style={{ color: PORTAL.muted }}>Switch to Discover to find voices to follow.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {profileFiltered.map((post) => (
              <SocialPostCard key={post.id} post={post} myProfile={myProfile} liked={likedIds.has(post.id)} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}