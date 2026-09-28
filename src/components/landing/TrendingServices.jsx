import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, Flame, Phone, ArrowUp, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { dialServices, getServiceStats } from "@/data/dialServices";

export default function TrendingServices() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const loadTrends = async () => {
    let queryCounts = {};
    try {
      const interactions = await base44.entities.VoiceInteraction.filter(
        { source: "dial_browser" },
        "-created_date",
        200
      );
      (interactions || []).forEach((i) => {
        const q = (i.query || "").toLowerCase().trim();
        if (q) queryCounts[q] = (queryCounts[q] || 0) + 1;
      });
    } catch {
      // If searches can't be loaded, fall back to pure call-volume ranking
    }

    const scored = dialServices
      .map((service) => {
        const stats = getServiceStats(service.id);
        const keywords = [
          service.name.toLowerCase(),
          service.category.toLowerCase(),
          service.dial.toLowerCase(),
          ...service.tags.map((t) => t.toLowerCase()),
        ];
        let searchHits = 0;
        Object.entries(queryCounts).forEach(([q, count]) => {
          if (keywords.some((k) => q.includes(k) || k.includes(q))) {
            searchHits += count;
          }
        });
        const score = stats.totalCalls + searchHits * 500;
        return {
          ...service,
          calls: stats.totalCalls,
          searches: searchHits,
          score,
          trendPercent: stats.trendPercent,
          trend: stats.trend,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    setTrends(scored);
    setLoading(false);
  };

  useEffect(() => {
    loadTrends();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const maxScore = trends[0]?.score || 1;

  return (
    <section
      ref={sectionRef}
      id="trending"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden min-h-[600px]"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-8 lg:mb-10"
        >
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Flame size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// TRENDING NOW — LIVE DEMAND</p>
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: pulse ? "#D1FF26" : "rgba(209,255,38,0.3)", boxShadow: pulse ? "0 0 8px #D1FF26" : "none", transition: "all 0.3s" }} />
              <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>LIVE</span>
            </div>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            What People Are <span style={{ color: "#D1FF26" }}>Dialing.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            The most requested services on the network right now — ranked automatically by real search volume and call frequency. Tap any service to grab its dial code.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : (
          <div className="space-y-2">
            {trends.map((trend, idx) => {
              const rank = idx + 1;
              const barWidth = (trend.score / maxScore) * 100;
              return (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.4) }}
                  className="relative flex items-center gap-3 sm:gap-4 p-4 overflow-hidden"
                  style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${rank <= 3 ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}` }}
                >
                  <div className="absolute left-0 top-0 bottom-0 transition-all duration-700" style={{ width: `${barWidth}%`, background: "linear-gradient(90deg, rgba(209,255,38,0.1), transparent)" }} />

                  <div className="relative flex-shrink-0 w-7 sm:w-8 text-center">
                    <span className="font-heading font-black text-lg sm:text-xl" style={{ color: rank <= 3 ? "#D1FF26" : "#8A8F98" }}>{rank}</span>
                  </div>
                  <div className="relative flex-shrink-0 text-2xl">{trend.icon}</div>
                  <div className="relative flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{trend.name}</p>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{trend.category.toUpperCase()} · {trend.dial}</p>
                  </div>
                  {trend.searches > 0 && (
                    <div className="relative hidden sm:flex items-center gap-1 px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                      <ArrowUp size={9} style={{ color: "#D1FF26" }} />
                      <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>{trend.searches} SEARCH{trend.searches !== 1 ? "ES" : ""}</span>
                    </div>
                  )}
                  <div className="relative flex-shrink-0 text-right">
                    <p className="font-mono text-xs font-bold" style={{ color: "#D1FF26" }}>{trend.calls.toLocaleString()}</p>
                    <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>CALLS</p>
                  </div>
                  <a
                    href={`tel:${trend.dial}`}
                    className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
                    style={{ background: "#D1FF26", color: "#05070A" }}
                    title={`Call ${trend.dial}`}
                  >
                    <Phone size={11} /> Dial
                  </a>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Link
            to="/directory"
            className="inline-flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.2)]"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            <TrendingUp size={13} /> Browse All Services →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}