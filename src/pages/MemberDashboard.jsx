import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home, Loader2, Crown, Star, Zap, Globe, Trophy, Gauge, PhoneCall, MessageSquare,
  AudioLines, Bell, Bookmark, Package, Sparkles, TrendingUp, CreditCard, Calendar,
  ArrowRight, Award, Gift, Clock, PhoneMissed, PhoneIncoming, Check, X, Users, MapPin, Phone,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import CourseBadges from "@/components/courses/CourseBadges";

const TIER_META = {
  free:     { label: "Free",     color: "#8A8F98", icon: Globe,  credits: 25,   tagline: "Get started" },
  plus:     { label: "Plus",     color: "#42E1F6", icon: Zap,    credits: 300,  tagline: "Social & radio unlocked" },
  premium:  { label: "Premium",  color: "#D1FF26", icon: Star,   credits: 800,  tagline: "Full platform access" },
  elite:    { label: "Elite",    color: "#fb923c", icon: Crown,  credits: 2000, tagline: "Sports + Media unlocked" },
  ultimate: { label: "Ultimate", color: "#a78bfa", icon: Trophy, credits: 5000, tagline: "Creator & collab unlocked" },
};

const safeCount = async (entityName, userId) => {
  try {
    const rows = await base44.entities[entityName].filter(
      { created_by_id: userId },
      "-created_date",
      1000
    );
    return Array.isArray(rows) ? rows.length : 0;
  } catch {
    return 0;
  }
};

const CALL_STATUS = {
  answered: { label: "Answered", color: "#D1FF26", icon: PhoneIncoming },
  missed:   { label: "Missed",   color: "#ef4444", icon: PhoneMissed },
  ringing:  { label: "Ringing",  color: "#42E1F6", icon: PhoneCall },
  declined: { label: "Declined", color: "#8A8F98", icon: X },
};

function fmtDuration(sec) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SectionHeader({ icon: Icon, label, title }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{label}</p>
      </div>
      <h3 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{title}</h3>
    </div>
  );
}

