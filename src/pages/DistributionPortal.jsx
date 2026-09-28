import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Loader2, Globe, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StepArtistProfile from "@/components/distribution/steps/StepArtistProfile";
import StepUploadMusic from "@/components/distribution/steps/StepUploadMusic";
import StepSelectRegions from "@/components/distribution/steps/StepSelectRegions";
import StepSelectAudience from "@/components/distribution/steps/StepSelectAudience";
import StepCampaignBudget from "@/components/distribution/steps/StepCampaignBudget";
import StepDistributionTimeline from "@/components/distribution/steps/StepDistributionTimeline";
import StepSocialMedia from "@/components/distribution/steps/StepSocialMedia";
import DistributionHeader from "@/components/distribution/DistributionHeader";

const STEPS = [
  { key: "profile", label: "Artist Profile", C: StepArtistProfile },
  { key: "music", label: "Upload Music", C: StepUploadMusic },
  { key: "regions", label: "Select Regions", C: StepSelectRegions },
  { key: "audience", label: "Select Audience", C: StepSelectAudience },
  { key: "budget", label: "Campaign Budget", C: StepCampaignBudget },
  { key: "timeline", label: "Timeline", C: StepDistributionTimeline },
  { key: "social", label: "Social Media", C: StepSocialMedia },
];

const initial = {
  artist_or_label_name: "", artist_name: "", contact_name: "", contact_email: "", contact_phone: "",
  music_genre: "", website: "", bio: "", artist_photo_url: "", logo_url: "", streaming_links: "", youtube_channel: "",
  song_title: "", album_name: "", release_date: "", producer_info: "", songwriter_info: "", copyright_info: "",
  isrc: "", explicit_content: false, cover_artwork_url: "", music_file_url: "", music_video_url: "",
  target_regions: [], target_countries: "",
  audience_age_range: "", audience_location: "", audience_genre: "", audience_interests: "", fan_demographics: "", distribution_goals: "",
  campaign_budget: 0, campaign_timeline: "just_price_checking", campaign_start_date: "", campaign_end_date: "",
  instagram_handle: "", other_social_links: "", sms_campaign: false, email_campaign: false,
  concert_ticket_url: "", merchandise_url: "", live_stream_url: "",
  step_reached: 1, status: "draft",
};

export default function DistributionPortal() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initial);
  const [appId, setAppId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (f, v) => setData((d) => ({ ...d, [f]: v }));

  const persist = async (status) => {
    const payload = { ...data, step_reached: Math.max(data.step_reached, step + 1), status: status || data.status };
    if (appId) {
      await base44.entities.DistributionApplication.update(appId, payload);
    } else {
      const rec = await base44.entities.DistributionApplication.create(payload);
      setAppId(rec.id);
    }
  };

  const next = async () => {
    setSaving(true);
    try {
      if (step < STEPS.length - 1) {
        await persist();
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        await persist("submitted");
        setSubmitted(true);
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error("save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const back = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const reset = () => {
    setSubmitted(false);
    setStep(0);
    setData(initial);
    setAppId(null);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#05070A" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full p-8 text-center"
          style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
        >
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.5)" }}>
            <Check size={28} style={{ color: "#D1FF26" }} />
          </div>
          <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// APPLICATION SUBMITTED</p>
          <h1 className="font-heading font-black text-3xl mt-2 mb-3" style={{ color: "#F5F5F7" }}>You're in the queue.</h1>
          <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Your Dial World Distribution application has been received. Our team reviews each submission for eligibility and will reach out through your contact information with next steps.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
              Back to Home
            </Link>
            <button onClick={reset} className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.25)", color: "#8A8F98" }}>
              Start Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const Current = STEPS[step].C;

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <DistributionHeader />

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={18} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// DIAL WORLD DISTRIBUTION</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl" style={{ color: "#F5F5F7" }}>
            Artist & Record Label <span style={{ color: "#D1FF26" }}>Distribution Portal</span>
          </h1>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "#8A8F98" }}>
            Your Music. Your Audience. Your World. Complete each step to build your distribution campaign.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex flex-wrap items-center gap-1.5 mb-8">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={s.key}>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                  style={{
                    background: active ? "rgba(209,255,38,0.12)" : done ? "rgba(209,255,38,0.06)" : "rgba(16,20,29,0.6)",
                    border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : done ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.12)"}`,
                    color: active || done ? "#D1FF26" : "#8A8F98",
                  }}
                >
                  {done ? <Check size={11} /> : i + 1}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <span style={{ color: "rgba(138,143,152,0.3)" }}>·</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step card */}
        <div className="p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Current data={data} update={update} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={back}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
            style={{ border: "0.5px solid rgba(138,143,152,0.25)", color: "#8A8F98" }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={next}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.25)] disabled:opacity-60"
            style={{ background: "#D1FF26", color: "#05070A" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : step === STEPS.length - 1 ? <Sparkles size={14} /> : <ArrowRight size={14} />}
            {saving ? "Saving…" : step === STEPS.length - 1 ? "Submit Application" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}