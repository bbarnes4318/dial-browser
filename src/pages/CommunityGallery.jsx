import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Users, Radio, Home } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GalleryProfileCard from "@/components/social/GalleryProfileCard";

/**
 * Public community gallery — highlights active Dial Social profiles that
 * feature a real human portrait (avatar_url), rendered as 5K holographic
 * cards with voice-enabled previews of each member's latest voice post.
 */
export default function CommunityGallery() {
  const [profiles, setProfiles] = useState([]);
  const [voicePosts, setVoicePosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("featured"); // featured | followers | recent

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.SocialProfile.filter({ active: true }, "-created_date", 200);
        // Only profiles with a real human portrait (avatar_url) — drop placeholder-only ones
        const withAvatars = all.filter((p) => p.avatar_url && p.avatar_url.trim());
        setProfiles(withAvatars);

        // Batch-load recent posts and index the latest voice post per author
        const posts = await base44.entities.SocialPost.list("-created_date", 200);
        const byAuthor = {};
        for (const post of posts) {
          if (!post.voice_note_url) continue;
          const key = post.author_profile_id;
          if (!byAuthor[key]) byAuthor[key] = post;
        }
        setVoicePosts(byAuthor);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const sorted = [...profiles].sort((a, b) => {
    if (sort === "followers") return (b.follower_count || 0) - (a.follower_count || 0);
    if (sort === "recent") return new Date(b.created_date) - new Date(a.created_date);
    // featured: profiles with a voice post first, then by followers
    const av = voicePosts[a.id] ? 1 : 0;
    const bv = voicePosts[b.id] ? 1 : 0;
    if (av !== bv) return bv - av;
    return (b.follower_count || 0) - (a.follower_count || 0);
  });

  const totalVoices = sorted.filter((p) => voicePosts[p.id]).length;

  return (
    <div className="min-h-screen pb-16" style={{ background: "#05070A" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between"
        style={{ background: "rgba(5,7,10,0.92)", borderBottom: "0.5px solid rgba(0,255,255,0.18)", backdropFilter: "blur(10px)" }}
      >
        <Link to="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(0,255,255,0.08)]" style={{ border: "0.5px solid rgba(0,255,255,0.25)", color: "#00FFFF" }}>
          <Home size={12} /> Home
        </Link>
        <p className="font-heading font-black text-base sm:text-lg" style={{ color: "#F5F5F7" }}>
          COMMUNITY <span style={{ color: "#00FFFF" }}>GALLERY</span>
        </p>
        <Link to="/social" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_14px_rgba(209,255,38,0.3)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
          <Sparkles size={12} /> Feed
        </Link>
      </header>

      {/* Hero */}
      <section className="relative px-4 lg:px-8 pt-12 lg:pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.5), transparent)" }} />
          <div className="absolute top-2/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(204,0,255,0.4), transparent)" }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users size={14} style={{ color: "#00FFFF" }} />
              <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#00FFFF" }}>// DIAL SOCIAL · COMMUNITY</p>
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
              Voices of the <span style={{ color: "#00FFFF", textShadow: "0 0 30px rgba(0,255,255,0.3)" }}>Network</span>
            </h1>
            <p className="text-base lg:text-lg max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              A living gallery of real members on Dial Social. Tap any portrait to hear their voice and explore their posts — every card is a holographic window into the people powering 1 Call Away™.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
              <span><span style={{ color: "#00FFFF" }}>{profiles.length}</span> members</span>
              <span><span style={{ color: "#CC00FF" }}>{totalVoices}</span> voice posts</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Get Connected banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-5xl mx-auto px-4 lg:px-8 mb-8"
      >
        <img
          src="https://media.base44.com/images/public/6a422320311efd575ae6536c/358f988c2_Gemini_Generated_Image_et9b5cet9b5cet9b.jpg"
          alt="Get Connected, Stay Connected — Dial Now Browse Now"
          style={{ width: "100%", height: "auto", display: "block", borderRadius: "2px" }}
        />
      </motion.div>

      {/* Sort controls */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] tracking-widest uppercase mr-1" style={{ color: "#8A8F98" }}>Sort:</span>
          {[
            { id: "featured", label: "Featured" },
            { id: "followers", label: "Most Followed" },
            { id: "recent", label: "Newest" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSort(opt.id)}
              className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all"
              style={sort === opt.id
                ? { background: "rgba(0,255,255,0.14)", border: "0.5px solid rgba(0,255,255,0.45)", color: "#00FFFF" }
                : { background: "transparent", border: "0.5px solid rgba(138,143,152,0.18)", color: "#8A8F98" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery grid */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {loading ? (
          <div className="text-center py-20"><Loader2 size={28} className="animate-spin mx-auto" style={{ color: "#00FFFF" }} /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <Users size={32} className="mx-auto mb-4" style={{ color: "rgba(0,255,255,0.3)" }} />
            <p className="text-sm mb-2" style={{ color: "#8A8F98" }}>No community profiles with portraits yet.</p>
            <p className="text-xs mb-6" style={{ color: "#8A8F98" }}>Be the first — create your Dial Social profile and add a photo.</p>
            <Link to="/social" className="inline-flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]" style={{ background: "#00FFFF", color: "#05070A" }}>
              <Sparkles size={12} /> Join Dial Social
            </Link>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5"
          >
            {sorted.map((profile, i) => (
              <motion.div key={profile.id} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}>
                <GalleryProfileCard profile={profile} latestVoicePost={voicePosts[profile.id]} index={i} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* CTA */}
      {!loading && sorted.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 lg:px-8 mt-14 text-center">
          <div className="relative p-8" style={{ background: "linear-gradient(135deg, rgba(0,255,255,0.04), rgba(204,0,255,0.04))", border: "0.5px solid rgba(0,255,255,0.25)" }}>
            <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
              <div className="h-full w-1/3" style={{ background: "linear-gradient(90deg, transparent, #00FFFF, #CC00FF, transparent)", animation: "tickerScroll 5s linear infinite" }} />
            </div>
            <Radio size={28} className="mx-auto mb-3" style={{ color: "#00FFFF" }} />
            <h2 className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>Want to be featured?</h2>
            <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              Create your Dial Social profile, add a portrait, and post a voice note. Active profiles with a photo appear right here in the gallery.
            </p>
            <Link to="/social" className="inline-flex items-center gap-2 px-8 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_24px_rgba(0,255,255,0.35)]" style={{ background: "#00FFFF", color: "#05070A" }}>
              <Sparkles size={13} /> Create Your Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}