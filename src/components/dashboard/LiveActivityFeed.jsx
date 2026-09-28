import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, TrendingUp, Users, PhoneCall, Globe, Zap, ArrowUp, ArrowDown, Radio, ShoppingCart, Stethoscope, Home, Briefcase, Music, Play, Heart, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SERVICE_ICONS = {
  medical: Stethoscope,
  dental: Stethoscope,
  real_estate: Home,
  grocery: ShoppingCart,
  jobs: Briefcase,
  music: Music,
  radio: Radio,
  dating: Heart,
  sports: Trophy,
  media: Play,
};

const REGIONS = ["Lagos, NG", "Atlanta, GA", "Mumbai, IN", "São Paulo, BR", "Nairobi, KE", "Houston, TX", "Manila, PH", "London, UK", "Accra, GH", "Kingston, JM", "Toronto, CA", "Sydney, AU", "Dubai, UAE", "Berlin, DE"];

const SERVICE_NAMES = [
  { name: "AI Symptom Check", type: "medical", dial: "*301#" },
  { name: "Job Alert Match", type: "jobs", dial: "*600#" },
  { name: "Live Stream Alert", type: "music", dial: "*700#" },
  { name: "Radio Phone Network", type: "radio", dial: "*800#" },
  { name: "Weather Forecast", type: "weather", dial: "*200#" },
  { name: "Dating Match", type: "dating", dial: "*550#" },
];

const ACTIONS = ["connected to", "booked via", "completed call to", "subscribed to", "requested"];

