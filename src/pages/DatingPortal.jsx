import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mic, Volume2, ArrowLeft, MapPin, Check, MessageSquare, User, Loader2, Shield, ShieldCheck, SlidersHorizontal, Music2, Sparkles, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";
import CreateProfileWizard from "@/components/dating/CreateProfileWizard";
import EmailVerification from "@/components/dating/EmailVerification";
import ProfileCard from "@/components/dating/ProfileCard";
import DatingPricing from "@/components/dating/DatingPricing";
import DatingHeroBanner from "@/components/landing/DatingHeroBanner";
import { useEntitlements } from "@/lib/useEntitlements";
import PhoneVerification from "@/components/dating/PhoneVerification";
import { INTEREST_OPTIONS, MUSIC_GENRE_OPTIONS, MUSIC_LABELS, LABELS } from "@/components/dating/DatingQuestionnaire";

export default function DatingPortal() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [myLikes, setMyLikes] = useState(new Set());
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMatch, setShowMatch] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [likingId, setLikingId] = useState(null);
  const [interestFilter, setInterestFilter] = useState([]);
  const [genreFilter, setGenreFilter] = useState([]);
  const [sharedOnly, setSharedOnly] = useState(false);
  const [likeError, setLikeError] = useState("");
  const ent = useEntitlements();

  const toggleFilter = (opt) => setInterestFilter((f) => f.includes(opt) ? f.filter((i) => i !== opt) : [...f, opt]);
  const toggleGenreFilter = (g) => setGenreFilter((f) => f.includes(g) ? f.filter((x) => x !== g) : [...f, g]);
  const sharedWithMe = (p) => {
    if (!myProfile || !myProfile.interests) return [];
    return (p.interests || []).filter((i) => myProfile.interests.includes(i));
  };
  const sharedGenresWithMe = (p) => {
    if (!myProfile || !myProfile.music_genres) return [];
    return (p.music_genres || []).filter((g) => myProfile.music_genres.includes(g));
  };
  const visibleProfiles = profiles.filter((p) => {
    if (sharedOnly && sharedWithMe(p).length === 0 && sharedGenresWithMe(p).length === 0) return false;
    if (interestFilter.length > 0 && !interestFilter.every((f) => (p.interests || []).includes(f))) return false;
    if (genreFilter.length > 0 && !genreFilter.every((g) => (p.music_genres || []).includes(g))) return false;
    return true;
  });

  const loadAll = useCallback(async (u) => {
    setLoading(true);
    try {
      const [mine, all, likes] = await Promise.all([
        base44.entities.DatingProfile.filter({ created_by_id: u.id }, "-created_date", 5),
        base44.entities.DatingProfile.filter({ active: true, email_verified: true }, "-created_date", 100),
        base44.entities.DatingLike.filter({}, "-created_date", 200),
      ]);
      const my = (mine && mine[0]) || null;
      setMyProfile(my);
      setProfiles((all || []).filter((p) => p.id !== (my && my.id)));
      if (my && my.email_verified) {
        base44.entities.DatingProfile.update(my.id, { last_portal_visit: new Date().toISOString() }).catch(() => {});
      }
      const mine_ = my ? new Set((likes || []).filter((l) => l.liker_profile_id === my.id).map((l) => l.liked_profile_id)) : new Set();
      setMyLikes(mine_);
      setMatches((likes || []).filter((l) => l.matched && my && (l.liker_profile_id === my.id || l.liked_profile_id === my.id)));
    } catch (e) {
      console.error("loadAll error", e);
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
        setUser(u);
        await loadAll(u);
      } catch {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; stopSpeaking(); };
  }, [loadAll]);

  const togglePlay = (p) => {
    if (playingId === p.id) { stopSpeaking(); setPlayingId(null); return; }
    stopSpeaking();
    setPlayingId(p.id);
    speak(p.voice_greeting, { onEnd: () => setPlayingId(null), onError: () => setPlayingId(null) });
  };

  const handleLike = async (p) => {
    if (!myProfile || !myProfile.email_verified || myLikes.has(p.id) || likingId) return;
    setLikingId(p.id);
    setLikeError("");
    try {
      const res = await base44.functions.invoke("create-dating-like", { liked_profile_id: p.id });
      setMyLikes((s) => new Set([...s, p.id]));
      if (res && res.data && res.data.matched && res.data.match_with) {
        setShowMatch(res.data.match_with);
        setMatches((m) => [...m, { liked_profile_id: p.id, liked_name: p.full_name, matched: true }]);
      }
    } catch (err) {
      setLikeError(err?.response?.data?.error || "Could not like right now.");
    } finally {
      setLikingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  const needsProfile = !myProfile;
  const needsVerification = myProfile && !myProfile.email_verified;
  const needsPhoneVerification = myProfile && myProfile.email_verified && !myProfile.phone_verified;

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-16 py-12 lg:py-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <DatingHeroBanner variant="header" />

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Heart size={16} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// 1 CALL DATING™ — REAL PROFILES</p>
          {!ent.loading && ent.datingTier && ent.datingTier !== "free" && (
            <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
              {ent.datingTier.toUpperCase()} MEMBER
            </span>
          )}
        </div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
          Find Your Match <span style={{ color: "#D1FF26" }}>Through Voice.</span>
        </h1>
        <p className="text-base font-light max-w-2xl mb-10" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Create your dating profile, browse verified members, and like who interests you. When the feeling is mutual, you'll both receive an SMS with the other's profile — your phone number stays private.
        </p>

        {/* Verified-email badge banner */}
        <div className="flex items-center gap-2 mb-8 p-3" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <ShieldCheck size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#F5F5F7" }}>EVERY MEMBER MUST VERIFY THEIR EMAIL · PROFILES STAY HIDDEN UNTIL VERIFIED · SMS SENT ON EVERY MATCH</p>
        </div>

        {needsProfile ? (
          <CreateProfileWizard
            emailHint={user && user.email}
            onCreated={() => loadAll(user)}
            onVerified={() => loadAll(user)}
          />
        ) : needsVerification ? (
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VERIFY YOUR EMAIL TO GO LIVE</p>
            </div>
            <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              Your profile is saved but hidden until you verify your email. Confirm the code we send to <span style={{ color: "#D1FF26" }}>{(user && user.email) || "your account email"}</span> to start matching.
            </p>
            <EmailVerification emailHint={user && user.email} onVerified={() => loadAll(user)} />
          </div>
        ) : needsPhoneVerification ? (
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VERIFY YOUR PHONE TO GO LIVE</p>
            </div>
            <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
              Email confirmed. Now verify your phone number via SMS to activate your profile and start matching. Every member is phone-verified to keep the community genuine.
            </p>
            <PhoneVerification phoneHint={myProfile.phone} onVerified={() => loadAll(user)} />
          </div>
        ) : (
          <div className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {likeError && (
                <div className="mb-2 p-3 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                  <AlertCircle size={13} style={{ color: "#ef4444" }} />
                  <span className="text-xs" style={{ color: "#ef4444" }}>{likeError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <User size={13} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// BROWSE VERIFIED SINGLES ({visibleProfiles.length})</p>
                </div>
                <button
                  onClick={() => setSharedOnly((s) => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                  style={{
                    background: sharedOnly ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)",
                    border: `0.5px solid ${sharedOnly ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                    color: sharedOnly ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  <Sparkles size={11} /> Shared with me
                </button>
              </div>

              {profiles.length > 0 && (
                <div className="p-3 mb-1" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <SlidersHorizontal size={11} style={{ color: "#8A8F98" }} />
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>FILTER BY MUSIC TASTE / INTERESTS</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_OPTIONS.map((opt) => {
                      const on = interestFilter.includes(opt);
                      const isMusic = opt === "music";
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleFilter(opt)}
                          className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                          style={{
                            background: on ? "rgba(209,255,38,0.15)" : "rgba(5,7,10,0.6)",
                            border: `0.5px solid ${on ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                            color: on ? "#D1FF26" : "#8A8F98",
                          }}
                        >
                          {isMusic && <Music2 size={10} />} {LABELS.interests[opt]}
                        </button>
                      );
                    })}
                    {interestFilter.length > 0 && (
                      <button onClick={() => setInterestFilter([])} className="px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>Clear ×</button>
                    )}
                  </div>
                </div>
              )}

              {profiles.length > 0 && (
                <div className="p-3 mb-1" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(34,211,238,0.15)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Music2 size={11} style={{ color: "#22d3ee" }} />
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>FILTER BY MUSIC GENRES</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSIC_GENRE_OPTIONS.map((opt) => {
                      const on = genreFilter.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleGenreFilter(opt)}
                          className="px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                          style={{
                            background: on ? "rgba(34,211,238,0.15)" : "rgba(5,7,10,0.6)",
                            border: `0.5px solid ${on ? "rgba(34,211,238,0.5)" : "rgba(138,143,152,0.12)"}`,
                            color: on ? "#22d3ee" : "#8A8F98",
                          }}
                        >
                          {MUSIC_LABELS[opt]}
                        </button>
                      );
                    })}
                    {genreFilter.length > 0 && (
                      <button onClick={() => setGenreFilter([])} className="px-2.5 py-1.5 font-mono text-[8px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>Clear ×</button>
                    )}
                  </div>
                </div>
              )}

              {profiles.length === 0 ? (
                <div className="p-10 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                  <Heart size={28} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 10px" }} />
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: "#8A8F98" }}>NO OTHER VERIFIED PROFILES YET</p>
                  <p className="text-xs mt-1" style={{ color: "#8A8F98" }}>Invite friends or check back soon.</p>
                </div>
              ) : visibleProfiles.length === 0 ? (
                <div className="p-10 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                  <SlidersHorizontal size={26} style={{ color: "rgba(209,255,38,0.3)", margin: "0 auto 10px" }} />
                  <p className="font-mono text-[11px] tracking-widest" style={{ color: "#8A8F98" }}>NO MATCHES FOR THESE FILTERS</p>
                  <button onClick={() => { setInterestFilter([]); setGenreFilter([]); setSharedOnly(false); }} className="mt-3 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>Reset filters</button>
                </div>
              ) : (
                visibleProfiles.map((p) => (
                  <ProfileCard
                    key={p.id}
                    profile={p}
                    playing={playingId === p.id}
                    onPlay={() => togglePlay(p)}
                    liked={myLikes.has(p.id)}
                    liking={likingId === p.id}
                    onLike={() => handleLike(p)}
                    sharedInterests={sharedWithMe(p)}
                    sharedGenres={sharedGenresWithMe(p)}
                    myProfile={myProfile}
                  />
                ))
              )}
            </div>
            <MatchesSidebar matches={matches} myProfile={myProfile} />
          </div>
          <DatingPricing />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMatch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(5,7,10,0.85)" }} onClick={() => setShowMatch(null)}>
            <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }} className="p-8 max-w-md w-full text-center" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Heart size={28} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>IT'S A MATCH!</span>
                <Heart size={28} style={{ color: "#D1FF26" }} />
              </div>
              {showMatch.avatar_url && <img src={showMatch.avatar_url} alt={showMatch.name} className="w-24 h-24 object-cover mx-auto mb-4" style={{ border: "0.5px solid rgba(209,255,38,0.4)" }} />}
              <h3 className="font-heading font-black text-3xl mb-2" style={{ color: "#F5F5F7" }}>You & {showMatch.name}</h3>
              <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                You both liked each other. We've sent each of you an SMS with the other's profile — your numbers stay private.
              </p>
              <div className="mb-5 p-4 text-left" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>{showMatch.name.toUpperCase()}'S VOICE NOTE</p>
                <p className="text-sm mb-3" style={{ color: "#F5F5F7", lineHeight: 1.5 }}>"{showMatch.voice_greeting}"</p>
                <button onClick={() => speak(showMatch.voice_greeting, {})} className="flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
                  <Volume2 size={12} /> Play Voice Note
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 mb-5">
                <MessageSquare size={13} style={{ color: "#D1FF26" }} />
                <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>PROFILES SENT VIA SMS</span>
              </div>
              <button onClick={() => setShowMatch(null)} className="w-full py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>Continue</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchesSidebar({ matches, myProfile }) {
  return (
    <div className="p-5 h-fit" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Heart size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// YOUR MATCHES</p>
      </div>
      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Heart size={26} style={{ color: "rgba(209,255,38,0.3)" }} />
          <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>No matches yet</p>
          <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Like profiles to find your match</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-heading font-semibold text-sm mb-1" style={{ color: "#F5F5F7" }}>{m.liked_name || m.liker_name}</p>
              <p className="font-mono text-[9px] flex items-center gap-1" style={{ color: "#D1FF26" }}><Check size={10} /> SMS sent</p>
            </motion.div>
          ))}
        </div>
      )}
      <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>PRIVATE & SAFE</p>
        </div>
        <ul className="space-y-1.5">
          {["Email verified for every member", "Phone numbers never shared", "Profiles sent via SMS on match", "Photos required to go live"].map((item) => (
            <li key={item} className="flex items-center gap-2 font-mono text-[8px]">
              <Check size={10} style={{ color: "#D1FF26" }} />
              <span style={{ color: "#8A8F98" }}>{item}</span>
            </li>
          ))}
        </ul>
        {myProfile && <p className="font-mono text-[8px] mt-4" style={{ color: "#8A8F98" }}>Signed in as {myProfile.full_name}</p>}
      </div>
    </div>
  );
}