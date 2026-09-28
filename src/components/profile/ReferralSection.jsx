import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Loader2, Users, Award, TrendingUp, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ReferralSection({ user }) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id ? user.id.slice(-8).toUpperCase() : "";
  const shareUrl = user?.id ? `${window.location.origin}/?ref=${user.id}` : "";

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const data = await base44.entities.Referral.filter({ referrer_user_id: user.id }, "-created_date", 100);
        setReferrals(data || []);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "1 Call Away — Join me",
          text: "Find, book, and engage services through simple voice calls. Join 1 Call Away:",
          url: shareUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const completed = referrals.filter((r) => r.status === "completed" || r.status === "rewarded").length;
  const pending = referrals.filter((r) => r.status === "pending").length;
  const totalCredits = referrals.reduce((sum, r) => sum + (r.credits_earned || 0), 0);

  const stats = [
    { label: "Invited", value: referrals.length, icon: Users, color: "#8A8F98" },
    { label: "Signed Up", value: completed, icon: Check, color: "#D1FF26" },
    { label: "Pending", value: pending, icon: TrendingUp, color: "#8A8F98" },
    { label: "Credits", value: totalCredits, icon: Award, color: "#D1FF26" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// INVITE & EARN</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>SHARE YOUR UNIQUE LINK</span>
      </div>

      <div className="p-5 space-y-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        {/* Intro */}
        <div>
          <p className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>Grow the network, earn call credits</p>
          <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>
            Share your invitation link with friends and family. When they sign up, you earn call credits you can use across the platform.
          </p>
        </div>

        {/* Referral link */}
        {user?.id ? (
          <>
            <div>
              <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>YOUR INVITATION LINK</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onClick={handleCopy}
                  className="flex-1 px-3 py-2.5 text-[16px] sm:text-xs cursor-pointer font-mono truncate"
                  style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.25)]"
                  style={{ background: copied ? "rgba(209,255,38,0.15)" : "#D1FF26", border: `0.5px solid ${copied ? "rgba(209,255,38,0.5)" : "#D1FF26"}`, color: "#05070A" }}
                >
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
                  style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                >
                  <Share2 size={13} /> Share
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>CODE: {referralCode}</span>
              </div>
            </div>

            {/* Stats grid */}
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="p-3 text-center" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                      <Icon size={14} style={{ color: stat.color, margin: "0 auto 6px" }} />
                      <p className="font-heading font-black text-xl" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="font-mono text-[8px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>{stat.label.toUpperCase()}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent referrals */}
            {!loading && referrals.length > 0 && (
              <div>
                <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>RECENT INVITES</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {referrals.slice(0, 5).map((ref) => (
                    <div key={ref.id} className="flex items-center gap-3 p-2.5" style={{ background: "rgba(5,7,10,0.3)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                      <div className="flex items-center justify-center w-7 h-7 flex-shrink-0" style={{ background: "rgba(209,255,38,0.06)" }}>
                        <Users size={12} style={{ color: "#8A8F98" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: "#F5F5F7" }}>{ref.referred_name || ref.referred_email || "Pending invitee"}</p>
                        {ref.service_shared && (
                          <p className="font-mono text-[8px] truncate" style={{ color: "rgba(138,143,152,0.6)" }}>via {ref.service_shared}</p>
                        )}
                      </div>
                      <span
                        className="font-mono text-[8px] tracking-widest px-2 py-0.5"
                        style={{
                          background: ref.status === "rewarded" ? "rgba(209,255,38,0.12)" : ref.status === "completed" ? "rgba(209,255,38,0.08)" : "rgba(138,143,152,0.08)",
                          color: ref.status === "rewarded" ? "#D1FF26" : ref.status === "completed" ? "#D1FF26" : "#8A8F98",
                        }}
                      >
                        {ref.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SIGN IN TO GET YOUR INVITATION LINK</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}