function StatCard({ icon: Icon, color, value, label, sub }) {
  return (
    <div className="p-4" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}30` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 flex items-center justify-center" style={{ background: `${color}12` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{label.toUpperCase()}</span>
      </div>
      <span className="font-heading font-black text-2xl block" style={{ color: "#F5F5F7" }}>{value.toLocaleString()}</span>
      {sub && <span className="font-mono text-[9px] mt-1 block" style={{ color: "#8A8F98" }}>{sub}</span>}
    </div>
  );
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [credits, setCredits] = useState(null);
  const [calls, setCalls] = useState({ total: 0, answered: 0, missed: 0, recent: [] });
  const [referrals, setReferrals] = useState({ total: 0, completed: 0, creditsEarned: 0 });
  const [usage, setUsage] = useState({
    voiceCommands: 0,
    voiceInteractions: 0,
    smsSent: 0,
    savedServices: 0,
    listings: 0,
  });
  const [completedDialCodes, setCompletedDialCodes] = useState([]);

  const loadAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [subs, creditRows, vc, callRows, vi, sms, saved, listings, referralRows] = await Promise.all([
        base44.entities.Subscription
          .filter({ owner_user_id: user.id, subscription_active: true }, "-created_date", 1)
          .catch(() => []),
        base44.entities.CallCredit
          .filter({ created_by_id: user.id }, "-created_date", 1)
          .catch(() => []),
        safeCount("VoiceCommand", user.id),
        base44.entities.IncomingCall
          .filter({ created_by_id: user.id }, "-created_date", 1000)
          .catch(() => []),
        safeCount("VoiceInteraction", user.id),
        safeCount("SmsNotification", user.id),
        safeCount("SavedService", user.id),
        safeCount("MarketplaceListing", user.id),
        base44.entities.Referral
          .filter({ referrer_user_id: user.id }, "-created_date", 100)
          .catch(() => []),
      ]);

      const callArr = Array.isArray(callRows) ? callRows : [];
      const refArr = Array.isArray(referralRows) ? referralRows : [];

      setSubscription(subs && subs.length > 0 ? subs[0] : null);
      setCredits(creditRows && creditRows.length > 0 ? creditRows[0] : null);
      setCalls({
        total: callArr.length,
        answered: callArr.filter((c) => c.status === "answered").length,
        missed: callArr.filter((c) => c.status === "missed").length,
        recent: callArr.slice(0, 5),
      });
      setReferrals({
        total: refArr.length,
        completed: refArr.filter((r) => r.status === "completed" || r.status === "rewarded").length,
        creditsEarned: refArr.reduce((s, r) => s + (r.credits_earned || 0), 0),
      });
      setUsage({
        voiceCommands: vc,
        voiceInteractions: vi,
        smsSent: sms,
        savedServices: saved,
        listings,
      });

      // Completed certified courses → achievement badges for the 16-course learning path
      try {
        const completed = await base44.entities.Enrollment.filter(
          { owner_user_id: user.id, status: "completed" }, "-created_date", 100
        ).catch(() => []);
        const cIds = Array.from(new Set((completed || []).map((e) => e.course_id).filter(Boolean)));
        const cs = await Promise.all(cIds.map((cid) => base44.entities.Course.get(cid).catch(() => null)));
        setCompletedDialCodes(cs.filter(Boolean).map((c) => c.dial_code).filter(Boolean));
      } catch { setCompletedDialCodes([]); }
    } catch {
      // non-blocking — dashboard shows empty states
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const tierId = subscription?.tier || credits?.plan_tier || "free";
  const tier = TIER_META[tierId] || TIER_META.free;
  const TierIcon = tier.icon;

  const totalCredits = (credits?.total_credits ?? tier.credits) + (credits?.bonus_credits ?? 0);
  const usedCredits = credits?.used_credits ?? 0;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);
  const creditPct = totalCredits > 0 ? Math.min(100, Math.round((usedCredits / totalCredits) * 100)) : 0;
  const bonusCredits = credits?.bonus_credits ?? 0;
  const cycleEnd = credits?.billing_cycle_end ? new Date(credits.billing_cycle_end) : null;

  const USAGE_CARDS = [
    { label: "Incoming Calls", value: calls.total, icon: PhoneCall, color: "#42E1F6" },
    { label: "Voice Commands", value: usage.voiceCommands, icon: AudioLines, color: "#D1FF26" },
    { label: "Voice Interactions", value: usage.voiceInteractions, icon: MessageSquare, color: "#fb923c" },
    { label: "SMS Alerts Sent", value: usage.smsSent, icon: Bell, color: "#a78bfa" },
    { label: "Saved Services", value: usage.savedServices, icon: Bookmark, color: "#D1FF26" },
    { label: "Marketplace Listings", value: usage.listings, icon: Package, color: "#42E1F6" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between"
        style={{ background: "rgba(5,7,10,0.9)", borderBottom: "0.5px solid rgba(209,255,38,0.15)", backdropFilter: "blur(12px)" }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
        >
          <Home size={12} /> Home
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#8A8F98" }}
        >
          <Package size={12} /> Marketplace
        </Link>
        <Link
          to="/share-location"
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
        >
          <MapPin size={12} /> Share Location
        </Link>
        <Link
          to="/phone"
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
        >
          <Phone size={12} /> Dial Phone
        </Link>
      </header>

      <div className="px-4 lg:px-8 py-8 pb-24 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <p className="font-mono text-xs tracking-[0.4em] mb-3" style={{ color: "#D1FF26" }}>// MEMBER DASHBOARD</p>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
            Your <span style={{ color: "#D1FF26" }}>Plan</span> & Usage
          </h1>
          <p className="text-sm lg:text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Monitor your subscription, call logs, rewards, and platform activity — all in one place, aligned to your billing cycle.
          </p>
        </motion.div>

        {/* Achievement badges — 16-course learning path */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
          className="mb-6"
        >
          <CourseBadges earnedDialCodes={completedDialCodes} />
        </motion.div>

        {/* Plan & Credits row */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Active subscription tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 p-6"
            style={{ background: tierId === "free" ? "rgba(16,20,29,0.6)" : `${tier.color}10`, border: `0.5px solid ${tierId === "free" ? "rgba(138,143,152,0.15)" : `${tier.color}55`}` }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 flex items-center justify-center flex-shrink-0"
                  style={{ background: `${tier.color}14`, border: `0.5px solid ${tier.color}55` }}
                >
                  <TierIcon size={26} style={{ color: tier.color }} />
                </div>
                <div>
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>// ACTIVE SUBSCRIPTION</p>
                  <h2 className="font-heading font-black text-2xl uppercase" style={{ color: tier.color }}>{tier.label}</h2>
                  <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{tier.tagline}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>// STATUS</p>
                <p className="font-heading font-bold text-sm flex items-center gap-1.5 justify-end" style={{ color: subscription ? "#D1FF26" : "#8A8F98" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: subscription ? "#D1FF26" : "#8A8F98" }} />
                  {subscription ? "Active" : "Free tier"}
                </p>
                {subscription?.plan && (
                  <p className="font-mono text-[10px] capitalize mt-0.5" style={{ color: "#8A8F98" }}>{subscription.plan} billing</p>
                )}
              </div>
            </div>

            {tierId === "free" && (
              <Link
                to="/#pricing"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                <Sparkles size={12} /> Upgrade Your Plan <ArrowRight size={12} />
              </Link>
            )}
          </motion.div>

          {/* AI Credits usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="p-6"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Gauge size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// AI CREDITS</p>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-heading font-black text-3xl" style={{ color: "#F5F5F7" }}>{remainingCredits.toLocaleString()}</span>
              <span className="font-mono text-xs" style={{ color: "#8A8F98" }}>/ {totalCredits.toLocaleString()} remaining</span>
            </div>
            <div className="h-2 w-full mb-2 overflow-hidden" style={{ background: "rgba(138,143,152,0.12)" }}>
              <div className="h-full transition-all duration-700" style={{ width: `${creditPct}%`, background: creditPct > 85 ? "#ef4444" : "#D1FF26" }} />
            </div>
            <div className="flex items-center justify-between font-mono text-[9px]" style={{ color: "#8A8F98" }}>
              <span>{usedCredits.toLocaleString()} used</span>
              <span>{creditPct}%</span>
            </div>
            {bonusCredits > 0 && (
              <p className="font-mono text-[9px] mt-2 flex items-center gap-1" style={{ color: "#D1FF26" }}>
                <Sparkles size={10} /> +{bonusCredits.toLocaleString()} bonus credits
              </p>
            )}
            {cycleEnd && (
              <p className="font-mono text-[9px] mt-3 flex items-center gap-1" style={{ color: "#8A8F98" }}>
                <Calendar size={10} /> Resets {cycleEnd.toLocaleDateString()}
              </p>
            )}
          </motion.div>
        </div>

        {/* ═══ CALL ACTIVITY ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 p-6"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}
        >
          <SectionHeader icon={PhoneCall} label="// CALL ACTIVITY" title="Recent Calls" />
          {/* Call stat chips */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 flex items-center gap-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <PhoneCall size={14} style={{ color: "#42E1F6" }} />
              <div>
                <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{calls.total}</p>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>TOTAL</p>
              </div>
            </div>
            <div className="p-3 flex items-center gap-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <PhoneIncoming size={14} style={{ color: "#D1FF26" }} />
              <div>
                <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{calls.answered}</p>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>ANSWERED</p>
              </div>
            </div>
            <div className="p-3 flex items-center gap-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
              <PhoneMissed size={14} style={{ color: "#ef4444" }} />
              <div>
                <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{calls.missed}</p>
                <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>MISSED</p>
              </div>
            </div>
          </div>

          {/* Recent calls list */}
          {calls.recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.15)" }}>
              <PhoneCall size={24} style={{ color: "rgba(209,255,38,0.3)" }} />
              <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO CALLS YET</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(138,143,152,0.08)" }}>
              {calls.recent.map((call) => {
                const st = CALL_STATUS[call.status] || { label: call.status || "Unknown", color: "#8A8F98", icon: PhoneCall };
                const SIcon = st.icon;
                const name = call.caller_name || call.caller_phone || "Unknown caller";
                return (
                  <div key={call.id} className="flex items-center gap-3 py-3" style={{ borderColor: "rgba(138,143,152,0.08)" }}>
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: `${st.color}12`, border: `0.5px solid ${st.color}40` }}>
                      <SIcon size={14} style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs truncate" style={{ color: "#F5F5F7" }}>{name}</p>
                      <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>
                        {call.caller_location || call.call_type || "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-widest" style={{ color: st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                        {st.label.toUpperCase()}
                      </span>
                      <p className="font-mono text-[9px] mt-0.5 flex items-center gap-2 justify-end" style={{ color: "#8A8F98" }}>
                        <span className="flex items-center gap-1"><Clock size={9} /> {fmtDuration(call.duration_sec)}</span>
                        <span>{fmtDate(call.created_date)}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 text-right">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase hover:underline" style={{ color: "#D1FF26" }}>
              View full call history <ArrowRight size={11} />
            </Link>
          </div>
        </motion.div>

        {/* ═══ REWARDS ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-6 p-6"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}
        >
          <SectionHeader icon={Gift} label="// REWARDS" title="Referrals & Bonus Credits" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StatCard icon={Sparkles} color="#D1FF26" value={bonusCredits} label="Bonus Credits" sub="Awarded to your account" />
            <StatCard icon={Users} color="#42E1F6" value={referrals.total} label="Referrals Made" sub={`${referrals.completed} completed`} />
            <StatCard icon={Award} color="#fb923c" value={referrals.creditsEarned} label="Credits Earned" sub="From completed referrals" />
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 p-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center gap-2">
              <Gift size={14} style={{ color: "#D1FF26" }} />
              <p className="text-xs" style={{ color: "#F5F5F7" }}>Earn 25 credits for every friend who joins with your link.</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)]"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              Refer & Earn <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>

        {/* ═══ ACTIVITY TRACKING ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6"
        >
          <SectionHeader icon={TrendingUp} label="// ACTIVITY TRACKING" title="Platform Service Usage" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {USAGE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="p-4 flex flex-col items-start"
                  style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${card.color}30` }}
                >
                  <div className="w-9 h-9 flex items-center justify-center mb-3" style={{ background: `${card.color}12` }}>
                    <Icon size={16} style={{ color: card.color }} />
                  </div>
                  <span className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{card.value.toLocaleString()}</span>
                  <span className="font-mono text-[9px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>{card.label.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Plan allowance reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
          className="p-6"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// MONTHLY AI CREDIT ALLOWANCE BY TIER</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(TIER_META).map(([id, t]) => {
              const Icon = t.icon;
              const active = id === tierId;
              return (
                <div
                  key={id}
                  className="p-3 flex items-center gap-2"
                  style={{
                    background: active ? `${t.color}12` : "rgba(5,7,10,0.4)",
                    border: `0.5px solid ${active ? t.color : "rgba(138,143,152,0.12)"}`,
                  }}
                >
                  <Icon size={14} style={{ color: t.color }} />
                  <div>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: active ? t.color : "#8A8F98" }}>{t.label.toUpperCase()}</p>
                    <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{t.credits.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="font-mono text-[9px] mt-4" style={{ color: "#8A8F98" }}>
            Credits cover calls, SMS, and AI actions. They reset at the end of each billing cycle.
          </p>
        </motion.div>
      </div>
    </div>
  );
}