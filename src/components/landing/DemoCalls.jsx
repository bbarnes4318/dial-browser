import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, PhoneOff, Volume2, UtensilsCrossed, Plane, Dices, Newspaper,
  ChevronRight, RotateCcw, Mic, Check
} from "lucide-react";

const demos = [
  {
    id: "doordash",
    label: "DoorDash",
    icon: UtensilsCrossed,
    color: '#D1FF26',
    accent: 'rgba(209,255,38,0.15)',
    border: 'rgba(209,255,38,0.3)',
    dialCode: "*DASH",
    title: "Ordering Food on DoorDash",
    subtitle: "Voice-activated meal ordering",
    transcript: [
      { role: "system", text: "Connecting to DoorDash via Dial Browser™..." },
      { role: "agent", text: "Welcome to DoorDash! What would you like to order today?" },
      { role: "user", text: "I'd like two chicken burrito bowls from Chipotle." },
      { role: "agent", text: "Got it — two chicken burrito bowls. Would you like to add guacamole or any sides?" },
      { role: "user", text: "Yes, add guac to both and a large chips and salsa." },
      { role: "agent", text: "Adding guacamole to both bowls and one large chips and salsa. Delivery to your home address on file?" },
      { role: "user", text: "Yes, that's correct." },
      { role: "agent", text: "Your total is $34.50, arriving in 25–35 minutes. I'll text you the tracking link. Anything else?" },
      { role: "user", text: "That's all, thanks." },
      { role: "system", text: "✓ Order placed. Tracking link sent via SMS." },
    ],
  },
  {
    id: "jamaica",
    label: "Jamaica Trip",
    icon: Plane,
    color: '#5AE0C8',
    accent: 'rgba(90,224,200,0.12)',
    border: 'rgba(90,224,200,0.3)',
    dialCode: "*TRAVEL",
    title: "Booking a Family Vacation to Jamaica",
    subtitle: "Plan and book flights + resort by voice",
    transcript: [
      { role: "system", text: "Connecting to travel booking via Dial Browser™..." },
      { role: "agent", text: "Where would you like to travel?" },
      { role: "user", text: "A family vacation to Jamaica — two adults, two kids, departing July 15th for seven nights." },
      { role: "agent", text: "I found beachfront resorts in Montego Bay and Negril. Would you prefer an all-inclusive package?" },
      { role: "user", text: "Yes, all-inclusive with a kids' club and ocean-view rooms." },
      { role: "agent", text: "The Beaches Ocho Rios resort has availability — all-inclusive, kids' club, and ocean-view suites. Round-trip flights from your nearest airport included. Total for the family: $6,840." },
      { role: "user", text: "That sounds perfect. Can we get airport transfers too?" },
      { role: "agent", text: "Adding complimentary airport transfers. I'll email your full itinerary and send a payment link via SMS. Shall I confirm the booking?" },
      { role: "user", text: "Yes, confirm it." },
      { role: "system", text: "✓ Vacation booked. Itinerary emailed · Payment link sent via SMS." },
    ],
  },
  {
    id: "betmgm",
    label: "BetMGM",
    icon: Dices,
    color: '#E0A85A',
    accent: 'rgba(224,168,90,0.12)',
    border: 'rgba(224,168,90,0.3)',
    dialCode: "*BETS",
    title: "Placing a Bet on BetMGM",
    subtitle: "Voice-driven sports wagering",
    transcript: [
      { role: "system", text: "Connecting to BetMGM via Dial Browser™..." },
      { role: "agent", text: "Welcome to BetMGM. What would you like to wager on?" },
      { role: "user", text: "I want to bet fifty dollars on the Lakers to win tonight against the Celtics." },
      { role: "agent", text: "Lakers vs. Celtics, moneyline on the Lakers. Current odds are +130. A $50 bet would return $115 in profit. Confirm?" },
      { role: "user", text: "Yes, place it." },
      { role: "agent", text: "Bet confirmed — $50 on the Lakers moneyline at +130. Potential payout: $165. I'll text you a live update when the game starts. Anything else?" },
      { role: "user", text: "No, that's it." },
      { role: "system", text: "✓ Wager placed. Confirmation and live game alerts sent via SMS." },
    ],
  },
  {
    id: "news",
    label: "News",
    icon: Newspaper,
    color: '#5A8FE0',
    accent: 'rgba(90,143,224,0.12)',
    border: 'rgba(90,143,224,0.3)',
    dialCode: "*NEWS",
    title: "Listening to the News",
    subtitle: "On-demand audio news briefing",
    transcript: [
      { role: "system", text: "Connecting to news briefing via Dial Browser™..." },
      { role: "agent", text: "Here's your personalized news briefing for today." },
      { role: "agent", text: "In world news: global leaders reached a new climate agreement at the summit in Geneva." },
      { role: "agent", text: "In tech: a major breakthrough in satellite connectivity promises to expand internet access to rural regions." },
      { role: "agent", text: "In markets: stocks closed higher today, with energy and tech leading gains." },
      { role: "agent", text: "In sports: the Lakers defeated the Celtics in overtime last night." },
      { role: "user", text: "Tell me more about the climate agreement." },
      { role: "agent", text: "The agreement commits 40 nations to cut emissions 40% by 2035, with a $200 billion fund for developing nations. Want the full article texted to you?" },
      { role: "user", text: "Yes please." },
      { role: "system", text: "✓ Full article sent via SMS. Briefing complete." },
    ],
  },
];

