import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Copy, Check, Send, X, Loader2, Hash, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PersonalDialNumber() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePhone, setSharePhone] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [receiveCalls, setReceiveCalls] = useState(false);
  const [togglingCalls, setTogglingCalls] = useState(false);

  useEffect(() => {
    const loadMember = async () => {
      try {
        const user = await base44.auth.me();
        const members = await base44.entities.Member.filter({}, "-created_date", 50);
        const mine = (members || []).find((m) => m.created_by_id === user.id) || (members || [])[0];
        setMember(mine);
        setReceiveCalls(mine?.receive_calls_enabled || false);
      } catch {
        // not logged in or no member record yet
      } finally {
        setLoading(false);
      }
    };
    loadMember();
  }, []);

  const dialCode = member?.member_dial_code || "";
  const phone = member?.phone || "";

  const copyNumber = async () => {
    if (!dialCode) return;
    try {
      await navigator.clipboard.writeText(dialCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const buildShareMessage = () => {
    return `1 CALL AWAY — You can reach me on my personal Dial Browser number: ${dialCode}\n\nDial it from any phone to connect with me directly.${phone ? `\n\nOr call my line: ${phone}` : ""}\n\n— Sent via 1 Call Away`;
  };

  const shareViaSms = (e) => {
    e.preventDefault();
    if (!sharePhone.trim() || !dialCode) return;
    const msg = encodeURIComponent(buildShareMessage());
    const cleanPhone = sharePhone.trim().replace(/\s+/g, "");
    window.location.href = `sms:${cleanPhone}?body=${msg}`;
  };

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(buildShareMessage());
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const toggleReceiveCalls = async () => {
    if (!member) return;
    setTogglingCalls(true);
    try {
      const newVal = !receiveCalls;
      await base44.entities.Member.update(member.id, { receive_calls_enabled: newVal });
      setReceiveCalls(newVal);
      setMember({ ...member, receive_calls_enabled: newVal });
    } catch { /* ignore */ } finally {
      setTogglingCalls(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Hash size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// PERSONAL DIAL BROWSER NUMBER</p>
      </div>

      {loading ? (
        <div className="p-6 flex items-center gap-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING YOUR NUMBER…</span>
        </div>
      ) : dialCode ? (
        <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>YOUR PERSONAL NUMBER</p>
              <p className="font-heading font-black text-3xl tracking-tight" style={{ color: "#D1FF26" }}>{dialCode}</p>
              {phone && (
                <p className="flex items-center gap-1.5 font-mono text-[10px] mt-2" style={{ color: "#8A8F98" }}>
                  <Phone size={11} /> Forwards to: {phone}
                </p>
              )}
              <p className="font-mono text-[9px] mt-2" style={{ color: "rgba(138,143,152,0.6)" }}>
                Share this number so anyone can dial it to reach you directly — no app needed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:${dialCode}`}
                className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
                style={{ background: "#D1FF26", color: "#05070A" }}
                title={`Call ${dialCode}`}
              >
                <Phone size={12} /> Call
              </a>
              <button
                onClick={copyNumber}
                className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                title="Copy your number"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                title="Share your number"
              >
                <Share2 size={12} /> Share
              </button>
            </div>
          </div>
          {/* Opt-in toggle for receiving calls */}
          <div className="flex items-center justify-between gap-3 mt-4 pt-4" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
            <div className="flex-1">
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#F5F5F7" }}>RECEIVE INCOMING CALLS</p>
              <p className="font-mono text-[8px] mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>
                {receiveCalls ? "On — calls ring through with caller ID" : "Off — callers go straight to voicemail"}
              </p>
            </div>
            <button
              onClick={toggleReceiveCalls}
              disabled={togglingCalls}
              className="relative w-12 h-6 rounded-full transition-all disabled:opacity-50 flex-shrink-0"
              style={{ background: receiveCalls ? "#D1FF26" : "rgba(138,143,152,0.2)" }}
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ left: receiveCalls ? "26px" : "2px", background: receiveCalls ? "#05070A" : "#8A8F98" }} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Hash size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO PERSONAL NUMBER ASSIGNED</p>
          <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Complete onboarding from the home page to get your personal Dial Browser number</p>
        </div>
      )}

      {/* Share dialog */}
      <AnimatePresence>
        {shareOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80]"
              style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
              onClick={() => setShareOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-md p-6"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SHARE YOUR NUMBER</p>
                </div>
                <button onClick={() => setShareOpen(false)} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              <p className="font-heading font-bold text-lg mb-1" style={{ color: "#D1FF26" }}>{dialCode}</p>
              <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>Send your personal Dial Browser number so others can call you directly.</p>

              <form onSubmit={shareViaSms}>
                <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>RECIPIENT PHONE NUMBER</label>
                <div className="relative mb-3">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                  <input
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    type="tel"
                    autoFocus
                    className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!sharePhone.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  <Send size={13} /> Send via SMS
                </button>
              </form>

              <button
                onClick={copyShareText}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: shareCopied ? "#D1FF26" : "#8A8F98" }}
              >
                {shareCopied ? <><Check size={12} /> Copied!</> : "Copy Message Instead"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}