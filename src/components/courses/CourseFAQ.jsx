import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

// Common student questions shown on every course detail page: lesson format,
// quiz/exam mechanics, retakes, certificate delivery, access, and SMS.
const buildFaq = (course) => [
  {
    q: "How are the lessons delivered?",
    a: `Every lesson is narrated to you by voice call. Dial the 1 Call number and press ${course.dial_code || "the course dial code"} to start listening. Press 1 to advance to the next lesson, and press the star key after the final lesson to hear exam instructions. You can also play lessons right here in the app.`,
  },
  {
    q: "How do quizzes and exams work?",
    a: "Multiple-choice and true/false questions are answered by phone keypad (DTMF) or by tapping on screen. Spoken short-answer and essay questions are recorded, transcribed, and graded by AI against the reference answer and rubric. Each assessment shows its passing score and time limit before you begin.",
  },
  {
    q: "How many retakes do I get?",
    a: "Each assessment has its own retake cap, shown on the assessment card (typically 3 attempts). Your best passing score is the one that counts toward your final grade.",
  },
  {
    q: "When and how do I receive my certificate?",
    a: "The moment you pass your final exam, a verifiable completion certificate is issued and emailed to you as a PDF. Each certificate carries a unique verification code that anyone can check on the public verify page.",
  },
  {
    q: "How long do I keep access?",
    a: "Enrollment is a one-time fee that unlocks lifetime access — revisit lessons, retake quizzes, and review your certificate anytime.",
  },
  {
    q: "Can I learn by text message?",
    a: "Yes. SMS fallback delivers lesson summaries to your phone, and we text you congratulations when you complete a module or pass a quiz so you stay motivated day to day.",
  },
];

export default function CourseFAQ({ course = {} }) {
  const [open, setOpen] = useState(0);
  const items = buildFaq(course);
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>▸ STUDENT FAQ</p>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${isOpen ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}` }}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 p-3.5 text-left"
              >
                <span className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{item.q}</span>
                <ChevronDown
                  size={14}
                  style={{ color: isOpen ? "#D1FF26" : "#8A8F98", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
                />
              </button>
              {isOpen && (
                <p className="px-3.5 pb-3.5 text-xs leading-relaxed" style={{ color: "#8A8F98" }}>{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}