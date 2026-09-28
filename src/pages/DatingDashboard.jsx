import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowLeft, Loader2, Send, Sparkles, Users, TrendingUp, MapPin, AudioLines, Activity, BarChart3, Music2, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { LABELS, MUSIC_LABELS } from "@/components/dating/DatingQuestionnaire";
import MeetupRatingDialog from "@/components/dating/MeetupRatingDialog";
import EngagementTimeline from "@/components/dating/EngagementTimeline";

// Private dating dashboard — live engagement stats, active matches, and
// quick access to the portal. Reads the member's own likes (RLS-scoped) and
// subscribes to DatingLike events so matches appear in real time.
export default function DatingDashboard() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [likes, setLikes] = useState([]);
  const [matchProfiles, setMatchProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [ratingMatch, setRatingMatch] = useState(null);
  const userRef = useRef(null);
  const audioRef = useRef(null);

  const load = useCallback(async (u) => {
    setLoading(true);
    try {
      const [mine, myLikes] = await Promise.all([
        base44.entities.DatingProfile.filter({ created_by_id: u.id }, "-created_date", 5),
        base44.entities.DatingLike.filter({}, "-created_date", 200),
      ]);
      const my = (mine && mine[0]) || null;
      setMyProfile(my);
      setLikes(myLikes || []);
      if (my && my.email_verified) {
        base44.entities.DatingProfile.update(my.id, { last_portal_visit: new Date().toISOString() }).catch(() => {});
      }

      const matchedIds = [...new Set((myLikes || []).filter((l) => l.matched).map((l) => l.liked_profile_id))];
      const profiles = {};
      await Promise.all(
        matchedIds.map(async (id) => {
          if (!id) return;
          try {
            const p = await base44.entities.DatingProfile.get(id);
            if (p) profiles[id] = p;
          } catch { /* ignore missing */ }
        })
      );
      setMatchProfiles(profiles);
    } catch (e) {
      console.error("dashboard load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (cancelled) return;
        userRef.current = u;
        setUser(u);
        await load(u);
      } catch {
        setLoading(false);
      }
    })();
    const unsub = base44.entities.DatingLike.subscribe(() => {
      if (userRef.current) load(userRef.current).catch(() => {});
    });
    return () => { cancelled = true; if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const likesSent = likes.length;
  const matched = likes.filter((l) => l.matched);
  const matchCount = matched.length;
  const mutualInterestPairs = matched
    .map((l) => {
      const mp = matchProfiles[l.liked_profile_id];
      if (!mp || !myProfile || !myProfile.interests || !mp.interests) return 0;
      return mp.interests.filter((i) => myProfile.interests.includes(i)).length;
    });
  const avgShared = mutualInterestPairs.length
    ? Math.round((mutualInterestPairs.reduce((a, b) => a + b, 0) / mutualInterestPairs.length) * 10) / 10
    : 0;
  const withClips = matched.filter((l) => matchProfiles[l.liked_profile_id]?.voice_intro_url).length;
  const genreCounts = {};
  matched.forEach((l) => {
    const mp = matchProfiles[l.liked_profile_id];
    if (!mp || !myProfile) return;
    (mp.music_genres || []).forEach((g) => {
      if ((myProfile.music_genres || []).includes(g)) genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  const topGenreEntry = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
  const topSharedGenre = topGenreEntry ? MUSIC_LABELS[topGenreEntry[0]] : "—";

  // Recent interaction counts for the real-time engagement strip.
  const nowMs = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const likes24h = likes.filter((l) => l.created_date && (nowMs - new Date(l.created_date).getTime()) < DAY_MS).length;
  const likes7d = likes.filter((l) => l.created_date && (nowMs - new Date(l.created_date).getTime()) < 7 * DAY_MS).length;
  const matches7d = matched.filter((l) => l.matched_at && (nowMs - new Date(l.matched_at).getTime()) < 7 * DAY_MS).length;

  const togglePlay = (id, url) => {
    const a = audioRef.current;
    if (playingId === id) {
      if (a) a.pause();
      setPlayingId(null);
      return;
    }
    if (a) { a.pause(); }
    if (a && url) {
      a.src = url;
      a.play().then(() => setPlayingId(id)).catch(() => setPlayingId(null));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (!myProfile) {
    return (
      <div className="min-h-screen" style={{ background: "#05070A" }}>
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <Heart size={32} style={{ color: "#D1FF26", margin: "0 auto 14px" }} />
          <p className="font-heading font-bold text-xl mb-2" style={{ color: "#F5F5F7" }}>No dating profile yet</p>
          <p className="text-sm mb-6" style={{ color: "#8A8F98" }}>Create your profile in the dating portal to start tracking matches.</p>
          <Link to="/dating" className="inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
            Go to Dating Portal <ArrowLeft size={13} className="rotate-180" />
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Likes Sent", value: likesSent, icon: Send, color: "#D1FF26" },
    { label: "Active Matches", value: matchCount, icon: Heart, color: "#FF6B35" },
    { label: "Avg Shared Interests", value: avgShared, icon: Sparkles, color: "#43C6AC" },
    { label: "Top Shared Genre", value: topSharedGenre, icon: Music2, color: "#22d3ee" },
    { label: "Matches w/ Voice Intro", value: withClips, icon: AudioLines, color: "#A855F7" },
    { label: "Match Rate", value: likesSent ? `${Math.round((matchCount / likesSent) * 100)}%` : "0%", icon: TrendingUp, color: "#5AE0C8" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-16 py-12 lg:py-16">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <Link to="/dating" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <Heart size={12} /> Open Portal
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={16} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DATING ENGAGEMENT DASHBOARD</p>
        </div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
          Your Match <span style={{ color: "#D1FF26" }}>Command Center</span>
        </h1>
        <p className="text-base font-light max-w-2xl mb-8" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Track active matches, hear their voice intros, and watch engagement update in real time as you connect.
        </p>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#43C6AC" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#43C6AC" }}>LIVE · UPDATES IN REAL TIME</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${s.color}33` }}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={14} style={{ color: s.color }} />
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{s.label.toUpperCase()}</span>
              </div>
              <p className="font-heading font-black text-2xl lg:text-3xl truncate" style={{ color: s.color }}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent interactions */}
        <div className="p-4 mb-6 flex items-center gap-4 flex-wrap" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center gap-2">
            <Activity size={13} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// RECENT INTERACTIONS</p>
          </div>
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="flex flex-col">
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>LIKES TODAY</span>
              <span className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{likes24h}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>LIKES · 7 DAYS</span>
              <span className="font-heading font-black text-xl" style={{ color: "#5AE0C8" }}>{likes7d}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>NEW MATCHES · 7 DAYS</span>
              <span className="font-heading font-black text-xl" style={{ color: "#FF6B35" }}>{matches7d}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#43C6AC" }} />
            <span className="font-mono text-[8px] tracking-widest" style={{ color: "#43C6AC" }}>LIVE</span>
          </div>
        </div>

        {/* 14-day engagement timeline */}
        <EngagementTimeline likes={likes} matches={matched} />

        {/* Shared music taste breakdown */}
        <div className="p-5 mb-8" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(34,211,238,0.2)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Music2 size={14} style={{ color: "#22d3ee" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#22d3ee" }}>// SHARED MUSIC TASTE ACROSS MATCHES</p>
          </div>
          {Object.keys(genreCounts).length === 0 ? (
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO SHARED GENRES YET — ADD MUSIC TAGS TO YOUR PROFILE AND LIKE MEMBERS WITH SIMILAR TASTE</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([g, count]) => {
                const pct = matchCount ? Math.round((count / matchCount) * 100) : 0;
                return (
                  <div key={g} className="flex items-center gap-3">
                    <span className="font-mono text-[9px] tracking-widest uppercase w-24 flex-shrink-0" style={{ color: "#F5F5F7" }}>{MUSIC_LABELS[g] || g}</span>
                    <div className="flex-1 h-2 overflow-hidden" style={{ background: "rgba(5,7,10,0.6)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="h-full" style={{ background: "linear-gradient(90deg, #22d3ee, #D1FF26)" }} />
                    </div>
                    <span className="font-mono text-[9px] tracking-widest w-16 flex-shrink-0 text-right" style={{ color: "#22d3ee" }}>{count} · {pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My profile strip */}
        <div className="p-5 mb-8 flex items-center gap-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center justify-center w-14 h-14 flex-shrink-0 overflow-hidden" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            {myProfile.avatar_url ? (
              <img src={myProfile.avatar_url} alt={myProfile.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{(myProfile.full_name || "U").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{myProfile.full_name}, {myProfile.age}</p>
            <p className="font-mono text-[10px] flex items-center gap-1" style={{ color: "#D1FF26" }}><MapPin size={10} /> {myProfile.location}</p>
            {myProfile.interests && myProfile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {myProfile.interests.map((it) => (
                  <span key={it} className="font-mono text-[8px] tracking-wide px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>{LABELS.interests[it] || it}</span>
                ))}
              </div>
            )}
          </div>
          {myProfile.voice_intro_url && (
            <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.35)" }}>
              <AudioLines size={9} className="inline mr-1" />VOICE INTRO LIVE
            </span>
          )}
        </div>

        {/* Active matches */}
        <div className="flex items-center gap-2 mb-4">
          <Users size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ACTIVE MATCHES ({matchCount})</p>
        </div>

        {matchCount === 0 ? (
          <div className="p-12 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <Heart size={30} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[11px] tracking-widest" style={{ color: "#8A8F98" }}>NO MATCHES YET</p>
            <p className="text-xs mt-1 mb-5" style={{ color: "#8A8F98" }}>Like profiles in the portal — mutual likes become matches here.</p>
            <Link to="/dating" className="inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
              Browse Singles <Heart size={12} />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {matched.map((l) => {
              const mp = matchProfiles[l.liked_profile_id];
              if (!mp) return null;
              const shared = (mp.interests || []).filter((i) => (myProfile.interests || []).includes(i));
              const sharedGenres = (mp.music_genres || []).filter((g) => (myProfile.music_genres || []).includes(g));
              const isPlaying = playingId === mp.id;
              return (
                <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-4 flex gap-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                  <div className="w-16 h-16 flex-shrink-0 overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    {mp.avatar_url || (mp.photos && mp.photos[0]) ? (
                      <img src={mp.avatar_url || mp.photos[0]} alt={mp.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)" }}>
                        <Heart size={18} style={{ color: "rgba(209,255,38,0.4)" }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{mp.full_name}, {mp.age}</p>
                      <Heart size={11} style={{ color: "#D1FF26", fill: "#D1FF26" }} />
                    </div>
                    <p className="font-mono text-[9px] flex items-center gap-1 mb-1.5" style={{ color: "#D1FF26" }}><MapPin size={9} /> {mp.location}</p>
                    <p className="text-[11px] line-clamp-2 mb-2" style={{ color: "#8A8F98", lineHeight: 1.4 }}>"{mp.voice_greeting}"</p>
                    {shared.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {shared.slice(0, 5).map((it) => (
                          <span key={it} className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.25)" }}>{LABELS.interests[it] || it}</span>
                        ))}
                      </div>
                    )}
                    {sharedGenres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {sharedGenres.slice(0, 5).map((g) => (
                          <span key={g} className="font-mono text-[8px] px-1.5 py-0.5 flex items-center gap-1" style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "0.5px solid rgba(34,211,238,0.3)" }}><Music2 size={9} />{MUSIC_LABELS[g] || g}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {mp.voice_intro_url && (
                        <button
                          onClick={() => togglePlay(mp.id, mp.voice_intro_url)}
                          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[8px] tracking-widest uppercase"
                          style={{ background: isPlaying ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                        >
                          <AudioLines size={10} /> {isPlaying ? "Pause Intro" : "Play Intro"}
                        </button>
                      )}
                      <button
                        onClick={() => setRatingMatch({ like: l, profile: mp })}
                        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[8px] tracking-widest uppercase"
                        style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                      >
                        <Star size={10} /> Rate Meetup
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Activity note */}
        <div className="mt-8 flex items-center gap-2 p-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
          <Activity size={12} style={{ color: "#8A8F98" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>STATS REFLECT YOUR ACTIVITY · NEW MATCHES APPEAR HERE AUTOMATICALLY AS THEY HAPPEN</p>
        </div>
      </div>

      {ratingMatch && (
        <MeetupRatingDialog
          match={ratingMatch.like}
          matchProfile={ratingMatch.profile}
          myProfile={myProfile}
          onClose={() => setRatingMatch(null)}
          onRated={() => setRatingMatch(null)}
        />
      )}
    </div>
  );
}