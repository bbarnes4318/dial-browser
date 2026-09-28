import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Zap, Clock, CheckCircle2, Circle, ChevronRight,
  Cpu, Globe, Radio, Star, Briefcase, HeartPulse, GraduationCap, ShieldCheck,
} from "lucide-react";

const roadmap = [
  {
    id: "r1",
    quarter: "Q3 2026",
    title: "Dial *109 — HealthLine",
    category: "Dial Service",
    status: "in_progress",
    icon: HeartPulse,
    dial: "*109#",
    summary: "Voice-first doctor consultations and prescription reminders via call.",
    deliverables: [
      "Connect to licensed physicians in under 60 seconds",
      "SMS prescription refills and appointment scheduling",
      "Multi-language symptom triage assistant",
      "Carrier billing integration for premium consultations",
    ],
  },
  {
    id: "r2",
    quarter: "Q3 2026",
    title: "Dial *110 — EduTutor",
    category: "Dial Service",
    status: "in_progress",
    icon: GraduationCap,
    dial: "*110#",
    summary: "Audio lessons and homework help for students without internet access.",
    deliverables: [
      "Curriculum-aligned audio lessons (Grades 1–12)",
      "Voice-activated quiz mode with instant feedback",
      "Daily SMS study prompts and progress reports",
      "Teacher hotline for live homework assistance",
    ],
  },
  {
    id: "r3",
    quarter: "Q4 2026",
    title: "Dial *111 — JobFinder",
    category: "Dial Service",
    status: "planned",
    icon: Briefcase,
    dial: "*111#",
    summary: "Browse and apply to jobs entirely through voice and SMS.",
    deliverables: [
      "Voice resume builder — describe experience, we format it",
      "SMS job alerts matched to your skills and location",
      "Callback scheduling with employers via dial code",
      "Skill verification badges for verified tradespeople",
    ],
  },
  {
    id: "r4",
    quarter: "Q4 2026",
    title: "Platform — AI Concierge Upgrade",
    category: "Platform Improvement",
    status: "planned",
    icon: Cpu,
    dial: null,
    summary: "Smarter multi-step AI agents that chain services across a single call.",
    deliverables: [
      "Natural language routing replaces rigid dial menus",
      "Context memory across call sessions for returning members",
      "Proactive service suggestions based on call history",
      "Reduced average call time by 35%",
    ],
  },
  {
    id: "r5",
    quarter: "Q1 2027",
    title: "Dial *112 — AgriMarket",
    category: "Dial Service",
    status: "planned",
    icon: Globe,
    dial: "*112#",
    summary: "Live crop prices, weather alerts, and buyer matching for rural farmers.",
    deliverables: [
      "Daily SMS market prices for 40+ crop types",
      "Voice weather forecasts in local dialects",
      "Direct buyer-to-farmer trade negotiation via call",
      "Cooperative bulk-selling coordination",
    ],
  },
  {
    id: "r6",
    quarter: "Q1 2027",
    title: "Platform — AppNet Edge Expansion",
    category: "Platform Improvement",
    status: "vision",
    icon: Radio,
    dial: null,
    summary: "Double Micro-Plug density for sub-second voice response in rural zones.",
    deliverables: [
      "15,000 → 30,000 Micro-Plug nodes deployed",
      "Peer-to-peer relay mesh activates in low-signal areas",
      "Predictive content pre-caching at edge nodes",
      "Satellite-relay fallback for ultra-remote communities",
    ],
  },
  {
    id: "r7",
    quarter: "Q2 2027",
    title: "Dial *113 — VoiceVault",
    category: "Dial Service",
    status: "vision",
    icon: ShieldCheck,
    dial: "*113#",
    summary: "Secure voice-authenticated document storage and identity verification.",
    deliverables: [
      "Store IDs, certificates, and records via voice upload",
      "Biometric voice unlock for sensitive documents",
      "Share verified credentials with employers or banks by dial code",
      "End-to-end encrypted with zero-knowledge architecture",
    ],
  },
  {
    id: "r8",
    quarter: "Q2 2027",
    title: "Dial *114 — StarVoice",
    category: "Dial Service",
    status: "vision",
    icon: Star,
    dial: "*114#",
    summary: "Fan-to-creator live audio shoutouts and paid voice interactions.",
    deliverables: [
      "One-tap dial to connect with favorite creators",
      "Paid personalized voice messages and shoutouts",
      "Live group AMAs moderated by the creator",
      "Tip-based priority queue for high-demand creators",
    ],
  },
];

