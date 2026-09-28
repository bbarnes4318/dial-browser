import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Share2, Users, Zap, Link2, TrendingUp, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ShareCards from "@/components/dashboard/ShareCards";

const REWARD_CREDITS = 25;

function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function ReferAFriend() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [totalCredits, setTotalCredits] = useState(0);
  const [selectedService, setSelectedService] = useState("");

  const [referralCode, setReferralCode] = useState("");

  const loadReferrals = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const data = await base44.entities.Referral.filter(
        { referrer_user_id: user.id },
        "-created_date",
        50
      );
      setReferrals(data || []);
      const earned = (data || []).reduce((sum, r) => sum + (r.credits_earned || 0), 0);
      setTotalCredits(earned);
      // Resolve or create a non-guessable referral code backed by a stored Referral record.
      const existingCode = (data || []).find((r) => r.referral_code)?.referral_code;
      if (existingCode) {
        setReferralCode(existingCode);
      } else {
        const newCode = generateReferralCode();
        await base44.entities.Referral.create({
          referrer_user_id: user.id,
          referrer_name: user.full_name || user.email || "Member",
          referral_code: newCode,
          status: "pending",
          credits_earned: 0,
        });
        setReferralCode(newCode);
        setReferrals((prev) => [{
          referrer_user_id: user.id,
          referrer_name: user.full_name || "Member",
          referral_code: newCode,
          status: "pending",
          credits_earned: 0,
          created_date: new Date().toISOString(),
        }, ...prev]);
      }
    } catch {
      // empty state shows
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  useEffect(() => {
    if (referralCode) {
      const origin = window.location.origin;
      setShareUrl(`${origin}/?ref=${encodeURIComponent(referralCode)}`);
    }
  }, [referralCode]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "1 Call Away — Find any service by voice",
          text: `Check out 1 Call Away! You can find, book, and call any service just by using your voice. ${selectedService ? `I found ${selectedService} on here. ` : ""}Use my link to get started:`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleShareService = async (serviceName, servicePath) => {
    const url = `${window.location.origin}${servicePath || "/"}?ref=${encodeURIComponent(referralCode)}`;
    try {
      await base44.entities.Referral.create({
        referrer_user_id: user?.id || "guest",
        referrer_name: user?.full_name || user?.email || "Member",
        referral_code: referralCode,
        service_shared: serviceName,
        share_url: url,
        status: "pending",
        credits_earned: 0,
      });
      setReferrals((prev) => [{
        referrer_user_id: user?.id || "guest",
        referrer_name: user?.full_name || "Member",
        referral_code: referralCode,
        service_shared: serviceName,
        share_url: url,
        status: "pending",
        credits_earned: 0,
        created_date: new Date().toISOString(),
      }, ...prev]);
    } catch {}
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${serviceName} on 1 Call Away`,
          text: `I found ${serviceName} on 1 Call Away — check it out!`,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const completedCount = referrals.filter((r) => r.status === "completed" || r.status === "rewarded").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-3">
          <Gift size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// REFER A FRIEND</p>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
          Share Services. <span style={{ color: "#D1FF26" }}>Earn Credits.</span>
        </h2>
        <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          Share your favorite voice services with friends. When they join 1 Call Away, you both get <span style={{ color: "#D1FF26" }}>{REWARD_CREDITS} bonus call credits</span>.
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Friends Referred" value={referrals.length} />
        <StatCard icon={Check} label="Joined" value={completedCount} />
        <StatCard icon={Zap} label="Credits Earned" value={totalCredits} highlight />
      </div>

      {/* Referral link card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="p-6"
        style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// YOUR UNIQUE REFERRAL LINK</p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 px-4 py-3 font-mono text-xs bg-transparent outline-none"
            style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
            style={{ background: copied ? "rgba(209,255,38,0.15)" : "#D1FF26", color: "#05070A", border: copied ? "0.5px solid #D1FF26" : "none" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[11px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]"
          style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          <Share2 size={14} /> Share Link with Friends
        </button>

        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
            Code: {referralCode}
          </span>
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
            Reward: {REWARD_CREDITS} credits per friend
          </span>
        </div>
      </motion.div>

      {/* Pre-designed social share cards */}
      <ShareCards referralCode={referralCode} shareUrl={shareUrl} userName={user?.full_name || user?.email} />

      {/* Quick share services */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="p-6"
        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>// QUICK SHARE — TOP SERVICES</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "AI Medical", path: "/#medical", icon: "🩺" },
            { name: "Real Estate", path: "/#realestate", icon: "🏠" },
            { name: "Job Alerts", path: "/#jobs", icon: "💼" },
            { name: "Grocery", path: "/#grocery", icon: "🛒" },
          ].map((svc) => (
            <button
              key={svc.name}
              onClick={() => handleShareService(svc.name, svc.path)}
              className="p-4 text-center transition-all hover:bg-[rgba(209,255,38,0.06)]"
              style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}
            >
              <div className="text-2xl mb-2">{svc.icon}</div>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#F5F5F7" }}>{svc.name}</p>
              <p className="font-mono text-[8px] mt-1 flex items-center justify-center gap-1" style={{ color: "#D1FF26" }}>
                <Send size={8} /> Share
              </p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Referral history */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>// REFERRAL HISTORY</p>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-12" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px dashed rgba(209,255,38,0.2)" }}>
            <Gift size={32} className="mx-auto mb-3" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO REFERRALS YET</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Share your link to start earning credits</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((ref, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.08)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)" }}>
                    {ref.service_shared ? <span className="text-base">{ref.service_shared?.[0] || "🔗"}</span> : <Share2 size={14} style={{ color: "#D1FF26" }} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#F5F5F7" }}>{ref.service_shared || "Platform referral"}</p>
                    <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>
                      {new Date(ref.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="font-mono text-[9px] tracking-widest uppercase px-2 py-1"
                    style={{
                      background: ref.status === "rewarded" ? "rgba(209,255,38,0.15)" : ref.status === "completed" ? "rgba(34,211,238,0.1)" : "rgba(138,143,152,0.1)",
                      color: ref.status === "rewarded" ? "#D1FF26" : ref.status === "completed" ? "#22D3EE" : "#8A8F98",
                    }}
                  >
                    {ref.status}
                  </span>
                  {ref.credits_earned > 0 && (
                    <p className="font-mono text-[10px] mt-1" style={{ color: "#D1FF26" }}>+{ref.credits_earned} credits</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className="p-4 text-center"
      style={{
        background: highlight ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.6)",
        border: `0.5px solid ${highlight ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}`,
      }}
    >
      <Icon size={16} className="mx-auto mb-2" style={{ color: highlight ? "#D1FF26" : "#8A8F98" }} />
      <p className="font-heading font-black text-xl" style={{ color: highlight ? "#D1FF26" : "#F5F5F7" }}>{value}</p>
      <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>{label}</p>
    </div>
  );
}