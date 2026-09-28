import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gift, Copy, Check, Loader2, Users, Award, Share2, MessageSquare,
  TrendingUp, Sparkles, ArrowRight, BookOpen, Phone,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Dedicated referral page. Each member gets a stable, non-guessable referral
// code (issued by the course-referral-code function). Friends who enroll in
// any of the 16 certified courses with the code get 20% off, and the member
// earns 25 call credits when the friend pays. Sharing is native SMS (opens the
// phone's SMS composer prefilled), copy link, and native share sheet.
export default function ReferralPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [stats, setStats] = useState({ completed_count: 0, credits_earned: 0, cap: 50 });
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [smsTo, setSmsTo] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  const shareUrl = code ? `${window.location.origin}/courses?ref=${code}` : "";
  const shareMsg = `Learn by phone and get certified. Enroll in any course with my code ${code} for 20% off: ${shareUrl}`;

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const [res, refs] = await Promise.all([
        base44.functions.invoke("course-referral-code", {}),
        base44.entities.Referral.filter({ referrer_user_id: user.id }, "-created_date", 100).catch(() => []),
      ]);
      const d = res?.data;
      if (d?.referral_code) {
        setCode(d.referral_code);
        setStats({ completed_count: d.completed_count || 0, credits_earned: d.credits_earned || 0, cap: d.cap || 50 });
      }
      setReferrals(Array.isArray(refs) ? refs : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "1 Call Away — Certified Courses", text: shareMsg, url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  // Opens the device's native SMS composer prefilled with the referral
  // message. On mobile this is the canonical "share via SMS" — no platform
  // credits consumed, sends from the member's own number.
  const handleSmsShare = () => {
    const num = (smsTo || "").replace(/[^\d+]/g, "");
    const target = num ? `sms:${num}` : "sms:";
    const body = encodeURIComponent(shareMsg);
    window.location.href = `${target}?&body=${body}`;
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 2500);
  };

  const pending = referrals.filter((r) => r.status === "pending").length;
  const remaining = Math.max(0, stats.cap - stats.completed_count);

  const statCards = [
    { label: "Invited", value: referrals.length, icon: Users, color: "#8A8F98" },
    { label: "Enrolled", value: stats.completed_count, icon: Check, color: "#D1FF26" },
    { label: "Pending", value: pending, icon: TrendingUp, color: "#8A8F98" },
    { label: "Credits Earned", value: stats.credits_earned, icon: Award, color: "#D1FF26" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.07) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 pt-8 pb-24">
        <Link to="/my-courses" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowRight size={14} className="rotate-180" /> Back to My Courses
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4" style={{ border: "0.5px solid rgba(209,255,38,0.3)", background: "rgba(209,255,38,0.05)" }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26" }} />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>DIAL BROWSER · REFERRAL PROGRAM</span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-5xl mb-3" style={{ color: "#F5F5F7" }}>
            Invite learners. <span style={{ color: "#D1FF26" }}>Earn call credits.</span>
          </h1>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Share your unique link with a friend. They get <span style={{ color: "#D1FF26" }}>20% off</span> enrollment in any of the 16 certified courses — you earn <span style={{ color: "#D1FF26" }}>25 call credits</span> the moment they pay.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : !user?.id ? (
          <div className="text-center py-20" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <Gift size={32} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.4)" }} />
            <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>SIGN IN TO GET YOUR REFERRAL LINK</p>
            <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
              Sign In <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <>
            {/* Referral code + link */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-6 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", boxShadow: "0 0 40px rgba(209,255,38,0.05)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={13} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>YOUR REFERRAL CODE</p>
              </div>
              <p className="font-heading font-black text-4xl sm:text-5xl tracking-[0.15em] mb-5" style={{ color: "#D1FF26", textShadow: "0 0 24px rgba(209,255,38,0.3)" }}>{code}</p>

              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR INVITATION LINK</label>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input readOnly value={shareUrl} onClick={handleCopy} className="flex-1 px-3 py-2.5 text-[16px] sm:text-xs cursor-pointer font-mono truncate" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }} />
                <button onClick={handleCopy} className="flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.25)]" style={{ background: copied ? "rgba(209,255,38,0.15)" : "#D1FF26", border: `0.5px solid ${copied ? "rgba(209,255,38,0.5)" : "#D1FF26"}`, color: "#05070A" }}>
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
                <button onClick={handleNativeShare} className="flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                  <Share2 size={13} /> Share
                </button>
              </div>

              {/* SMS share */}
              <div className="pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.12)" }}>
                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>SHARE VIA SMS</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2 flex-1 px-3 py-2.5" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                    <Phone size={13} className="flex-shrink-0" style={{ color: "#D1FF26" }} />
                    <input
                      value={smsTo}
                      onChange={(e) => setSmsTo(e.target.value)}
                      placeholder="Friend's phone number (optional)"
                      className="flex-1 bg-transparent outline-none text-[16px] sm:text-xs font-mono"
                      style={{ color: "#F5F5F7" }}
                      inputMode="tel"
                    />
                  </div>
                  <button onClick={handleSmsShare} className="flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.25)]" style={{ background: smsSent ? "rgba(209,255,38,0.15)" : "#D1FF26", border: `0.5px solid ${smsSent ? "rgba(209,255,38,0.5)" : "#D1FF26"}`, color: "#05070A" }}>
                    {smsSent ? <><Check size={13} /> Opened</> : <><MessageSquare size={13} /> Send SMS</>}
                  </button>
                </div>
                <p className="font-mono text-[8px] tracking-widest mt-2" style={{ color: "rgba(138,143,152,0.6)" }}>OPENS YOUR PHONE'S MESSAGES APP · PREFILLED WITH YOUR CODE & LINK</p>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {statCards.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="p-4 text-center" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
                    <Icon size={16} style={{ color: s.color, margin: "0 auto 8px" }} />
                    <p className="font-heading font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
                    <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>{s.label.toUpperCase()}</p>
                  </div>
                );
              })}
            </div>

            {/* How it works */}
            <div className="p-6 mb-6" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
              <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>▸ HOW IT WORKS</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { n: "01", t: "Share your link", d: "Text your code or link to a friend who wants to learn.", icon: Share2 },
                  { n: "02", t: "They enroll", d: "Your friend enrolls in any course and gets 20% off at checkout.", icon: BookOpen },
                  { n: "03", t: "You earn", d: "25 call credits land in your balance the moment they pay.", icon: Award },
                ].map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.n} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                          <Icon size={15} style={{ color: "#D1FF26" }} />
                        </div>
                      </div>
                      <div>
                        <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: "#D1FF26" }}>STEP {step.n}</p>
                        <p className="font-heading font-bold text-sm mb-1" style={{ color: "#F5F5F7" }}>{step.t}</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>{step.d}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.12)" }}>
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LIFETIME CAP</p>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{stats.completed_count} / {stats.cap} · {remaining} REMAINING</p>
              </div>
            </div>

            {/* Recent referrals */}
            {referrals.length > 0 && (
              <div className="p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>▸ RECENT INVITES</p>
                <div className="space-y-2">
                  {referrals.slice(0, 8).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-3" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                      <div className="flex items-center justify-center w-8 h-8 flex-shrink-0" style={{ background: "rgba(209,255,38,0.06)" }}>
                        <Users size={13} style={{ color: "#8A8F98" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: "#F5F5F7" }}>{r.referred_name || r.referred_email || "Pending invitee"}</p>
                        {r.referral_code && <p className="font-mono text-[8px] truncate" style={{ color: "rgba(138,143,152,0.6)" }}>CODE {r.referral_code}</p>}
                      </div>
                      <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: r.status === "rewarded" ? "rgba(209,255,38,0.12)" : r.status === "completed" ? "rgba(209,255,38,0.08)" : "rgba(138,143,152,0.08)", color: r.status === "rewarded" || r.status === "completed" ? "#D1FF26" : "#8A8F98" }}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}