import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight, ArrowLeft, Mic, Square, Check, Loader2, ShieldCheck,
  Percent, FileLock2, Sparkles, AlertTriangle,
} from "lucide-react";

const STEPS = ["Welcome", "Legal & Policy", "Revenue Share", "NDA & Verbal", "Complete"];

const CREATOR_TYPES = [
  { value: "artist", label: "Artist / Musician" },
  { value: "host", label: "Show Host" },
  { value: "podcaster", label: "Podcaster" },
  { value: "producer", label: "Producer" },
  { value: "influencer", label: "Influencer" },
  { value: "other", label: "Other Creator" },
];

const DISCLAIMER_TEXT = `You are applying for a content creator account on the Dial Browser platform ("1 Call Away"). Submitting content does not guarantee publication, compensation, or visibility. You affirm that all content you create is original, properly licensed, or used with permission, and that you hold all necessary rights. You are solely responsible for your content and its accuracy. Dial Browser is not liable for user-generated content and reserves the right to remove, demote, or reject any content that violates these terms. This is a general information disclaimer and does not constitute legal or financial advice.`;

const POLICY_TEXT = `By proceeding you agree to the Dial Browser Platform Policy: no hate speech, harassment, illegal content, misinformation, or infringement of third-party rights. Adult content must be labeled and age-gated. You consent to automated and manual content review. Violations may result in suspension, forfeiture of pending earnings, and permanent removal. You agree to comply with all applicable local, state, and federal laws. Earnings are reported in accordance with applicable tax law and you are responsible for your own tax obligations.`;

const NDA_TEXT = `NON-DISCLOSURE AGREEMENT. As a condition of creating content on Dial Browser, you agree to keep confidential any non-public platform information disclosed to you, including unreleased features, internal metrics, creator terms, partner data, and roadmap details. You may not share, reproduce, or exploit such information for any purpose outside your creator activities. This obligation survives termination of your creator status. You confirm your agreement both by checking the box below and by recording a verbal confirmation of your identity and consent.`;

const VERBAL_SCRIPT = `I, [state your name], agree to the Dial Browser non-disclosure agreement and confirm my verbal consent to begin creating content.`;

