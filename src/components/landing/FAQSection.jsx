import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Search, X } from "lucide-react";

const faqs = [
  {
    q: "Do I need a smartphone to use 1 CALL AWAY?",
    a: "No. 1 CALL AWAY works on any phone — including basic flip phones, feature phones, and landlines. There's no app to download, no internet connection, and no Wi-Fi required. You simply call or text one number.",
  },
  {
    q: "How much does it cost?",
    a: "The Free plan costs nothing — you only pay what your carrier charges for a regular phone call or text. Paid tiers (Plus $19/mo, Premium $39/mo, Elite $79/mo, Ultimate $149/mo) add monthly AI credits and unlock more services. Cancel anytime.",
  },
  {
    q: "What is The Dial Browser™?",
    a: "The Dial Browser™ is our voice and SMS-based interface that routes your request to the right digital service. Think of it as a browser for the internet — but instead of typing a URL, you speak or dial a short code and we connect you.",
  },
  {
    q: "Which services can I access?",
    a: "Local directory and dining, weather, pharmacy and doctor lookup, job search, the marketplace, creator content, AI assistant, and emergency contact alerts. New services are added regularly.",
  },
  {
    q: "Does it work outside the United States?",
    a: "Yes. Because 1 CALL AWAY operates over standard voice and SMS networks, it works anywhere your phone has cellular coverage — including areas with no internet infrastructure. This makes it ideal for rural regions, developing markets, and travel.",
  },
  {
    q: "How do I get started?",
    a: "Register for a free account to get your personal dial code, then dial a short code for the service you want and speak in plain language. Each service has a code (e.g. *101# for local services, *108# for the AI assistant).",
  },
  {
    q: "Is my data secure?",
    a: "We never sell your personal data. Call content is processed to fulfill your request and then discarded. Payment and account information is encrypted and stored securely. You can request data deletion at any time.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. There are no contracts or cancellation fees. You can cancel any paid plan at any time from your account. Access continues until the end of your current billing cycle.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  const filteredFaqs = faqs.filter((faq) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query);
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 lg:mb-14"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // FREQUENTLY ASKED
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Questions & Answers
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Everything you need to know about how 1 CALL AWAY works.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div
            className="flex items-center gap-3 p-4"
            style={{ background: 'rgba(16,20,29,0.8)', border: '0.5px solid rgba(209,255,38,0.15)' }}
          >
            <Search size={18} style={{ color: '#D1FF26' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenIndex(null);
              }}
              placeholder="Search questions — try 'cost', 'services', 'security'..."
              className="flex-1 bg-transparent outline-none font-body text-sm placeholder:text-[#8A8F98]"
              style={{ color: '#F5F5F7' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="transition-opacity hover:opacity-100 opacity-60"
                aria-label="Clear search"
              >
                <X size={16} style={{ color: '#8A8F98' }} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="font-mono text-[10px] tracking-wider mt-2" style={{ color: '#8A8F98' }}>
              ▸ {filteredFaqs.length} RESULT{filteredFaqs.length !== 1 ? "S" : ""} FOR "{searchQuery.toUpperCase()}"
            </p>
          )}
        </motion.div>

        {/* FAQ list */}
        <div className="space-y-2">
          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="font-mono text-sm tracking-wider" style={{ color: '#8A8F98' }}>
                NO MATCHING QUESTIONS — TRY A DIFFERENT KEYWORD.
              </p>
            </div>
          )}
          {filteredFaqs.map((faq, idx) => {
            const originalIdx = faqs.indexOf(faq);
            const isOpen = openIndex === originalIdx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="overflow-hidden"
                style={{
                  background: isOpen ? '#10141D' : 'rgba(16, 20, 29, 0.5)',
                  border: `0.5px solid ${isOpen ? 'rgba(209,255,38,0.3)' : 'rgba(209,255,38,0.08)'}`,
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : originalIdx)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left transition-colors"
                >
                  <span className="flex items-center gap-4">
                    <span className="font-mono text-xs" style={{ color: '#D1FF26' }}>
                      {String(originalIdx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-heading font-bold text-base sm:text-lg" style={{ color: '#F5F5F7' }}>
                      {faq.q}
                    </span>
                  </span>
                  <span className="flex-shrink-0">
                    {isOpen ? (
                      <Minus size={18} style={{ color: '#D1FF26' }} />
                    ) : (
                      <Plus size={18} style={{ color: '#8A8F98' }} />
                    )}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 pl-14 text-sm leading-relaxed" style={{ color: '#8A8F98', lineHeight: '1.7' }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 text-center"
        >
          <p className="text-sm" style={{ color: '#8A8F98' }}>
            Still have questions?{" "}
            <a href="mailto:founders@dialbrowser.com" className="font-mono tracking-wide transition-colors hover:opacity-80" style={{ color: '#D1FF26' }}>
              founders@dialbrowser.com
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}