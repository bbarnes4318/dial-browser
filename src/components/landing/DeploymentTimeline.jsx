import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Cpu, Globe, Cloud, Radio, Users, TrendingUp,
  CheckCircle2, Clock, Circle, ChevronRight, MapPin, Zap, Server
} from "lucide-react";

const milestones = [
  {
    id: "m1",
    phase: "Phase 0",
    date: "Q1 2026",
    title: "Foundation & Pilot",
    status: "completed",
    icon: Rocket,
    summary: "Core Dial Browser™ engine, voice verification, and initial 3-region pilot.",
    stats: [
      { label: "PILOT REGIONS", value: "3" },
      { label: "ACTIVE USERS", value: "120K" },
      { label: "MICRO-PLUGS", value: "450" },
    ],
    details: [
      "Voice Recognition Engine deployed with 12-language support",
      "USSD gateway live across pilot carrier networks",
      "Onboarding flow validated with 15,000-member beta cohort",
      "First marketplace transactions processed via SMS commands",
    ],
    regions: ["New York", "Lagos", "Mumbai"],
  },
  {
    id: "m2",
    phase: "Phase 1",
    date: "Q3 2026",
    title: "Foundational Deployment",
    status: "active",
    icon: Cpu,
    summary: "Full 12-region launch with 8-service spectrum and 15,000 Micro-Plug nodes.",
    stats: [
      { label: "LAUNCH REGIONS", value: "12" },
      { label: "TARGET USERS", value: "8M" },
      { label: "MICRO-PLUGS", value: "15K" },
    ],
    details: [
      "All 8 service categories live (*101–*108 dial codes)",
      "Creator platform opens with revenue sharing for content partners",
      "Payment integration across 4 carrier billing systems",
      "AppNet edge caching deployed in priority urban zones",
      "Security audit passed — GDPR, CCPA, NDPR compliance verified",
    ],
    regions: ["New York", "Los Angeles", "Mexico City", "London", "Cairo", "Lagos", "Nairobi", "Mumbai", "Jakarta", "Tokyo", "São Paulo", "Sydney"],
  },
  {
    id: "m3",
    phase: "Phase 2",
    date: "Q2 2027",
    title: "Regional Expansion",
    status: "upcoming",
    icon: Globe,
    summary: "30 additional regions, real-time translation across 47 languages, 45K Micro-Plugs.",
    stats: [
      { label: "TOTAL REGIONS", value: "42" },
      { label: "TARGET USERS", value: "24M" },
      { label: "MICRO-PLUGS", value: "60K" },
    ],
    details: [
      "Real-time language translation engine live (47 languages, 120+ dialects)",
      "Sub-Saharan Africa deep deployment — 8 new countries",
      "Southeast Asia corridor: Philippines, Vietnam, Thailand, Bangladesh",
      "Rural North America satellite-relay Micro-Plugs for remote communities",
      "Peer-to-peer relay network activates across all edge nodes",
      "Enterprise advertising platform launches with intent-based placement",
    ],
    regions: ["Philippines", "Vietnam", "Thailand", "Bangladesh", "Ghana", "Ethiopia", "Tanzania", "Uganda", "+34 more"],
  },
  {
    id: "m4",
    phase: "Phase 3",
    date: "Q4 2027",
    title: "Autonomous AI Agents",
    status: "upcoming",
    icon: Cloud,
    summary: "Multi-step AI workflows, IoT voice control, and predictive edge pre-fetching.",
    stats: [
      { label: "AI AGENT TYPES", value: "12" },
      { label: "AUTO WORKFLOWS", value: "340+" },
      { label: "EDGE HIT RATE", value: "89%" },
    ],
    details: [
      "Autonomous agents execute multi-step service workflows without supervision",
      "IoT device control via voice — smart home, agriculture, healthcare sensors",
      "Predictive pre-fetching: AppNet caches anticipated requests before users ask",
      "Federated learning improves language models without centralizing user data",
      "Voice biometric upgrade — continuous authentication during active calls",
    ],
    regions: ["All deployed regions"],
  },
  {
    id: "m5",
    phase: "Phase 4",
    date: "Q3 2028",
    title: "Global Scale",
    status: "upcoming",
    icon: Radio,
    summary: "Full global coverage across 6 continents with satellite-direct connectivity.",
    stats: [
      { label: "GLOBAL REACH", value: "6" },
      { label: "TARGET USERS", value: "50M" },
      { label: "MICRO-PLUGS", value: "120K" },
    ],
    details: [
      "Satellite-direct voice connectivity via low-earth-orbit constellations",
      "Ultra-remote users access services without terrestrial infrastructure",
      "Global coverage achieved across all 6 continents",
      "Brain-computer interface research enters clinical trials",
      "Platform opens as white-label infrastructure for telecom partners",
    ],
    regions: ["Global Coverage"],
  },
  {
    id: "m6",
    phase: "Horizon",
    date: "2030+",
    title: "The Next Billion",
    status: "vision",
    icon: Users,
    summary: "Default service access layer for the next billion digital citizens.",
    stats: [
      { label: "PROJECTED USERS", value: "500M" },
      { label: "LANGUAGES", value: "100+" },
      { label: "MICRO-PLUGS", value: "1M+" },
    ],
    details: [
      "1 CALL AWAY™ becomes the default service layer for next-billion users",
      "Full voice-native OS — no screen, no app, no internet required",
      "Decentralized governance — Micro-Plug hosts vote on platform direction",
      "Open protocol: any telecom, any device, any language, any service",
    ],
    regions: ["Worldwide"],
  },
];