const statusConfig = {
  in_progress: { color: "#D1FF26", bg: "rgba(209,255,38,0.12)", border: "rgba(209,255,38,0.5)", icon: Zap, label: "IN PROGRESS" },
  planned: { color: "#8A8F98", bg: "rgba(138,143,152,0.06)", border: "rgba(138,143,152,0.2)", icon: Clock, label: "PLANNED" },
  completed: { color: "#D1FF26", bg: "rgba(209,255,38,0.08)", border: "rgba(209,255,38,0.3)", icon: CheckCircle2, label: "SHIPPED" },
  vision: { color: "#4CB4FF", bg: "rgba(76,180,255,0.06)", border: "rgba(76,180,255,0.25)", icon: Circle, label: "EXPLORING" },
};

const filters = ["All", "Dial Service", "Platform Improvement"];

export default function DashboardRoadmap() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selected, setSelected] = useState("r1");

  const visible = roadmap.filter((r) => activeFilter === "All" || r.category === activeFilter);
  const item = roadmap.find((r) => r.id === selected) || visible[0];
  const StatusIcon = statusConfig[item.status].icon;

  return (
    <div className="p-5 lg:p-6" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Phone size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// PLATFORM ROADMAP</p>
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: activeFilter === f ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                border: `0.5px solid ${activeFilter === f ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                color: activeFilter === f ? "#D1FF26" : "#8A8F98",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mb-6 pl-6">
        {/* Vertical track */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px" style={{ background: "rgba(138,143,152,0.15)" }} />
        <div className="space-y-1">
          {visible.map((entry, i) => {
            const cfg = statusConfig[entry.status];
            const Icon = entry.icon;
            const isSelected = entry.id === selected;
            return (
              <button
                key={entry.id}
                onClick={() => setSelected(entry.id)}
                className="flex items-center gap-4 w-full text-left py-2.5 px-2 transition-all group"
                style={{
                  background: isSelected ? "rgba(209,255,38,0.04)" : "transparent",
                }}
              >
                {/* Node */}
                <div
                  className="absolute left-0 flex items-center justify-center rounded-full transition-all duration-300 z-10"
                  style={{
                    width: isSelected ? 24 : 16,
                    height: isSelected ? 24 : 16,
                    background: isSelected ? cfg.bg : "#05070A",
                    border: `1.5px solid ${isSelected ? cfg.color : "rgba(138,143,152,0.2)"}`,
                    boxShadow: isSelected ? `0 0 12px ${cfg.color}40` : "none",
                    marginLeft: isSelected ? "-4px" : "0",
                  }}
                >
                  {isSelected && <Icon size={11} style={{ color: cfg.color }} />}
                </div>

                {/* Content row */}
                <div className="flex-1 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: cfg.color }}>{entry.quarter}</p>
                      <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="font-heading font-semibold text-sm truncate" style={{ color: isSelected ? "#F5F5F7" : "#8A8F98" }}>{entry.title}</p>
                  </div>
                  {entry.dial && (
                    <span className="flex-shrink-0 font-mono text-[9px] px-2 py-1" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
                      {entry.dial}
                    </span>
                  )}
                  <ChevronRight size={14} className="flex-shrink-0 transition-all" style={{ color: isSelected ? "#D1FF26" : "rgba(138,143,152,0.3)", transform: isSelected ? "rotate(0deg)" : "rotate(0deg)" }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="p-5 lg:p-6"
          style={{ background: "linear-gradient(135deg, rgba(16,20,29,0.8) 0%, rgba(10,13,18,0.8) 100%)", border: `0.5px solid ${statusConfig[item.status].border}` }}
        >
          <div className="flex items-start gap-4 mb-5">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 48, height: 48, background: statusConfig[item.status].bg, border: `1px solid ${statusConfig[item.status].border}` }}
            >
              <item.icon size={22} style={{ color: statusConfig[item.status].color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-[9px] tracking-widest" style={{ color: statusConfig[item.status].color }}>{item.quarter}</p>
                <span className="font-mono text-[7px] tracking-widest px-2 py-0.5" style={{ background: statusConfig[item.status].bg, color: statusConfig[item.status].color, border: `0.5px solid ${statusConfig[item.status].border}` }}>
                  {statusConfig[item.status].label}
                </span>
              </div>
              <h3 className="font-heading font-black text-xl tracking-tight" style={{ color: "#F5F5F7" }}>{item.title}</h3>
              {item.dial && (
                <p className="font-mono text-[10px] mt-0.5" style={{ color: "#D1FF26" }}>Dial {item.dial}</p>
              )}
            </div>
            <StatusIcon size={18} style={{ color: statusConfig[item.status].color }} />
          </div>

          <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.7 }}>{item.summary}</p>

          <div>
            <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: statusConfig[item.status].color }}>// KEY DELIVERABLES</p>
            <ul className="space-y-2">
              {item.deliverables.map((d, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex items-center justify-center flex-shrink-0 mt-0.5 rounded-full" style={{ width: 14, height: 14, background: statusConfig[item.status].bg, border: `0.5px solid ${statusConfig[item.status].border}` }}>
                    <CheckCircle2 size={8} style={{ color: statusConfig[item.status].color }} />
                  </div>
                  <span className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{d}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}