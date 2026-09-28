import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Globe, Bell, BookmarkCheck, Trash2, Phone, Check, Loader2, ChevronRight, Mail, Shield, Briefcase, Search, Gift } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage, languages } from "@/lib/LanguageContext";
import { dialServices } from "@/data/dialServices";
import CallHistoryLog from "@/components/profile/CallHistoryLog";
import VoiceNotesDashboard from "@/components/profile/VoiceNotesDashboard";
import PersonalDialNumber from "@/components/profile/PersonalDialNumber";
import CallerIdDisplay from "@/components/profile/CallerIdDisplay";
import VoicemailBox from "@/components/profile/VoicemailBox";
import VideoChat from "@/components/profile/VideoChat";
import VoicemailGreeting from "@/components/dashboard/VoicemailGreeting";
import ReferralSection from "@/components/profile/ReferralSection";

const BOOKMARK_KEY = "dial_bookmarks";

const alertFields = [
  "Technology", "Telecom", "Marketing", "Design", "Hardware",
  "Sales", "Logistics", "Community", "Accessibility", "General",
];

export default function Profile() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Saved services (bookmarks)
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Job alert subscriptions
  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ full_name: "", phone: "", selected_field: "Technology" });
  const [subSaving, setSubSaving] = useState(false);
  const [subError, setSubError] = useState(null);

  // Language search
  const [langQuery, setLangQuery] = useState("");

  // Member dial code for caller ID
  const [memberDialCode, setMemberDialCode] = useState("");
  const [receiveCallsEnabled, setReceiveCallsEnabled] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      setLoadingUser(false);
      // Fetch member record to get dial code for caller ID
      try {
        const members = await base44.entities.Member.filter({}, "-created_date", 50);
        const mine = (members || []).find((m) => m.created_by_id === u.id) || (members || [])[0];
        if (mine?.member_dial_code) setMemberDialCode(mine.member_dial_code);
        setReceiveCallsEnabled(mine?.receive_calls_enabled || false);
      } catch { /* ignore */ }
    }).catch(() => setLoadingUser(false));

    // Load bookmarks
    try {
      const stored = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
      setBookmarkedIds(stored);
    } catch { /* ignore */ }

    // Load job alert subscriptions
    loadSubs();
  }, []);

  const loadSubs = async () => {
    try {
      const data = await base44.entities.JobAlertSubscription.filter({}, "-created_date", 50);
      setSubs(data || []);
    } catch { /* ignore */ } finally {
      setLoadingSubs(false);
    }
  };

  const bookmarkedServices = useMemo(
    () => dialServices.filter((s) => bookmarkedIds.includes(s.id)),
    [bookmarkedIds]
  );

  const removeBookmark = (serviceId) => {
    const updated = bookmarkedIds.filter((id) => id !== serviceId);
    setBookmarkedIds(updated);
    try {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const filteredLanguages = languages.filter(
    (l) =>
      l.label.toLowerCase().includes(langQuery.toLowerCase().trim()) ||
      l.native.toLowerCase().includes(langQuery.toLowerCase().trim()) ||
      l.code.toLowerCase().includes(langQuery.toLowerCase().trim())
  );

  const createSub = async (e) => {
    e.preventDefault();
    if (!subForm.full_name.trim() || !subForm.phone.trim()) return;
    setSubSaving(true);
    setSubError(null);
    try {
      await base44.entities.JobAlertSubscription.create({
        full_name: subForm.full_name.trim(),
        phone: subForm.phone.trim(),
        selected_field: subForm.selected_field,
        active: true,
      });
      setSubForm({ full_name: "", phone: "", selected_field: "Technology" });
      setShowSubForm(false);
      await loadSubs();
    } catch (err) {
      setSubError("Could not save subscription. Try again.");
    } finally {
      setSubSaving(false);
    }
  };

  const toggleSub = async (sub) => {
    try {
      await base44.entities.JobAlertSubscription.update(sub.id, { active: !sub.active });
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? { ...s, active: !s.active } : s)));
    } catch { /* ignore */ }
  };

  const deleteSub = async (sub) => {
    try {
      await base44.entities.JobAlertSubscription.delete(sub.id);
      setSubs((prev) => prev.filter((s) => s.id !== sub.id));
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-16 py-12 lg:py-20">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ChevronRight size={14} className="rotate-180" /> Back to Home
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// MEMBER PROFILE</p>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Your <span style={{ color: "#D1FF26" }}>Settings</span>
          </h1>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Manage your saved services, preferred language, and job alert notifications in one place.
          </p>
        </motion.div>

        {/* User card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="p-5 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {loadingUser ? (
            <div className="flex items-center gap-3">
              <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING PROFILE…</span>
            </div>
          ) : user ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0" style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.4)" }}>
                <span className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>{(user.full_name || user.email || "U").charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{user.full_name || "Member"}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 font-mono text-[10px]" style={{ color: "#8A8F98" }}><Mail size={11} /> {user.email}</span>
                  <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: user.role === "admin" ? "rgba(209,255,38,0.08)" : "rgba(138,143,152,0.08)", color: user.role === "admin" ? "#D1FF26" : "#8A8F98" }}>
                    <Shield size={10} /> {user.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>SIGN IN TO VIEW PROFILE</p>
          )}
        </motion.div>

        {/* Personal Dial Number */}
        <PersonalDialNumber />

        {/* Caller ID Display */}
        <CallerIdDisplay dialCode={memberDialCode} receiveCallsEnabled={receiveCallsEnabled} />

        {/* Voicemail Box */}
        <VoicemailBox dialCode={memberDialCode} />

        {/* Voicemail Greeting (Free) */}
        <VoicemailGreeting />

        {/* Free Video Chat & Meetings */}
        <VideoChat user={user} loadingUser={loadingUser} />

        {/* Referral — Invite & Earn */}
        <ReferralSection user={user} />

        {/* Saved Services */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookmarkCheck size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SAVED SERVICES</p>
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{bookmarkedServices.length} BOOKMARKED</span>
          </div>

          {bookmarkedServices.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <BookmarkCheck size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO SAVED SERVICES YET</p>
              <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.5)" }}>Bookmark services from the directory to access them here</p>
              <Link to="/directory" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                Browse Directory <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {bookmarkedServices.map((svc) => (
                <div key={svc.id} className="p-4 flex items-center gap-3" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <span className="text-2xl flex-shrink-0">{svc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <Link to={`/directory/${svc.id}`} className="font-heading font-semibold text-sm hover:text-[#D1FF26] transition-colors" style={{ color: "#F5F5F7" }}>{svc.name}</Link>
                    <p className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>{svc.dial}</p>
                  </div>
                  <a href={`tel:${svc.dial}`} className="flex items-center justify-center w-9 h-9 transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]" style={{ background: "#D1FF26", color: "#05070A" }} title={`Call ${svc.dial}`}>
                    <Phone size={13} />
                  </a>
                  <button onClick={() => removeBookmark(svc.id)} className="flex items-center justify-center w-9 h-9 transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }} title="Remove bookmark">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Call History Log */}
        <CallHistoryLog />

        {/* Voice Notes & Reminders Dashboard */}
        <VoiceNotesDashboard />

        {/* Preferred Language */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// PREFERRED LANGUAGE</p>
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{languages.find((l) => l.code === lang)?.native}</span>
          </div>

          <div className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }} />
              <input
                value={langQuery}
                onChange={(e) => setLangQuery(e.target.value)}
                placeholder="Search languages…"
                className="w-full pl-9 pr-3 py-2.5 text-[16px] sm:text-sm"
                style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filteredLanguages.map((l) => {
                const isActive = l.code === lang;
                return (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-all"
                    style={{
                      background: isActive ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.4)",
                      border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[8px] tracking-widest uppercase flex-shrink-0" style={{ color: isActive ? "#D1FF26" : "#8A8F98" }}>{l.code}</span>
                      <span className="text-xs truncate" style={{ color: isActive ? "#D1FF26" : "#F5F5F7" }}>{l.native}</span>
                    </div>
                    {isActive && <Check size={12} style={{ color: "#D1FF26" }} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            {filteredLanguages.length === 0 && (
              <p className="text-center font-mono text-[9px] tracking-widest py-4" style={{ color: "#8A8F98" }}>NO LANGUAGES FOUND</p>
            )}
          </div>
        </motion.div>

        {/* Job Alert Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// JOB ALERT NOTIFICATIONS</p>
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{subs.filter((s) => s.active).length} ACTIVE</span>
            </div>
            {!showSubForm && (
              <button onClick={() => setShowSubForm(true)} className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "#D1FF26", color: "#05070A" }}>
                <Briefcase size={12} /> New Alert
              </button>
            )}
          </div>

          {/* New subscription form */}
          {showSubForm && (
            <form onSubmit={createSub} className="p-5 mb-4" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// SUBSCRIBE TO JOB ALERTS</p>
              {subError && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {subError}</p>}
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <input
                  value={subForm.full_name}
                  onChange={(e) => setSubForm({ ...subForm, full_name: e.target.value })}
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
                <input
                  value={subForm.phone}
                  onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })}
                  placeholder="Phone number for SMS alerts"
                  type="tel"
                  className="w-full px-3 py-2.5 text-[16px] sm:text-sm"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {alertFields.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSubForm({ ...subForm, selected_field: f })}
                    className="px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                    style={{
                      background: subForm.selected_field === f ? "rgba(209,255,38,0.12)" : "transparent",
                      border: `0.5px solid ${subForm.selected_field === f ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.15)"}`,
                      color: subForm.selected_field === f ? "#D1FF26" : "#8A8F98",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={subSaving || !subForm.full_name.trim() || !subForm.phone.trim()} className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                  {subSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Subscribe
                </button>
                <button type="button" onClick={() => { setShowSubForm(false); setSubError(null); }} className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Subscriptions list */}
          {loadingSubs ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
            </div>
          ) : subs.length === 0 ? (
            <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
              <Bell size={28} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>NO JOB ALERTS SET UP</p>
              <p className="font-mono text-[9px]" style={{ color: "rgba(138,143,152,0.5)" }}>Subscribe to get SMS alerts when new jobs match your field</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subs.map((sub) => (
                <div key={sub.id} className="p-4 flex items-center gap-3" style={{ background: "#10141D", border: `0.5px solid ${sub.active ? "rgba(209,255,38,0.2)" : "rgba(138,143,152,0.1)"}` }}>
                  <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: sub.active ? "rgba(209,255,38,0.08)" : "rgba(138,143,152,0.08)" }}>
                    <Briefcase size={16} style={{ color: sub.active ? "#D1FF26" : "#8A8F98" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{sub.full_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{sub.selected_field}</span>
                      <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}><Phone size={9} className="inline" /> {sub.phone}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSub(sub)}
                    className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                    style={{
                      background: sub.active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                      border: `0.5px solid ${sub.active ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.2)"}`,
                      color: sub.active ? "#D1FF26" : "#8A8F98",
                    }}
                  >
                    {sub.active ? <><Check size={11} /> Active</> : "Paused"}
                  </button>
                  <button onClick={() => deleteSub(sub)} className="flex items-center justify-center w-9 h-9 transition-colors hover:bg-[rgba(239,68,68,0.1)]" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }} title="Delete alert">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}