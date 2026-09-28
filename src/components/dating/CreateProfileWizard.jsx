import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Mic, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PhotoUploader from "@/components/dating/PhotoUploader";
import VoiceIntroRecorder from "@/components/dating/VoiceIntroRecorder";
import EmailVerification from "@/components/dating/EmailVerification";
import { QUESTIONNAIRE, Dropdown, InterestPicker, MusicGenrePicker } from "@/components/dating/DatingQuestionnaire";
import { Field } from "@/components/dating/ProfileCard";

// Multi-step dating profile builder: photos + basics → standard questionnaire
// + voice greeting → mandatory email verification (activates the profile).
export default function CreateProfileWizard({ initialForm, emailHint, onCreated, onVerified }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: "", age: "", location: "", phone: "", gender: "other", looking_for: "relationship",
    voice_greeting: "", voice_intro_url: "", voice_intro_duration: 0, bio: "", occupation: "", photos: [],
    height: "", body_type: "", education: "", drinking: "", smoking: "", kids: "", want_kids: "", religion: "", ethnicity: "", zodiac: "",
    interests: [],
    music_genres: [],
    ...initialForm,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleInterest = (opt) => set("interests", form.interests.includes(opt) ? form.interests.filter((i) => i !== opt) : [...form.interests, opt]);
  const toggleMusicGenre = (g) => set("music_genres", form.music_genres.includes(g) ? form.music_genres.filter((x) => x !== g) : [...form.music_genres, g]);

  const canStep1 = form.full_name && form.age && Number(form.age) >= 18 && form.location && form.phone && form.photos.length > 0;
  const canStep2 = form.voice_greeting;

  const createProfile = async () => {
    setError("");
    setSaving(true);
    try {
      await base44.entities.DatingProfile.create({
        full_name: form.full_name,
        age: Number(form.age),
        location: form.location,
        phone: form.phone,
        gender: form.gender,
        looking_for: form.looking_for,
        voice_greeting: form.voice_greeting,
        voice_intro_url: form.voice_intro_url || "",
        voice_intro_duration: form.voice_intro_duration || 0,
        bio: form.bio,
        occupation: form.occupation,
        photos: form.photos,
        avatar_url: form.photos[0] || "",
        height: form.height || "prefer_not_to_say",
        body_type: form.body_type || "prefer_not_to_say",
        education: form.education || "prefer_not_to_say",
        drinking: form.drinking || "prefer_not_to_say",
        smoking: form.smoking || "prefer_not_to_say",
        kids: form.kids || "prefer_not_to_say",
        want_kids: form.want_kids || "prefer_not_to_say",
        religion: form.religion || "prefer_not_to_say",
        ethnicity: form.ethnicity || "prefer_not_to_say",
        zodiac: form.zodiac || "prefer_not_to_say",
        interests: form.interests,
        music_genres: form.music_genres,
        email_verified: false,
        active: false,
      });
      onCreated();
      setStep(3);
    } catch (err) {
      setError(err.message || "Could not create profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 font-mono text-[10px] font-bold" style={{ background: step >= n ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${step >= n ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`, color: step >= n ? "#D1FF26" : "#8A8F98" }}>{n}</div>
            {n < 3 && <div className="w-8 h-px" style={{ background: step > n ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)" }} />}
          </div>
        ))}
        <span className="font-mono text-[9px] tracking-widest ml-2" style={{ color: "#8A8F98" }}>{step === 1 ? "PROFILE" : step === 2 ? "QUESTIONNAIRE" : "VERIFY EMAIL"}</span>
      </div>

      {error && <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}

      <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="p-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// STEP 1 — YOUR PROFILE</p>
            </div>
            <PhotoUploader photos={form.photos} onChange={(urls) => set("photos", urls)} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full Name" value={form.full_name} onChange={(v) => set("full_name", v)} required />
              <Field label="Age" type="number" value={form.age} onChange={(v) => set("age", v)} required />
              <Field label="Location" placeholder="City, State" value={form.location} onChange={(v) => set("location", v)} required />
              <Field label="Phone (for match SMS)" type="tel" value={form.phone} onChange={(v) => set("phone", v)} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Dropdown label="I am a" value={form.gender} fieldKey="gender" options={["man", "woman", "nonbinary", "other"]} onChange={(v) => set("gender", v)} />
              <Dropdown label="Looking for" value={form.looking_for} options={["relationship", "casual", "friendship", "other"]} onChange={(v) => set("looking_for", v)} />
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setStep(2)} disabled={!canStep1} className="flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// STEP 2 — STANDARD QUESTIONNAIRE</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {QUESTIONNAIRE.map((q) => (
                <Dropdown key={q.key} label={q.label} value={form[q.key]} fieldKey={q.key} options={q.options} onChange={(v) => set(q.key, v)} />
              ))}
              <Field label="Occupation" value={form.occupation} onChange={(v) => set("occupation", v)} />
            </div>
            <InterestPicker selected={form.interests} onToggle={toggleInterest} />
            <MusicGenrePicker selected={form.music_genres} onToggle={toggleMusicGenre} />
            <div>
              <label className="font-mono text-[9px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>VOICE GREETING TEXT (others hear this if no clip) *</label>
              <textarea value={form.voice_greeting} onChange={(e) => set("voice_greeting", e.target.value)} maxLength={500} rows={3} placeholder="Hi! I love cooking and live music…" className="w-full p-3 text-sm outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
            </div>
            <VoiceIntroRecorder
              value={form.voice_intro_url}
              duration={form.voice_intro_duration}
              onChange={(url, dur) => { set("voice_intro_url", url); set("voice_intro_duration", dur); }}
            />
            <div>
              <label className="font-mono text-[9px] tracking-widest mb-1 block" style={{ color: "#8A8F98" }}>BIO (optional)</label>
              <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={500} rows={2} className="w-full p-3 text-sm outline-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}>
                <ChevronLeft size={13} /> Back
              </button>
              <button onClick={createProfile} disabled={!canStep2 || saving} className="flex items-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Mic size={13} />} Continue to Verification
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <EmailVerification emailHint={emailHint} onVerified={onVerified} />
        )}
      </motion.div>
    </div>
  );
}