import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Check, Shield, AlertTriangle, Phone, HelpCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MESSAGE_TYPES = [
  { key: "booking_receipt", label: "Booking Receipts", desc: "Confirmation of a service you requested by voice call." },
  { key: "emergency_alert", label: "Emergency Alerts", desc: "SOS distress signals and critical safety broadcasts." },
  { key: "new_match", label: "Dating Match Alerts", desc: "When someone you liked likes you back." },
  { key: "new_message", label: "Voice Messages", desc: "New voice messages from matches or members." },
  { key: "job_alert", label: "Job Alerts", desc: "New job listings matching your saved search." },
  { key: "category_alert", label: "Category Alerts", desc: "New providers in service categories you follow." },
  { key: "daily_summary", label: "Daily Summaries", desc: "An optional digest of your activity and reminders." },
  { key: "event_starting", label: "Event Reminders", desc: "Heads-up before events you registered for." },
  { key: "status_update", label: "Status Updates", desc: "Changes to your service requests and orders." },
  { key: "onboarding", label: "Onboarding Messages", desc: "Guidance for new members through their first call." },
];

const OPT_OUT_KEYWORDS = [
  { kw: "STOP", note: "Stop all SMS" },
  { kw: "STOP ALL", note: "Stop all SMS" },
  { kw: "CANCEL", note: "Stop all SMS" },
  { kw: "UNSUBSCRIBE", note: "Stop all SMS" },
  { kw: "HELP", note: "Get support info" },
  { kw: "START", note: "Opt back in" },
];

const SECTIONS = [
  { id: "glance", icon: Shield, title: "At a Glance" },
  { id: "receive", icon: MessageSquare, title: "What You'll Receive" },
  { id: "frequency", icon: AlertTriangle, title: "Message Frequency" },
  { id: "opt-out", icon: HelpCircle, title: "Opt Out Anytime" },
  { id: "carrier", icon: Phone, title: "Carrier Participation & Costs" },
  { id: "privacy", icon: Shield, title: "Privacy & Data Sharing" },
  { id: "support", icon: HelpCircle, title: "Support" },
];

