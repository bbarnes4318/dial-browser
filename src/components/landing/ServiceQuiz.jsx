import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, RotateCcw, Phone, Check, ChevronLeft } from "lucide-react";
import { dialServices } from "@/data/dialServices";
import { openVoiceFlowSimulator } from "@/components/dial/VoiceFlowSimulator";

// Needs-based quiz — answers map to service categories, tags, and regions.
// Each option awards points to matching services; the top 3 are recommended.
const QUESTIONS = [
  {
    key: "need",
    prompt: "What do you need most right now?",
    options: [
      { label: "Food or groceries", icon: "🍽️", match: { category: ["Food"], pts: 3 } },
      { label: "Health & urgent care", icon: "🩺", match: { category: ["Health"], pts: 3 } },
      { label: "Work & productivity", icon: "💼", match: { category: ["Productivity"], tags: ["job", "career", "ai", "assistant"], pts: 3 } },
      { label: "Be entertained", icon: "🎵", match: { category: ["Entertainment"], pts: 3 } },
      { label: "Local services", icon: "📍", match: { category: ["Local"], tags: ["local", "business", "directory"], pts: 3 } },
      { label: "Get around town", icon: "🚌", match: { category: ["Transport"], tags: ["ride", "transit", "bus", "taxi"], pts: 3 } },
      { label: "Shop & trade", icon: "🏷️", match: { category: ["Shopping"], tags: ["marketplace", "buy", "sell"], pts: 3 } },
    ],
  },
  {
    key: "where",
    prompt: "Where will you be using it?",
    options: [
      { label: "Right here, locally", icon: "📍", match: { region: ["Local"], pts: 2 } },
      { label: "Anywhere in the country", icon: "🇺🇸", match: { region: ["National"], pts: 2 } },
      { label: "Anywhere in the world", icon: "🌍", match: { region: ["Global"], pts: 2 } },
      { label: "Doesn't matter", icon: "🤷", match: { pts: 0 } },
    ],
  },
  {
    key: "how",
    prompt: "How do you prefer to connect?",
    options: [
      { label: "Talk to a real person", icon: "🗣️", match: { tags: ["doctor", "creator", "emergency", "pharmacy"], category: ["Health", "Entertainment"], pts: 2 } },
      { label: "Fast automated voice AI", icon: "🤖", match: { tags: ["ai", "assistant"], category: ["Productivity"], pts: 2 } },
      { label: "Just get it done", icon: "⚡", match: { pts: 0 } },
    ],
  },
  {
    key: "goal",
    prompt: "What's your main goal?",
    options: [
      { label: "Save time", icon: "⏱️", match: { tags: ["ai", "assistant", "booking", "delivery"], pts: 1 } },
      { label: "Save money", icon: "💰", match: { tags: ["marketplace"], category: ["Shopping"], pts: 1 } },
      { label: "Stay informed", icon: "📡", match: { tags: ["weather", "news", "forecast"], pts: 1 } },
      { label: "Stay safe", icon: "🛡️", match: { tags: ["emergency", "safety", "health"], pts: 1 } },
      { label: "Be entertained", icon: "🎧", match: { tags: ["music", "podcast", "movie", "event", "concert"], category: ["Entertainment"], pts: 1 } },
    ],
  },
];

function scoreService(svc, answers) {
  let score = 0;
  QUESTIONS.forEach((q) => {
    const opt = q.options.find((o) => o.label === answers[q.key]);
    if (!opt || !opt.match) return;
    if (opt.match.category && opt.match.category.includes(svc.category)) score += opt.match.pts;
    if (opt.match.region && opt.match.region.includes(svc.region)) score += opt.match.pts;
    if (opt.match.tags && opt.match.tags.some((t) => svc.tags.includes(t))) score += opt.match.pts;
  });
  return score;
}

function recommend(answers) {
  const scored = dialServices
    .map((s) => ({ service: s, score: scoreService(s, answers) }))
    .sort((a, b) => b.score - a.score || a.service.name.localeCompare(b.service.name));
  const top = scored.filter((s) => s.score > 0).slice(0, 3);
  // Fallback: if nothing scored, return the first three services by name
  return (top.length ? top : scored.slice(0, 3));
}

