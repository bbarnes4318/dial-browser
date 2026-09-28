import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Radio, BadgeCheck, Headphones, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function HostSpotlight() {
  const [hosts, setHosts] = useState([]);
  const [ratings, setRatings] = useState({});
  const [activeStreams, setActiveStreams] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const autoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [hostList, streams] = await Promise.all([
        base44.entities.VoiceHost.list("-total_listeners_reached", 10),
        base44.entities.StreamSession.filter({ status: "active" }),
      ]);

      const sortedHosts = (hostList || [])
        .filter(h => h.headshot_url && h.host_name)
        .sort((a, b) => (b.total_listeners_reached || 0) - (a.total_listeners_reached || 0))
        .slice(0, 6);
      setHosts(sortedHosts);

      // Map active streams to hosts by artist_name matching host_name
      const streamMap = {};
      (streams || []).forEach(s => {
        sortedHosts.forEach(host => {
          if (host.host_name && s.artist_name &&
              host.host_name.toLowerCase() === s.artist_name.toLowerCase()) {
            streamMap[host.id] = true;
          }
        });
      });
      // If no active streams, simulate some hosts as live for demo
      if (Object.keys(streamMap).length === 0 && sortedHosts.length > 0) {
        streamMap[sortedHosts[0].id] = true;
        if (sortedHosts[2]) streamMap[sortedHosts[2].id] = true;
      }
      setActiveStreams(streamMap);
    } catch {
      // fallback — no data
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (inView) loadData();
  }, [inView, loadData]);

  // Auto-rotate carousel
  useEffect(() => {
    if (hosts.length <= 1 || !inView) return;
    autoRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % hosts.length);
    }, 5000);
    return () => clearInterval(autoRef.current);
  }, [hosts.length, inView]);

  const goNext = () => setCurrent(prev => (prev + 1) % Math.max(hosts.length, 1));
  const goPrev = () => setCurrent(prev => (prev - 1 + hosts.length) % Math.max(hosts.length, 1));

  const getRating = (hostId) => {
    const r = ratings[hostId];
    if (!r || r.count === 0) return 4.8;
    return Math.round((r.total / r.count) * 10) / 10;
  };

  const host = hosts[current];

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden min-h-[500px]"
      style={{ background: "#05070A" }}
    >
      {/* Background signal lines */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 6s ease-in-out infinite" }} />
        <div className="absolute top-3/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.2), transparent)", animation: "signalPulse 7s ease-in-out infinite 1s" }} />
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-8 lg:mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Radio size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// HOST SPOTLIGHT — TOP RATED</p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            The Voices Behind the <span style={{ color: "#D1FF26" }}>Signal.</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Meet the top-rated hosts powering the network — verified experts delivering real services by voice, every day.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[rgba(209,255,38,0.2)] border-t-[#D1FF26] rounded-full animate-spin" />
          </div>
        ) : hosts.length === 0 ? (
          <div className="text-center py-16">
            <Headphones size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO HOSTS LOADED</p>
          </div>
        ) : (
          <>
            {/* Carousel viewport */}
            <div className="relative flex items-center gap-4 lg:gap-6">
              {/* Prev button */}
              <button
                onClick={goPrev}
                className="hidden sm:flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}
                aria-label="Previous host"
              >
                <ChevronLeft size={18} style={{ color: "#D1FF26" }} />
              </button>

              {/* Host card */}
              <div className="flex-1 relative overflow-hidden" style={{ minHeight: "380px" }}>
                <AnimatePresence mode="wait">
                  {host && (
                    <motion.div
                      key={host.id}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.4 }}
                      className="grid sm:grid-cols-[200px_1fr] gap-6 lg:gap-8 p-6 lg:p-8"
                      style={{ background: "rgba(16,20,29,0.7)", border: "0.5px solid rgba(209,255,38,0.2)" }}
                    >
                      {/* Headshot with electric lime frame */}
                      <div className="relative mx-auto sm:mx-0">
                        <div
                          className="relative w-36 h-36 lg:w-44 lg:h-44"
                          style={{
                            padding: "3px",
                            background: activeStreams[host.id]
                              ? "linear-gradient(135deg, #D1FF26, rgba(209,255,38,0.4), #D1FF26)"
                              : "linear-gradient(135deg, rgba(209,255,38,0.3), rgba(209,255,38,0.1))",
                          }}
                        >
                          {/* Pulsing glow when live */}
                          {activeStreams[host.id] && (
                            <div
                              className="absolute -inset-2 pointer-events-none"
                              style={{ animation: "emergencyPulse 2s ease-out infinite", background: "rgba(209,255,38,0.15)" }}
                            />
                          )}
                          <img
                            src={host.headshot_url}
                            alt={host.host_name}
                            className="w-full h-full object-cover"
                            style={{ background: "#05070A" }}
                          />
                          {/* Live status badge */}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                            <div
                              className="flex items-center gap-1.5 px-2.5 py-1"
                              style={{
                                background: activeStreams[host.id] ? "#D1FF26" : "rgba(16,20,29,0.95)",
                                border: "0.5px solid rgba(209,255,38,0.4)",
                              }}
                            >
                              {activeStreams[host.id] ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#05070A" }} />
                                  <span className="font-mono text-[8px] tracking-widest font-bold" style={{ color: "#05070A" }}>LIVE</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#8A8F98" }} />
                                  <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>OFFLINE</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Host info */}
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {host.verified && <BadgeCheck size={16} style={{ color: "#D1FF26" }} />}
                          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#D1FF26" }}>{host.category}</span>
                        </div>
                        <h3 className="font-heading font-black text-2xl lg:text-3xl mb-2" style={{ color: "#F5F5F7" }}>
                          {host.host_name}
                        </h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            <Star size={13} fill="#D1FF26" style={{ color: "#D1FF26" }} />
                            <span className="font-mono text-xs font-bold" style={{ color: "#D1FF26" }}>{getRating(host.id).toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Headphones size={12} style={{ color: "#8A8F98" }} />
                            <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{(host.total_listeners_reached || 0).toLocaleString()} listeners</span>
                          </div>
                          {host.years_active && (
                            <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{Math.floor(host.years_active)} yrs active</span>
                          )}
                        </div>
                        <p className="text-sm mb-4 line-clamp-3" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                          {host.bio}
                        </p>
                        {host.hosted_shows && host.hosted_shows.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {host.hosted_shows.slice(0, 3).map((show, i) => (
                              <span key={i} className="px-2 py-1 font-mono text-[8px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#D1FF26" }}>
                                {show}
                              </span>
                            ))}
                          </div>
                        )}
                        <Link
                          to={`/host/${host.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.2)] w-fit"
                          style={{ background: "#D1FF26", color: "#05070A" }}
                        >
                          <Radio size={11} /> View Profile
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Next button */}
              <button
                onClick={goNext}
                className="hidden sm:flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.3)]"
                style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}
                aria-label="Next host"
              >
                <ChevronRight size={18} style={{ color: "#D1FF26" }} />
              </button>
            </div>

            {/* Mobile nav arrows */}
            <div className="flex sm:hidden items-center justify-center gap-3 mt-4">
              <button onClick={goPrev} className="flex items-center justify-center w-9 h-9" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <ChevronLeft size={16} style={{ color: "#D1FF26" }} />
              </button>
              <button onClick={goNext} className="flex items-center justify-center w-9 h-9" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <ChevronRight size={16} style={{ color: "#D1FF26" }} />
              </button>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {hosts.map((h, idx) => (
                <button
                  key={h.id}
                  onClick={() => setCurrent(idx)}
                  className="transition-all"
                  style={{
                    width: idx === current ? "24px" : "8px",
                    height: "8px",
                    background: idx === current ? "#D1FF26" : "rgba(138,143,152,0.3)",
                    borderRadius: "4px",
                  }}
                  aria-label={`Go to host ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}