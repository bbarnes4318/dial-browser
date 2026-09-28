import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Bell, BellRing, BellOff, Loader2, Trash2, MapPin, RefreshCw,
  Stethoscope, Bone as Tooth, Home as HomeIcon, HardHat, ShoppingCart,
  Cloud, Music, Briefcase, Receipt, Store, Check, Phone, Plus,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "dental", label: "Dental", icon: Tooth },
  { id: "real_estate", label: "Real Estate", icon: HomeIcon },
  { id: "construction", label: "Construction", icon: HardHat },
  { id: "grocery", label: "Grocery", icon: ShoppingCart },
  { id: "weather", label: "Weather", icon: Cloud },
  { id: "music", label: "Music", icon: Music },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "bill_payment", label: "Bill Payment", icon: Receipt },
  { id: "marketplace", label: "Marketplace", icon: Store },
];

const REGIONS = [
  { id: "all", label: "Nationwide" },
  { id: "northeast", label: "Northeast" },
  { id: "southeast", label: "Southeast" },
  { id: "midwest", label: "Midwest" },
  { id: "southwest", label: "Southwest" },
  { id: "west", label: "West" },
];

function catLabel(id) { return CATEGORIES.find((c) => c.id === id)?.label || id; }
function catIcon(id) { return CATEGORIES.find((c) => c.id === id)?.icon || Bell; }
function regionLabel(id) { return REGIONS.find((r) => r.id === id)?.label || id; }