export default function ServiceQuiz() {
  const [stage, setStage] = useState("intro"); // intro | questions | results
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const start = () => { setAnswers({}); setQIndex(0); setStage("questions"); };
  const restart = () => { setAnswers({}); setQIndex(0); setStage("intro"); };

  const pick = (label) => {
    const q = QUESTIONS[qIndex];
    const next = { ...answers, [q.key]: label };
    setAnswers(next);
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setAnswers(next);
      setStage("results");
    }
  };

  const back = () => {
    if (qIndex > 0) setQIndex(qIndex - 1);
    else setStage("intro");
  };

  const results = stage === "results" ? recommend(answers) : [];
  const maxScore = results.length ? results[0].score : 0;

  return (
    <section className="relative py-16 lg:py-24 px-6 lg:px-8" style={{ background: "#05070A" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />
      <div className="relative max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <Sparkles size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// FIND YOUR SERVICE</p>
        </div>
        <h2 className="font-heading font-black text-3xl sm:text-4xl text-center mb-3" style={{ color: "#F5F5F7" }}>
          Which Dial Browser service fits you?
        </h2>
        <p className="text-center text-sm mb-10 max-w-xl mx-auto" style={{ color: "#8A8F98" }}>
          Answer a few quick questions and we'll match you to the best voice services for your needs.
        </p>

        <div className="relative p-6 sm:p-8 min-h-[420px]" style={{ background: "rgba(16,20,29,0.7)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <AnimatePresence mode="wait">
            {/* INTRO */}
            {stage === "intro" && (
              <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col items-center justify-center text-center py-10">
                <span className="text-5xl mb-4">🎙️</span>
                <p className="font-heading font-bold text-xl mb-2" style={{ color: "#F5F5F7" }}>Let's find your match</p>
                <p className="text-sm mb-8 max-w-sm" style={{ color: "#8A8F98" }}>Four quick questions about what you need. Takes under a minute.</p>
                <button onClick={start} className="flex items-center gap-2 px-8 py-4 font-mono text-[11px] tracking-widest uppercase transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.35)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                  Start Quiz <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

            {/* QUESTIONS */}
            {stage === "questions" && (
              <motion.div key={`q-${qIndex}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                {/* Progress */}
                <div className="flex items-center justify-between mb-6">
                  <button onClick={back} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase transition-colors" style={{ color: "#8A8F98" }}>
                    <ChevronLeft size={12} /> Back
                  </button>
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>QUESTION {qIndex + 1} / {QUESTIONS.length}</span>
                </div>
                <div className="flex gap-1.5 mb-6">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className="h-1 flex-1" style={{ background: i <= qIndex ? "#D1FF26" : "rgba(138,143,152,0.15)", boxShadow: i === qIndex ? "0 0 8px #D1FF26" : "none" }} />
                  ))}
                </div>
                <h3 className="font-heading font-bold text-xl sm:text-2xl mb-6" style={{ color: "#F5F5F7" }}>{QUESTIONS[qIndex].prompt}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {QUESTIONS[qIndex].options.map((opt) => {
                    const selected = answers[QUESTIONS[qIndex].key] === opt.label;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => pick(opt.label)}
                        className="flex items-center gap-3 p-4 text-left transition-all duration-200 group"
                        style={{
                          background: selected ? "rgba(209,255,38,0.1)" : "rgba(5,7,10,0.5)",
                          border: `0.5px solid ${selected ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.12)"}`,
                        }}
                      >
                        <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                        <span className="font-heading font-medium text-sm flex-1" style={{ color: "#F5F5F7" }}>{opt.label}</span>
                        {selected && <Check size={14} style={{ color: "#D1FF26" }} />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* RESULTS */}
            {stage === "results" && (
              <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <div className="flex items-center gap-2 mb-1">
                  <Check size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// YOUR MATCHES</p>
                </div>
                <h3 className="font-heading font-bold text-xl mb-5" style={{ color: "#F5F5F7" }}>Best Dial Browser services for you</h3>
                <div className="space-y-3 mb-6">
                  {results.map(({ service, score }, i) => {
                    const isTop = i === 0 && score > 0;
                    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                    return (
                      <motion.div key={service.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 flex items-center gap-4" style={{ background: isTop ? "rgba(209,255,38,0.06)" : "rgba(5,7,10,0.5)", border: `0.5px solid ${isTop ? "rgba(209,255,38,0.35)" : "rgba(138,143,152,0.15)"}` }}>
                        <span className="text-3xl flex-shrink-0">{service.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{service.name}</span>
                            {isTop && <span className="font-mono text-[7px] px-1.5 py-0.5" style={{ background: "#D1FF26", color: "#05070A" }}>BEST MATCH</span>}
                          </div>
                          <p className="text-xs line-clamp-1 mb-1.5" style={{ color: "#8A8F98" }}>{service.desc}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1" style={{ background: "rgba(138,143,152,0.15)" }}>
                              <div className="h-full" style={{ width: `${pct}%`, background: "#D1FF26", boxShadow: "0 0 6px #D1FF26" }} />
                            </div>
                            <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button onClick={() => openVoiceFlowSimulator(service)} className="flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }} title="Try the voice flow">
                            ▶ Try Flow
                          </button>
                          <Link to={`/directory/${service.id}`} className="flex items-center justify-center gap-1 px-3 py-2 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                            Details
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button onClick={restart} className="flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase transition-all" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                    <RotateCcw size={12} /> Retake Quiz
                  </button>
                  <Link to="/directory" className="flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                    Browse All Services <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center font-mono text-[8px] tracking-widest mt-4" style={{ color: "rgba(138,143,152,0.5)" }}>
          <Phone size={9} className="inline mr-1" /> MATCHES ARE SUGGESTIONS — DIAL ANY CODE FROM A REAL PHONE TO CONNECT
        </p>
      </div>
    </section>
  );
}