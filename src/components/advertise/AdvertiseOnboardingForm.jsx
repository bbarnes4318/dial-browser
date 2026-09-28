import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, DollarSign, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2, Check, Globe, Megaphone,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

const LIME = "#A4FF00";
const PURPLE = "#BC00FF";

const STEPS = [
  { num: 1, label: "Business", Icon: Building2, desc: "Tell us about your brand" },
  { num: 2, label: "Audience", Icon: Users, desc: "Pick who and where" },
  { num: 3, label: "Budget", Icon: DollarSign, desc: "Set budget & timeline" },
  { num: 4, label: "Review", Icon: CheckCircle2, desc: "Confirm & submit" },
];

const BUDGETS = [
  { v: "under_1k", l: "Under $1K / mo" },
  { v: "1k_5k", l: "$1K – $5K / mo" },
  { v: "5k_25k", l: "$5K – $25K / mo" },
  { v: "25k_100k", l: "$25K – $100K / mo" },
  { v: "100k_plus", l: "$100K+ / mo" },
];
const GOALS = [
  { v: "brand_awareness", l: "Brand Awareness" },
  { v: "app_installs", l: "App Installs" },
  { v: "lead_gen", l: "Lead Generation" },
  { v: "sales", l: "Sales / Conversions" },
  { v: "foot_traffic", l: "Foot Traffic" },
];
const TIMELINES = [
  { v: "ready_now", l: "Ready Now" },
  { v: "30_days", l: "Within 30 Days" },
  { v: "60_days", l: "Within 60 Days" },
  { v: "just_exploring", l: "Just Exploring" },
];
const REGIONS = ["North America", "Latin America", "Europe", "Africa", "Middle East", "South Asia", "East Asia", "Southeast Asia", "Oceania", "Caribbean"];
const CHANNELS = [
  { v: "voice_ads", l: "Voice Ads" },
  { v: "sms_broadcast", l: "SMS Broadcast" },
  { v: "radio_spot", l: "Radio Spots" },
  { v: "dating_sponsor", l: "Dating Sponsor" },
  { v: "social_feed", l: "Social Feed" },
  { v: "audiobook_pre_roll", l: "Audiobook Pre-Roll" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, children, error }) {
  return (
    <div>
      <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>{label}</p>
      {children}
      {error && <p className="mt-1 text-[10px]" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    background: "rgba(16,20,29,0.6)",
    border: `0.5px solid ${hasError ? "rgba(239,68,68,0.5)" : "rgba(164,255,0,0.2)"}`,
    color: "#F5F5F7",
  };
}

function Pill({ active, onClick, children, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap transition-all"
      style={{
        background: active ? `${accent}1a` : "rgba(5,7,10,0.4)",
        border: `0.5px solid ${active ? `${accent}66` : "rgba(138,143,152,0.12)"}`,
        color: active ? accent : "#8A8F98",
      }}
    >
      {children}
    </button>
  );
}

export default function AdvertiseOnboardingForm() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [form, setForm] = useState({
    business_name: "", contact_name: "", contact_email: "", contact_phone: "",
    website: "", industry: "",
    campaign_goal: "brand_awareness", target_regions: [], preferred_channels: [],
    budget_range: "under_1k", start_timeline: "just_exploring", creative_ready: false, notes: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm((p) => {
    const arr = p[k] || [];
    return { ...p, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
  });

  const validateStep = (n) => {
    const e = {};
    if (n === 1) {
      if (!form.business_name.trim()) e.business_name = "Required";
      if (!form.contact_name.trim()) e.contact_name = "Required";
      if (!form.contact_email.trim() || !EMAIL_RE.test(form.contact_email)) e.contact_email = "Valid email required";
    }
    if (n === 2) {
      if (!form.preferred_channels.length) e.preferred_channels = "Pick at least one channel";
    }
    return e;
  };

  const next = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    const e = validateStep(1);
    if (Object.keys(e).length) { setStep(1); setErrors(e); return; }
    setSubmitting(true);
    setErrors({});
    try {
      const res = await base44.functions.invoke("submit-advertise-inquiry", form);
      setSubmitted(res?.data || { ok: true });
    } catch (err) {
      setErrors({ submit: err?.message || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted?.ok) {
    return (
      <div className="text-center py-16 px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center justify-center w-16 h-16 mb-4" style={{ background: `${LIME}1a`, border: `0.5px solid ${LIME}66`, borderRadius: "50%" }}>
          <Check size={28} style={{ color: LIME }} />
        </motion.div>
        <h3 className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>Application Received</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: "#8A8F98" }}>
          Thanks{form.contact_name ? `, ${form.contact_name.split(" ")[0]}` : ""}! Our partnerships team will review your campaign and reach out within 1–2 business days.
        </p>
        <button onClick={() => { setSubmitted(null); setStep(1); setForm({ business_name: "", contact_name: "", contact_email: "", contact_phone: "", website: "", industry: "", campaign_goal: "brand_awareness", target_regions: [], preferred_channels: [], budget_range: "under_1k", start_timeline: "just_exploring", creative_ready: false, notes: "" }); }} className="mt-6 font-mono text-[10px] tracking-widest uppercase hover:underline" style={{ color: LIME }}>
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <section id="advertise-form" className="relative py-14 lg:py-20" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${PURPLE}10 0%, transparent 55%)` }} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-8">
          <p className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: PURPLE }}>// ADVERTISER ONBOARDING</p>
          <h2 className="font-heading font-black text-2xl sm:text-4xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
            Launch in <span style={{ color: LIME }}>four steps.</span>
          </h2>
          <p className="text-sm" style={{ color: "#8A8F98" }}>No commitment. A real human reviews every application.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.Icon;
            const done = step > s.num;
            const active = step === s.num;
            const accent = active || done ? LIME : "#8A8F98";
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center text-center flex-1 min-w-0">
                  <div
                    className="w-10 h-10 flex items-center justify-center transition-all"
                    style={{
                      background: active || done ? `${LIME}1a` : "rgba(16,20,29,0.6)",
                      border: `0.5px solid ${active || done ? `${LIME}66` : "rgba(138,143,152,0.15)"}`,
                      boxShadow: active ? `0 0 16px ${LIME}33` : "none",
                    }}
                  >
                    {done ? <Check size={15} style={{ color: LIME }} /> : <Icon size={15} style={{ color: accent }} />}
                  </div>
                  <p className="font-mono text-[8px] tracking-widest mt-1.5 hidden sm:block" style={{ color: accent }}>{s.label.toUpperCase()}</p>
                  <p className="text-[9px] mt-0.5 hidden md:block" style={{ color: "#8A8F98" }}>{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px flex-shrink-0 flex-1" style={{ background: done ? `${LIME}66` : "rgba(138,143,152,0.15)" }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form card */}
        <div className="p-5 lg:p-7" style={{ background: "rgba(10,13,20,0.7)", border: `0.5px solid ${LIME}25`, boxShadow: "0 12px 50px rgba(0,0,0,0.5)" }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="BUSINESS / BRAND NAME" error={errors.business_name}>
                    <input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Acme Corp" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle(errors.business_name)} />
                  </Field>
                  <Field label="INDUSTRY" >
                    <input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Retail, Fintech, Food…" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle()} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="CONTACT NAME" error={errors.contact_name}>
                    <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Jane Doe" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle(errors.contact_name)} />
                  </Field>
                  <Field label="CONTACT EMAIL" error={errors.contact_email}>
                    <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="jane@acme.com" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle(errors.contact_email)} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="PHONE (OPTIONAL)">
                    <input type="tel" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+1 555 000 1234" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle()} />
                  </Field>
                  <Field label="WEBSITE (OPTIONAL)">
                    <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://acme.com" className="w-full px-3 py-2.5 text-sm outline-none" style={inputStyle()} />
                  </Field>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                <Field label="CAMPAIGN GOAL">
                  <div className="flex flex-wrap gap-1.5">
                    {GOALS.map((g) => <Pill key={g.v} active={form.campaign_goal === g.v} onClick={() => set("campaign_goal", g.v)} accent={PURPLE}>{g.l}</Pill>)}
                  </div>
                </Field>
                <Field label="TARGET REGIONS">
                  <div className="flex flex-wrap gap-1.5">
                    {REGIONS.map((r) => <Pill key={r} active={form.target_regions.includes(r)} onClick={() => toggleArr("target_regions", r)} accent={LIME}>{r}</Pill>)}
                  </div>
                </Field>
                <Field label="PREFERRED CHANNELS" error={errors.preferred_channels}>
                  <div className="flex flex-wrap gap-1.5">
                    {CHANNELS.map((c) => <Pill key={c.v} active={form.preferred_channels.includes(c.v)} onClick={() => toggleArr("preferred_channels", c.v)} accent={PURPLE}>{c.l}</Pill>)}
                  </div>
                </Field>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                <Field label="MONTHLY BUDGET">
                  <div className="flex flex-wrap gap-1.5">
                    {BUDGETS.map((b) => <Pill key={b.v} active={form.budget_range === b.v} onClick={() => set("budget_range", b.v)} accent={LIME}>{b.l}</Pill>)}
                  </div>
                </Field>
                <Field label="START TIMELINE">
                  <div className="flex flex-wrap gap-1.5">
                    {TIMELINES.map((t) => <Pill key={t.v} active={form.start_timeline === t.v} onClick={() => set("start_timeline", t.v)} accent={PURPLE}>{t.l}</Pill>)}
                  </div>
                </Field>
                <Field label="AD CREATIVE">
                  <button type="button" onClick={() => set("creative_ready", !form.creative_ready)} className="flex items-center gap-2 px-3 py-2 transition-all" style={{ background: form.creative_ready ? `${LIME}1a` : "rgba(16,20,29,0.6)", border: `0.5px solid ${form.creative_ready ? `${LIME}66` : "rgba(138,143,152,0.15)"}` }}>
                    <div className="w-4 h-4 flex items-center justify-center" style={{ background: form.creative_ready ? LIME : "transparent", border: `0.5px solid ${form.creative_ready ? LIME : "#8A8F98"}` }}>
                      {form.creative_ready && <Check size={10} style={{ color: "#05070A" }} />}
                    </div>
                    <span className="text-[12px]" style={{ color: form.creative_ready ? LIME : "#8A8F98" }}>I have ad creative ready</span>
                  </button>
                </Field>
                <Field label="NOTES (OPTIONAL)">
                  <textarea value={form.notes} onChange={(e) => set("notes", e.target.value.slice(0, 2000))} rows={3} placeholder="Tell us about your campaign goals, audience, or any questions…" className="w-full px-3 py-2.5 text-sm outline-none resize-none" style={inputStyle()} />
                </Field>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3">
                <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: LIME }}>// REVIEW YOUR APPLICATION</p>
                <ReviewRow label="Business" value={form.business_name} />
                <ReviewRow label="Contact" value={`${form.contact_name} · ${form.contact_email}`} />
                <ReviewRow label="Industry" value={form.industry || "—"} />
                <ReviewRow label="Goal" value={GOALS.find((g) => g.v === form.campaign_goal)?.l} />
                <ReviewRow label="Regions" value={form.target_regions.length ? form.target_regions.join(", ") : "—"} />
                <ReviewRow label="Channels" value={form.preferred_channels.map((c) => CHANNELS.find((x) => x.v === c)?.l).join(", ") || "—"} />
                <ReviewRow label="Budget" value={BUDGETS.find((b) => b.v === form.budget_range)?.l} />
                <ReviewRow label="Timeline" value={TIMELINES.find((t) => t.v === form.start_timeline)?.l} />
                <ReviewRow label="Creative ready" value={form.creative_ready ? "Yes" : "No"} />
                {errors.submit && <p className="text-[11px]" style={{ color: "#ef4444" }}>{errors.submit}</p>}
                <p className="text-[10px] pt-2" style={{ color: "#8A8F98" }}>
                  By submitting you agree to be contacted by the Dial Browser partnerships team. We never share your data.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.12)" }}>
            <button onClick={back} disabled={step === 1 || submitting} className="flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-colors disabled:opacity-30" style={{ color: "#8A8F98" }}>
              <ChevronLeft size={13} /> Back
            </button>
            {step < 4 ? (
              <button onClick={next} disabled={submitting} className="flex items-center gap-1.5 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(164,255,0,0.3)]" style={{ background: LIME, color: "#05070A" }}>
                Continue <ChevronRight size={13} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1.5 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(188,0,255,0.4)]" style={{ background: PURPLE, color: "#F5F5F7" }}>
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Megaphone size={13} />} Submit Application
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-4 text-[11px]" style={{ color: "#8A8F98" }}>
          Want to manage campaigns after approval?{" "}
          <button onClick={openRegistrationModal} className="hover:underline" style={{ color: LIME }}>Create a member account</button>.
        </p>
      </div>
    </section>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
      <span className="font-mono text-[9px] tracking-widest flex-shrink-0" style={{ color: "#8A8F98" }}>{label.toUpperCase()}</span>
      <span className="text-[12px] text-right" style={{ color: "#F5F5F7" }}>{value}</span>
    </div>
  );
}