export default function SmsSubscriptionManager() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [editRegion, setEditRegion] = useState(null);

  // Try to pre-fill phone from Member record
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await base44.auth.me();
        if (me?.full_name) setName(me.full_name);
        const members = await base44.entities.Member.filter({ created_by_id: me.id }, "-created_date", 1).catch(() => []);
        if (members?.length > 0 && members[0].phone) {
          setPhone(members[0].phone);
        }
      } catch { /* not logged in — user enters phone manually */ }
    };
    loadProfile();
  }, []);

  const loadSubs = useCallback(async (searchPhone) => {
    if (!searchPhone?.trim()) return;
    setLoading(true);
    try {
      const all = await base44.entities.CategoryAlertSubscription.filter({}, "-created_date", 200).catch(() => []);
      const mine = (all || []).filter((s) => s.phone && s.phone.replace(/\D/g, "") === searchPhone.replace(/\D/g, ""));
      setSubs(mine);
    } catch {
      setSubs([]);
    }
    setLoading(false);
    setSearched(true);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadSubs(phone);
  };

  const toggleActive = async (sub) => {
    setUpdating(sub.id);
    try {
      await base44.entities.CategoryAlertSubscription.update(sub.id, { active: !sub.active });
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? { ...s, active: !s.active } : s)));
    } catch { /* ignore */ }
    setUpdating(null);
  };

  const changeRegion = async (sub, regionId) => {
    setUpdating(sub.id);
    try {
      await base44.entities.CategoryAlertSubscription.update(sub.id, { region: regionId });
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? { ...s, region: regionId } : s)));
      setEditRegion(null);
    } catch { /* ignore */ }
    setUpdating(null);
  };

  const unsubscribe = async (sub) => {
    setUpdating(sub.id);
    try {
      await base44.entities.CategoryAlertSubscription.update(sub.id, { active: false });
      setSubs((prev) => prev.filter((s) => s.id !== sub.id));
    } catch { /* ignore */ }
    setUpdating(null);
  };

  // Map subscriptions to categories the user hasn't subscribed to yet
  const subscribedCats = new Set(subs.map((s) => s.category));
  const availableCats = CATEGORIES.filter((c) => !subscribedCats.has(c.id));

  const activeCount = subs.filter((s) => s.active).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BellRing size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SMS SUBSCRIPTION MANAGER</p>
          {searched && subs.length > 0 && (
            <span className="font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              {activeCount} ACTIVE
            </span>
          )}
        </div>
        {searched && (
          <button
            onClick={() => loadSubs(phone)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            <RefreshCw size={11} /> Refresh
          </button>
        )}
      </div>

      {/* Phone search */}
      {!searched && (
        <div className="p-5 mb-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Phone size={13} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// FIND YOUR SUBSCRIPTIONS</p>
          </div>
          <p className="text-xs mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            Enter the phone number you used to subscribe. We'll pull up every category alert tied to that number so you can toggle them on or off.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              type="tel"
              className="flex-1 px-3 py-3 text-[16px] sm:text-sm outline-none"
              style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            />
            <button
              type="submit"
              disabled={!phone.trim() || loading}
              className="flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Find
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          {subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
              <BellOff size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
              <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO SUBSCRIPTIONS FOUND</p>
              <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>
                No category alerts are tied to {phone}
              </p>
              <Link
                to="/#category-alerts"
                className="mt-5 flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              >
                <Plus size={12} /> Browse Categories
              </Link>
            </div>
          ) : (
            <>
              {/* Phone info bar */}
              <div className="flex items-center gap-2 mb-4 p-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                <Phone size={11} style={{ color: "#8A8F98" }} />
                <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{phone}</span>
                <button
                  onClick={() => { setSearched(false); setSubs([]); }}
                  className="ml-auto font-mono text-[9px] tracking-widest uppercase transition-all hover:text-[#D1FF26]"
                  style={{ color: "#8A8F98" }}
                >
                  Change Number
                </button>
              </div>

              {/* Active subscriptions */}
              <p className="font-mono text-[9px] tracking-widest mb-3 px-1" style={{ color: "#D1FF26" }}>// YOUR SUBSCRIPTIONS</p>
              <div className="space-y-2 mb-6">
                <AnimatePresence mode="popLayout">
                  {subs.map((sub) => {
                    const Icon = catIcon(sub.category);
                    const isActive = sub.active;
                    const isUpdating = updating === sub.id;
                    return (
                      <motion.div
                        key={sub.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 p-4"
                        style={{
                          background: isActive ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.4)",
                          border: `0.5px solid ${isActive ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.12)"}`,
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            background: isActive ? "rgba(209,255,38,0.1)" : "rgba(138,143,152,0.06)",
                            border: `0.5px solid ${isActive ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.12)"}`,
                          }}
                        >
                          <Icon size={16} style={{ color: isActive ? "#D1FF26" : "#8A8F98" }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-heading font-semibold text-sm" style={{ color: isActive ? "#F5F5F7" : "#8A8F98" }}>
                              {catLabel(sub.category)}
                            </p>
                            <span
                              className="font-mono text-[7px] tracking-widest px-1.5 py-0.5"
                              style={{
                                background: isActive ? "rgba(209,255,38,0.12)" : "rgba(138,143,152,0.1)",
                                color: isActive ? "#D1FF26" : "#8A8F98",
                              }}
                            >
                              {isActive ? "ON" : "OFF"}
                            </span>
                          </div>
                          {/* Region selector */}
                          {editRegion === sub.id ? (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {REGIONS.map((r) => (
                                <button
                                  key={r.id}
                                  onClick={() => changeRegion(sub, r.id)}
                                  className="px-2 py-0.5 font-mono text-[8px] tracking-widest uppercase transition-all"
                                  style={{
                                    background: sub.region === r.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                                    border: `0.5px solid ${sub.region === r.id ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                                    color: sub.region === r.id ? "#D1FF26" : "#8A8F98",
                                  }}
                                >
                                  {r.label}
                                </button>
                              ))}
                              <button
                                onClick={() => setEditRegion(null)}
                                className="px-2 py-0.5 font-mono text-[8px] tracking-widest uppercase"
                                style={{ color: "#8A8F98" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditRegion(sub.id)}
                              className="flex items-center gap-1 mt-0.5 font-mono text-[9px] transition-colors hover:text-[#D1FF26]"
                              style={{ color: "#8A8F98" }}
                            >
                              <MapPin size={9} /> {regionLabel(sub.region)}
                            </button>
                          )}
                        </div>

                        {/* Toggle switch */}
                        <button
                          onClick={() => toggleActive(sub)}
                          disabled={isUpdating}
                          className="relative flex-shrink-0 transition-all"
                          title={isActive ? "Turn off alerts" : "Turn on alerts"}
                        >
                          <div
                            className="w-11 h-6 rounded-full transition-all"
                            style={{
                              background: isActive ? "#D1FF26" : "rgba(138,143,152,0.2)",
                              boxShadow: isActive ? "0 0 10px rgba(209,255,38,0.3)" : "none",
                            }}
                          />
                          <div
                            className="absolute top-0.5 w-5 h-5 rounded-full transition-all flex items-center justify-center"
                            style={{
                              left: isActive ? "22px" : "2px",
                              background: isActive ? "#05070A" : "#8A8F98",
                            }}
                          >
                            {isUpdating && <Loader2 size={10} className="animate-spin" style={{ color: "#D1FF26" }} />}
                          </div>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => unsubscribe(sub)}
                          disabled={isUpdating}
                          className="flex-shrink-0 p-2 transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                          title="Unsubscribe permanently"
                        >
                          <Trash2 size={13} style={{ color: "#8A8F98" }} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Available categories to add */}
              {availableCats.length > 0 && (
                <>
                  <p className="font-mono text-[9px] tracking-widest mb-3 px-1" style={{ color: "#8A8F98" }}>// ADD MORE CATEGORIES</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                    {availableCats.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <Link
                          key={cat.id}
                          to="/#category-alerts"
                          className="flex flex-col items-center p-3 text-center transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.1)]"
                          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}
                        >
                          <Icon size={16} style={{ color: "#8A8F98" }} />
                          <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>{cat.label}</p>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Info note */}
              <div className="flex items-start gap-2 p-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                <Bell size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#8A8F98" }} />
                <p className="font-mono text-[9px] leading-relaxed" style={{ color: "#8A8F98" }}>
                  Toggle alerts on or off instantly. When off, you won't receive SMS notifications for new providers in that category. Use the trash icon to permanently remove a subscription.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}