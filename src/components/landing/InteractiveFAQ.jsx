import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, RotateCcw, MessageSquare, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SUGGESTED_QUESTIONS = [
  "How does The Dial Browser work?",
  "Can I use 1 Call Away without internet?",
  "What services can I access by voice?",
  "How much does a call cost?",
  "Is my personal data secure?",
];

const SYSTEM_CONTEXT = `You are the AI assistant for "1 Call Away" — a voice-first digital services platform whose core product is "The Dial Browser™".

Key facts about the platform:
- Users access services by dialing short codes or by speaking naturally in plain language
- Works on ANY phone — flip phones, feature phones, landlines, smartphones — no app download, no internet, no Wi-Fi required
- Live services and their dial codes: Local services, dining, rides, doctors, weather & directory (*101#), Rides & transit schedules (*103#), Music & movie showtimes info (*105#), Buy & sell on the marketplace (*106#), Creators & event info (*107#), AI assistant & job search (*108#)
- Pricing tiers: Free, Plus ($19/mo), Premium ($39/mo), Elite ($79/mo), Ultimate ($149/mo). Each paid tier includes a monthly AI credit allowance. Start free, upgrade anytime.
- Works globally wherever there is cellular coverage — ideal for rural areas, developing markets, elderly users, and travel
- The Dial Browser™ is a voice/SMS interface that routes spoken requests to digital services — like a web browser but you speak instead of typing URLs
- Data is never sold; call content is processed to fulfill the request then discarded; payments are encrypted; data deletion available on request
- Subscriptions can be canceled anytime with no contracts or fees
- 1 Call Away does NOT offer grocery delivery, bill payment, construction/contractor matching, travel booking, money transfer, real estate, dental, or sports services. If asked about these, say they are not available.

Instructions for answering:
- Answer concisely in 2-4 sentences, friendly and helpful tone
- If the question is unrelated to the platform, gently steer back to what 1 Call Away offers
- Use plain conversational text — no markdown, no URLs, no headers, no bullet points
- If a specific dial code is relevant, mention it naturally in the answer`;

export default function InteractiveFAQ() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [askedQuestion, setAskedQuestion] = useState("");
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const ask = async (q) => {
    const query = (q || question).trim();
    if (!query || loading) return;
    setLoading(true);
    setError(null);
    setAskedQuestion(query);
    setQuestion(query);
    setAnswer(null);
    try {
      const res = (await base44.functions.invoke("faq-answer", { question: query })).data;
      setAnswer(res);
    } catch {
      setError("Signal lost — could not reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuestion("");
    setAnswer(null);
    setError(null);
    setAskedQuestion("");
  };

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04), transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-8 lg:mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 8px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
            <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// AI ANSWERS</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Ask <span style={{ color: "#D1FF26" }}>Anything.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            Type your question about 1 Call Away™ and get an instant answer from our AI assistant.
          </p>
        </motion.div>

        {/* Input bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <form
            onSubmit={(e) => { e.preventDefault(); ask(); }}
            className="flex items-center gap-3 p-4"
            style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)", boxShadow: "0 0 30px rgba(209,255,38,0.05)" }}
          >
            <Sparkles size={18} style={{ color: "#D1FF26" }} />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about services, pricing, dial codes…"
              className="flex-1 bg-transparent outline-none font-body text-sm sm:text-base placeholder:text-[#8A8F98]"
              style={{ color: "#F5F5F7" }}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </motion.div>

        {/* Suggested questions (only when no answer and not loading) */}
        <AnimatePresence>
          {!askedQuestion && !loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>▸ SUGGESTED QUESTIONS</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => ask(q)}
                    className="flex items-center gap-2 px-3 py-2 text-xs transition-all hover:bg-[rgba(209,255,38,0.08)]"
                    style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.12)", color: "#F5F5F7" }}
                  >
                    <MessageSquare size={11} style={{ color: "#D1FF26" }} />
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer panel */}
        <AnimatePresence mode="wait">
          {(loading || answer || error) && (
            <motion.div
              key={askedQuestion + String(loading)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="relative p-5 lg:p-6"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.25)" }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
              </div>

              {/* Asked question */}
              <div className="flex items-start gap-3 mb-4 pb-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
                <div className="flex items-center justify-center w-8 h-8 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <MessageSquare size={14} style={{ color: "#D1FF26" }} />
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>// YOUR QUESTION</p>
                  <p className="font-heading font-semibold text-sm sm:text-base" style={{ color: "#F5F5F7" }}>{askedQuestion}</p>
                </div>
              </div>

              {/* Answer or loading or error */}
              {loading ? (
                <div className="flex items-center gap-3 py-6">
                  <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>CONNECTING TO AI…</p>
                </div>
              ) : error ? (
                <div className="py-4">
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 flex-shrink-0" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    <Sparkles size={14} style={{ color: "#D1FF26" }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// AI ANSWER</p>
                    <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#F5F5F7", lineHeight: 1.7 }}>{answer?.answer}</p>
                    {answer?.related_code && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                        <Phone size={12} style={{ color: "#D1FF26" }} />
                        <span className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>{answer.related_code}</span>
                        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>DIAL CODE</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reset button */}
              {!loading && (
                <div className="mt-5 pt-4 flex justify-end" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.06)]"
                    style={{ border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}
                  >
                    <RotateCcw size={11} /> Ask Another
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}