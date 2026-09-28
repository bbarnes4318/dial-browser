import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, MessageSquare, Share2, Loader2, Users, TrendingUp, Mic } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import SocialVoicePlayer from "@/components/social/SocialVoicePlayer";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

/**
 * Public landing feed — shows the most popular posts from different members.
 * Read-only (no like/comment actions) so it works for logged-out visitors.
 */
export default function PopularSocialFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await base44.entities.SocialPost.filter({}, "-like_count", 30);
        if (cancelled) return;
        // Deduplicate to 1 post per author for maximum variety across users
        const seen = new Set();
        const unique = [];
        for (const p of all || []) {
          if (p.author_handle && !seen.has(p.author_handle)) {
            seen.add(p.author_handle);
            unique.push(p);
          }
          if (unique.length >= 8) break;
        }
        // Backfill if not enough unique authors
        if (unique.length < 6 && (all || []).length > unique.length) {
          for (const p of all || []) {
            if (!unique.includes(p)) unique.push(p);
            if (unique.length >= 8) break;
          }
        }
        setPosts(unique);
      } catch {
        /* non-blocking */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="relative py-16 lg:py-20 overflow-hidden" style={{ background: "#05070A" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,255,255,0.04) 0%, transparent 50%)" }} />

      <div className="relative z-10 px-4 lg:px-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5" style={{ background: "rgba(0,255,255,0.06)", border: "0.5px solid rgba(0,255,255,0.25)" }}>
            <TrendingUp size={12} style={{ color: "#00FFFF" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#00FFFF" }}>// TRENDING ON DIAL SOCIAL</span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Voices from the <span style={{ color: "#00FFFF" }}>Network</span>
          </h2>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            The most popular posts from members across Dial Social — text, voice notes, and photos from real people, one call away.
          </p>
        </motion.div>

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "#00FFFF" }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4" style={{ background: "rgba(0,255,255,0.06)", border: "0.5px solid rgba(0,255,255,0.2)" }}>
              <Users size={28} style={{ color: "#00FFFF" }} />
            </div>
            <p className="font-heading font-bold text-lg mb-2" style={{ color: "#F5F5F7" }}>Be the first voice on the network</p>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              No posts yet. Join Dial Social, record a voice note, and your post could be featured here.
            </p>
            <button onClick={() => openRegistrationModal()} className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#00FFFF", color: "#05070A" }}>
              Join the Network
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post, idx) => (
                <PopularPostCard key={post.id} post={post} delay={idx * 0.08} />
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-10 text-center"
            >
              <p className="text-sm mb-4" style={{ color: "#8A8F98" }}>
                Want to post your own voice notes and join the conversation?
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={() => openRegistrationModal()} className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]" style={{ background: "#00FFFF", color: "#05070A" }}>
                  Join Dial Social
                </button>
                <Link to="/social" className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:border-[rgba(0,255,255,0.5)]" style={{ border: "0.5px solid rgba(0,255,255,0.3)", color: "#00FFFF", background: "transparent" }}>
                  Browse All Posts
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * Read-only popular post card — holographic cyan/magenta style matching the social hub.
 */
function PopularPostCard({ post, delay }) {
  const timeAgo = post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="relative p-4 transition-all duration-300 hover:border-[rgba(0,255,255,0.4)]"
      style={{
        background: "linear-gradient(135deg, rgba(0,255,255,0.04) 0%, rgba(10,13,20,0.6) 50%, rgba(204,0,255,0.04) 100%)",
        border: "0.5px solid rgba(0,255,255,0.2)",
        boxShadow: "0 0 24px rgba(0,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Holographic top accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden pointer-events-none">
        <div className="h-full w-1/3" style={{ background: "linear-gradient(90deg, transparent, #00FFFF, #CC00FF, transparent)", animation: "tickerScroll 6s linear infinite" }} />
      </div>

      {/* Author */}
      <Link to={`/social/profile/${post.author_handle}`} className="flex items-center gap-3 mb-3 group">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, rgba(0,255,255,0.2), transparent 70%)" }} />
          <div className="relative w-10 h-10 overflow-hidden" style={{ border: "0.5px solid rgba(0,255,255,0.4)", boxShadow: "0 0 12px rgba(0,255,255,0.15)" }}>
            {post.author_avatar ? (
              <img src={proxyMediaUrl(post.author_avatar)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold" style={{ background: "rgba(0,255,255,0.08)", color: "#00FFFF" }}>{post.author_name?.[0]}</div>
            )}
          </div>
        </div>
        <div>
          <p className="font-semibold text-sm group-hover:opacity-80 transition-opacity" style={{ color: "#F5F5F7", textShadow: "0 0 10px rgba(0,255,255,0.1)" }}>{post.author_name}</p>
          <p className="font-mono text-[10px] tracking-wider" style={{ color: "#00FFFF" }}>@{post.author_handle} · {timeAgo}</p>
        </div>
      </Link>

      {/* Text */}
      {post.text && <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap line-clamp-4" style={{ color: "#F5F5F7" }}>{post.text}</p>}

      {/* Image */}
      {post.media_url && (
        <div className="mb-3 overflow-hidden" style={{ border: "0.5px solid rgba(204,0,255,0.25)", boxShadow: "0 0 20px rgba(204,0,255,0.08)" }}>
          <img src={proxyMediaUrl(post.media_url)} alt="" className="w-full max-h-72 object-cover" />
        </div>
      )}

      {/* Voice note */}
      {post.voice_note_url && (
        <div className="mb-3">
          <SocialVoicePlayer url={post.voice_note_url} transcript={post.voice_note_transcript} compact />
        </div>
      )}

      {/* Engagement stats (display only) */}
      <div className="flex items-center gap-4 pt-2" style={{ borderTop: "0.5px solid rgba(0,255,255,0.1)" }}>
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider" style={{ color: "#CC00FF" }}>
          <Heart size={14} fill="#CC00FF" /> {post.like_count || 0}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider" style={{ color: "#00FFFF" }}>
          <MessageSquare size={14} /> {post.comment_count || 0}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider" style={{ color: "#8A8F98" }}>
          <Share2 size={14} /> {post.share_count || 0}
        </div>
        {post.voice_note_url && (
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ml-auto" style={{ color: "#00FFFF" }}>
            <Mic size={12} /> Voice
          </div>
        )}
      </div>
    </motion.div>
  );
}