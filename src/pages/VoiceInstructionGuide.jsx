import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Mic, ShoppingCart, Stethoscope, FileText, Home as HomeIcon,
  Car, Music, Phone, Copy, Check, ArrowLeft, Lightbulb,
  Volume2, MessageSquare, Sparkles, ChevronRight,
} from "lucide-react";
import VoiceTrainingMode from "@/components/voice/VoiceTrainingMode";

export const SERVICE_GUIDES = [
  {
    id: "grocery",
    name: "Grocery List",
    icon: ShoppingCart,
    color: "#A3E635",
    dialCode: "*400#",
    intro: "Dictate your grocery list by voice. The system organizes items, estimates cost, and assigns a store.",
    commands: [
      { phrase: "I need milk, eggs, bread, and bananas", result: "Creates a structured cart with 4 items and price estimates" },
      { phrase: "Add toilet paper and paper towels", result: "Appends household items to your active cart" },
      { phrase: "Remove the eggs", result: "Deletes a specific item from your list" },
      { phrase: "What's my total so far?", result: "Reads back the estimated cost of all items" },
      { phrase: "Place the order", result: "Sends the cart to the assigned store for fulfillment" },
    ],
  },
  {
    id: "medical",
    name: "Medical Request",
    icon: Stethoscope,
    color: "#22D3EE",
    dialCode: "*301#",
    intro: "Describe your symptoms by voice. An AI triage system assesses urgency and connects you to a provider.",
    commands: [
      { phrase: "I have a fever and a sore throat", result: "Starts AI triage, flags symptoms, and assigns urgency level" },
      { phrase: "I need to refill my blood pressure medication", result: "Routes to prescription refill workflow" },
      { phrase: "It's an emergency, I can't breathe", result: "Flags as emergency priority and connects immediately" },
      { phrase: "Show me my last lab results", result: "Reads back your most recent lab interpretation" },
      { phrase: "Connect me to a doctor now", result: "Routes to the next available telehealth provider" },
    ],
  },
  {
    id: "dental",
    name: "Dental Request",
    icon: Stethoscope,
    color: "#FBBF24",
    dialCode: "*308#",
    intro: "Describe your dental issue. The system finds local dentists and books appointments.",
    commands: [
      { phrase: "I have a toothache on the lower right side", result: "Starts dental triage and identifies nearby dentists" },
      { phrase: "I need a cleaning appointment", result: "Searches for routine cleaning availability" },
      { phrase: "My filling fell out", result: "Flags as urgent repair and prioritizes same-day slots" },
      { phrase: "Find an orthodontist near me", result: "Searches for specialized dental providers in your area" },
    ],
  },
  {
    id: "bills",
    name: "Bill Processing",
    icon: FileText,
    color: "#C084FC",
    dialCode: "*600#",
    intro: "Pay bills by voice. State the bill type, company, and amount — the system handles the rest.",
    commands: [
      { phrase: "Pay my electric bill to ConEd, $85.40", result: "Initiates payment to ConEd with processing fee shown" },
      { phrase: "What bills are due this week?", result: "Reads back upcoming bills from your tracked accounts" },
      { phrase: "Pay my internet bill", result: "Searches for your internet provider and prompts for amount" },
      { phrase: "How much did I pay for gas last month?", result: "Reads back last month's gas payment history" },
      { phrase: "Cancel that payment", result: "Stops a pending bill payment before it processes" },
    ],
  },
  {
    id: "realestate",
    name: "Real Estate Search",
    icon: HomeIcon,
    color: "#F472B6",
    dialCode: "*500#",
    intro: "Describe your ideal property by voice. The system searches listings and connects you to an agent.",
    commands: [
      { phrase: "I'm looking for a 2-bedroom apartment in Brooklyn under $2,000", result: "Searches listings matching your criteria" },
      { phrase: "Show me houses with a backyard in Atlanta", result: "Filters for single-family homes with outdoor space" },
      { phrase: "Connect me to a real estate agent", result: "Routes to a local agent for a consultation" },
      { phrase: "What's the average rent in my area?", result: "Reads back local rental market data" },
    ],
  },
  {
    id: "transport",
    name: "Transportation",
    icon: Car,
    color: "#60A5FA",
    dialCode: "*103#",
    intro: "Request rides and ground transportation instantly from any phone.",
    commands: [
      { phrase: "Get me a ride to the airport", result: "Requests a ride to your nearest airport" },
      { phrase: "I need a ride home", result: "Routes a ride to your saved home address" },
      { phrase: "How much is a ride to downtown?", result: "Provides an estimated fare for your destination" },
    ],
  },
  {
    id: "music",
    name: "Music & Audio",
    icon: Music,
    color: "#FB7185",
    dialCode: "*105#",
    intro: "Stream music, podcasts, and audio content directly through your call.",
    commands: [
      { phrase: "Play trending music", result: "Streams today's top trending tracks" },
      { phrase: "Play some jazz", result: "Streams jazz genre audio" },
      { phrase: "Play the latest podcast episode", result: "Streams the most recent episode of trending podcasts" },
      { phrase: "Skip this song", result: "Advances to the next track" },
    ],
  },
  {
    id: "weather",
    name: "Weather Forecast",
    icon: Sparkles,
    color: "#38BDF8",
    dialCode: "*200#",
    intro: "Get daily weather updates delivered by voice or SMS.",
    commands: [
      { phrase: "What's the weather today?", result: "Reads back today's forecast for your location" },
      { phrase: "Subscribe me to daily weather for Atlanta", result: "Enables daily SMS weather forecasts for your city" },
      { phrase: "Will it rain tomorrow?", result: "Reads tomorrow's precipitation forecast" },
    ],
  },
];

