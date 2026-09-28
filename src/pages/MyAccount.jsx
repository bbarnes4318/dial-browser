import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Phone, CreditCard, Activity, Loader2, Check, Plus, Trash2, User, Shield, Clock, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CustomGreetingRecorder from "@/components/settings/CustomGreetingRecorder";
import PlanSwitcher from "@/components/account/PlanSwitcher";
import DatingAlerts from "@/components/account/DatingAlerts";

const TIER_META = {
  plus: { color: "#43C6AC", label: "Plus" },
  premium: { color: "#D1FF26", label: "Premium" },
  elite: { color: "#FF6B35", label: "Elite" },
  ultimate: { color: "#A855F7", label: "Ultimate" },
};

const STATUS_META = {
  submitted: { color: "#8A8F98", label: "Submitted" },
  ai_processing: { color: "#D1FF26", label: "Processing" },
  in_review: { color: "#43C6AC", label: "In Review" },
  action_needed: { color: "#FF6B35", label: "Action Needed" },
  completed: { color: "#10B981", label: "Completed" },
};

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [phoneForm, setPhoneForm] = useState({ phone: "", backup_phone: "" });
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      try {
        const members = await base44.entities.Member.filter({}, "-created_date", 50);
        const mine = (members || []).find((m) => m.created_by_id === u.id) || (members || [])[0];
        if (mine) {
          setMember(mine);
          setPhoneForm({ phone: mine.phone || "", backup_phone: mine.backup_phone || "" });
        }
      } catch { /* ignore */ }
      setLoading(false);
    }).catch(() => setLoading(false));

    loadRequests();
    loadSubscriptions();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await base44.entities.ServiceRequest.filter({}, "-created_date", 50);
      setRequests(data || []);
    } catch { /* ignore */ } finally {
      setLoadingRequests(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const data = await base44.entities.Subscription.filter({}, "-created_date", 50);
      setSubscriptions(data || []);
    } catch { /* ignore */ } finally {
      setLoadingSubs(false);
    }
  };

  const savePhones = async (e) => {
    e.preventDefault();
    if (!member) return;
    setPhoneSaving(true);
    setPhoneSaved(false);
    try {
      await base44.entities.Member.update(member.id, {
        phone: phoneForm.phone,
        backup_phone: phoneForm.backup_phone,
      });
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    } catch { /* ignore */ } finally {
      setPhoneSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-16 py-12 lg:py-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ChevronRight size={14} className="rotate-180" /> Back to Home
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// MY ACCOUNT</p>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Account <span style={{ color: "#D1FF26" }}>Hub</span>
          </h1>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Manage your phone numbers, view request history, and control your payment methods — all in one place.
          </p>
        </motion.div>

        {/* User card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="p-5 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING…</span>
            </div>
          ) : user ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0" style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.4)" }}>
                <span className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{(user.full_name || user.email || "U").charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{user.full_name || "Member"}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{user.email}</span>
                  <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: user.role === "admin" ? "rgba(209,255,38,0.08)" : "rgba(138,143,152,0.08)", color: user.role === "admin" ? "#D1FF26" : "#8A8F98" }}>
                    <Shield size={10} className="inline mr-1" />{user.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Phone Numbers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SAVED PHONE NUMBERS</p>
          </div>
          <form onSubmit={savePhones} className="p-5 space-y-4" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div>
              <label className="font-mono text-[9px] tracking-widest uppercase block mb-2" style={{ color: "#8A8F98" }}>Primary Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                <input
                  type="tel"
                  value={phoneForm.phone}
                  onChange={(e) => setPhoneForm({ ...phoneForm, phone: e.target.value })}
                  placeholder="Your primary phone number"
                  className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-[9px] tracking-widest uppercase block mb-2" style={{ color: "#8A8F98" }}>Backup Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
                <input
                  type="tel"
                  value={phoneForm.backup_phone}
                  onChange={(e) => setPhoneForm({ ...phoneForm, backup_phone: e.target.value })}
                  placeholder="Secondary number for fallback alerts"
                  className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={phoneSaving || !phoneForm.phone.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)] disabled:opacity-40"
              style={{ background: phoneSaved ? "rgba(209,255,38,0.15)" : "#D1FF26", color: "#05070A", border: `0.5px solid ${phoneSaved ? "rgba(209,255,38,0.5)" : "#D1FF26"}` }}
            >
              {phoneSaving ? <Loader2 size={13} className="animate-spin" /> : phoneSaved ? <Check size={13} /> : null}
              {phoneSaving ? "Saving…" : phoneSaved ? "Saved!" : "Update Numbers"}
            </button>
          </form>
        </motion.div>

        {/* Dial Browser Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CUSTOM GREETING</p>
          </div>
          <CustomGreetingRecorder />
        </motion.div>

        {/* Dating Engagement — real-time alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DATING ALERTS</p>
          </div>
          <DatingAlerts user={user} />
        </motion.div>

        {/* Request History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// REQUEST HISTORY</p>
            {!loadingRequests && requests.length > 0 && (
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{requests.length} REQUESTS</span>
            )}
          </div>
          {loadingRequests ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Activity size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO REQUESTS YET</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => {
                const status = STATUS_META[req.status] || STATUS_META.submitted;
                return (
                  <div key={req.id} className="p-4" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5" style={{ background: status.color + "15", color: status.color, border: `0.5px solid ${status.color}30` }}>
                        {status.label}
                      </span>
                      <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
                        {(req.service_type || "service").replace("_", " ")}
                      </span>
                      <span className="font-mono text-[8px] ml-auto" style={{ color: "rgba(138,143,152,0.6)" }}>
                        {req.created_date ? new Date(req.created_date).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#F5F5F7" }}>
                      {req.details ? (req.details.length > 120 ? req.details.slice(0, 120) + "…" : req.details) : "No details"}
                    </p>
                    {req.requester_name && (
                      <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>
                        <Phone size={9} className="inline mr-1" />{req.requester_name}{req.requester_phone ? ` · ${req.requester_phone}` : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Plan switcher — self-serve tier + credit changes */}
        <PlanSwitcher user={user} subscriptions={subscriptions} loadingSubs={loadingSubs} onReload={loadSubscriptions} />

        {/* Payment Methods / Subscriptions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// LINKED PAYMENT METHODS</p>
          </div>
          {loadingSubs ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <CreditCard size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO PAYMENT METHODS LINKED</p>
              <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.5)" }}>Subscribe to a plan to link your first payment method</p>
              <Link to="/#pricing" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                View Plans <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const tier = TIER_META[sub.tier] || TIER_META.plus;
                const isActive = sub.subscription_status === "active";
                return (
                  <div key={sub.id} className="p-4" style={{ background: "#10141D", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}` }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 flex-shrink-0" style={{ background: `${tier.color}15`, border: `0.5px solid ${tier.color}40` }}>
                        <CreditCard size={18} style={{ color: tier.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{tier.label} Plan</p>
                          <span className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5" style={{ background: isActive ? "rgba(209,255,38,0.08)" : "rgba(138,143,152,0.08)", color: isActive ? "#D1FF26" : "#8A8F98" }}>
                            {sub.subscription_status?.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-mono text-[9px] mt-0.5" style={{ color: "#8A8F98" }}>
                          {sub.plan?.toUpperCase()} · {sub.owner_email || "Linked account"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}