import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Plus, Minus, PhoneCall } from "lucide-react";

const FAQS = [
  {
    q: "What is Dial Browser, in plain terms?",
    a: "Dial Browser lets you reach everyday services — local businesses, doctors, weather, music, jobs, and more — from any phone, just by calling the 1 Call Away number and speaking. No app to download, no internet required. It turns a regular phone call into a voice-driven concierge.",
  },
  {
    q: "Do I need a smartphone or internet to use it?",
    a: "No. Dial Browser works on any phone that can make a call — smartphones, flip phones, and landlines. Because everything happens over a voice call, you never need Wi-Fi or a data plan to get connected.",
  },
  {
    q: "How do I use it from my own phone?",
    a: "Just call the 1 Call Away number and speak in plain words — for example, 'I need a doctor' or 'Find me a plumber.' The system listens, confirms, and connects you or completes the request on the spot.",
  },
  {
    q: "What does it cost?",
    a: "A free tier gives you basic voice calls to get started. Paid tiers (Plus, Premium, Elite, and Ultimate) add monthly AI credits and unlock more services, with prices from $0 up to $149/month. You can start free and upgrade anytime from the pricing section.",
  },
  {
    q: "How do I get started?",
    a: "Register for a free account, then call the 1 Call Away number and say what you need. Your account, saved services, and preferences stay with you across devices.",
  },
  {
    q: "Can I really just speak naturally to the system?",
    a: "Yes. Speak in normal sentences — for example, 'I need a doctor' or 'Find me a ride downtown.' The voice assistant understands plain language, asks follow-up questions only when needed, and confirms every action before it happens.",
  },
  {
    q: "What if I get disconnected or change phones?",
    a: "Nothing is lost. Your account and saved services live on the network — not on your device. Just call back from any phone and you're right where you left off.",
  },
  {
    q: "Is my information private and secure?",
    a: "Yes. Your account and saved services live on the network — not on your phone. Calls are encrypted in transit, and you can lock your account with a voiceprint so only your voice can unlock it from any device.",
  },
  {
    q: "How do I register and start using it today?",
    a: "Tap Register anywhere on the site, enter your name, phone, and email, and verify the code we send you. Then call the 1 Call Away number and place your first request — no credit card needed to start on the free tier.",
  },
];

export default function DialInFAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="snap-section relative py-16 lg:py-24 overflow-hidden" style={{ background: "#05070A" }}>
      {/* faint signal-line backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
        backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(209,255,38,0.5) 38px, rgba(209,255,38,0.5) 39px)",
      }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4" style={{ border: "0.5px solid rgba(209,255,38,0.3)", background: "rgba(209,255,38,0.05)" }}>
            <HelpCircle size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>
              New Here? Start With These
            </span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl mb-3" style={{ color: "#F5F5F7" }}>
            How Calling In <span style={{ color: "#D1FF26" }}>Actually Works</span>
          </h2>
          <p className="text-sm lg:text-base" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Everything a first-time caller needs to know — no jargon, no fine print. If your question isn't here, call the 1 Call Away number and just ask.
          </p>
        </div>

        {/* FAQ list */}
        <div className="space-y-2.5">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                style={{
                  background: "rgba(10,13,20,0.7)",
                  border: `0.5px solid ${isOpen ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.12)"}`,
                  boxShadow: isOpen ? "0 0 24px rgba(209,255,38,0.08)" : "none",
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-4 lg:px-5 py-4 transition-colors hover:bg-[rgba(209,255,38,0.03)]"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[10px] tracking-widest flex-shrink-0" style={{ color: isOpen ? "#D1FF26" : "#8A8F98" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-heading font-semibold text-sm lg:text-base" style={{ color: isOpen ? "#D1FF26" : "#F5F5F7" }}>
                      {faq.q}
                    </span>
                  </span>
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center" style={{ background: isOpen ? "rgba(209,255,38,0.12)" : "transparent", border: `0.5px solid ${isOpen ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.2)"}` }}>
                    {isOpen ? <Minus size={12} style={{ color: "#D1FF26" }} /> : <Plus size={12} style={{ color: "#8A8F98" }} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 lg:px-5 pb-4 pl-12 text-sm leading-relaxed" style={{ color: "#8A8F98" }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <PhoneCall size={13} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
            Still stuck? Call the <span style={{ color: "#D1FF26" }}>1 Call Away number</span> and ask anything
          </p>
        </div>
      </div>
    </section>
  );
}