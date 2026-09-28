import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellRing, Loader2, Check, MapPin, X, Stethoscope, Bone as Tooth, Home as HomeIcon, HardHat, ShoppingCart, Cloud, Music, Briefcase, Receipt, Store, Sparkles
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

const CATEGORIES = [
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "weather", label: "Weather", icon: Cloud },
  { id: "music", label: "Music", icon: Music },
  { id: "jobs", label: "Jobs", icon: Briefcase },
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

export default function CategoryAlertSignup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingSubs, setExistingSubs] = useState([]);
  const [form, setForm] = useState({ full_name: "", phone: "", category: "medical", region: "all" });
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const loadExisting = async () => {
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      if (!isAuthed) return;
      const subs = await base44.entities.CategoryAlertSubscription.filter({ active: true }, "-created_date", 50);
      setExistingSubs(subs || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadExisting();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const isAuthed = await base44.auth.isAuthenticated();
    if (!isAuthed) {
      openRegistrationModal();
      return;
    }
    if (!form.full_name || !form.phone) {
      setError("Name and phone number are required");
      return;
    }
    setLoading(true);
    try {
      await base44.entities.CategoryAlertSubscription.create({
        full_name: form.full_name,
        phone: form.phone,
        category: form.category,
        region: form.region,
        active: true,
      });
      setStep("success");
      loadExisting();
    } catch (err) {
      setError(err.message || "Failed to subscribe");
    }
    setLoading(false);
  };

  const handleUnsubscribe = async (id) => {
    try {
      await base44.entities.CategoryAlertSubscription.update(id, { active: false });
      setExistingSubs((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  };

  const reset = () => {
    setStep("form");
    setForm({ full_name: "", phone: "", category: "medical", region: "all" });
    setOpen(false);
  };

  const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;
  const regionLabel = (id) => REGIONS.find((r) => r.id === id)?.label || id;

  return (
    <section
      ref={sectionRef}
      id="category-alerts"
      className="snap-section relative py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
        <div className="absolute bottom-1/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.2), transparent)", animation: "signalPulse 6s ease-in-out infinite 1s" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <BellRing size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// CATEGORY ALERTS</span>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Be the First to <span style={{ color: "#D1FF26" }}>Know.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Subscribe to any service category and get an SMS the instant a new provider joins the network in your area. Never miss a match.
          </p>
        </motion.div>

        {/* Category grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8"
        >
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            const subscribed = existingSubs.some((s) => s.category === cat.id);
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                onClick={() => { setForm({ ...form, category: cat.id }); setOpen(true); setStep("form"); setError(""); }}
                className="group relative p-5 flex flex-col items-center text-center transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.15)]"
                style={{
                  background: subscribed ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${subscribed ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                }}
              >
                {subscribed && (
                  <span className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
                  </span>
                )}
                <div className="w-12 h-12 flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <Icon size={20} style={{ color: "#D1FF26" }} />
                </div>
                <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{cat.label}</p>
                <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: subscribed ? "#D1FF26" : "#8A8F98" }}>
                  {subscribed ? "ACTIVE" : "SUBSCRIBE"}
                </p>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Active subscriptions */}
        {existingSubs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-5"
            style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Bell size={13} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// YOUR ACTIVE ALERTS</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {existingSubs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.12)" }}>
                  <div className="flex items-center gap-2 min-w-0">
                    {(() => {
                      const cat = CATEGORIES.find((c) => c.id === sub.category);
                      const Icon = cat?.icon || Bell;
                      return <Icon size={14} style={{ color: "#D1FF26" }} />;
                    })()}
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] truncate" style={{ color: "#F5F5F7" }}>{catLabel(sub.category)}</p>
                      <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>{regionLabel(sub.region)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleUnsubscribe(sub.id)} className="p-1 flex-shrink-0 transition-colors hover:bg-[rgba(239,68,68,0.1)]" title="Unsubscribe">
                    <X size={12} style={{ color: "#8A8F98" }} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Subscribe Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }}
              onClick={reset}
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain pointer-events-auto"
                style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                  <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
                </div>

                <div className="flex items-center justify-between p-5" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}>
                  <div className="flex items-center gap-2">
                    <BellRing size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// ALERT SETUP</p>
                  </div>
                  <button onClick={reset} className="p-1.5 transition-colors hover:bg-[rgba(239,68,68,0.1)]">
                    <X size={16} style={{ color: "#8A8F98" }} />
                  </button>
                </div>

                <div className="p-5">
                  {step === "success" ? (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
                        <Check size={28} style={{ color: "#D1FF26" }} />
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-2" style={{ color: "#F5F5F7" }}>Alert Active!</h3>
                      <p className="text-sm" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                        We'll text <span style={{ color: "#D1FF26" }}>{form.phone}</span> the moment a new <span style={{ color: "#D1FF26" }}>{catLabel(form.category)}</span> provider joins in <span style={{ color: "#D1FF26" }}>{regionLabel(form.region)}</span>.
                      </p>
                      <button onClick={reset} className="mt-6 w-full py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>New Provider Alert</h3>
                      <p className="text-xs mb-5" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                        Choose a category and region. We'll send an SMS the instant a matching provider lists on the network.
                      </p>

                      {error && <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Category */}
                        <div>
                          <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
                            <Sparkles size={10} style={{ color: "#D1FF26" }} /> CATEGORY
                          </label>
                          <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto overscroll-contain p-1">
                            {CATEGORIES.map((c) => {
                              const Icon = c.icon;
                              const active = form.category === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setForm({ ...form, category: c.id })}
                                  className="flex items-center gap-2 px-2 py-2 font-mono text-[9px] tracking-wider text-left transition-all"
                                  style={{
                                    background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                                    border: `0.5px solid ${active ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                                    color: active ? "#D1FF26" : "#8A8F98",
                                  }}
                                >
                                  <Icon size={11} /> {c.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Region */}
                        <div>
                          <label className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>
                            <MapPin size={10} style={{ color: "#D1FF26" }} /> REGION
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {REGIONS.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setForm({ ...form, region: r.id })}
                                className="px-3 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all"
                                style={{
                                  background: form.region === r.id ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.6)",
                                  border: `0.5px solid ${form.region === r.id ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                                  color: form.region === r.id ? "#D1FF26" : "#8A8F98",
                                }}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Name + Phone */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>YOUR NAME</label>
                            <input
                              value={form.full_name}
                              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                              placeholder="John Doe"
                              required
                              className="w-full px-3 py-2.5 text-sm outline-none"
                              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                            />
                          </div>
                          <div>
                            <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>PHONE</label>
                            <input
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                              placeholder="+1234567890"
                              type="tel"
                              required
                              className="w-full px-3 py-2.5 text-[16px] sm:text-sm outline-none"
                              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40"
                          style={{ background: "#D1FF26", color: "#05070A" }}
                        >
                          {loading ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />} Activate Alert
                        </button>
                        <p className="text-center font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.5)" }}>
                          SMS alerts · Unsubscribe anytime · Standard rates apply
                        </p>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}