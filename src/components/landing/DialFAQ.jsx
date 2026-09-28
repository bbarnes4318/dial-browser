import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Phone } from "lucide-react";

const faqs = [
  {
    q: "What exactly is a dial code?",
    a: "A dial code is a short sequence — like *101# or 1-800-555-DIAL — that you enter on any phone's keypad to instantly connect to a specific service. No app, no internet, no smartphone required. Think of it as a speed-dial shortcut that routes you directly to the service you need, whether that's flight booking, food delivery, or an AI assistant.",
  },
  {
    q: "Do I need a smartphone or internet to use dial codes?",
    a: "No. Dial codes work on any phone with a keypad — flip phones, feature phones, landlines, and smartphones alike. The entire 1 Call Away platform is designed around voice and SMS, so you can access every service without a data plan, app store, or Wi-Fi connection.",
  },
  {
    q: "How do I find the right dial code for what I need?",
    a: "Browse the Dial Service Directory, where every service is listed with its dial code, category, and a short description. Use the search bar or category filters to narrow down what you're looking for, then copy the code and dial it from any phone. You can also use the global search bar at the top of the directory to search by name, keyword, or code.",
  },
  {
    q: "What happens after I dial a code?",
    a: "You'll be connected to an automated voice assistant specific to that service. The assistant walks you through the available options using simple voice prompts — press a number or say a word to navigate. Some services also send an SMS with a streaming link if visual content (like a video or map) is relevant to your request.",
  },
  {
    q: "Can I save or memorize my most-used dial codes?",
    a: "Absolutely. Each service card in the directory has a copy button — tap it to copy the code to your clipboard, then paste it into your contacts or notes. We recommend saving your top 5–10 codes as contacts in your phone for one-tap access. Premium members get a personalized dial code that bundles their favorite services.",
  },
  {
    q: "Are dial codes free to call, or do they cost money?",
    a: "Most dial codes connect via a standard voice call, so normal calling rates from your carrier apply. Free-tier services are accessible at no additional platform charge, while premium services (like Let's Collab or 1 Call Dating) require a subscription. Each service card clearly shows whether it's free or premium.",
  },
  {
    q: "How do I get the best results from voice prompts?",
    a: "Speak clearly and naturally — the assistant understands conversational language, not just keywords. Wait for the full prompt before responding, and use the keypad numbers if you prefer silent navigation. If you're in a noisy environment, keypad entry is more reliable than voice. For complex requests, break them into steps: first state what you need, then add details when prompted.",
  },
  {
    q: "What if a dial code doesn't connect or I get an error?",
    a: "Check the service's status indicator on its directory card — a green dot means active, orange means maintenance. If the service is active but you can't connect, try dialing again after a few minutes, ensure you're entering the full code including the * and # symbols, or switch to a different phone. Persistent issues can be reported through the service request form at the bottom of the directory.",
  },
  {
    q: "Can I request a new dial service that doesn't exist yet?",
    a: "Yes — that's what the community service request form is for. Scroll to the bottom of the Dial Service Directory and submit your idea with a name, category, and description. Other members can upvote requests, and the most popular ones get prioritized for development. You'll be notified by SMS when your requested service launches.",
  },
  {
    q: "How do premium subscriptions enhance the dial experience?",
    a: "Premium tiers unlock specialized services like creator collaborations, dating matchmaking, live sports audio, and interest-based group chats — all still accessible by phone. Subscribers also get priority routing (faster connect times), a personalized dial code, and SMS notifications for matches, messages, and events. See the pricing section for tier details.",
  },
];

function FAQItem({ item, index, inView }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      className="overflow-hidden"
      style={{
        background: open ? "rgba(16,20,29,0.7)" : "rgba(16,20,29,0.4)",
        border: `0.5px solid ${open ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.12)"}`,
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
            Q{String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-heading font-semibold text-sm sm:text-base" style={{ color: "#F5F5F7" }}>
            {item.q}
          </h3>
        </div>
        <div className="flex-shrink-0">
          {open ? (
            <Minus size={16} style={{ color: "#D1FF26" }} />
          ) : (
            <Plus size={16} style={{ color: "#8A8F98" }} />
          )}
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 pl-14 text-sm leading-relaxed" style={{ color: "#8A8F98" }}>
          {item.a}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function DialFAQ() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="dial-faq"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(209,255,38,0.04) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 text-center"
        >
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Master Your <span style={{ color: "#D1FF26" }}>Dial Codes.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Everything you need to know about how dial codes work, what to expect when you call, and how to get the most out of the 1 Call Away platform.
          </p>
        </motion.div>

        <div className="space-y-2.5">
          {faqs.map((item, i) => (
            <FAQItem key={i} item={item} index={i} inView={inView} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <p className="text-sm" style={{ color: "#8A8F98" }}>Still have questions?</p>
          <div className="flex items-center gap-2 px-5 py-2.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Phone size={14} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[11px] tracking-widest" style={{ color: "#D1FF26" }}>DIAL *100# FOR SUPPORT</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}