import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Copy, Check, Facebook, Twitter, Instagram, Linkedin, MessageSquare, Link as LinkIcon, Send } from "lucide-react";

const platforms = [
  { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2" },
  { id: "twitter", label: "X (Twitter)", icon: Twitter, color: "#F5F5F7" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  { id: "whatsapp", label: "WhatsApp", icon: Send, color: "#25D366" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E4405F" },
  { id: "sms", label: "SMS", icon: MessageSquare, color: "#D1FF26" },
  { id: "copy", label: "Copy Link", icon: LinkIcon, color: "#8A8F98" },
];

export default function ShareNetwork() {
  const [inView, setInView] = useState(true);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedItems, setSharedItems] = useState([]);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const shareableContent = [
    { id: "s1", title: "1 CALL AWAY™ — Voice-First Universal Interface", type: "Platform", url: "1call.away/platform" },
    { id: "s2", title: "Dial Browser™ Demo — Access Services by Phone", type: "Demo", url: "1call.away/demo" },
    { id: "s3", title: "Job Match Node™ — Hire & Get Hired by Voice", type: "Service", url: "1call.away/jobs" },
    { id: "s4", title: "1 Call News™ — 24/7 Global News Stream", type: "Service", url: "1call.away/news" },
    { id: "s5", title: "Let's Collab™ — Find Your Next Collaborator", type: "Service", url: "1call.away/collab" },
    { id: "s6", title: "Marketplace — Buy, Sell & Trade by Call", type: "Service", url: "1call.away/market" },
  ];

  const handleShare = (platformId, item) => {
    const fullUrl = `https://${item.url}`;
    const shareText = encodeURIComponent(`${item.title} — ${fullUrl}`);
    const shareUrl = encodeURIComponent(fullUrl);

    if (platformId === "copy") {
      navigator.clipboard?.writeText(fullUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setSharedItems((prev) => prev.includes(item.id) ? prev : [...prev, item.id]);
      setTimeout(() => setOpen(false), 1200);
      return;
    }

    if (platformId === "instagram") {
      // Instagram has no web share URL — copy the link so the user can paste in the app
      navigator.clipboard?.writeText(fullUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setSharedItems((prev) => prev.includes(item.id) ? prev : [...prev, item.id]);
      setTimeout(() => setOpen(false), 1200);
      return;
    }

    const shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${shareText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      whatsapp: `https://wa.me/?text=${shareText}`,
      sms: `sms:?&body=${shareText}`,
    };

    if (shareLinks[platformId]) {
      window.open(shareLinks[platformId], "_blank", "noopener,noreferrer,width=600,height=600");
      setSharedItems((prev) => prev.includes(item.id) ? prev : [...prev, item.id]);
      setTimeout(() => setOpen(false), 500);
    }
  };

  return (
    <section ref={sectionRef} className="relative py-12 overflow-hidden" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(209,255,38,0.04) 0%, transparent 70%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Share2 size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// SHARE THE NETWORK</p>
          </div>
          <h3 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
            Spread the <span style={{ color: "#D1FF26" }}>Signal.</span>
          </h3>
          <p className="text-sm font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Share 1 CALL AWAY™ content, services, and posts directly to your social media — free, no account required.
          </p>
        </motion.div>

        {/* Shareable content grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shareableContent.map((item, i) => {
            const isShared = sharedItems.includes(item.id);
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.05 }} className="p-4 flex items-center justify-between gap-3" style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${isShared ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.12)"}` }}>
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 inline-block mb-1.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>{item.type.toUpperCase()}</span>
                  <p className="font-heading font-semibold text-xs truncate" style={{ color: "#F5F5F7" }}>{item.title}</p>
                  <p className="font-mono text-[8px] truncate" style={{ color: "#8A8F98" }}>{item.url}</p>
                </div>
                <button onClick={() => { setOpen(item); setCopied(false); }} className="flex items-center justify-center flex-shrink-0 w-9 h-9 transition-all" style={{ background: isShared ? "rgba(209,255,38,0.15)" : "#D1FF26", border: "0.5px solid #D1FF26" }}>
                  {isShared ? <Check size={14} style={{ color: "#D1FF26" }} /> : <Share2 size={14} style={{ color: "#05070A" }} />}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md p-6" style={{ background: "#0A0D12", border: "0.5px solid rgba(209,255,38,0.3)" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2"><Share2 size={14} style={{ color: "#D1FF26" }} /><p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SHARE TO SOCIAL</p></div>
                <button onClick={() => setOpen(false)}><X size={16} style={{ color: "#8A8F98" }} /></button>
              </div>

              <div className="p-3 mb-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                <p className="font-heading font-semibold text-sm mb-1" style={{ color: "#F5F5F7" }}>{open.title}</p>
                <p className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>https://{open.url}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {platforms.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} onClick={() => handleShare(p.id, open)} className="flex flex-col items-center gap-2 p-3 transition-all hover:scale-[1.03]" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                      <div className="flex items-center justify-center w-9 h-9" style={{ background: `${p.color}15`, border: `0.5px solid ${p.color}40` }}>
                        {p.id === "copy" && copied ? <Check size={16} style={{ color: "#D1FF26" }} /> : <Icon size={16} style={{ color: p.color }} />}
                      </div>
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{((p.id === "copy" || p.id === "instagram") && copied) ? "COPIED" : p.label.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}