import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DollarSign, Eye, TrendingUp, Activity, Phone, Zap } from "lucide-react";
import RevenueChart from "@/components/landing/RevenueChart";

const creatorData = {
  handle: "@chefamara",
  name: "Chef Amara",
  balance: 2847.32,
  totalViews: 892400,
  totalEarnings: 12458.90,
  avgRate: 0.012,
  shorts: [
    { id: "sh1", title: "60-Second Recipe: Jollof Rice", views: 142000, earned: 1704.00, rate: 0.012, trend: "up" },
    { id: "sh7", title: "Quick Puff-Puff Recipe", views: 98500, earned: 1182.00, rate: 0.012, trend: "up" },
    { id: "sh8", title: "5-Minute Suya Marinade", views: 215000, earned: 3225.00, rate: 0.015, trend: "up" },
    { id: "sh9", title: "Perfect Akara Hack", views: 67800, earned: 678.00, rate: 0.010, trend: "down" },
  ],
  weeklyViews: [12400, 15800, 11200, 18900, 22100, 19500, 16700],
};

const fmtNum = (n) => (n >= 1000 ? (n / 1000).toFixed(0) + "K" : n);
const fmtMoney = (n) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CreatorEarningsDashboard() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);
  const [pulseBalance, setPulseBalance] = useState(creatorData.balance);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Simulate live balance pulse
  useEffect(() => {
    const t = setInterval(() => {
      setPulseBalance((b) => b + (Math.random() - 0.5) * 0.05);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const maxViews = Math.max(...creatorData.weeklyViews);

  return (
    <div ref={sectionRef} className="p-5" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      <div className="flex items-center gap-2 mb-5">
        <Zap size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// CREATOR EARNINGS DASHBOARD</p>
      </div>

      {/* Creator profile header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{creatorData.name}</h3>
          <p className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{creatorData.handle}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
          <Phone size={12} /> Dial *405#
        </button>
      </div>

      {/* Big balance display with pulse */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="p-5 mb-5 relative overflow-hidden"
        style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
        </div>
        <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>AVAILABLE BALANCE</p>
        <motion.p
          key={Math.round(pulseBalance * 100)}
          initial={{ opacity: 0.7, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="font-heading font-black text-4xl lg:text-5xl tracking-tight"
          style={{ color: "#D1FF26", textShadow: "0 0 30px rgba(209,255,38,0.3)" }}
        >
          {fmtMoney(pulseBalance)}
        </motion.p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <Eye size={12} style={{ color: "#8A8F98" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>Total Views:</span>
            <span className="font-mono text-[9px] font-bold" style={{ color: "#F5F5F7" }}>{fmtNum(creatorData.totalViews)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>Lifetime:</span>
            <span className="font-mono text-[9px] font-bold" style={{ color: "#D1FF26" }}>{fmtMoney(creatorData.totalEarnings)}</span>
          </div>
        </div>
      </motion.div>

      {/* Daily revenue trend chart */}
      <RevenueChart />

      {/* Weekly views chart */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={12} style={{ color: "#8A8F98" }} />
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>7-DAY VIEW TREND</p>
        </div>
        <div className="flex items-end gap-1 h-16">
          {creatorData.weeklyViews.map((views, idx) => {
            const height = (views / maxViews) * 100;
            const isToday = idx === 6;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${height}%` } : {}}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className="w-full rounded-sm"
                  style={{
                    background: isToday ? "#D1FF26" : "rgba(209,255,38,0.2)",
                    boxShadow: isToday ? "0 0 12px rgba(209,255,38,0.4)" : "none",
                  }}
                />
                <span className="font-mono text-[7px]" style={{ color: isToday ? "#D1FF26" : "#8A8F98" }}>
                  {["M", "T", "W", "T", "F", "S", "S"][idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shorts breakdown */}
      <div>
        <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#8A8F98" }}>// YOUR SHORTS</p>
        <div className="space-y-2">
          {creatorData.shorts.map((short, idx) => (
            <motion.div
              key={short.id}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: idx * 0.06 }}
              className="p-3 flex items-center justify-between"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.1)" }}
            >
              <div className="flex-1">
                <h4 className="font-heading font-semibold text-sm mb-0.5" style={{ color: "#F5F5F7" }}>{short.title}</h4>
                <div className="flex items-center gap-3 font-mono text-[8px]">
                  <span style={{ color: "#8A8F98" }}>▶ {fmtNum(short.views)} views</span>
                  <span style={{ color: "#8A8F98" }}>@ ${short.rate.toFixed(3)}/play</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold" style={{ color: "#D1FF26" }}>{fmtMoney(short.earned)}</p>
                <span className={`font-mono text-[7px] ${short.trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                  {short.trend === "up" ? "↑" : "↓"} Trending
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Withdrawal CTA */}
      <button className="w-full mt-5 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.25)]" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}>
        Withdraw Balance · Min. $50
      </button>

      <p className="font-mono text-[8px] text-center mt-3" style={{ color: "#8A8F98" }}>
        Payouts processed within 24h via mobile money or bank transfer
      </p>
    </div>
  );
}