const GENERAL_TIPS = [
  { icon: Volume2, title: "Speak Naturally", desc: "No special keywords needed. Just talk like you're on the phone with a friend." },
  { icon: MessageSquare, title: "Text Also Works", desc: "Prefer typing? Send SMS commands to the same number — voice and text are interchangeable." },
  { icon: Phone, title: "No App Required", desc: "Works on any phone — smartphone, flip phone, or landline. No internet or data plan needed." },
];

function CommandRow({ phrase, result, index }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group p-4 transition-all"
      style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.1)" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center font-mono text-[9px] font-bold" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <button onClick={copy} className="flex items-center gap-2 mb-1.5 group/btn">
            <Mic size={11} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>"{phrase}"</span>
            {copied ? <Check size={11} style={{ color: "#D1FF26" }} /> : <Copy size={11} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" style={{ color: "#8A8F98" }} />}
          </button>
          <div className="flex items-start gap-1.5 pl-5">
            <ChevronRight size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#8A8F98" }} />
            <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{result}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function VoiceInstructionGuide() {
  const [activeService, setActiveService] = useState("grocery");
  const active = SERVICE_GUIDES.find((s) => s.id === activeService);

  return (
    <div className="min-h-screen py-20 px-6 lg:px-16" style={{ background: "#05070A" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Mic size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// VOICE INSTRUCTION GUIDE</span>
          </div>
          <h1 className="font-heading font-black text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            What to <span style={{ color: "#D1FF26" }}>Say</span>
          </h1>
          <p className="text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Exact phrases to trigger every Dial Browser service. Speak naturally — no special keywords, no apps, no internet required. Just call and say what you need.
          </p>
        </motion.div>

        {/* General tips */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {GENERAL_TIPS.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-4"
                style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}
              >
                <Icon size={16} style={{ color: "#D1FF26" }} />
                <p className="font-heading font-bold text-sm mt-2 mb-1" style={{ color: "#F5F5F7" }}>{tip.title}</p>
                <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{tip.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Service selector tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {SERVICE_GUIDES.map((svc) => {
            const Icon = svc.icon;
            const isActive = activeService === svc.id;
            return (
              <button
                key={svc.id}
                onClick={() => setActiveService(svc.id)}
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase whitespace-nowrap transition-all"
                style={{
                  background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${isActive ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}`,
                  color: isActive ? "#D1FF26" : "#8A8F98",
                }}
              >
                <Icon size={12} style={{ color: isActive ? "#D1FF26" : svc.color }} /> {svc.name}
              </button>
            );
          })}
        </div>

        {/* Active service detail */}
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-5 lg:p-6 mb-8"
          style={{ background: "#10141D", border: `0.5px solid ${active.color}40` }}
        >
          {/* Service header */}
          <div className="flex items-start justify-between gap-4 mb-5 pb-5" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.1)" }}>
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                style={{ background: `${active.color}12`, border: `0.5px solid ${active.color}40` }}
              >
                <active.icon size={22} style={{ color: active.color }} />
              </div>
              <div>
                <h2 className="font-heading font-black text-2xl" style={{ color: "#F5F5F7" }}>{active.name}</h2>
                <p className="text-sm mt-1 max-w-md" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{active.intro}</p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="font-mono text-[8px] tracking-widest mb-1" style={{ color: "#8A8F98" }}>DIAL CODE</p>
              <p className="font-mono text-lg font-bold" style={{ color: active.color }}>{active.dialCode}</p>
            </div>
          </div>

          {/* Commands */}
          <div className="flex items-center gap-2 mb-4">
            <Mic size={13} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// EXACT PHRASES TO SAY</p>
          </div>
          <div className="space-y-2">
            {active.commands.map((cmd, i) => (
              <CommandRow key={i} phrase={cmd.phrase} result={cmd.result} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Pro tip */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-5 mb-8"
          style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)" }}
        >
          <div className="flex items-start gap-3">
            <Lightbulb size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
            <div>
              <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#D1FF26" }}>▸ PRO TIP</p>
              <p className="text-sm" style={{ color: "#F5F5F7", lineHeight: 1.6 }}>
                You don't need to memorize exact phrases. The Dial Browser understands natural language — just describe what you need in your own words and it routes you to the right service automatically.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Interactive Training Mode */}
        <VoiceTrainingMode />

        {/* Back link */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
            <ArrowLeft size={12} /> BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}