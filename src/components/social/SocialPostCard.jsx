import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageSquare, Share2, Bookmark, BadgeCheck, Loader2, Smile } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialVoicePlayer from "./SocialVoicePlayer";
import SocialCommentThread from "./SocialCommentThread";
import { PORTAL } from "./portal/portalTheme";

/**
 * Neon-cyberpunk post card — cyan/magenta glass with verified badge, Save,
 * and an inline comment composer row.
 */
export default function SocialPostCard({ post, myProfile, liked }) {
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [isLiked, setIsLiked] = useState(!!liked);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);

  const verified = post.author_handle === "dialbrowser" || post.author_handle === "dial";

  const toggleLike = async () => {
    if (!myProfile || likeLoading) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        const likes = await base44.entities.SocialLike.filter({ post_id: post.id, liker_profile_id: myProfile.id });
        for (const l of likes) await base44.entities.SocialLike.delete(l.id);
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
        await base44.entities.SocialPost.update(post.id, { like_count: Math.max(0, likeCount - 1) });
      } else {
        await base44.entities.SocialLike.create({ post_id: post.id, liker_profile_id: myProfile.id, liker_handle: myProfile.handle });
        setIsLiked(true);
        setLikeCount((c) => c + 1);
        await base44.entities.SocialPost.update(post.id, { like_count: likeCount + 1 });
      }
    } catch {}
    setLikeLoading(false);
  };

  const share = async () => {
    const url = `${window.location.origin}/social/profile/${post.author_handle}`;
    try {
      if (navigator.share) await navigator.share({ title: "Dial Social", text: post.text?.slice(0, 100), url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch {}
    try { await base44.entities.SocialPost.update(post.id, { share_count: (post.share_count || 0) + 1 }); } catch {}
  };

  const toggleSave = () => setSaved((s) => !s);

  const timeAgo = post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : "";

  return (
    <div
      className="relative p-4 transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgba(0,240,255,0.05) 0%, rgba(10,10,30,0.6) 50%, rgba(255,0,255,0.05) 100%)",
        border: "0.5px solid rgba(0,240,255,0.2)",
        boxShadow: "0 0 24px rgba(0,240,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(8px)",
        borderRadius: 10,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 40px rgba(0,240,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(0,240,255,0.4)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(0,240,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(0,240,255,0.2)"; }}
    >
      {/* Holographic top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden pointer-events-none rounded-t-[10px]">
        <div className="h-full w-1/3" style={{ background: "linear-gradient(90deg, transparent, #00f0ff, #ff00ff, transparent)", animation: "tickerScroll 6s linear infinite" }} />
      </div>

      {/* Author */}
      <Link to={`/social/profile/${post.author_handle}`} className="flex items-center gap-3 mb-3 group">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(0,240,255,0.2), transparent 70%)" }} />
          <div className="relative w-10 h-10 overflow-hidden" style={{ border: `0.5px solid ${PORTAL.cyan}`, borderRadius: "50%", boxShadow: "0 0 12px rgba(0,240,255,0.15)" }}>
            {post.author_avatar ? (
              <img src={proxyMediaUrl(post.author_avatar)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold" style={{ background: "rgba(0,240,255,0.08)", color: PORTAL.cyan }}>{post.author_name?.[0]}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm group-hover:opacity-80 transition-opacity" style={{ color: PORTAL.text, textShadow: "0 0 10px rgba(0,240,255,0.1)" }}>{post.author_name}</p>
          {verified && <BadgeCheck size={14} style={{ color: PORTAL.cyan, filter: "drop-shadow(0 0 5px rgba(0,240,255,0.6))" }} />}
        </div>
        <p className="font-mono text-[10px] tracking-wider" style={{ color: PORTAL.muted }}>@{post.author_handle} · {timeAgo}</p>
      </Link>

      {/* Text */}
      {post.text && <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: "#e8e8f0" }}>{post.text}</p>}

      {/* Image */}
      {post.media_url && (
        <div className="mb-3 overflow-hidden" style={{ border: `0.5px solid ${PORTAL.magenta}`, boxShadow: "0 0 20px rgba(255,0,255,0.1)", borderRadius: 8 }}>
          <img src={proxyMediaUrl(post.media_url)} alt="" className="w-full max-h-96 object-cover" />
        </div>
      )}

      {/* Voice note */}
      {post.voice_note_url && (
        <div className="mb-3">
          <SocialVoicePlayer url={post.voice_note_url} transcript={post.voice_note_transcript} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2" style={{ borderTop: "0.5px solid rgba(0,240,255,0.1)" }}>
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-40"
          style={isLiked ? { color: PORTAL.magenta, textShadow: "0 0 10px rgba(255,0,255,0.4)" } : { color: PORTAL.muted }}
        >
          {likeLoading ? <Loader2 size={13} className="animate-spin" /> : <Heart size={14} fill={isLiked ? PORTAL.magenta : "none"} />} {likeCount}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:scale-105"
          style={showComments ? { color: PORTAL.cyan, textShadow: "0 0 10px rgba(0,240,255,0.4)" } : { color: PORTAL.muted }}
        >
          <MessageSquare size={14} /> {commentCount}
        </button>
        <button
          onClick={share}
          className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:scale-105"
          style={shared ? { color: PORTAL.cyan } : { color: PORTAL.muted }}
        >
          <Share2 size={14} /> {shared ? "Copied" : "Share"}
        </button>
        <button
          onClick={toggleSave}
          className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all hover:scale-105 ml-auto"
          style={saved ? { color: PORTAL.cyan, textShadow: "0 0 10px rgba(0,240,255,0.4)" } : { color: PORTAL.muted }}
        >
          <Bookmark size={14} fill={saved ? PORTAL.cyan : "none"} /> {saved ? "Saved" : "Save"}
        </button>
      </div>

      {/* Inline comment trigger row */}
      {myProfile && !showComments && (
        <button onClick={() => setShowComments(true)} className="flex items-center gap-2 w-full mt-3 px-3 py-2 text-left text-xs transition-all hover:shadow-[0_0_12px_rgba(0,240,255,0.2)]" style={{ background: "rgba(0,240,255,0.04)", border: "0.5px solid rgba(0,240,255,0.15)", color: PORTAL.muted, borderRadius: 6 }}>
          <Smile size={13} style={{ color: PORTAL.muted }} />
          <span>Add a comment…</span>
          <span className="ml-auto font-mono text-[10px] tracking-widest uppercase" style={{ color: PORTAL.cyan }}>Post</span>
        </button>
      )}

      {/* Comments */}
      {showComments && (
        <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid rgba(0,240,255,0.1)" }}>
          <SocialCommentThread postId={post.id} myProfile={myProfile} onCountChange={setCommentCount} />
        </div>
      )}
    </div>
  );
}