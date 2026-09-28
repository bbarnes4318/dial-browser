import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Loader2, Users, Award, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Course referral card for the student dashboard. Each student gets a stable
// referral code; friends who enroll in any of the 16 courses with the code
// get 20% off and the student earns 25 call credits when the friend pays.
export default function CourseReferralSection() {
  const [code, setCode] = useState("");
  const [stats, setStats] = useState({ completed_count: 0, credits_earned: 0, cap: 50 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const res = await base44.functions.invoke("course-referral-code", {});
      const d = res?.data;
      if (d?.referral_code) {
        setCode(d.referral_code);
        setStats({ completed_count: d.completed_count || 0, credits_earned: d.credits_earned || 0, cap: d.cap || 50 });
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const shareUrl = code ? `${window.location.origin}/courses?ref=${code}` : "";

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
          title: "1 Call Away — Certified Courses",
          text: "Learn by phone and get certified. Enroll with my code for 20% off any course:",
          url: shareUrl,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Gift size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// INVITE & EARN</p>
      </div>

      <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <p className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>Refer a friend, earn call credits</p>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "#8A8F98" }}>
          Share your link with a friend. They get <span style={{ color: "#D1FF26" }}>20% off</span> enrollment in any of the 16 certified courses — you earn <span style={{ color: "#D1FF26" }}>25 call credits</span> when they pay.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-4"><Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : code ? (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
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

            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>CODE: {code}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 text-center" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <Users size={14} style={{ color: "#8A8F98", margin: "0 auto 6px" }} />
                <p className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{stats.completed_count}</p>
                <p className="font-mono text-[8px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>ENROLLED</p>
              </div>
              <div className="p-3 text-center" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <Award size={14} style={{ color: "#D1FF26", margin: "0 auto 6px" }} />
                <p className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{stats.credits_earned}</p>
                <p className="font-mono text-[8px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>CREDITS</p>
              </div>
              <div className="p-3 text-center" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <Gift size={14} style={{ color: "#8A8F98", margin: "0 auto 6px" }} />
                <p className="font-heading font-black text-xl" style={{ color: "#8A8F98" }}>{stats.cap - stats.completed_count}</p>
                <p className="font-mono text-[8px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>REMAINING</p>
              </div>
            </div>
          </>
        ) : (
          <p className="font-mono text-[10px] tracking-widest text-center py-4" style={{ color: "#8A8F98" }}>SIGN IN TO GET YOUR REFERRAL LINK</p>
        )}
      </div>
    </motion.div>
  );
}