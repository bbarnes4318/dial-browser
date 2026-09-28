import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Share2, Gift, Lock, Users, Zap, Crown, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const tiers = [
  { name: "Signal", icon: Zap, min: 0, max: 3, perk: "Priority early access", color: '#8A8F98' },
  { name: "Frequency", icon: Users, min: 3, max: 10, perk: "Beta tester + exclusive dial code", color: '#D1FF26' },
  { name: "Broadcast", icon: Crown, min: 10, max: 25, perk: "Founding member badge + swag", color: '#D1FF26' },
  { name: "Orbital", icon: Sparkles, min: 25, max: 50, perk: "Lifetime free tier + equity waitlist", color: '#D1FF26' },
];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function ReferralSection() {
  const [inView, setInView] = useState(true);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sharedPlatform, setSharedPlatform] = useState(null);
  const sectionRef = useRef(null);

  // Load real referral data for the logged-in user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.id) { if (mounted) setLoading(false); return; }
        // Generate a deterministic referral code from user ID if none saved yet
        const userCode = user.full_name
          ? user.full_name.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase().padEnd(6, '1CALL'.charAt(user.full_name.length % 5))
          : user.id.substring(0, 8).toUpperCase();
        if (mounted) setCode(userCode);
        // Count the user's completed referrals
        const referrals = await base44.entities.Referral.filter({ referrer_user_id: user.id });
        const completed = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
        if (mounted) { setReferralCount(completed); setLoading(false); }
      } catch {
        // Not logged in — generate a guest code
        if (mounted) { setCode(generateCode()); setLoading(false); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const inviteLink = `dialbrowser.com/r/${code}`;
  const currentTier = [...tiers].reverse().find(t => referralCount >= t.min) || tiers[0];
  const nextTier = tiers.find(t => t.min > referralCount);
  const progress = nextTier
    ? ((referralCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;
  const remaining = nextTier ? nextTier.min - referralCount : 0;

  const shareText = `Join me on 1 Call Away™ — the voice-first platform that puts the internet one call away. Dial any service from any phone, no app or internet needed. Use my link:`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(`https://${inviteLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    const url = `https://${inviteLink}`;
    const text = encodeURIComponent(`${shareText} ${url}`);
    let shareUrl = '';
    switch (platform) {
      case 'WhatsApp':
        shareUrl = `https://wa.me/?text=${text}`;
        break;
      case 'SMS':
        shareUrl = `sms:?&body=${text}`;
        break;
      case 'Email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Join me on 1 Call Away™')}&body=${text}`;
        break;
      case 'X':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setSharedPlatform(platform);
    setTimeout(() => setSharedPlatform(null), 2000);
  };

  const handleRegenerate = () => {
    setCode(generateCode());
    setCopied(false);
  };

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 text-center"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // REFERRAL NETWORK
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Bring Your Network Online
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Share your unique invite link. Every friend who joins moves you closer to exclusive tier status.
          </p>
        </motion.div>

        {/* Main referral card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="p-6 lg:p-8 mb-6"
          style={{
            background: 'rgba(16,20,29,0.5)',
            border: '0.5px solid rgba(209,255,38,0.15)',
          }}
        >
          {/* Current status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{ background: 'rgba(209,255,38,0.1)', border: '0.5px solid rgba(209,255,38,0.3)' }}
              >
                <Gift size={22} style={{ color: '#D1FF26' }} />
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                  CURRENT TIER
                </p>
                <p className="font-heading font-black text-xl" style={{ color: '#D1FF26' }}>
                  {loading ? <Loader2 size={16} className="animate-spin inline" /> : currentTier.name.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                REFERRALS
              </p>
              <p className="font-heading font-black text-xl" style={{ color: '#F5F5F7' }}>
                {loading ? '—' : referralCount} <span className="text-sm font-normal" style={{ color: '#8A8F98' }}>invited</span>
              </p>
            </div>
          </div>

          {/* Invite link generator */}
          <div className="mb-6">
            <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: '#8A8F98' }}>
              YOUR UNIQUE INVITE LINK
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div
                className="flex-1 flex items-center px-4 py-3 min-w-0"
                style={{ background: 'rgba(5,7,10,0.6)', border: '0.5px solid rgba(138,143,152,0.15)' }}
              >
                <Share2 size={14} className="flex-shrink-0 mr-2" style={{ color: '#D1FF26' }} />
                <span className="font-mono text-sm truncate" style={{ color: '#F5F5F7' }}>
                  {inviteLink}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
                style={{ background: copied ? 'rgba(209,255,38,0.15)' : '#D1FF26', color: '#05070A', border: '0.5px solid #D1FF26' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              onClick={handleRegenerate}
              className="mt-2 flex items-center gap-1.5 font-mono text-[10px] tracking-widest transition-colors hover:text-[#D1FF26]"
              style={{ color: '#8A8F98' }}
            >
              <RefreshCw size={10} /> GENERATE NEW LINK
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                PROGRESS TO {nextTier ? nextTier.name.toUpperCase() : 'MAX TIER'}
              </p>
              <p className="font-mono text-[10px] font-bold" style={{ color: '#D1FF26' }}>
                {referralCount}/{nextTier ? nextTier.min : currentTier.max}
              </p>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(138,143,152,0.1)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${progress}%` } : {}}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                className="h-full rounded-full relative"
                style={{
                  background: 'linear-gradient(90deg, rgba(209,255,38,0.4), #D1FF26)',
                  boxShadow: '0 0 12px rgba(209,255,38,0.4)',
                }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-1" style={{ background: '#fff', boxShadow: '0 0 8px #fff' }} />
              </motion.div>
            </div>
            <p className="font-mono text-[10px] mt-2" style={{ color: '#8A8F98' }}>
              {remaining > 0 ? (
                <>Invite <span style={{ color: '#D1FF26' }}>{remaining} more</span> to unlock <span style={{ color: '#D1FF26' }}>{nextTier.name}</span></>
              ) : (
                <span style={{ color: '#D1FF26' }}>★ Maximum tier reached — you're a legend</span>
              )}
            </p>
          </div>
        </motion.div>

        {/* Tier ladder */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            const unlocked = referralCount >= tier.min;
            const isCurrent = currentTier.name === tier.name;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                className="relative p-4"
                style={{
                  background: isCurrent ? 'rgba(209,255,38,0.06)' : 'rgba(16,20,29,0.3)',
                  border: `0.5px solid ${isCurrent ? 'rgba(209,255,38,0.3)' : unlocked ? 'rgba(209,255,38,0.12)' : 'rgba(138,143,152,0.08)'}`,
                }}
              >
                {isCurrent && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 font-mono text-[8px] tracking-widest"
                    style={{ background: '#D1FF26', color: '#05070A' }}
                  >
                    CURRENT
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 flex items-center justify-center"
                    style={{
                      background: unlocked ? 'rgba(209,255,38,0.1)' : 'rgba(138,143,152,0.05)',
                      border: `0.5px solid ${unlocked ? 'rgba(209,255,38,0.2)' : 'rgba(138,143,152,0.1)'}`,
                    }}
                  >
                    {unlocked ? <Icon size={16} style={{ color: '#D1FF26' }} /> : <Lock size={14} style={{ color: '#8A8F98' }} />}
                  </div>
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: unlocked ? '#D1FF26' : '#8A8F98' }}>
                    {tier.min}+ REFERRALS
                  </span>
                </div>
                <p className="font-heading font-bold text-sm mb-1" style={{ color: unlocked ? '#F5F5F7' : '#8A8F98' }}>
                  {tier.name}
                </p>
                <p className="text-[11px] leading-snug" style={{ color: unlocked ? 'rgba(138,143,152,0.8)' : 'rgba(138,143,152,0.4)' }}>
                  {tier.perk}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Share buttons — now actually share */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
            QUICK SHARE:
          </span>
          <div className="flex gap-2">
            {['WhatsApp', 'SMS', 'Email', 'X'].map((platform) => (
              <button
                key={platform}
                onClick={() => handleShare(platform)}
                className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all duration-200 hover:bg-[rgba(209,255,38,0.1)]"
                style={{
                  background: sharedPlatform === platform ? 'rgba(209,255,38,0.2)' : 'transparent',
                  border: sharedPlatform === platform ? '0.5px solid #D1FF26' : '0.5px solid rgba(209,255,38,0.2)',
                  color: sharedPlatform === platform ? '#D1FF26' : '#D1FF26',
                }}
              >
                {sharedPlatform === platform ? <Check size={10} className="inline mr-1" /> : null}
                {platform}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}