export default function SmsOptInPolicy() {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [existingConsent, setExistingConsent] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (active && me) setExistingConsent(me.sms_opt_in ?? null);
      } catch { /* anonymous visitor — fine */ }
    })();
    return () => { active = false; };
  }, []);

  const handleOptIn = async () => {
    if (!agreed) return;
    setSubmitting(true);
    setError("");
    try {
      await base44.auth.updateMe({
        sms_opt_in: true,
        sms_opt_in_at: new Date().toISOString(),
      });
      setDone(true);
    } catch (e) {
      setError(e.message || "Could not save your consent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 lg:mb-12"
        >
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>
              // SMS OPT-IN POLICY
            </p>
          </div>
          <h1 className="font-heading font-black text-3xl lg:text-5xl mb-4 tracking-tight" style={{ color: "#F5F5F7" }}>
            SMS Text Messaging Consent
          </h1>
          <p className="text-base leading-relaxed max-w-2xl" style={{ color: "#8A8F98" }}>
            1 Call Away™ (Dial Browser) uses real SMS to deliver booking confirmations, alerts, and
            service updates to your mobile phone. By enabling SMS, you consent to the practices
            described here. This policy explains exactly what you'll receive, how often, and how to
            stop at any time.
          </p>
        </motion.div>

        {/* Section index — quick navigation */}
        <nav className="mb-8 lg:mb-10 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:border-[rgba(209,255,38,0.4)]"
              style={{
                background: "rgba(16,20,29,0.5)",
                border: "0.5px solid rgba(138,143,152,0.18)",
              }}
            >
              <s.icon size={11} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "#8A8F98" }}>
                {s.title}
              </span>
            </a>
          ))}
        </nav>

        {/* Sections stack — consistent vertical rhythm */}
        <div className="space-y-6">
          {/* At a glance */}
          <Section id="glance" index={1} icon={Shield} title="At a Glance">
            <ul className="space-y-3 text-sm" style={{ color: "#C9CED6" }}>
              <Bullet>We never share or sell your phone number.</Bullet>
              <Bullet>Standard message and data rates from your carrier may apply.</Bullet>
              <Bullet>You can opt out instantly by replying <b style={{ color: "#D1FF26" }}>STOP</b> to any message.</Bullet>
              <Bullet>You may opt back in any time from your account or by texting <b style={{ color: "#D1FF26" }}>START</b>.</Bullet>
            </ul>
          </Section>

          {/* What you receive */}
          <Section id="receive" index={2} icon={MessageSquare} title="What You'll Receive">
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "#8A8F98" }}>
              Message types depend on which features you use. You will only receive a message when the
              related event occurs.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {MESSAGE_TYPES.map((m) => (
                <div
                  key={m.key}
                  className="p-4 transition-colors hover:border-[rgba(209,255,38,0.25)]"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}
                >
                  <p className="text-sm font-semibold mb-1.5" style={{ color: "#F5F5F7" }}>{m.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#8A8F98" }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Frequency */}
          <Section id="frequency" index={3} icon={AlertTriangle} title="Message Frequency">
            <p className="text-sm leading-relaxed" style={{ color: "#C9CED6" }}>
              Message volume varies by usage. A typical active member receives 2–8 messages per week
              (booking receipts, match and job alerts, category updates). Emergency and SOS broadcasts
              are sent immediately regardless of frequency. Daily summary digests are optional and sent
              at most once per day. You will never receive marketing or promotional texts from us.
            </p>
          </Section>

          {/* Opt out */}
          <Section id="opt-out" index={4} icon={HelpCircle} title="Opt Out Anytime">
            <p className="text-sm mb-4" style={{ color: "#C9CED6" }}>
              Reply to any message with one of these keywords:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {OPT_OUT_KEYWORDS.map((k) => (
                <div
                  key={k.kw}
                  className="p-3 text-center"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
                >
                  <p className="font-mono text-xs font-bold tracking-widest" style={{ color: "#D1FF26" }}>{k.kw}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#8A8F98" }}>{k.note}</p>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4 leading-relaxed" style={{ color: "#8A8F98" }}>
              You can also disable SMS from <Link href="/account">your account page</Link>. Opting out does
              not cancel your account or affect voice calls.
            </p>
          </Section>

          {/* Carrier & privacy */}
          <Section id="carrier" index={5} icon={Phone} title="Carrier Participation & Costs">
            <ul className="space-y-3 text-sm" style={{ color: "#C9CED6" }}>
              <Bullet>1 Call Away is not liable for delayed or undelivered messages.</Bullet>
              <Bullet>Availability depends on your carrier's participation and your messaging plan.</Bullet>
              <Bullet>Message and data rates may apply to each message sent or received.</Bullet>
              <Bullet>We may stop sending a specific message type if your carrier blocks it.</Bullet>
            </ul>
          </Section>

          <Section id="privacy" index={6} icon={Shield} title="Privacy & Data Sharing">
            <p className="text-sm leading-relaxed" style={{ color: "#C9CED6" }}>
              Your phone number is used solely to deliver the service messages above and to verify your
              identity. We do not share, rent, or sell your number to third parties. SMS content is
              transmitted through our provider (Twilio) for delivery and may be stored by them per their
              retention policy. See our <Link href="/about">privacy page</Link> for full details.
            </p>
          </Section>

          <Section id="support" index={7} icon={HelpCircle} title="Support">
            <p className="text-sm leading-relaxed" style={{ color: "#C9CED6" }}>
              For SMS-related questions, reply <b style={{ color: "#D1FF26" }}>HELP</b> to any message or
              visit <Link href="/contact">our contact page</Link>. You can also manage all notification
              preferences from <Link href="/account">your account</Link>.
            </p>
          </Section>
        </div>

        {/* Consent action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-6 lg:p-7"
          style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.3)" }}
        >
          {done ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ background: "#D1FF26" }}>
                <Check size={18} style={{ color: "#05070A" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#F5F5F7" }}>SMS enabled</p>
                <p className="text-xs mt-0.5" style={{ color: "#8A8F98" }}>You'll now receive service messages on your phone.</p>
              </div>
            </div>
          ) : existingConsent ? (
            <div className="flex items-center gap-3">
              <Check size={18} className="flex-shrink-0" style={{ color: "#D1FF26" }} />
              <p className="text-sm leading-relaxed" style={{ color: "#C9CED6" }}>
                You've already opted in to SMS. To change this, visit <Link href="/account">your account</Link>.
              </p>
            </div>
          ) : (
            <>
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#D1FF26] flex-shrink-0"
                />
                <span className="text-sm leading-relaxed" style={{ color: "#C9CED6" }}>
                  I have read this SMS Opt-In Policy and consent to receive the service messages
                  described above on my mobile phone. I understand message and data rates may apply
                  and that I can reply <b style={{ color: "#D1FF26" }}>STOP</b> to opt out at any time.
                </span>
              </label>
              {error && (
                <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  {error}
                </div>
              )}
              <button
                onClick={handleOptIn}
                disabled={!agreed || submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[11px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40"
                style={{ background: "#D1FF26", color: "#05070A" }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Enable SMS
              </button>
              <p className="text-center mt-4 text-[11px]" style={{ color: "#8A8F98" }}>
                By enabling, you authorize 1 Call Away to send recurring automated SMS to your phone.
              </p>
            </>
          )}
        </motion.div>

        <p className="text-center mt-10 text-[10px] font-mono tracking-widest" style={{ color: "rgba(138,143,152,0.6)" }}>
          // CONSENT RECORDED UNDER U.S. TELEPHONE CONSUMER PROTECTION ACT (TCPA) · LAST UPDATED SEP 2026
        </p>
      </div>
    </div>
  );
}

function Section({ id, index, icon: Icon, title, children }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35 }}
      className="scroll-mt-24 p-6 lg:p-7"
      style={{ background: "rgba(10,13,20,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}
    >
      <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.12)" }}>
        <div className="flex items-center justify-center w-7 h-7 flex-shrink-0 font-mono text-[10px] font-bold"
          style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
          {String(index).padStart(2, "0")}
        </div>
        <Icon size={14} style={{ color: "#D1FF26" }} />
        <h2 className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: "#F5F5F7" }}>{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full" style={{ background: "#D1FF26" }} />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

function Link({ href, children }) {
  return (
    <a href={href} className="font-medium hover:underline" style={{ color: "#D1FF26" }}>
      {children}
    </a>
  );
}