export default function CreatorOnboardingPortal() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ creator_name: "", creator_email: "", creator_type: "artist" });
  const [agreed, setAgreed] = useState({ disclaimer: false, policy: false, revenue: false, nda: false });
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verbalUrl, setVerbalUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    base44.auth.me()
      .then((u) => setForm((f) => ({ ...f, creator_name: u?.full_name || "", creator_email: u?.email || "" })))
      .catch(() => {});
  }, []);

  const startRec = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setUploading(true);
        try {
          const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: blob });
          setVerbalUrl(file_url);
        } catch (err) {
          setError("Upload failed: " + (err.message || "please try again"));
        } finally {
          setUploading(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRec = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const canAdvance = () => {
    if (step === 0) return form.creator_name.trim() && form.creator_email.trim();
    if (step === 1) return agreed.disclaimer && agreed.policy;
    if (step === 2) return agreed.revenue;
    if (step === 3) return agreed.nda && !!verbalUrl;
    return true;
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.CreatorOnboarding.create({
        creator_name: form.creator_name,
        creator_email: form.creator_email,
        creator_type: form.creator_type,
        disclaimer_agreed: agreed.disclaimer,
        policy_agreed: agreed.policy,
        revenue_share_agreed: agreed.revenue,
        revenue_share_percent: 30,
        nda_agreed: agreed.nda,
        nda_verbal_url: verbalUrl,
        completed: true,
        completed_at: new Date().toISOString(),
      });
      setStep(4);
    } catch (err) {
      setError(err.message || "Failed to complete onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 lg:pt-20 pb-20 relative" style={{ background: "#05070A" }}>
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: "linear-gradient(rgba(140,243,72,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(140,243,72,0.06) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />
      <div className="relative max-w-3xl mx-auto px-6">
        <div className="mb-6">
          <Link to="/" className="font-mono text-[10px] tracking-[0.3em] uppercase hover:underline" style={{ color: "#8A8F98" }}>← Back to Home</Link>
          <h1 className="font-heading font-black text-3xl sm:text-4xl mt-3" style={{ color: "#F5F5F7" }}>
            CREATOR <span style={{ color: "#8cf348" }}>ONBOARDING</span>
          </h1>
          <p className="font-mono text-xs tracking-[0.2em] mt-2 uppercase" style={{ color: "#8cf348" }}>
            Legal · Policy · Revenue · NDA — required before you publish
          </p>
        </div>

        {/* stepper */}
        <div className="flex items-center gap-1.5 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className="h-1 transition-all duration-300" style={{ background: i <= step ? "#8cf348" : "rgba(138,143,152,0.2)", boxShadow: i === step ? "0 0 8px #8cf348" : "none" }} />
              <p className="font-mono text-[7px] sm:text-[8px] tracking-widest uppercase mt-1.5" style={{ color: i <= step ? "#8cf348" : "#8A8F98" }}>{String(i + 1).padStart(2, "0")} {s}</p>
            </div>
          ))}
        </div>

        <div className="relative p-6 sm:p-8" style={{ background: "rgba(10,14,10,0.6)", border: "0.5px solid rgba(140,243,72,0.25)" }}>
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #8cf348, transparent)", animation: "tickerScroll 5s linear infinite" }} />
          </div>

          {error && (
            <div className="mb-5 p-3 text-xs flex items-start gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 0 — welcome / identity */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <div className="flex items-center gap-2 mb-4"><Sparkles size={16} style={{ color: "#8cf348" }} /><h2 className="font-heading font-bold text-xl" style={{ color: "#F5F5F7" }}>Welcome, Creator</h2></div>
                <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.6 }}>Tell us who you are. You'll complete a short legal, policy, revenue-share, and NDA confirmation before you can start creating content.</p>
                <div className="space-y-3">
                  <div>
                    <label className="font-mono text-[10px] tracking-widest uppercase block mb-1" style={{ color: "#8A8F98" }}>Creator name</label>
                    <input value={form.creator_name} onChange={(e) => setForm({ ...form, creator_name: e.target.value })} placeholder="Your stage or display name" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(140,243,72,0.2)", color: "#F5F5F7" }} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-widest uppercase block mb-1" style={{ color: "#8A8F98" }}>Email</label>
                    <input type="email" value={form.creator_email} onChange={(e) => setForm({ ...form, creator_email: e.target.value })} placeholder="you@example.com" className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(140,243,72,0.2)", color: "#F5F5F7" }} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-widest uppercase block mb-1" style={{ color: "#8A8F98" }}>Creator type</label>
                    <select value={form.creator_type} onChange={(e) => setForm({ ...form, creator_type: e.target.value })} className="w-full px-3 py-2.5 text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(140,243,72,0.2)", color: "#F5F5F7" }}>
                      {CREATOR_TYPES.map((t) => <option key={t.value} value={t.value} style={{ background: "#10141D" }}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1 — legal disclaimer + policy */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <div className="flex items-center gap-2 mb-4"><ShieldCheck size={16} style={{ color: "#8cf348" }} /><h2 className="font-heading font-bold text-xl" style={{ color: "#F5F5F7" }}>Legal Disclaimer & Policy</h2></div>
                <Panel title="// LEGAL DISCLAIMER" text={DISCLAIMER_TEXT} />
                <Checkbox checked={agreed.disclaimer} onChange={(v) => setAgreed({ ...agreed, disclaimer: v })} label="I have read and accept the legal disclaimer." />
                <Panel title="// PLATFORM POLICY" text={POLICY_TEXT} />
                <Checkbox checked={agreed.policy} onChange={(v) => setAgreed({ ...agreed, policy: v })} label="I agree to the Dial Browser Platform Policy." />
              </motion.div>
            )}

            {/* STEP 2 — revenue share */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <div className="flex items-center gap-2 mb-4"><Percent size={16} style={{ color: "#8cf348" }} /><h2 className="font-heading font-bold text-xl" style={{ color: "#F5F5F7" }}>Revenue Share Agreement</h2></div>
                <div className="p-4 mb-4" style={{ background: "rgba(140,243,72,0.06)", border: "0.5px solid rgba(140,243,72,0.3)" }}>
                  <p className="font-heading font-black text-4xl mb-1" style={{ color: "#8cf348" }}>30%</p>
                  <p className="text-sm" style={{ color: "#F5F5F7", lineHeight: 1.6 }}>Dial Browser retains <strong>30%</strong> of all donations, gifts, tips, and membership fees you receive through the platform. You keep 70%. This covers hosting, payments processing, discovery, and platform services.</p>
                </div>
                <Checkbox checked={agreed.revenue} onChange={(v) => setAgreed({ ...agreed, revenue: v })} label="I agree to the 30% platform revenue share on all donations, gifts, tips, and membership fees." />
              </motion.div>
            )}

            {/* STEP 3 — NDA + verbal confirmation */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <div className="flex items-center gap-2 mb-4"><FileLock2 size={16} style={{ color: "#8cf348" }} /><h2 className="font-heading font-bold text-xl" style={{ color: "#F5F5F7" }}>NDA & Verbal Confirmation</h2></div>
                <Panel title="// NON-DISCLOSURE AGREEMENT" text={NDA_TEXT} />
                <Checkbox checked={agreed.nda} onChange={(v) => setAgreed({ ...agreed, nda: v })} label="I agree to the Non-Disclosure Agreement." />

                <div className="mt-5 p-4" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(140,243,72,0.2)" }}>
                  <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#22d3ee" }}>▸ VERBAL CONFIRMATION REQUIRED</p>
                  <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>Read the script aloud and record your verbal consent. This is required before you can create content.</p>
                  <div className="p-3 mb-4 font-mono text-xs" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7", lineHeight: 1.6 }}>"{VERBAL_SCRIPT}"</div>

                  <div className="flex items-center gap-3">
                    {!recording ? (
                      <button onClick={startRec} disabled={uploading} className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40" style={{ background: "#8cf348", color: "#05070A" }}>
                        <Mic size={13} /> {verbalUrl ? "Re-record" : "Record Verbal"}
                      </button>
                    ) : (
                      <button onClick={stopRec} className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#ef4444", color: "#fff" }}>
                        <Square size={13} /> Stop
                      </button>
                    )}
                    {uploading && <span className="font-mono text-[10px] flex items-center gap-2" style={{ color: "#8cf348" }}><Loader2 size={12} className="animate-spin" /> Uploading…</span>}
                    {recording && <span className="font-mono text-[10px]" style={{ color: "#ef4444" }}>● REC</span>}
                  </div>

                  {verbalUrl && !uploading && (
                    <div className="mt-3">
                      <audio controls src={verbalUrl} className="w-full" style={{ filter: "invert(0.9) hue-rotate(70deg)" }} />
                      <p className="font-mono text-[10px] mt-2 flex items-center gap-1" style={{ color: "#8cf348" }}><Check size={12} /> Verbal confirmation recorded</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4 — complete */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col items-center text-center py-6">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-20 h-20 flex items-center justify-center mb-5" style={{ background: "rgba(140,243,72,0.15)", border: "0.5px solid #8cf348", boxShadow: "0 0 40px rgba(140,243,72,0.3)" }}>
                  <Check size={40} style={{ color: "#8cf348" }} />
                </motion.div>
                <h2 className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>You're Approved</h2>
                <p className="max-w-md text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>Your legal, policy, 30% revenue-share, and NDA verbal confirmation are on file. You can now start creating content.</p>
                <button onClick={() => navigate("/creator-dashboard")} className="inline-flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(140,243,72,0.3)]" style={{ background: "#8cf348", color: "#05070A" }}>
                  Go to Creator Dashboard <ArrowRight size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* controls */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-6">
            <button onClick={back} disabled={step === 0} className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-colors disabled:opacity-30" style={{ border: "0.5px solid rgba(140,243,72,0.3)", color: "#8cf348" }}>
              <ArrowLeft size={13} /> Back
            </button>
            {step < 3 ? (
              <button onClick={next} disabled={!canAdvance()} className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30 hover:shadow-[0_0_20px_rgba(140,243,72,0.3)]" style={{ background: "#8cf348", color: "#05070A" }}>
                Continue <ArrowRight size={13} />
              </button>
            ) : (
              <button onClick={finish} disabled={!canAdvance() || submitting} className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-30 hover:shadow-[0_0_20px_rgba(140,243,72,0.3)]" style={{ background: "#8cf348", color: "#05070A" }}>
                {submitting ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : <><Check size={13} /> Complete Onboarding</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({ title, text }) {
  return (
    <div className="mb-3">
      <p className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: "#D1FF26" }}>{title}</p>
      <div className="p-3 mb-3 max-h-40 overflow-y-auto text-xs" style={{ background: "rgba(5,7,10,0.5)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98", lineHeight: 1.6 }}>
        {text}
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="w-full flex items-start gap-3 p-3 mb-3 text-left transition-colors hover:bg-[rgba(140,243,72,0.04)]" style={{ border: `0.5px solid ${checked ? "rgba(140,243,72,0.5)" : "rgba(138,143,152,0.15)"}` }}>
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: checked ? "#8cf348" : "transparent", border: `0.5px solid ${checked ? "#8cf348" : "rgba(138,143,152,0.4)"}` }}>
        {checked && <Check size={13} style={{ color: "#05070A" }} />}
      </div>
      <span className="text-xs" style={{ color: checked ? "#F5F5F7" : "#8A8F98", lineHeight: 1.5 }}>{label}</span>
    </button>
  );
}