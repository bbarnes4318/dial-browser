import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Globe, ArrowRight, Check, Handshake } from "lucide-react";

const partnerTypes = [
  { id: "business", label: "Business / Enterprise", icon: Building2 },
  { id: "country", label: "Country / Government", icon: Globe },
];

const interests = [
  "Network Infrastructure",
  "Creator & Artist Distribution",
  "Rural Connectivity Initiative",
  "Advertising & Sponsorship",
  "White-Label Deployment",
  "Strategic Investment",
];

export default function PartnershipForm() {
  const [inView, setInView] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    type: "business",
    orgName: "",
    contactName: "",
    email: "",
    country: "",
    interest: interests[0],
    message: "",
  });
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const reset = () => {
    setSubmitted(false);
    setForm({
      type: "business",
      orgName: "",
      contactName: "",
      email: "",
      country: "",
      interest: interests[0],
      message: "",
    });
  };

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left — pitch */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
              // PARTNERSHIP PROGRAM
            </p>
            <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6" style={{ color: '#F5F5F7' }}>
              Build the Bridge With Us
            </h2>
            <p className="text-base font-light mb-8" style={{ color: '#8A8F98', lineHeight: '1.7' }}>
              Whether you're a global enterprise looking to reach the unconnected or a nation ready to bring every citizen online, 1 Call Away™ offers partnership pathways that scale.
            </p>

            <div className="space-y-4">
              {[
                { icon: Building2, title: "For Businesses", desc: "Access 3 billion+ underserved users through voice and SMS channels. Intent-based advertising, creator distribution, and white-label deployment." },
                { icon: Globe, title: "For Countries", desc: "Deploy a sovereign voice-first digital layer for rural and low-connectivity regions. Infrastructure partnerships and government-grade integration." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                    className="flex gap-4 p-4"
                    style={{ background: 'rgba(16,20,29,0.4)', border: '0.5px solid rgba(209,255,38,0.1)' }}
                  >
                    <div
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center"
                      style={{ background: 'rgba(209,255,38,0.1)', border: '0.5px solid rgba(209,255,38,0.2)' }}
                    >
                      <Icon size={18} style={{ color: '#D1FF26' }} />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm mb-1" style={{ color: '#F5F5F7' }}>{item.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#8A8F98' }}>{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative p-6 lg:p-8"
            style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(209,255,38,0.15)' }}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="w-16 h-16 flex items-center justify-center rounded-full mb-6"
                  style={{ background: 'rgba(209,255,38,0.15)', border: '1px solid #D1FF26' }}
                >
                  <Check size={28} style={{ color: '#D1FF26' }} />
                </motion.div>
                <h3 className="font-heading font-black text-2xl mb-3" style={{ color: '#F5F5F7' }}>
                  Application Received
                </h3>
                <p className="text-sm mb-6 max-w-xs" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
                  Thank you, {form.contactName || 'partner'}. Our partnerships team will reach out within 48 hours.
                </p>
                <button
                  onClick={reset}
                  className="font-mono text-[10px] tracking-widest uppercase px-5 py-2 transition-all hover:bg-[rgba(209,255,38,0.1)]"
                  style={{ border: '0.5px solid rgba(209,255,38,0.3)', color: '#D1FF26' }}
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.1)' }}>
                  <Handshake size={16} style={{ color: '#D1FF26' }} />
                  <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: '#D1FF26' }}>
                    PARTNERSHIP APPLICATION
                  </span>
                </div>

                {/* Partner type toggle */}
                <div className="mb-5">
                  <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: '#8A8F98' }}>
                    PARTNER TYPE
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {partnerTypes.map((pt) => {
                      const Icon = pt.icon;
                      const active = form.type === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => handleChange("type", pt.id)}
                          className="flex items-center gap-2 px-3 py-3 transition-all duration-200"
                          style={{
                            background: active ? 'rgba(209,255,38,0.1)' : 'transparent',
                            border: `0.5px solid ${active ? '#D1FF26' : 'rgba(138,143,152,0.15)'}`,
                          }}
                        >
                          <Icon size={14} style={{ color: active ? '#D1FF26' : '#8A8F98' }} />
                          <span className="font-mono text-[10px] tracking-wider" style={{ color: active ? '#D1FF26' : '#8A8F98' }}>
                            {pt.label.toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Org / Country name */}
                <div className="mb-4">
                  <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: '#8A8F98' }}>
                    {form.type === 'country' ? 'COUNTRY / REGION' : 'ORGANIZATION NAME'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.orgName}
                    onChange={(e) => handleChange("orgName", e.target.value)}
                    className="w-full px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:border-[#D1FF26]"
                    style={{ background: 'rgba(5,7,10,0.6)', border: '0.5px solid rgba(138,143,152,0.15)', color: '#F5F5F7' }}
                    placeholder={form.type === 'country' ? 'e.g. Republic of Kenya' : 'e.g. Acme Telecom'}
                  />
                </div>

                {/* Contact name + email */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: '#8A8F98' }}>
                      CONTACT NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={form.contactName}
                      onChange={(e) => handleChange("contactName", e.target.value)}
                      className="w-full px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:border-[#D1FF26]"
                      style={{ background: 'rgba(5,7,10,0.6)', border: '0.5px solid rgba(138,143,152,0.15)', color: '#F5F5F7' }}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: '#8A8F98' }}>
                      EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:border-[#D1FF26]"
                      style={{ background: 'rgba(5,7,10,0.6)', border: '0.5px solid rgba(138,143,152,0.15)', color: '#F5F5F7' }}
                      placeholder="jane@org.com"
                    />
                  </div>
                </div>

                {/* Country (for businesses) */}
                {form.type === 'business' && (
                  <div className="mb-4">
                    <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: '#8A8F98' }}>
                      HEADQUARTERS COUNTRY
                    </label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      className="w-full px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:border-[#D1FF26]"
                      style={{ background: 'rgba(5,7,10,0.6)', border: '0.5px solid rgba(138,143,152,0.15)', color: '#F5F5F7' }}
                      placeholder="e.g. United States"
                    />
                  </div>
                )}

                {/* Interest area */}
                <div className="mb-4">
                  <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: '#8A8F98' }}>
                    PARTNERSHIP INTEREST
                  </label>
                  <select
                    value={form.interest}
                    onChange={(e) => handleChange("interest", e.target.value)}
                    className="w-full px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:border-[#D1FF26]"
                    style={{ background: 'rgba(5,7,10,0.6)', border: '0.5px solid rgba(138,143,152,0.15)', color: '#F5F5F7' }}
                  >
                    {interests.map((opt) => (
                      <option key={opt} value={opt} style={{ background: '#10141D', color: '#F5F5F7' }}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <label className="font-mono text-[10px] tracking-widest mb-2 block" style={{ color: '#8A8F98' }}>
                    MESSAGE
                  </label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className="w-full px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:border-[#D1FF26] resize-none"
                    style={{ background: 'rgba(5,7,10,0.6)', border: '0.5px solid rgba(138,143,152,0.15)', color: '#F5F5F7' }}
                    placeholder="Tell us about your partnership goals..."
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="group w-full flex items-center justify-center gap-2 px-6 py-4 transition-all duration-300 hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
                  style={{ background: '#D1FF26', color: '#05070A' }}
                >
                  <span className="font-mono text-xs tracking-[0.3em] uppercase font-bold">
                    Submit Application
                  </span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}