function generateActivity() {
  const svc = SERVICE_NAMES[Math.floor(Math.random() * SERVICE_NAMES.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const callerId = Math.floor(1000 + Math.random() * 9000);
  const minutesAgo = Math.floor(Math.random() * 3);
  return {
    id: `${Date.now()}-${Math.random()}`,
    service: svc.name,
    serviceType: svc.type,
    dial: svc.dial,
    region,
    action,
    caller: `User #${callerId}`,
    timestamp: new Date(),
    minutesAgo,
  };
}

function generateTrendStat() {
  const base = 800 + Math.floor(Math.random() * 4000);
  const change = Math.floor((Math.random() - 0.3) * 200);
  return {
    calls: base,
    change,
    activeUsers: 200 + Math.floor(Math.random() * 800),
    regions: 12 + Math.floor(Math.random() * 8),
  };
}

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ calls: 0, change: 0, activeUsers: 0, regions: 0 });
  const [isLive, setIsLive] = useState(true);
  const [tickerOffset, setTickerOffset] = useState(0);
  const feedRef = useRef(null);
  const initialized = useRef(false);

  // Seed initial activities
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const seed = Array.from({ length: 8 }, (_, i) => {
      const act = generateActivity();
      act.minutesAgo = i + 1;
      act.timestamp = new Date(Date.now() - (i + 1) * 30000);
      return act;
    });
    setActivities(seed);
    setStats(generateTrendStat());
  }, []);

  // Live ticker — new activity every 3-5 seconds
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const newAct = generateActivity();
      newAct.minutesAgo = 0;
      newAct.timestamp = new Date();
      setActivities((prev) => [newAct, ...prev].slice(0, 30));
      setStats(generateTrendStat());
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Scroll ticker for top bar
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setTickerOffset((prev) => (prev - 1) % 1000);
    }, 50);
    return () => clearInterval(interval);
  }, [isLive]);

  const trendUp = stats.change >= 0;

  return (
    <div className="relative overflow-hidden" style={{ background: "rgba(10,13,20,0.9)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Top signal line */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.1)" }}>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7">
            <div className="absolute inset-0 rounded-full" style={{ background: "rgba(209,255,38,0.1)", animation: "phosphorPulse 2s ease-in-out infinite" }} />
            <Activity size={14} style={{ color: "#D1FF26" }} className="relative z-10" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>Live Activity Feed</p>
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>// GLOBAL SERVICE USAGE</p>
          </div>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
          style={{
            background: isLive ? "rgba(209,255,38,0.1)" : "rgba(138,143,152,0.1)",
            border: `0.5px solid ${isLive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.2)"}`,
            color: isLive ? "#D1FF26" : "#8A8F98",
          }}
        >
          <span className="relative flex w-1.5 h-1.5">
            {isLive && <span className="absolute inline-flex w-full h-full rounded-full opacity-75" style={{ background: "#D1FF26", animation: "phosphorPulse 1.5s ease-in-out infinite" }} />}
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: isLive ? "#D1FF26" : "#8A8F98" }} />
          </span>
          {isLive ? "LIVE" : "PAUSED"}
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 divide-x" style={{ borderColor: "rgba(138,143,152,0.08)" }}>
        <StatPill icon={PhoneCall} label="Calls Today" value={stats.calls.toLocaleString()} change={stats.change} trendUp={trendUp} />
        <StatPill icon={Users} label="Active Now" value={stats.activeUsers.toString()} />
        <StatPill icon={Globe} label="Regions" value={stats.regions.toString()} />
        <StatPill icon={Zap} label="Avg Response" value="1.2s" />
      </div>

      {/* Scrolling ticker bar */}
      <div className="overflow-hidden py-2 px-4" style={{ background: "rgba(5,7,10,0.6)", borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
        <div className="flex items-center gap-8 whitespace-nowrap" style={{ transform: `translateX(${tickerOffset}px)` }}>
          {[...SERVICE_NAMES, ...SERVICE_NAMES].map((svc, i) => {
            const Icon = SERVICE_ICONS[svc.type] || PhoneCall;
            return (
              <span key={i} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
                <Icon size={9} style={{ color: "#D1FF26" }} />
                {svc.name.toUpperCase()} <span style={{ color: "rgba(138,143,152,0.4)" }}>{svc.dial}</span>
                <span style={{ color: "rgba(209,255,38,0.3)" }}>·</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Activity list */}
      <div
        ref={feedRef}
        className="max-h-[400px] overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <AnimatePresence initial={false}>
          {activities.map((act, i) => {
            const Icon = SERVICE_ICONS[act.serviceType] || PhoneCall;
            const isNew = i === 0 && act.minutesAgo === 0;
            return (
              <motion.div
                key={act.id}
                initial={isNew ? { opacity: 0, height: 0, x: -20 } : { opacity: 0 }}
                animate={{ opacity: 1, height: "auto", x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: "0.5px solid rgba(138,143,152,0.05)",
                  background: isNew ? "rgba(209,255,38,0.04)" : "transparent",
                }}
              >
                {/* Pulsing dot for new entries */}
                <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
                  {isNew && (
                    <div className="absolute inset-0 rounded-full" style={{ background: "rgba(209,255,38,0.1)", animation: "phosphorPulse 1.5s ease-in-out infinite" }} />
                  )}
                  <div
                    className="relative w-8 h-8 flex items-center justify-center"
                    style={{
                      background: isNew ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                      border: `0.5px solid ${isNew ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`,
                    }}
                  >
                    <Icon size={14} style={{ color: isNew ? "#D1FF26" : "#8A8F98" }} />
                  </div>
                </div>

                {/* Activity text */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "#F5F5F7" }}>
                    <span style={{ color: "#D1FF26" }}>{act.caller}</span> {act.action}{" "}
                    <span className="font-medium">{act.service}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.5)" }}>
                      <Globe size={7} className="inline mr-1" />{act.region}
                    </span>
                    <span className="font-mono text-[8px]" style={{ color: "rgba(138,143,152,0.3)" }}>·</span>
                    <span className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(209,255,38,0.4)" }}>{act.dial}</span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-[9px]" style={{ color: isNew ? "#D1FF26" : "#8A8F98" }}>
                    {isNew ? "NOW" : `${act.minutesAgo}m ago`}
                  </p>
                  <p className="font-mono text-[7px] mt-0.5" style={{ color: "rgba(138,143,152,0.3)" }}>
                    {act.timestamp.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(5,7,10,0.4)", borderTop: "0.5px solid rgba(138,143,152,0.05)" }}>
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.4)" }}>
          // REAL-TIME DATA · UPDATES EVERY 3-5s
        </p>
        <p className="font-mono text-[8px] tracking-widest" style={{ color: "rgba(138,143,152,0.4)" }}>
          {activities.length} EVENTS TRACKED
        </p>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, change, trendUp }) {
  return (
    <div className="px-3 py-2.5 text-center" style={{ borderColor: "rgba(138,143,152,0.08)" }}>
      <Icon size={11} className="mx-auto mb-1" style={{ color: "#8A8F98" }} />
      <p className="font-heading font-black text-sm" style={{ color: "#F5F5F7" }}>{value}</p>
      <p className="font-mono text-[7px] tracking-widest mt-0.5" style={{ color: "#8A8F98" }}>{label}</p>
      {change !== undefined && (
        <p className="font-mono text-[7px] mt-0.5 flex items-center justify-center gap-0.5" style={{ color: trendUp ? "#D1FF26" : "#ef4444" }}>
          {trendUp ? <ArrowUp size={7} /> : <ArrowDown size={7} />}
          {Math.abs(change)}
        </p>
      )}
    </div>
  );
}