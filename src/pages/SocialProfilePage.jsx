import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SocialComposer from "@/components/social/SocialComposer";
import SocialPostCard from "@/components/social/SocialPostCard";
import PortalShell from "@/components/social/portal/PortalShell";
import PortalProfileHeader from "@/components/social/portal/PortalProfileHeader";
import { PORTAL } from "@/components/social/portal/portalTheme";

export default function SocialProfilePage() {
  const { handle } = useParams();
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [tab, setTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const mine = await base44.entities.SocialProfile.filter({ owner_user_id: u.id });
        setMyProfile(mine[0] || null);
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!handle) return;
    (async () => {
      try {
        const found = await base44.entities.SocialProfile.filter({ handle });
        if (found.length > 0) setProfile(found[0]);
      } catch {}
    })();
  }, [handle]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setPostsLoading(true);
      try {
        const list = await base44.entities.SocialPost.filter({ author_profile_id: profile.id }, "-created_date", 100);
        setPosts(list);
      } catch {}
      setPostsLoading(false);
    })();
    const unsub = base44.entities.SocialPost.subscribe((event) => {
      if (event.type === "create" && event.data.author_profile_id === profile.id) setPosts((prev) => [event.data, ...prev]);
    });
    return unsub;
  }, [profile]);

  useEffect(() => {
    if (!myProfile || posts.length === 0) return;
    (async () => {
      try {
        const likes = await base44.entities.SocialLike.filter({ liker_profile_id: myProfile.id }, "-created_date", 200);
        setLikedIds(new Set(likes.map((l) => l.post_id)));
      } catch {}
    })();
  }, [myProfile, posts.length]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: PORTAL.bg }}><Loader2 size={24} className="animate-spin" style={{ color: PORTAL.cyan }} /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: PORTAL.bg }}>
        <p className="text-sm" style={{ color: PORTAL.muted }}>Profile not found.</p>
        <Link to="/social" className="font-mono text-[10px] tracking-widest uppercase px-4 py-2" style={{ background: "rgba(0,240,255,0.08)", border: `0.5px solid ${PORTAL.cyan}`, color: PORTAL.cyan, borderRadius: 6 }}>Back to Social</Link>
      </div>
    );
  }

  const isOwn = myProfile?.id === profile.id;

  const filtered = searchQuery
    ? posts.filter((p) => p.text?.toLowerCase().includes(searchQuery.toLowerCase()) || p.voice_note_transcript?.toLowerCase().includes(searchQuery.toLowerCase()))
    : posts;

  const tabFiltered = (() => {
    if (tab === "reels") return filtered.filter((p) => p.voice_note_url);
    if (tab === "photos") return filtered.filter((p) => p.media_url);
    if (tab === "videos" || tab === "tagged") return [];
    return filtered;
  })();

  const reloadPosts = async () => {
    try {
      const list = await base44.entities.SocialPost.filter({ author_profile_id: profile.id }, "-created_date", 100);
      setPosts(list);
    } catch {}
  };

  const likesCount = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);

  return (
    <PortalShell myProfile={myProfile} active="profile" onVoiceCommand={setSearchQuery}>
      <div className="sticky top-0 z-30 px-4 py-3 mb-3" style={{ background: "rgba(5,5,21,0.92)", borderBottom: "0.5px solid rgba(0,240,255,0.18)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-3">
          <Link to="/social" className="p-1.5 transition-all hover:opacity-80" style={{ color: PORTAL.muted }}>
            <ArrowLeft size={18} />
          </Link>
          <p className="font-mono text-xs tracking-wider" style={{ color: PORTAL.cyan }}>@{profile.handle}</p>
        </div>
      </div>

      <PortalProfileHeader profile={profile} myProfile={myProfile} likesCount={likesCount} tab={tab} onTabChange={setTab} onProfileUpdated={setProfile} />

      <div className="px-4 mt-4">
        {isOwn && (
          <div id="composer" className="mb-4">
            <SocialComposer profile={myProfile} onPosted={reloadPosts} />
          </div>
        )}

        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: PORTAL.muted }}>// {isOwn ? "YOUR POSTS" : "POSTS"}</p>

        {postsLoading ? (
          <div className="text-center py-12"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: PORTAL.muted }} /></div>
        ) : tabFiltered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: PORTAL.muted }}>{tab !== "posts" ? `No ${tab} yet.` : isOwn ? "You haven't posted yet. Share your voice above." : "No posts yet."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tabFiltered.map((post) => (
              <SocialPostCard key={post.id} post={post} myProfile={myProfile} liked={likedIds.has(post.id)} />
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}