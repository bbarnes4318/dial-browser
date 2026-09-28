import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  MessageSquare,
  Tag,
  Loader2,
  CheckCircle2,
  Send,
  LifeBuoy,
  Clock,
  MapPin,
  Headphones,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { value: "general", label: "General Question" },
  { value: "support", label: "Customer Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press / Media" },
  { value: "technical", label: "Technical Issue" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
];

const CONTACT_CHANNELS = [
  { icon: Mail, label: "Email", value: "support@dialbrowser.com", note: "Replies within 24 hours" },
  { icon: Phone, label: "Dial In", value: "1-800-DIAL-1AW", note: "Mon–Fri, 9AM–6PM EST" },
  { icon: Headphones, label: "Live Support", value: "Dial *500#", note: "Premium members, 24/7" },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "general",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await base44.functions.invoke("submit-contact-inquiry", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        category: form.category,
        message: form.message,
        source: "contact_page",
      });
      if (res.data?.ok) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", subject: "", category: "general", message: "" });
      } else {
        setStatus("error");
        setErrorMsg(res.data?.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Could not submit your inquiry. Please try again.");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <LifeBuoy size={12} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// CONTACT US</p>
          </div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Get In <span style={{ color: "#D1FF26" }}>Touch</span>
          </h1>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Have a question, need support, or want to partner with Dial Browser? Send us a message and our team will get back to you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact channels */}
          <div className="lg:col-span-1 space-y-4">
            {CONTACT_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <div key={ch.label} className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(138,143,152,0.2)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                      <Icon size={16} style={{ color: "#D1FF26" }} />
                    </div>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{ch.label.toUpperCase()}</p>
                  </div>
                  <p className="font-heading font-bold text-base mb-0.5" style={{ color: "#F5F5F7" }}>{ch.value}</p>
                  <p className="text-xs" style={{ color: "#8A8F98" }}>{ch.note}</p>
                </div>
              );
            })}
            <div className="p-5 flex items-start gap-3" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
              <Clock size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
              <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                Typical response time is <span style={{ color: "#F5F5F7" }}>under 24 hours</span>. Premium members get priority via Dial *500#.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="p-6 lg:p-8" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)", boxShadow: "0 0 40px rgba(209,255,38,0.05)" }}>
              {/* Signal accent */}
              <div className="h-px overflow-hidden mb-6">
                <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }} />
              </div>

              {status === "success" ? (
                <div className="py-10 text-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center justify-center w-16 h-16 mb-5" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
                    <CheckCircle2 size={32} style={{ color: "#D1FF26" }} />
                  </motion.div>
                  <h2 className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>Message Sent</h2>
                  <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                    Thanks for reaching out. We've received your inquiry and our team will reply to your email shortly.
                  </p>
                  <button onClick={() => setStatus("idle")} className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field icon={User} label="Name" required value={form.name} onChange={(v) => update("name", v)} placeholder="Your full name" />
                    <Field icon={Mail} label="Email" required type="email" value={form.email} onChange={(v) => update("email", v)} placeholder="you@example.com" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field icon={Phone} label="Phone (optional)" value={form.phone} onChange={(v) => update("phone", v)} placeholder="555-123-4567" />
                    <div>
                      <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>CATEGORY</label>
                      <div className="relative">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
                        <select
                          value={form.category}
                          onChange={(e) => update("category", e.target.value)}
                          className="w-full pl-9 pr-3 py-3 text-sm outline-none appearance-none"
                          style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value} style={{ background: "#10141D" }}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <Field icon={MessageSquare} label="Subject" required value={form.subject} onChange={(v) => update("subject", v)} placeholder="Brief subject of your inquiry" />
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>MESSAGE <span style={{ color: "rgba(209,255,38,0.5)" }}>*</span></label>
                    <textarea
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      required
                      rows={6}
                      placeholder="Tell us how we can help..."
                      className="w-full px-3 py-3 text-sm outline-none resize-y"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
                    />
                  </div>

                  {status === "error" && (
                    <div className="p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)] disabled:opacity-50"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                  >
                    {status === "submitting" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {status === "submitting" ? "Sending..." : "Send Message"}
                  </button>
                  <p className="font-mono text-[8px] text-center" style={{ color: "rgba(138,143,152,0.5)" }}>
                    Your message is encrypted and reviewed by our team only.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text", placeholder, required }) {
  return (
    <div>
      <label className="block font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>
        {label.toUpperCase()}{required && <span style={{ color: "rgba(209,255,38,0.5)" }}> *</span>}
      </label>
      <div className="relative">
        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm outline-none"
          style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
        />
      </div>
    </div>
  );
}