function CallBubble({ message, color }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {isSystem ? (
        <div
          className="w-full text-center py-1.5 px-3 font-mono text-[10px] tracking-wider"
          style={{ color: '#D1FF26', background: 'rgba(209,255,38,0.05)', border: '0.5px solid rgba(209,255,38,0.15)' }}
        >
          {message.text}
        </div>
      ) : (
        <div
          className="max-w-[80%] px-3.5 py-2.5"
          style={{
            background: isUser ? color : 'rgba(16,20,29,0.9)',
            border: isUser ? 'none' : '0.5px solid rgba(138,143,152,0.15)',
            color: isUser ? '#05070A' : '#F5F5F7',
          }}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function DemoCalls() {
  const [activeDemo, setActiveDemo] = useState(demos[0]);
  const [callState, setCallState] = useState("idle"); // idle | connecting | active | ended
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const transcriptRef = useRef(null);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const startCall = (demo) => {
    clearTimers();
    setActiveDemo(demo);
    setCallState("connecting");
    setVisibleMessages([]);
    setCurrentIdx(0);

    // After connecting delay, begin streaming transcript
    const connectTimer = setTimeout(() => {
      setCallState("active");
      streamMessages(demo, 0);
    }, 1200);
    timersRef.current.push(connectTimer);
  };

  const streamMessages = (demo, idx) => {
    if (idx >= demo.transcript.length) {
      const endTimer = setTimeout(() => setCallState("ended"), 800);
      timersRef.current.push(endTimer);
      return;
    }
    setVisibleMessages((prev) => [...prev, demo.transcript[idx]]);
    setCurrentIdx(idx + 1);
    // Vary delay: system messages fast, agent slower, user medium
    const msg = demo.transcript[idx];
    const delay = msg.role === "system" ? 700 : msg.role === "agent" ? 1800 : 1200;
    const next = setTimeout(() => streamMessages(demo, idx + 1), delay);
    timersRef.current.push(next);
  };

  const endCall = () => {
    clearTimers();
    setCallState("ended");
  };

  const resetCall = () => {
    clearTimers();
    setCallState("idle");
    setVisibleMessages([]);
    setCurrentIdx(0);
  };

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  const Icon = activeDemo.icon;

  return (
    <section
      id="democalls"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // LIVE DEMO CALLS
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            See It In Action
          </h2>
          <p className="text-base font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Pick a scenario and watch a real voice call unfold through the Dial Browser™ — no app, no screen, just a phone call.
          </p>
        </motion.div>

        {/* Demo selector tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          {demos.map((demo) => {
            const TabIcon = demo.icon;
            const isActive = activeDemo.id === demo.id;
            return (
              <button
                key={demo.id}
                onClick={() => {
                  resetCall();
                  setActiveDemo(demo);
                }}
                className="flex flex-col items-center gap-2 p-4 transition-all duration-200"
                style={{
                  background: isActive ? demo.accent : 'rgba(16,20,29,0.5)',
                  border: `0.5px solid ${isActive ? demo.border : 'rgba(138,143,152,0.1)'}`,
                }}
              >
                <TabIcon size={20} style={{ color: isActive ? demo.color : '#8A8F98' }} />
                <span
                  className="font-heading font-bold text-xs"
                  style={{ color: isActive ? demo.color : '#8A8F98' }}
                >
                  {demo.label}
                </span>
                <span className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>
                  {demo.dialCode}
                </span>
              </button>
            );
          })}
        </div>

        {/* Phone call interface */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mx-auto max-w-md"
          style={{
            background: 'rgba(16,20,29,0.9)',
            border: `0.5px solid ${activeDemo.border}`,
            boxShadow: callState === 'active' ? `0 0 40px ${activeDemo.accent}` : 'none',
          }}
        >
          {/* Call header */}
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `0.5px solid ${activeDemo.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ background: activeDemo.accent, border: `0.5px solid ${activeDemo.border}` }}
              >
                <Icon size={18} style={{ color: activeDemo.color }} />
              </div>
              <div>
                <p className="font-heading font-bold text-sm" style={{ color: '#F5F5F7' }}>
                  {activeDemo.title}
                </p>
                <p className="font-mono text-[9px] tracking-wider" style={{ color: '#8A8F98' }}>
                  {activeDemo.subtitle.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: callState === 'active' ? activeDemo.color : callState === 'connecting' ? '#E0A85A' : '#8A8F98',
                  animation: callState === 'active' || callState === 'connecting' ? 'dotPulse 1.5s ease-in-out infinite' : 'none',
                }}
              />
              <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
                {callState === 'idle' && 'READY'}
                {callState === 'connecting' && 'CONNECTING'}
                {callState === 'active' && 'LIVE'}
                {callState === 'ended' && 'ENDED'}
              </span>
            </div>
          </div>

          {/* Transcript area */}
          <div
            ref={transcriptRef}
            className="p-4 space-y-3 overflow-y-auto"
            style={{ height: '340px' }}
          >
            {callState === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: activeDemo.accent, border: `1px solid ${activeDemo.border}` }}
                >
                  <Phone size={26} style={{ color: activeDemo.color }} />
                </div>
                <p className="font-mono text-xs tracking-wider" style={{ color: '#8A8F98' }}>
                  PRESS CALL TO START THE DEMO
                </p>
              </div>
            )}
            {callState === 'connecting' && (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: activeDemo.color, borderRightColor: activeDemo.color }}
                />
                <p className="font-mono text-xs tracking-wider" style={{ color: '#8A8F98' }}>
                  DIALING {activeDemo.dialCode}...
                </p>
              </div>
            )}
            {(callState === 'active' || callState === 'ended') && (
              <AnimatePresence>
                {visibleMessages.map((msg, i) => (
                  <CallBubble key={i} message={msg} color={activeDemo.color} />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Call controls */}
          <div
            className="flex items-center justify-center gap-4 p-4"
            style={{ borderTop: `0.5px solid ${activeDemo.border}` }}
          >
            {callState === 'idle' && (
              <button
                onClick={() => startCall(activeDemo)}
                className="flex items-center gap-2 px-6 py-2.5 font-mono text-xs tracking-widest transition-all duration-200 hover:scale-105"
                style={{ background: activeDemo.color, color: '#05070A' }}
              >
                <Phone size={14} />
                START CALL
              </button>
            )}
            {callState === 'connecting' && (
              <button
                disabled
                className="flex items-center gap-2 px-6 py-2.5 font-mono text-xs tracking-widest opacity-50"
                style={{ background: '#8A8F98', color: '#05070A' }}
              >
                CONNECTING...
              </button>
            )}
            {callState === 'active' && (
              <>
                <div className="flex items-center gap-1.5">
                  <Mic size={14} style={{ color: activeDemo.color }} />
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>LISTENING</span>
                </div>
                <button
                  onClick={endCall}
                  className="flex items-center gap-2 px-5 py-2.5 font-mono text-xs tracking-widest transition-all duration-200 hover:scale-105"
                  style={{ background: '#FF3838', color: '#F5F5F7' }}
                >
                  <PhoneOff size={14} />
                  END CALL
                </button>
                <div className="flex items-center gap-1.5">
                  <Volume2 size={14} style={{ color: activeDemo.color }} />
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>SPEAKING</span>
                </div>
              </>
            )}
            {callState === 'ended' && (
              <button
                onClick={() => startCall(activeDemo)}
                className="flex items-center gap-2 px-6 py-2.5 font-mono text-xs tracking-widest transition-all duration-200 hover:scale-105"
                style={{ background: activeDemo.color, color: '#05070A' }}
              >
                <RotateCcw size={14} />
                REPLAY CALL
              </button>
            )}
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-6 text-center font-mono text-[10px] tracking-wider"
          style={{ color: '#8A8F98' }}
        >
          ▸ SIMULATED TRANSCRIPTS FOR DEMONSTRATION · ACTUAL CALLS USE LIVE VOICE AI
        </motion.p>
      </div>
    </section>
  );
}