const statusConfig = {
  completed: { color: "#D1FF26", bg: "rgba(209,255,38,0.08)", border: "rgba(209,255,38,0.3)", icon: CheckCircle2, label: "COMPLETED" },
  active: { color: "#D1FF26", bg: "rgba(209,255,38,0.12)", border: "rgba(209,255,38,0.5)", icon: Zap, label: "IN PROGRESS" },
  upcoming: { color: "#8A8F98", bg: "rgba(138,143,152,0.06)", border: "rgba(138,143,152,0.2)", icon: Clock, label: "UPCOMING" },
  vision: { color: "#4CB4FF", bg: "rgba(76,180,255,0.06)", border: "rgba(76,180,255,0.25)", icon: Circle, label: "VISION" },
};

export default function DeploymentTimeline() {
  const [inView, setInView] = useState(true);
  const [activeMilestone, setActiveMilestone] = useState(1); // default to Phase 1 (active)
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Animate progress line
  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => setProgress(25), 500); // ~Phase 1 position
    return () => clearTimeout(timer);
  }, [inView]);

  // Live counter effect
  const [liveUsers, setLiveUsers] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setLiveUsers((prev) => prev + Math.floor(Math.random() * 7) + 1);
    }, 800);
    return () => clearInterval(interval);
  }, [inView]);

  const milestone = milestones[activeMilestone];
  const StatusIcon = statusConfig[milestone.status].icon;

  return (
    <div ref={sectionRef} className="relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
            // DEPLOYMENT ROADMAP
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26", animation: "dotPulse 1.5s ease-in-out infinite" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>LIVE USERS</span>
          <span className="font-mono text-[10px] font-bold" style={{ color: "#F5F5F7" }}>{liveUsers.toLocaleString()}</span>
        </div>
      </div>

      {/* Timeline track — horizontal on desktop */}
      <div className="hidden lg:block relative mb-8">
        {/* Track line */}
        <div className="absolute left-0 right-0 top-6 h-px" style={{ background: "rgba(138,143,152,0.15)" }} />
        {/* Progress fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${progress}%` } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute left-0 top-6 h-px"
          style={{ background: "linear-gradient(90deg, #D1FF26, rgba(209,255,38,0.3))", boxShadow: "0 0 8px rgba(209,255,38,0.4)" }}
        />

        {/* Milestone nodes */}
        <div className="relative flex justify-between">
          {milestones.map((m, i) => {
            const cfg = statusConfig[m.status];
            const Icon = m.icon;
            const isActive = i === activeMilestone;
            const isPast = i < activeMilestone;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMilestone(i)}
                onMouseEnter={() => setActiveMilestone(i)}
                className="flex flex-col items-center group relative z-10"
                style={{ width: "calc(100% / 6)" }}
              >
                {/* Node */}
                <div
                  className="relative flex items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 48 : 36,
                    height: isActive ? 48 : 36,
                    background: isActive ? cfg.bg : "#05070A",
                    border: `1.5px solid ${isActive ? cfg.color : isPast ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.2)"}`,
                    boxShadow: isActive ? `0 0 20px ${cfg.color}40` : "none",
                  }}
                >
                  {isActive && (
                    <div className="absolute rounded-full pointer-events-none" style={{ width: "60px", height: "60px", left: "-6px", top: "-6px", border: `0.5px solid ${cfg.color}30`, animation: "converge 2s ease-out infinite" }} />
                  )}
                  <Icon size={isActive ? 18 : 14} style={{ color: isActive ? cfg.color : isPast ? "#D1FF26" : "#8A8F98" }} />
                </div>
                {/* Label */}
                <div className="mt-3 text-center">
                  <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: isActive ? cfg.color : "#8A8F98" }}>{m.phase}</p>
                  <p className="font-mono text-[8px]" style={{ color: isActive ? "#F5F5F7" : "#8A8F98", opacity: isActive ? 1 : 0.6 }}>{m.date}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline track — vertical on mobile */}
      <div className="lg:hidden relative mb-6 pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: "rgba(138,143,152,0.15)" }} />
        <motion.div
          initial={{ height: 0 }}
          animate={inView ? { height: `${progress * 3}%` } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute left-3 top-0 w-px"
          style={{ background: "linear-gradient(180deg, #D1FF26, rgba(209,255,38,0.3))", boxShadow: "0 0 8px rgba(209,255,38,0.4)" }}
        />
        <div className="space-y-3">
          {milestones.map((m, i) => {
            const cfg = statusConfig[m.status];
            const Icon = m.icon;
            const isActive = i === activeMilestone;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMilestone(i)}
                className="flex items-center gap-3 w-full text-left"
              >
                <div
                  className="absolute left-0 flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: isActive ? 28 : 20,
                    height: isActive ? 28 : 20,
                    background: isActive ? cfg.bg : "#05070A",
                    border: `1.5px solid ${isActive ? cfg.color : "rgba(138,143,152,0.2)"}`,
                    marginLeft: isActive ? "-4px" : "0",
                  }}
                >
                  <Icon size={isActive ? 12 : 9} style={{ color: isActive ? cfg.color : "#8A8F98" }} />
                </div>
                <div>
                  <p className="font-mono text-[8px] tracking-widest" style={{ color: isActive ? cfg.color : "#8A8F98" }}>{m.phase}</p>
                  <p className="text-[10px]" style={{ color: isActive ? "#F5F5F7" : "#8A8F98" }}>{m.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active milestone detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={milestone.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid lg:grid-cols-3 gap-4"
        >
          {/* Left — milestone summary */}
          <div
            className="lg:col-span-2 p-6 lg:p-8"
            style={{
              background: "linear-gradient(135deg, rgba(16,20,29,0.8) 0%, rgba(10,13,18,0.8) 100%)",
              border: `0.5px solid ${statusConfig[milestone.status].border}`,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 56, height: 56,
                    background: statusConfig[milestone.status].bg,
                    border: `1px solid ${statusConfig[milestone.status].border}`,
                  }}
                >
                  <milestone.icon size={24} style={{ color: statusConfig[milestone.status].color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: statusConfig[milestone.status].color }}>{milestone.phase}</p>
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: statusConfig[milestone.status].bg, color: statusConfig[milestone.status].color, border: `0.5px solid ${statusConfig[milestone.status].border}` }}>
                      {statusConfig[milestone.status].label}
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-2xl tracking-tight" style={{ color: "#F5F5F7" }}>{milestone.title}</h3>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: "#8A8F98" }}>{milestone.date}</p>
                </div>
              </div>
              <StatusIcon size={20} style={{ color: statusConfig[milestone.status].color }} />
            </div>

            {/* Summary */}
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#8A8F98", lineHeight: "1.7" }}>{milestone.summary}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {milestone.stats.map((stat) => (
                <div key={stat.label} className="p-3 text-center" style={{ background: "rgba(5,7,10,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <p className="font-heading font-black text-xl mb-1" style={{ color: statusConfig[milestone.status].color }}>{stat.value}</p>
                  <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Details list */}
            <div>
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: statusConfig[milestone.status].color }}>// KEY DELIVERABLES</p>
              <ul className="space-y-2.5">
                {milestone.details.map((detail, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 mt-0.5 rounded-full" style={{ width: 16, height: 16, background: statusConfig[milestone.status].bg, border: `0.5px solid ${statusConfig[milestone.status].border}` }}>
                      <CheckCircle2 size={9} style={{ color: statusConfig[milestone.status].color }} />
                    </div>
                    <span className="text-sm" style={{ color: "#8A8F98", lineHeight: "1.6" }}>{detail}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — regions + navigation */}
          <div className="space-y-4">
            {/* Regions */}
            <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={14} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// DEPLOYMENT REGIONS</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {milestone.regions.map((region, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="px-2.5 py-1.5"
                    style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.15)" }}
                  >
                    <p className="font-mono text-[9px]" style={{ color: "#F5F5F7" }}>{region}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>TOTAL REGIONS</span>
                  <span className="font-heading font-black text-lg" style={{ color: "#D1FF26" }}>{milestone.regions.length}</span>
                </div>
              </div>
            </div>

            {/* Phase progress indicator */}
            <div className="p-5" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.1)" }}>
              <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>// ROADMAP PROGRESS</p>
              <div className="flex items-center gap-1 mb-3">
                {milestones.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex-1 h-1.5 rounded-sm transition-all"
                    style={{
                      background: i < activeMilestone ? "#D1FF26" : i === activeMilestone ? statusConfig[m.status].color : "rgba(138,143,152,0.15)",
                      opacity: i <= activeMilestone ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>PHASE {activeMilestone + 1}/{milestones.length}</span>
                <span className="font-mono text-[8px] font-bold" style={{ color: statusConfig[milestone.status].color }}>
                  {Math.round(((activeMilestone + 1) / milestones.length) * 100)}% COMPLETE
                </span>
              </div>
            </div>

            {/* Navigation hint */}
            <div className="p-4 flex items-center justify-between" style={{ background: "rgba(16,20,29,0.3)", border: "0.5px solid rgba(138,143,152,0.08)" }}>
              <button
                onClick={() => activeMilestone > 0 && setActiveMilestone(activeMilestone - 1)}
                disabled={activeMilestone === 0}
                className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-20"
                style={{ color: "#8A8F98" }}
              >
                <ChevronRight size={12} className="rotate-180" /> Prev
              </button>
              <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>TAP NODES TO EXPLORE</span>
              <button
                onClick={() => activeMilestone < milestones.length - 1 && setActiveMilestone(activeMilestone + 1)}
                disabled={activeMilestone === milestones.length - 1}
                className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-20"
                style={{ color: "#8A8F98" }}
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}